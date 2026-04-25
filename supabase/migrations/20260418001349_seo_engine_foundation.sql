-- SINA SEO Programmatic Engine — Foundation Schema
create type seo_page_type as enum ('city','district','property_type','company','developer','service','topic','hybrid');
create type seo_page_status as enum ('draft','ready_for_review','published','noindex','archived');
create type seo_content_mode as enum ('auto_auto','auto_review','manual_only');
create type seo_entity_type as enum ('city','district','property_type','service','topic');

create table public.seo_entities (
  id uuid primary key default gen_random_uuid(),
  entity_type seo_entity_type not null,
  slug text not null,
  name_ar text not null,
  name_en text not null,
  description_ar text,
  description_en text,
  parent_id uuid references public.seo_entities(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  is_active boolean not null default true,
  is_sensitive boolean not null default false,
  sort_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, slug)
);
create index idx_seo_entities_type on public.seo_entities (entity_type);
create index idx_seo_entities_parent on public.seo_entities (parent_id);

create table public.seo_templates (
  id uuid primary key default gen_random_uuid(),
  page_type seo_page_type not null,
  name text not null,
  is_default boolean not null default false,
  title_template_ar text not null,
  title_template_en text not null,
  meta_description_ar text not null,
  meta_description_en text not null,
  h1_template_ar text not null,
  h1_template_en text not null,
  intro_template_ar text,
  intro_template_en text,
  body_sections_ar jsonb default '[]'::jsonb,
  body_sections_en jsonb default '[]'::jsonb,
  faq_template jsonb default '[]'::jsonb,
  internal_links_template jsonb default '[]'::jsonb,
  og_title_template_ar text,
  og_title_template_en text,
  og_description_template_ar text,
  og_description_template_en text,
  og_image_pattern text,
  canonical_pattern text not null,
  default_content_mode seo_content_mode not null default 'auto_review',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_seo_templates_type on public.seo_templates (page_type);
create unique index idx_seo_templates_default_per_type on public.seo_templates (page_type) where is_default = true;

create table public.seo_pages (
  id uuid primary key default gen_random_uuid(),
  page_type seo_page_type not null,
  template_id uuid references public.seo_templates(id) on delete set null,
  slug text not null,
  canonical_url text,
  locale text not null default 'ar' check (locale in ('ar','en')),
  hreflang_group uuid,
  title text not null,
  meta_description text not null,
  h1 text not null,
  intro text,
  body_html text,
  schema_json jsonb default '{}'::jsonb,
  faq_items jsonb default '[]'::jsonb,
  internal_links jsonb default '[]'::jsonb,
  og_title text,
  og_description text,
  og_image text,
  entity_id uuid references public.seo_entities(id) on delete set null,
  secondary_entity_id uuid references public.seo_entities(id) on delete set null,
  bound_developer_id uuid,
  bound_data_snapshot jsonb default '{}'::jsonb,
  status seo_page_status not null default 'draft',
  content_mode seo_content_mode not null default 'auto_review',
  quality_score int default 0,
  word_count int default 0,
  noindex boolean not null default false,
  nofollow boolean not null default false,
  generated_at timestamptz,
  published_at timestamptz,
  last_reviewed_by uuid,
  last_reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, locale)
);
create index idx_seo_pages_status on public.seo_pages (status);
create index idx_seo_pages_type on public.seo_pages (page_type);
create index idx_seo_pages_locale on public.seo_pages (locale);
create index idx_seo_pages_entity on public.seo_pages (entity_id);
create index idx_seo_pages_hreflang on public.seo_pages (hreflang_group);
create index idx_seo_pages_published on public.seo_pages (published_at desc) where status = 'published';

create table public.seo_page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.seo_pages(id) on delete cascade,
  section_type text not null,
  heading text,
  body text,
  display_order int not null default 0,
  is_auto_generated boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_seo_page_sections_page on public.seo_page_sections (page_id);

create table public.seo_page_links (
  id uuid primary key default gen_random_uuid(),
  source_page_id uuid not null references public.seo_pages(id) on delete cascade,
  target_page_id uuid references public.seo_pages(id) on delete set null,
  target_url text,
  anchor_text text not null,
  link_context text,
  display_order int default 0,
  created_at timestamptz not null default now()
);
create index idx_seo_page_links_source on public.seo_page_links (source_page_id);
create index idx_seo_page_links_target on public.seo_page_links (target_page_id);

create table public.seo_generation_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  page_type seo_page_type not null,
  min_data_requirements jsonb not null default '{}'::jsonb,
  quality_gates jsonb not null default '{}'::jsonb,
  max_pages_per_run int default 50,
  content_mode seo_content_mode not null default 'auto_review',
  is_active boolean not null default true,
  priority int default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_seo_rules_type on public.seo_generation_rules (page_type);

create table public.seo_redirects (
  id uuid primary key default gen_random_uuid(),
  source_path text not null unique,
  target_path text not null,
  status_code int not null default 301 check (status_code in (301,302,307,308)),
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_seo_redirects_source on public.seo_redirects (source_path) where is_active = true;

create table public.seo_issues (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references public.seo_pages(id) on delete cascade,
  issue_type text not null,
  severity text not null check (severity in ('low','medium','high','critical')),
  details jsonb default '{}'::jsonb,
  is_resolved boolean not null default false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz not null default now()
);
create index idx_seo_issues_page on public.seo_issues (page_id);
create index idx_seo_issues_unresolved on public.seo_issues (is_resolved) where is_resolved = false;

create table public.seo_generation_runs (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid references public.seo_generation_rules(id) on delete set null,
  triggered_by uuid,
  trigger_type text not null default 'manual' check (trigger_type in ('manual','scheduled','webhook')),
  status text not null default 'pending' check (status in ('pending','running','completed','failed')),
  pages_generated int default 0,
  pages_skipped int default 0,
  errors jsonb default '[]'::jsonb,
  started_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_seo_gen_runs_status on public.seo_generation_runs (status);

create table public.seo_publish_queue (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.seo_pages(id) on delete cascade,
  target_status seo_page_status not null default 'published',
  scheduled_for timestamptz,
  processed_at timestamptz,
  status text not null default 'queued' check (status in ('queued','processing','done','failed')),
  error_message text,
  created_at timestamptz not null default now()
);
create index idx_seo_publish_queue_pending on public.seo_publish_queue (status, scheduled_for) where status = 'queued';

create or replace function public.seo_touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_seo_entities_updated before update on public.seo_entities for each row execute function public.seo_touch_updated_at();
create trigger trg_seo_templates_updated before update on public.seo_templates for each row execute function public.seo_touch_updated_at();
create trigger trg_seo_pages_updated before update on public.seo_pages for each row execute function public.seo_touch_updated_at();
create trigger trg_seo_sections_updated before update on public.seo_page_sections for each row execute function public.seo_touch_updated_at();
create trigger trg_seo_rules_updated before update on public.seo_generation_rules for each row execute function public.seo_touch_updated_at();
create trigger trg_seo_redirects_updated before update on public.seo_redirects for each row execute function public.seo_touch_updated_at();

alter table public.seo_entities          enable row level security;
alter table public.seo_templates         enable row level security;
alter table public.seo_pages             enable row level security;
alter table public.seo_page_sections     enable row level security;
alter table public.seo_page_links        enable row level security;
alter table public.seo_generation_rules  enable row level security;
alter table public.seo_redirects         enable row level security;
alter table public.seo_issues            enable row level security;
alter table public.seo_generation_runs   enable row level security;
alter table public.seo_publish_queue     enable row level security;

create or replace function public.is_seo_admin() returns boolean as $$
  select exists (
    select 1 from public.admin_permissions ap
    where ap.user_id = auth.uid() and (ap.is_super_admin = true or ap.perm_content = true)
  );
$$ language sql security definer stable;

create policy seo_entities_admin_all  on public.seo_entities         for all to authenticated using (public.is_seo_admin()) with check (public.is_seo_admin());
create policy seo_templates_admin_all on public.seo_templates        for all to authenticated using (public.is_seo_admin()) with check (public.is_seo_admin());
create policy seo_pages_admin_all     on public.seo_pages            for all to authenticated using (public.is_seo_admin()) with check (public.is_seo_admin());
create policy seo_sections_admin_all  on public.seo_page_sections    for all to authenticated using (public.is_seo_admin()) with check (public.is_seo_admin());
create policy seo_links_admin_all     on public.seo_page_links       for all to authenticated using (public.is_seo_admin()) with check (public.is_seo_admin());
create policy seo_rules_admin_all     on public.seo_generation_rules for all to authenticated using (public.is_seo_admin()) with check (public.is_seo_admin());
create policy seo_redirects_admin_all on public.seo_redirects        for all to authenticated using (public.is_seo_admin()) with check (public.is_seo_admin());
create policy seo_issues_admin_all    on public.seo_issues           for all to authenticated using (public.is_seo_admin()) with check (public.is_seo_admin());
create policy seo_runs_admin_all      on public.seo_generation_runs  for all to authenticated using (public.is_seo_admin()) with check (public.is_seo_admin());
create policy seo_queue_admin_all     on public.seo_publish_queue    for all to authenticated using (public.is_seo_admin()) with check (public.is_seo_admin());

create policy seo_pages_public_read      on public.seo_pages         for select to anon, authenticated using (status = 'published' and noindex = false);
create policy seo_entities_public_read   on public.seo_entities      for select to anon, authenticated using (is_active = true);
create policy seo_sections_public_read   on public.seo_page_sections for select to anon, authenticated using (exists (select 1 from public.seo_pages p where p.id = seo_page_sections.page_id and p.status = 'published' and p.noindex = false));
create policy seo_links_public_read      on public.seo_page_links    for select to anon, authenticated using (exists (select 1 from public.seo_pages p where p.id = seo_page_links.source_page_id and p.status = 'published' and p.noindex = false));
create policy seo_redirects_public_read  on public.seo_redirects     for select to anon, authenticated using (is_active = true);

insert into public.seo_entities (entity_type, slug, name_ar, name_en, sort_order) values
  ('city','riyadh','الرياض','Riyadh',1),('city','jeddah','جدة','Jeddah',2),('city','makkah','مكة المكرمة','Makkah',3),
  ('city','madinah','المدينة المنورة','Madinah',4),('city','dammam','الدمام','Dammam',5),('city','khobar','الخبر','Khobar',6),
  ('city','dhahran','الظهران','Dhahran',7),('city','abha','أبها','Abha',8),('city','taif','الطائف','Taif',9),
  ('city','tabuk','تبوك','Tabuk',10),('city','hail','حائل','Hail',11),('city','jubail','الجبيل','Jubail',12),
  ('city','yanbu','ينبع','Yanbu',13),('city','buraidah','بريدة','Buraidah',14);

insert into public.seo_entities (entity_type, slug, name_ar, name_en, sort_order) values
  ('property_type','lands','أراضٍ','Lands',1),('property_type','apartments','شقق','Apartments',2),
  ('property_type','villas','فلل','Villas',3),('property_type','buildings','عمائر','Buildings',4),
  ('property_type','warehouses','مستودعات','Warehouses',5),('property_type','offices','مكاتب','Offices',6),
  ('property_type','shops','محلات تجارية','Shops',7),('property_type','commercial','عقارات تجارية','Commercial Real Estate',8),
  ('property_type','residential','عقارات سكنية','Residential Real Estate',9),('property_type','investment','عقارات استثمارية','Investment Real Estate',10);

insert into public.seo_entities (entity_type, slug, name_ar, name_en, is_sensitive, sort_order) values
  ('service','real-estate-development','التطوير العقاري','Real Estate Development',false,1),
  ('service','real-estate-marketing','التسويق العقاري','Real Estate Marketing',false,2),
  ('service','real-estate-partnership','الشراكة العقارية','Real Estate Partnership',false,3),
  ('service','real-estate-brokerage','الوساطة العقارية','Real Estate Brokerage',false,4),
  ('service','property-management','إدارة الأملاك','Property Management',false,5),
  ('service','real-estate-valuation','التقييم العقاري','Real Estate Valuation',false,6),
  ('service','real-estate-investment','الاستثمار العقاري','Real Estate Investment',true,7),
  ('service','real-estate-financing','التمويل العقاري','Real Estate Financing',true,8),
  ('service','real-estate-funds','الصناديق العقارية','Real Estate Funds',true,9),
  ('service','white-land-fees','رسوم الأراضي البيضاء','White Land Fees',true,10);

insert into public.seo_entities (entity_type, slug, name_ar, name_en, is_sensitive, sort_order) values
  ('topic','real-estate-development-guide','دليل التطوير العقاري','Real Estate Development Guide',false,1),
  ('topic','partnership-vs-sale','الشراكة مقابل البيع المباشر','Partnership vs. Direct Sale',false,2),
  ('topic','land-valuation-basics','أساسيات تقييم الأراضي','Land Valuation Basics',false,3),
  ('topic','how-partnerships-work','كيف تعمل الشراكة التطويرية','How Development Partnerships Work',false,4),
  ('topic','due-diligence-checklist','قائمة الفحص النافي للجهالة','Due Diligence Checklist',false,5),
  ('topic','real-estate-funds-explained','شرح الصناديق العقارية','Real Estate Funds Explained',true,6),
  ('topic','white-land-fees-explained','شرح رسوم الأراضي البيضاء','White Land Fees Explained',true,7);
