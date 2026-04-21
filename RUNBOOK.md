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

## Disaster recovery & backups

### What Supabase already does for us

- **Daily automated backups** (retained 7 days on Free / Pro, 14 on Pro add-on).
  Visible in Dashboard → Database → Backups.
- **Point-in-time recovery (PITR)** on Pro tier, 7-day window (upgradable).
  Restores to any second within the window — the gold standard for
  accidental `UPDATE`/`DELETE` recovery.
- **Storage**: object uploads to the `public` bucket are versioned at the
  object level; deletes are soft for 30 days.

Restores of the above are **admin-only** operations via the Supabase
dashboard or `supabase db restore`. Call the on-call admin — they are
destructive and can't be undone.

### Our own weekly logical backup

Vendor backups are authoritative; this is defence-in-depth in case we
ever need to migrate off Supabase or cross-check a row-level question
without touching prod. Run from a workstation that has `pg_dump` 15+ and
access to 1Password.

```sh
# 1. Pull the pooler connection string from Supabase dashboard
#    (Settings → Database → Connection string → URI → "Session").
#    Store it as $SUPABASE_DB_URL in your shell — NEVER commit it.
export SUPABASE_DB_URL="postgresql://postgres.nqbobxtlwzvtzxqcdfdo:...@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# 2. Dump schema + data, excluding noise tables (rate_limits, audit churn).
DATE=$(date -u +%Y%m%dT%H%M%SZ)
pg_dump "$SUPABASE_DB_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --exclude-table-data='public.rate_limits' \
  --exclude-table-data='public.email_log' \
  --file="cidoma-backup-${DATE}.dump"

# 3. Verify the dump is readable and list contents (no restore yet).
pg_restore --list "cidoma-backup-${DATE}.dump" | head -40

# 4. Encrypt before storing off-site (1Password / S3 / whatever).
age -e -r "age1…recipient…" \
  -o "cidoma-backup-${DATE}.dump.age" \
  "cidoma-backup-${DATE}.dump"
rm "cidoma-backup-${DATE}.dump"   # keep only the encrypted copy
```

Cadence: **every Sunday**. Delete dumps older than 60 days from cold
storage. If you skip two weeks in a row, flag the team — this is the
only artefact we control end-to-end.

### Restore drill (quarterly)

Once a quarter, prove the backup actually restores. Use a throwaway
Supabase branch — never touch prod.

```sh
# 1. Spin up a fresh branch (MCP create_branch, or dashboard).
#    Get its connection string as $BRANCH_DB_URL.

# 2. Decrypt and restore.
age -d -i ~/.age/cidoma-key.txt "cidoma-backup-YYYYMMDD.dump.age" \
  > /tmp/cidoma-restore.dump
pg_restore \
  --clean --if-exists --no-owner --no-privileges \
  --dbname "$BRANCH_DB_URL" \
  /tmp/cidoma-restore.dump
rm /tmp/cidoma-restore.dump

# 3. Smoke-check: row counts on the tables that matter.
psql "$BRANCH_DB_URL" -c "
  SELECT 'lands' AS t, count(*) FROM public.lands
  UNION ALL SELECT 'developers', count(*) FROM public.developers
  UNION ALL SELECT 'owners', count(*) FROM public.owners
  UNION ALL SELECT 'partnerships', count(*) FROM public.partnerships;
"

# 4. Delete the branch (MCP delete_branch) — you're done.
```

Record the drill date + row counts in the on-call log. If a restore
fails, open a P1 immediately — our DR story is broken until it's fixed.

### Recovery objectives

| Incident                          | Who fixes                  | RTO     | RPO     |
| --------------------------------- | -------------------------- | ------- | ------- |
| Frontend down (Vercel)            | On-call → rollback         | <5 min  | 0       |
| Edge function broken              | On-call → re-activate prev | <5 min  | 0       |
| Accidental row delete/update      | Admin → PITR restore       | <30 min | <1 sec  |
| Full DB loss (region outage)      | Admin → latest daily + PITR| <2 hr   | <24 hr  |
| Supabase account compromised      | Admin → rotate + restore   | <4 hr   | <24 hr  |

RTO = Recovery Time Objective. RPO = Recovery Point Objective (max data
loss tolerated).
