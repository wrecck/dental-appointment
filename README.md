# My Dental Clinic

Multi-tenant dental clinic SaaS (web). The Next.js app lives in [`dental-clinic/`](./dental-clinic).

## Deploy on Vercel + Neon

### 1. Create a Neon project

1. Go to [console.neon.tech](https://console.neon.tech) and create a project.
2. Copy both connection strings from the Neon dashboard:
   - **Pooled** (has `-pooler` in the host) → `DATABASE_URL`
   - **Direct** (no `-pooler`) → `DIRECT_URL`
3. Append `?sslmode=require` if it is not already present.

### 2. Import the repo in Vercel

1. Import **https://github.com/wrecck/dental-appointment**.
2. Set **Root Directory** to `dental-clinic`.
3. Add environment variables:

| Name | Value |
|------|--------|
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` |
| `AUTH_URL` | `https://dental-appointment-psi.vercel.app` (no trailing slash) |
| `DATABASE_URL` | Neon **pooled** connection string |
| `DIRECT_URL` | Neon **direct** connection string |

4. Deploy. The build runs `prisma migrate deploy`, which creates the tables on Neon.

### 3. First login

Open your Vercel URL → `/register` → create a clinic and owner account.

## Local development

```bash
cd dental-clinic
cp .env.example .env
# paste your Neon DATABASE_URL + DIRECT_URL and AUTH_SECRET into .env
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000/register](http://localhost:3000/register).

## Stack

- Next.js 16, TypeScript, Tailwind, shadcn/ui
- Prisma 7 + Neon Postgres (`@prisma/adapter-neon`)
- NextAuth.js (credentials, multi-tenant clinic isolation)
