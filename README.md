# SINA / CIDOMA — Real-Estate Partnership Platform

Arabic-first digital platform connecting Saudi landowners with real-estate
developers under vetted, audited partnership agreements. Production site:
https://cidoma.com.

## Stack

- **Frontend**: React 18 + Vite 5 + TypeScript 5.8
- **UI**: Tailwind + Radix/shadcn + lucide-react
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)
- **Hosting**: Vercel (SPA + rewrites to Supabase edge functions for `/sitemap.xml`, `/robots.txt`)
- **Observability**: Resend (transactional email), pg_cron (scheduled jobs)

## Quick start

```sh
git clone <repo>
cd syna
cp .env.example .env.local   # fill in your own keys
npm install
npm run dev                  # http://localhost:5173
```

Required env vars are listed in `.env.example`. The app will not build
without a valid Supabase URL + publishable key.

## Scripts

| Command            | What it does                          |
| ------------------ | ------------------------------------- |
| `npm run dev`      | Vite dev server with HMR              |
| `npm run build`    | Production build → `dist/`            |
| `npm run lint`     | ESLint on `src/`                      |
| `npm run preview`  | Preview the production build          |

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — module layout, data model, auth
  flow, SEO pipeline.
- **[RUNBOOK.md](./RUNBOOK.md)** — on-call procedures: deployments,
  rollbacks, common incidents, secrets rotation.
- **[.env.example](./.env.example)** — every env var consumed by the
  frontend + every secret referenced by the edge functions.

## Deploying

Pushes to `main` are auto-deployed by Vercel. Edge functions are
deployed separately via the Supabase MCP or CLI — see `RUNBOOK.md`.

## License

Proprietary. © SINA Real Estate Investments.
