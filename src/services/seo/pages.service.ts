import { supabase } from "@/integrations/supabase/client";
import type { SeoPage, SeoPageStatus, SeoPageType, SeoPageSection } from "@/types/seo";

// Cast helpers — tables aren't in generated supabase types yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pagesTable = () => supabase.from("seo_pages" as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sectionsTable = () => supabase.from("seo_page_sections" as any);

export interface ListPagesFilters {
  status?: SeoPageStatus;
  pageType?: SeoPageType;
  locale?: "ar" | "en";
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listSeoPages(filters: ListPagesFilters = {}): Promise<{
  rows: SeoPage[];
  total: number;
}> {
  let query = pagesTable()
    .select("*", { count: "exact" })
    .order("updated_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.pageType) query = query.eq("page_type", filters.pageType);
  if (filters.locale) query = query.eq("locale", filters.locale);
  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`
    );
  }

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as unknown as SeoPage[], total: count ?? 0 };
}

export async function getSeoPageById(id: string): Promise<SeoPage | null> {
  const { data, error } = await pagesTable().select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as SeoPage) ?? null;
}

export async function getSeoPageBySlug(
  slug: string,
  locale: "ar" | "en" = "ar"
): Promise<SeoPage | null> {
  const { data, error } = await pagesTable()
    .select("*")
    .eq("slug", slug)
    .eq("locale", locale)
    .eq("status", "published")
    .eq("noindex", false)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as SeoPage) ?? null;
}

export async function updateSeoPage(id: string, patch: Partial<SeoPage>): Promise<SeoPage> {
  const { data, error } = await pagesTable()
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as SeoPage;
}

export async function deleteSeoPage(id: string): Promise<void> {
  const { error } = await pagesTable().delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setSeoPageStatus(
  id: string,
  status: SeoPageStatus,
  reviewerId?: string,
  reviewNotes?: string
): Promise<SeoPage> {
  const patch: Partial<SeoPage> = { status };
  if (status === "published") patch.published_at = new Date().toISOString();
  if (reviewerId) {
    patch.last_reviewed_by = reviewerId;
    patch.last_reviewed_at = new Date().toISOString();
  }
  if (reviewNotes !== undefined) patch.review_notes = reviewNotes;
  return updateSeoPage(id, patch);
}

export async function getSeoPageSections(pageId: string): Promise<SeoPageSection[]> {
  const { data, error } = await sectionsTable()
    .select("*")
    .eq("page_id", pageId)
    .order("display_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SeoPageSection[];
}

export interface SeoOverviewCounts {
  total: number;
  draft: number;
  readyForReview: number;
  published: number;
  noindex: number;
  archived: number;
  missingCanonical: number;
  missingSchema: number;
  duplicateTitles: number;
}

export async function getSeoOverview(): Promise<SeoOverviewCounts> {
  // Pull everything in one query then aggregate client-side (tables are small)
  const { data, error } = await pagesTable().select(
    "id,status,canonical_url,schema_json,title,locale"
  );
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as Array<{
    status: SeoPageStatus;
    canonical_url: string | null;
    schema_json: Record<string, unknown> | null;
    title: string;
    locale: string;
  }>;

  const titleKey = (r: { title: string; locale: string }) => `${r.locale}::${r.title.trim().toLowerCase()}`;
  const titleCounts = new Map<string, number>();
  rows.forEach((r) => {
    const k = titleKey(r);
    titleCounts.set(k, (titleCounts.get(k) ?? 0) + 1);
  });
  const duplicateTitles = Array.from(titleCounts.values()).filter((c) => c > 1).length;

  return {
    total: rows.length,
    draft: rows.filter((r) => r.status === "draft").length,
    readyForReview: rows.filter((r) => r.status === "ready_for_review").length,
    published: rows.filter((r) => r.status === "published").length,
    noindex: rows.filter((r) => r.status === "noindex").length,
    archived: rows.filter((r) => r.status === "archived").length,
    missingCanonical: rows.filter((r) => !r.canonical_url).length,
    missingSchema: rows.filter(
      (r) => !r.schema_json || Object.keys(r.schema_json).length === 0
    ).length,
    duplicateTitles,
  };
}
