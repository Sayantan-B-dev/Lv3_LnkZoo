# Deploy Plan — Linkzoo → Vercel

## 1. Push to GitHub

```bash
git checkout -b main          # or push current branch
git push origin edit/05062026:main
```

## 2. Set Environment Variables in Vercel Dashboard

Go to **Project Settings → Environment Variables** and add:

| Name | Value | Scope |
|------|-------|-------|
| `NEON_DATABASE_URL` | `postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require` | Production |
| `JWT_SECRET` | `4RZeFlZum85QcETTgSOvgJhuqgPTr6djxNKDz2NuTNk` | All |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |
| `GOOGLE_CLIENT_ID` | `531096819698-...apps.googleusercontent.com` | All |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | All |
| `GOOGLE_REDIRECT_URI` | `https://your-app.vercel.app/api/auth/google/callback` | Production |
| `CLOUDINARY_URL` | `cloudinary://...` | Production |
| `CLOUDINARY_CLOUD_NAME` | `dxvn6hpux` | Production |
| `CLOUDINARY_API_KEY` | `698572292767519` | Production |
| `CLOUDINARY_API_SECRET` | `t1Q4IBJd-...` | Production |

Do **NOT** add `LOCAL_DATABASE_URL` or `NODE_ENV=development`.

## 3. Update Redirect URIs

- **Google OAuth**: Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → edit your OAuth 2.0 client → add `https://your-app.vercel.app/api/auth/google/callback` to **Authorized redirect URIs**.

## 4. Database: Local vs Neon

`lib/db.ts` switches automatically:

- `NODE_ENV === "development"` → uses `LOCAL_DATABASE_URL` (local Postgres)
- Anything else (Vercel = `"production"`) → uses `NEON_DATABASE_URL`

No code changes needed — just ensure `NEON_DATABASE_URL` is set in Vercel env.

## 5. Deploy

In Vercel dashboard:
1. **Add New Project** → Import your GitHub repo
2. **Root Directory**: leave as `./`
3. **Framework Preset**: Next.js (auto-detected)
4. **Build Command**: `next build` (default)
5. **Output Directory**: `.next` (default)
6. **Environment Variables**: paste from step 2
7. Click **Deploy**

## 6. Verify

- Visit the production URL
- Confirm pages load with the correct layout
- Test Google sign-in
- Check footer legal links work
- Run `curl https://your-app.vercel.app/api/health` (if endpoint exists)

## 7. Custom Domain (optional)

Settings → Domains → add your domain → update DNS records.
