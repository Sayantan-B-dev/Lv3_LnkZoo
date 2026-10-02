/**
 * Lazy, sentinel-safe Cloudinary access. Use `await getCloudinary()` instead of
 * importing `cloudinary` directly.
 *
 * Why dynamic + lazy: merely *evaluating* the SDK throws
 * `Invalid CLOUDINARY_URL protocol` — `uploader.js` calls `config()` at
 * require time, which parses `CLOUDINARY_URL` and rejects anything not
 * starting with `cloudinary://`. That includes Vercel's local `[SENSITIVE]`
 * placeholder, which `vercel build` injects for redacted vars with precedence
 * over `.env*` files. A static top-level import therefore kills `next build`
 * page-data collection for every route in the import graph, and no amount of
 * sanitizing-after-import can help (imports evaluate first).
 *
 * Sanitizing before the first dynamic import keeps the build green; a
 * genuinely broken production value then fails loudly at request time, where
 * the error is actionable. A valid `CLOUDINARY_URL` still feeds the SDK, and
 * the explicit keys still win over it.
 */
type CloudinaryV2 = typeof import('cloudinary').v2;

let api: CloudinaryV2 | undefined;

function sanitizeCloudinaryEnv(): void {
  const url = process.env.CLOUDINARY_URL;
  if (url && !url.toLowerCase().startsWith('cloudinary://')) {
    delete process.env.CLOUDINARY_URL;
  }
  const accountUrl = process.env.CLOUDINARY_ACCOUNT_URL;
  if (accountUrl && !accountUrl.toLowerCase().startsWith('account://')) {
    delete process.env.CLOUDINARY_ACCOUNT_URL;
  }
}

export async function getCloudinary(): Promise<CloudinaryV2> {
  if (!api) {
    sanitizeCloudinaryEnv();
    const mod = await import('cloudinary');
    api = mod.v2;
    api.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
  return api;
}
