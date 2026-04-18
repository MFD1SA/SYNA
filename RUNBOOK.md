# Runbook

On-call procedures for CIDOMA production.

## Access checklist

Before you're useful on-call, you need:

- GitHub access to the repo (push to `main`).
- Vercel team membership + `vercel login`.
- Supabase project access (org: look up via `supabase projects list`).
- Resend dashboard access (for bounced / complained emails).
- 1Password vault for production secrets (never checked in).

## Deployments

### Frontend → Vercel

Pushes to `main` trigger a Vercel build. Watch for the green check on
the PR before merging.

If the webhook drops (it has happened), deploy manually:

```sh
npm install -g vercel      # one-time
vercel login
vercel deploy --prod --yes
```

### Edge functions → Supabase

Deploy one at a time — or via the Supabase CLI if installed locally:

```sh
supabase functions deploy <name> --project-ref nqbobxtlwzvtzxqcdfdo
```

No CLI? Use the Supabase dashboard UI or the MCP `deploy_edge_function`
tool. `verify_jwt: true` is the safe default; disable only for public
endpoints (`seo-sitemap`, `seo-robots`, `send-contact`).

### Database migrations → Supabase

Prefer the MCP `apply_migration` tool — it runs idempotent DDL and
records the migration under a snake_case name. Never ad-hoc `DROP` or
`TRUNCATE` production tables — restore is manual and painful.

## Rollbacks

### Frontend

Vercel → Deployments → pick a green one → "Promote to Production". Takes
~30s to propagate.

### Edge function

Supabase dashboard → Edge Functions → function → Versions → re-activate
the prior version.

### Database

There's no auto-rollback. For forward-compatible fixes, ship a new
migration that reverses the change. For catastrophic data loss, restore
from PITR (Supabase Pro tier) — call an admin.

## Common incidents

### "Forms say email is required" and a user swears it isn't

Check `nda_consents.status_check` — valid values are
`pending | accepted | rejected | revoked`. The frontend may be sending
an older legacy value.

### Impersonate button does nothing

Open DevTools → check the `impersonate-user` response. Since 2026-04 it
returns `verify_url` ONLY (tokens no longer in the body). Old client
builds that still look for `data.access_token` will break silently —
deploy the frontend.

### Sitemap missing a page we just launched

`/sitemap.xml` is served by the `seo-sitemap` edge function with
`Cache-Control: max-age=3600`. Either wait an hour or redeploy the
function to invalidate Vercel's edge cache.

### Outbound email not sending

1. Check `email_log` for the recipient — did Resend accept it?
2. Check the Resend dashboard for bounces / spam complaints.
3. Verify `EMAIL_FROM` uses a domain you actually verified in Resend.
   Default fallback is the Resend sandbox (`onboarding@resend.dev`)
   which is DEV-only and will be rate-limited or rejected in prod.

### Rate-limit table balloons

```sql
SELECT public.prune_rate_limits();  -- deletes anything older than 24h
```

Schedule this nightly via pg_cron if you haven't yet.

## Secrets rotation

When a secret leaks:

1. Revoke at the vendor (Supabase, Resend, OpenAI).
2. Re-issue, put in 1Password.
3. Update in Supabase dashboard → Edge Functions → Secrets.
4. Redeploy every edge function that reads that secret (it's not
   auto-reloaded).
5. If it's a frontend key (`VITE_SUPABASE_PUBLISHABLE_KEY`), update in
   Vercel env vars and redeploy.

Never commit a secret. `.env.local` is gitignored; double-check with
`git status` before every commit.

## SEO verification

- Google Search Console: file-based verification — file lives at
  `public/google78ccfc58b8ce98c5.html`. Do not delete.
- IndexNow: key file at `public/e3e616d6f6f53656b776848c48e2822b.txt`.
  Key must match `INDEXNOW_KEY` in Supabase secrets.
- `robots.txt`: served by `seo-robots` edge function.
