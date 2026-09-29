import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-utils';
import { getSessionFromRequest } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import {
  FEEDBACK_ALLOWED_IMAGE_MIMES,
  FEEDBACK_LIST_MAX_PER_USER,
  FEEDBACK_LIST_WINDOW_MS,
  FEEDBACK_MAX_DESCRIPTION,
  FEEDBACK_MAX_PAGE_SIZE,
  FEEDBACK_MAX_SCREENSHOT_BYTES,
  FEEDBACK_MAX_TITLE,
  FEEDBACK_MIN_DESCRIPTION,
  FEEDBACK_MIN_TITLE,
  FEEDBACK_MULTIPART_OVERHEAD,
  FEEDBACK_PAGE_SIZE,
  FEEDBACK_POST_MAX_PER_IP,
  FEEDBACK_POST_MAX_PER_USER,
  FEEDBACK_POST_WINDOW_MS,
  DEFAULT_FEEDBACK_VISIBILITY,
  isFeedbackStatus,
  isFeedbackVisibility,
} from '@/lib/feedbackRules';
import {
  createFeedback,
  feedbackStatusCounts,
  listFeedback,
} from '@/services/feedback.service';

export const dynamic = 'force-dynamic';

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
}

/**
 * Submit a bug report. Signed-in only, doubly rate-limited (per IP and per
 * user), size-capped before the body is read, and the screenshot is validated
 * against a mime allowlist — SVG is deliberately excluded because it can carry
 * script. Nothing here fetches a user-supplied URL.
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Please sign in to send feedback' }, { status: 401 });
  }

  const contentLength = Number(req.headers.get('content-length') ?? '0');
  if (contentLength > FEEDBACK_MAX_SCREENSHOT_BYTES + FEEDBACK_MULTIPART_OVERHEAD) {
    return NextResponse.json(
      { error: 'Screenshot must be 5MB or less' },
      { status: 413 }
    );
  }

  const ip = clientIp(req);
  if (!rateLimit(`feedback:ip:${ip}`, FEEDBACK_POST_MAX_PER_IP, FEEDBACK_POST_WINDOW_MS)) {
    return NextResponse.json(
      { error: 'Too many reports from this network, try again later' },
      { status: 429 }
    );
  }
  if (
    !rateLimit(
      `feedback:user:${session.user_id}`,
      FEEDBACK_POST_MAX_PER_USER,
      FEEDBACK_POST_WINDOW_MS
    )
  ) {
    return NextResponse.json(
      { error: 'You have sent a lot of reports — please wait a few minutes' },
      { status: 429 }
    );
  }

  const form = await req.formData();

  const rawTitle = form.get('title');
  const rawDescription = form.get('description');
  const title = typeof rawTitle === 'string' ? rawTitle.trim() : '';
  const description = typeof rawDescription === 'string' ? rawDescription.trim() : '';

  if (title.length < FEEDBACK_MIN_TITLE || title.length > FEEDBACK_MAX_TITLE) {
    return NextResponse.json(
      { error: `Title must be ${FEEDBACK_MIN_TITLE}-${FEEDBACK_MAX_TITLE} characters` },
      { status: 400 }
    );
  }
  if (
    description.length < FEEDBACK_MIN_DESCRIPTION ||
    description.length > FEEDBACK_MAX_DESCRIPTION
  ) {
    return NextResponse.json(
      {
        error: `Description must be ${FEEDBACK_MIN_DESCRIPTION}-${FEEDBACK_MAX_DESCRIPTION} characters`,
      },
      { status: 400 }
    );
  }

  const rawVisibility = form.get('visibility');
  const visibility =
    typeof rawVisibility === 'string' && rawVisibility
      ? rawVisibility
      : DEFAULT_FEEDBACK_VISIBILITY;
  if (!isFeedbackVisibility(visibility)) {
    return NextResponse.json({ error: 'Unknown visibility' }, { status: 400 });
  }

  let screenshot: { buffer: Buffer; mime: string } | null = null;
  const rawScreenshot = form.get('screenshot');
  if (rawScreenshot && typeof rawScreenshot !== 'string') {
    if (rawScreenshot.size > FEEDBACK_MAX_SCREENSHOT_BYTES) {
      return NextResponse.json(
        { error: 'Screenshot must be 5MB or less' },
        { status: 413 }
      );
    }
    const mime = (rawScreenshot.type || '').toLowerCase();
    if (!FEEDBACK_ALLOWED_IMAGE_MIMES.includes(mime)) {
      return NextResponse.json(
        { error: 'Screenshot must be a PNG, JPEG, WebP or GIF' },
        { status: 400 }
      );
    }
    screenshot = {
      mime,
      buffer: Buffer.from(await rawScreenshot.arrayBuffer()),
    };
  }

  try {
    const created = await createFeedback({
      userId: session.user_id,
      title,
      description,
      visibility,
      screenshot,
    });
    return NextResponse.json({ feedback: created }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/feedback]', err?.message);
    return NextResponse.json({ error: 'Could not submit feedback' }, { status: 500 });
  }
});

/**
 * Public board. Signed-out visitors get public reports; a signed-in user also
 * gets their own private ones; an admin gets everything. The filters narrow
 * that set, never widen it.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const session = await getSessionFromRequest(req);
  const isAdmin = session?.role === 'admin';
  const viewerId = session?.user_id ?? null;

  const ip = clientIp(req);
  const bucketKey = session ? `feedback:list:${session.user_id}` : `feedback:list:ip:${ip}`;
  if (
    !rateLimit(bucketKey, FEEDBACK_LIST_MAX_PER_USER, FEEDBACK_LIST_WINDOW_MS)
  ) {
    return NextResponse.json({ error: 'Too many requests, slow down' }, { status: 429 });
  }

  const sp = req.nextUrl.searchParams;

  const statusParam = sp.get('status');
  if (statusParam && !isFeedbackStatus(statusParam)) {
    return NextResponse.json({ error: 'Unknown status' }, { status: 400 });
  }

  const visibilityParam = sp.get('visibility');
  if (visibilityParam && !isFeedbackVisibility(visibilityParam)) {
    return NextResponse.json({ error: 'Unknown visibility' }, { status: 400 });
  }

  const limit = Math.min(
    FEEDBACK_MAX_PAGE_SIZE,
    Math.max(1, parseInt(sp.get('limit') ?? String(FEEDBACK_PAGE_SIZE), 10) || FEEDBACK_PAGE_SIZE)
  );
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1);

  const { items, total } = await listFeedback({
    viewerId,
    isAdmin,
    status: statusParam ?? undefined,
    visibility: visibilityParam ?? undefined,
    limit,
    offset: (page - 1) * limit,
  });

  return NextResponse.json({
    feedback: items,
    total,
    page,
    limit,
    isAdmin,
    signedIn: !!session,
    counts: await feedbackStatusCounts(viewerId, isAdmin),
  });
});
