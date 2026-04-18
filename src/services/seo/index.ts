/**
 * SEO services — single import surface.
 * Each sub-service is a thin typed wrapper around Supabase queries.
 * Admin-only RLS enforces server-side access control.
 */
export * from "./pages.service";
export * from "./templates.service";
export * from "./entities.service";
export * from "./rules.service";
export * from "./redirects.service";
export * from "./issues.service";
export * from "./generation.service";
export * from "./quality.service";
export * from "./queue.service";
