import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-utils';
import { isAdminRole, requireAdmin, requireSession } from '@/lib/policies';
import { rateLimit } from '@/lib/rate-limit';
import {
  FEEDBACK_WRITE_MAX_PER_USER,
  FEEDBACK_WRITE_WINDOW_MS,
  isFeedbackStatus,
} from '@/lib/feedbackRules';
import { deleteFeedback, updateFeedbackStatus } from '@/services/feedback.service';

export const dynamic = 'force-dynamic';

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Triage: admins move a report between statuses. */
export const PATCH = apiHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.response;
    const { session } = guard;

    if (
      !rateLimit(
        `feedback:patch:${session.user_id}`,
        FEEDBACK_WRITE_MAX_PER_USER,
        FEEDBACK_WRITE_WINDOW_MS
      )
    ) {
      return NextResponse.json({ error: 'Too many requests, slow down' }, { status: 429 });
    }

    const id = parseId(params.id);
    if (id === null) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const { status } = await req.json().catch(() => ({ status: undefined }));
    if (typeof status !== 'string' || !isFeedbackStatus(status)) {
      return NextResponse.json({ error: 'Unknown status' }, { status: 400 });
    }

    const updated = await updateFeedbackStatus(id, status, session.user_id);
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ feedback: updated });
  }
);

/** Admins can remove any report; a user can remove their own. */
export const DELETE = apiHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const guard = await requireSession(req);
    if (!guard.ok) return guard.response;
    const { session } = guard;

    if (
      !rateLimit(
        `feedback:delete:${session.user_id}`,
        FEEDBACK_WRITE_MAX_PER_USER,
        FEEDBACK_WRITE_WINDOW_MS
      )
    ) {
      return NextResponse.json({ error: 'Too many requests, slow down' }, { status: 429 });
    }

    const id = parseId(params.id);
    if (id === null) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const deleted = await deleteFeedback(id, session.user_id, isAdminRole(session.role));
    if (!deleted) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  }
);
