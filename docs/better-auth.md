# Better Auth (Convex) setup

## Required Convex env vars

Run these once per Convex deployment:

```bash
npx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
npx convex env set SITE_URL http://localhost:3000
npx convex env set CONVEX_SITE_URL https://your-deployment-name.convex.site
```

Notes:

- `SITE_URL` must match your app URL (port `3000` in `vite.config.ts`). Used for CORS.
- `CONVEX_SITE_URL` is your Convex `.site` URL (where auth endpoints live). Used to construct OAuth redirect URIs. Must match what you register in Google Console.
- In production, set both to your production domains.

## Required client env vars

`better-auth/react` talks to your Convex **.site** domain.

Make sure your framework env includes:

- `VITE_CONVEX_URL`: your Convex **.cloud** URL
- `VITE_CONVEX_SITE_URL`: your Convex **.site** URL

If you’re using `.env.local`, it should look like:

```bash
CONVEX_DEPLOYMENT=dev:adjective-animal-123
VITE_CONVEX_URL=https://adjective-animal-123.convex.cloud
VITE_CONVEX_SITE_URL=https://adjective-animal-123.convex.site
VITE_SITE_URL=http://localhost:3000
```
