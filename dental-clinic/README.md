# My Dental Clinic (app)

Multi-tenant dental practice management app. Deploy with **Vercel + Neon Postgres**.

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `DATABASE_URL` | Neon **pooled** URL (`-pooler` host) |
| `DIRECT_URL` | Neon **direct** URL (no pooler) |
| `AUTH_URL` | App URL (production: your Vercel domain) |

## Scripts

```bash
npm install
npx prisma migrate deploy   # apply schema to Neon
npm run dev                 # http://localhost:3000
```

`npm run build` runs `prisma generate`, `prisma migrate deploy`, then `next build` (what Vercel uses).
