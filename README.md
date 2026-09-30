# My Dental Clinic

Multi-tenant dental clinic SaaS (web). The Next.js app lives in [`dental-clinic/`](./dental-clinic).

## Deploy on Vercel

1. Import **https://github.com/wrecck/dental-appointment** in [Vercel](https://vercel.com/new).
2. Set **Root Directory** to `dental-clinic`.
3. Add environment variables:

| Name | Value |
|------|--------|
| `AUTH_SECRET` | A long random string (`openssl rand -base64 32`) |
| `DATABASE_URL` | `file:./dev.db` for a quick demo, or a Postgres URL for production |

4. Deploy.

SQLite (`file:./dev.db`) will not persist on Vercel’s serverless filesystem. For real use, switch to a hosted database (Neon, Vercel Postgres, Turso, etc.).

## Local development

```bash
cd dental-clinic
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000/register](http://localhost:3000/register) and create a clinic.
