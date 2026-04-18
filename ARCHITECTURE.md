# Architecture

## Overview

SINA is a React SPA fronted by Vercel and backed by Supabase. All business
logic that must be trusted (auth, payments, email, LLM calls, audit logging)
runs in Postgres functions or Deno edge functions — **the browser is never
trusted**.

```
┌─────────────┐   https    ┌─────────┐   direct    ┌───────────────────┐
│  Browser    │ ─────────► │ Vercel  │ ──────────► │ Supabase Postgres │
│ (React SPA) │            │ (static)│             │  + RLS + triggers │
└─────────────┘            └────┬────┘             └───────────────────┘
       │                        │ rewrites                │
       │ supabase-js            ▼                         │
       │             ┌─────────────────────┐              │
       └───────────► │ Supabase Edge Funcs │ ─────────────┘
                     │ (Deno, 23 deployed) │
                     └──────────┬──────────┘
                                │
                    Resend │ OpenAI │ IndexNow
```

## Module map (src/)

| Path                         | Role                                               |
| ---------------------------- | -------------------------------------------------- |
| `src/pages/`                 | Route components. Subdirs per persona: `admin/`, `crm/` (developer), `owner/`, `seo/`. |
| `src/components/landing/`    | Public marketing — navbar, hero, footer, CTA.      |
| `src/components/shared/`     | Cross-cutting UI (ImageGallery, MarkdownRenderer). |
| `src/components/ui/`         | shadcn primitives (button, dialog, toast, …).      |
| `src/components/seo/`        | Programmatic SEO renderer (+ safelist of route-bound slugs). |
| `src/integrations/supabase/` | Client factories — `client.ts` (localStorage),     |
|                              | `impersonateClient.ts` (sessionStorage for admin impersonation tabs). |
| `src/hooks/`                 | `useMetaTags`, `useLanguage`, `useAuth`, …          |
| `src/i18n/`                  | AR/EN translation catalogs + direction switcher.    |
| `src/services/`              | Thin data layer over supabase-js, organised by domain. |
| `src/lib/`                   | Pure utilities. No React, no side effects.          |

## Data model (highlights)

- **`profiles`**: one row per auth user. FK → `auth.users`.
- **`user_roles`**: RBAC — values: `admin`, `developer`, `owner`.
- **`lands`**: landowner-submitted opportunities. Gated by `owner_approved`.
- **`developers`**: developer company profile. Gated by admin verification.
- **`deal_requests`** → **`deal_phase_transitions`**, **`negotiation_rounds`**,
  **`deal_closings`**: the deal lifecycle.
- **`nda_consents`**: Saudi-NDA acceptance per (user, land). Immutable.
- **`audit_logs`**: append-only; written by edge functions and by triggers
  on the four legally-critical tables above.

## Auth model

1. **Signup**: Supabase Auth (email+password). `handle_new_user` trigger
   creates the `profiles` row.
2. **Role assignment**: admin grants `developer` or `owner` via the admin
   UI, which writes to `user_roles`.
3. **Impersonation** (admin-only): `impersonate-user` edge function
   generates a one-time magic link, server-verifies it, embeds session
   tokens in the URL fragment, and opens it in a new tab. Target tab is
   flagged at client-module load so its session is stored in
   `sessionStorage` — never touching the admin's `localStorage` session.
4. **RLS**: every table has policies. `service_role` bypasses. Frontend
   uses the anon/publishable key only.

## Edge functions (23 deployed)

Categorised by trust boundary:

- **Admin-only** (JWT + role check): `impersonate-user`, `seo-generate`.
- **Authenticated user**: `accept-nda`, `transition-deal-phase`,
  `create-owner`, `register-developer`, `invite-owner`, `notify-interest`,
  `deal-drive-automation`.
- **Service-role-only** (pg_cron): `check-report-deadlines`,
  `generate-developer-report`, `notify-new-opportunity`,
  `indexnow-submit`.
- **Public** (no JWT): `seo-sitemap`, `seo-robots`, `radius900`,
  `send-contact`.

Shared utilities live in `supabase/functions/_shared/`.

## SEO pipeline

1. Admin authors a `seo_generation_rules` row (e.g. "per Saudi city
   × property-type").
2. Admin triggers `seo-generate` from the UI OR pg_cron hits it with the
   service key. The function expands rules into `seo_pages` rows, each
   bound to a real entity (land, developer, city) with quality gates:
   min-word-count, min internal links, forced `manual_only` for sensitive
   topics, dedupe by (slug, locale).
3. Failing quality checks land in `seo_issues` for admin review.
4. Vercel rewrites `/sitemap.xml` → `seo-sitemap` edge function, which
   reads `seo_pages` + static marketing paths + active `platform_offers`
   + approved `lands`, emitting reciprocal hreflang.
5. `seo-robots` serves `/robots.txt` (Sitemap + IndexNow key URL).
6. The SPA renders each `seo_pages` row through `SeoPageRenderer`, which
   sanitises stored HTML with DOMPurify before `dangerouslySetInnerHTML`.

## Observability & audit

- **`audit_logs`** is append-only. Triggers on `deal_phase_transitions`,
  `nda_consents`, `negotiation_rounds`, and `deal_closings` write a row
  for each legally-meaningful event. Edge functions (e.g. impersonation)
  write directly when no source row exists.
- **`email_log`** records every transactional email sent via Resend.
- **pg_cron** schedules daily jobs (report deadlines, sitemap refresh,
  SEO regeneration).

## Performance notes

- Hero + city images are stored in `src/assets/` at ≤100KB, hashed by
  Vite. The one 2.3MB outlier (`hero-home.jpg`) was removed in 2026-04
  after confirming nothing imported it.
- 47 missing foreign-key indexes were added in `add_missing_fk_indexes`
  (2026-04) — the audit found hot-path joins doing seq-scans.
- Core Web Vitals are watched via Vercel Speed Insights; alerting is
  manual, check the dashboard weekly.
