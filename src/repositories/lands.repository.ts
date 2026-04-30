/**
 * Lands repository.
 * ───────────────────────────────────────────────────────────────────────
 * Centralises all read paths for the lands data model so SELECT shapes
 * stay consistent across pages and the column-level security boundary
 * is enforced in one place.
 *
 * Background — why this layer exists (audit 2026-04-29):
 *   `public.lands` has columns explicitly designed to be hidden before
 *   NDA acceptance: deed_number, owner_name, plot_number, plan_number,
 *   exact_location_lat/lng, owner_id. Pages used to query the base
 *   table directly with ad-hoc SELECT lists, and the column scrub was
 *   enforced only in the application query builder. A typo, a copy-
 *   paste, or a developer reaching for "*" would leak PII.
 *
 *   The repository now offers four explicit surfaces:
 *     • forDeveloperBrowse()  → reads `lands_developer_browse` view
 *                                (column-safe, filtered to active +
 *                                approved + not-deleted by the view).
 *     • countForDeveloperBrowse(filter) → KPI counts using the same view.
 *     • forOwner(ownerId)     → full read for the row owner only.
 *     • forAdmin(filter)      → full read for admins (no row gate;
 *                                relies on the existing admin SELECT
 *                                policy on lands).
 *
 *   Plus one mutation helper:
 *     • softDelete()          → flips deleted_at, the canonical "remove"
 *                                operation that all UIs should use.
 *
 *   Pages that need full-row access in deal context (developer with an
 *   active deal_request/deal on the land) keep going through the
 *   service layer (resolve-party-identity / dealPhase.service) — this
 *   repository deliberately doesn't expose a "get full row" path so the
 *   reveal-level state machine stays the single gate.
 */

import { supabase } from "@/integrations/supabase/client";
import { log } from "@/lib/logger";

/* ── Public-shaped (no PII) row returned from the safe view ──────── */
export interface LandBrowseRow {
  id: string;
  city: string;
  district: string | null;
  land_area_sqm: number;
  length_m: number | null;
  width_m: number | null;
  street_width_m: number | null;
  usage_type: string;
  partnership_goal: string;
  partnership_model: string | null;
  project_type: string | null;
  quality_level: string | null;
  revenue_model: string | null;
  expected_dev_duration_months: number | null;
  developer_experience_requirements: string | null;
  financing_preference: string | null;
  vision_summary: string | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  brokerage_license_status: string | null;
  is_active: boolean;
  is_featured: boolean;
  owner_approved: boolean;
  created_at: string;
  updated_at: string;
}

const BROWSE_COLUMNS =
  "id, city, district, land_area_sqm, length_m, width_m, street_width_m, " +
  "usage_type, partnership_goal, partnership_model, project_type, quality_level, " +
  "revenue_model, expected_dev_duration_months, developer_experience_requirements, " +
  "financing_preference, vision_summary, image_url, gallery_urls, " +
  "brokerage_license_status, is_active, is_featured, owner_approved, created_at, updated_at";

export const landsRepo = {
  /**
   * Developer-side browse listing. Reads the column-safe view —
   * the underlying RLS on `public.lands` no longer permits a
   * verified developer to read rows without deal context.
   */
  async forDeveloperBrowse(): Promise<LandBrowseRow[]> {
    const { data, error } = await supabase
      // The view is added in migration 20260429120000_lands_column_safe_view_and_rls.
      // It's typed via supabase-js generated Database typing; falling back to
      // `as any` until the type regen catches up.
      .from("lands_developer_browse" as any)
      .select(BROWSE_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) {
      log.error("lands.forDeveloperBrowse failed", { code: (error as any).code });
      return [];
    }
    return (data as unknown as LandBrowseRow[]) ?? [];
  },

  /** KPI count of currently-browsable lands. */
  async countForDeveloperBrowse(filter?: { sinceISO?: string }): Promise<number> {
    let q = supabase
      .from("lands_developer_browse" as any)
      .select("id", { count: "exact", head: true });
    if (filter?.sinceISO) q = q.gte("created_at", filter.sinceISO);
    const { count, error } = await q;
    if (error) {
      log.error("lands.countForDeveloperBrowse failed", { code: (error as any).code });
      return 0;
    }
    return count ?? 0;
  },

  /**
   * Owner reading their own land roster (full row). RLS enforces
   * `auth.uid() = owner_id` on the underlying `public.lands` policy.
   */
  async forOwner(ownerId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("lands")
      .select("*")
      .eq("owner_id", ownerId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) {
      log.error("lands.forOwner failed", { code: (error as any).code });
      return [];
    }
    return data ?? [];
  },

  /**
   * Admin/staff full-row read. Relies on the admin SELECT policy on
   * lands; no extra app-side gating because the admin layout itself
   * is already gated by AdminRoute + useAdminRole.
   */
  async forAdmin(filter?: { onlyActive?: boolean }): Promise<any[]> {
    let q = supabase.from("lands").select("*").order("created_at", { ascending: false });
    if (filter?.onlyActive) q = q.eq("is_active", true).is("deleted_at", null);
    const { data, error } = await q;
    if (error) {
      log.error("lands.forAdmin failed", { code: (error as any).code });
      return [];
    }
    return data ?? [];
  },

  /** Soft-delete a land (admin-only, owner-only via RLS). */
  async softDelete(landId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from("lands")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("id", landId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  },
};
