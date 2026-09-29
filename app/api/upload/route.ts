import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { apiHandler } from '@/lib/api-utils';
import { requireSession } from '@/lib/policies';
import { rateLimit } from '@/lib/rate-limit';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = 'force-dynamic';

/**
 * The only folders this endpoint will write into. `folder` arrives from the
 * client, and feeding it straight to Cloudinary let any signed-in user create
 * assets anywhere in the account's media library.
 */
const ALLOWED_FOLDERS = ['lnkzoo_profiles', 'lnkzoo_avatars', 'lnkzoo_covers'];
const DEFAULT_FOLDER = 'lnkzoo_profiles';

/** Decoded cap. Base64 carries ~4 bytes of text per 3 bytes of image. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_BASE64_CHARS = Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 1024;

/** JPEG/PNG/WebP only — SVG can carry script and is never a profile picture. */
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const UPLOAD_WINDOW_MS = 10 * 60 * 1000;
const UPLOAD_MAX_PER_USER = 20;

export const POST = apiHandler(async (req: NextRequest) => {
  const guard = await requireSession(req);
  if (!guard.ok) return guard.response;
  const { session } = guard;

  if (!rateLimit(`upload:${session.user_id}`, UPLOAD_MAX_PER_USER, UPLOAD_WINDOW_MS)) {
    return NextResponse.json({ error: 'Too many uploads, try again later' }, { status: 429 });
  }

  // Reject oversized bodies before reading them into memory.
  const contentLength = Number(req.headers.get('content-length') ?? '0');
  if (contentLength > MAX_BASE64_CHARS + 2048) {
    return NextResponse.json({ error: 'Image must be 5MB or less' }, { status: 413 });
  }

  const body = await req.json().catch(() => ({}));

  const image = typeof body?.image === 'string' ? body.image : '';
  if (!image) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }
  if (image.length > MAX_BASE64_CHARS) {
    return NextResponse.json({ error: 'Image must be 5MB or less' }, { status: 413 });
  }

  // A data URI only. Accepting a remote URL would have the server fetch whatever
  // the caller names, which is the SSRF shape this endpoint must not grow.
  const dataUri = image.match(/^data:([a-z0-9.+/-]+);base64,/i);
  const mime = dataUri?.[1]?.toLowerCase() ?? '';
  if (!dataUri || !ALLOWED_MIME_TYPES.includes(mime)) {
    return NextResponse.json(
      { error: 'Image must be a PNG, JPEG or WebP data URI' },
      { status: 400 }
    );
  }

  const requestedFolder = typeof body?.folder === 'string' ? body.folder : DEFAULT_FOLDER;
  const folder = ALLOWED_FOLDERS.includes(requestedFolder) ? requestedFolder : DEFAULT_FOLDER;

  try {
    const result = await cloudinary.uploader.upload(image, {
      folder,
      resource_type: 'image',
      upload_preset: 'ml_default',
      // Profiles are displayed at a few hundred pixels at most; keeping the
      // original resolution around just burns storage.
      transformation: [{ width: 1024, crop: 'limit' }],
    });

    return NextResponse.json({ url: result.secure_url });
  } catch {
    // Cloudinary's message can name account details, so it stays server-side.
    return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
  }
});
