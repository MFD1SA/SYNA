export const usageLabels: Record<string, { ar: string; en: string }> = {
  residential: { ar: "سكني", en: "Residential" },
  commercial: { ar: "تجاري", en: "Commercial" },
  residential_commercial: { ar: "سكني تجاري", en: "Mixed" },
  high_density: { ar: "كثافة عالية (أبراج)", en: "High Density (Towers)" },
};

export const goalLabels: Record<string, { ar: string; en: string }> = {
  develop_sell: { ar: "تطوير وبيع", en: "Develop & Sell" },
  develop_rent: { ar: "تطوير وتأجير", en: "Develop & Rent" },
  develop_mixed: { ar: "مختلط", en: "Mixed" },
  develop_complex: { ar: "مجمع متكامل", en: "Integrated Complex" },
  sell_develop: { ar: "بيع وتطوير", en: "Sell & Develop" },
  partial_exit: { ar: "تخارج جزئي", en: "Partial Exit" },
  offplan_sell: { ar: "تطوير وبيع على الخارطة", en: "Off-Plan Sell" },
  real_estate_contribution: { ar: "مساهمة عقارية", en: "Real Estate Contribution" },
};

export const projectModelLabels: Record<string, { ar: string; en: string }> = {
  development_partnership: { ar: "شراكة تطوير", en: "Development Partnership" },
  real_estate_contribution: { ar: "مساهمة عقارية", en: "Real Estate Contribution" },
};

export const developmentSubtypes: Record<string, { label: { ar: string; en: string }; options: { value: string; ar: string; en: string }[] }> = {
  residential: {
    label: { ar: "النوع السكني", en: "Residential Type" },
    options: [
      { value: "villas", ar: "فلل", en: "Villas" },
      { value: "townhouses", ar: "تاون هاوس", en: "Townhouses" },
      { value: "apartments", ar: "شقق سكنية", en: "Residential Apartments" },
      { value: "compound", ar: "مجمع سكني", en: "Residential Compound" },
      { value: "mixed_residential", ar: "تطوير سكني مختلط", en: "Mixed Residential Development" },
    ],
  },
  commercial: {
    label: { ar: "النوع التجاري", en: "Commercial Type" },
    options: [
      { value: "showrooms", ar: "معارض تجارية", en: "Retail Showrooms" },
      { value: "retail_offices", ar: "تجاري + مكاتب", en: "Retail + Offices" },
      { value: "offices_only", ar: "مكاتب فقط", en: "Offices Only" },
      { value: "commercial_center", ar: "مركز تجاري", en: "Commercial Center" },
      { value: "office_complex", ar: "مجمع مكاتب", en: "Office Complex" },
      { value: "mixed_commercial", ar: "تطوير تجاري مختلط", en: "Mixed Commercial Development" },
    ],
  },
  residential_commercial: {
    label: { ar: "النوع المختلط", en: "Mixed Type" },
    options: [
      { value: "villas", ar: "فلل", en: "Villas" },
      { value: "townhouses", ar: "تاون هاوس", en: "Townhouses" },
      { value: "apartments", ar: "شقق سكنية", en: "Residential Apartments" },
      { value: "showrooms", ar: "معارض تجارية", en: "Retail Showrooms" },
      { value: "retail_offices", ar: "تجاري + مكاتب", en: "Retail + Offices" },
      { value: "mixed_development", ar: "تطوير مختلط شامل", en: "Mixed Development" },
    ],
  },
  high_density: {
    label: { ar: "نوع الأبراج", en: "Tower Type" },
    options: [
      { value: "residential_tower", ar: "برج سكني", en: "Residential Tower" },
      { value: "commercial_tower", ar: "برج تجاري", en: "Commercial Tower" },
      { value: "office_tower", ar: "برج مكاتب", en: "Office Tower" },
      { value: "mixed_tower", ar: "برج متعدد الاستخدام", en: "Mixed-Use Tower" },
    ],
  },
  raw_land: {
    label: { ar: "نوع تطوير الأرض الخام", en: "Raw Land Development" },
    options: [
      { value: "infrastructure", ar: "تطوير بنية تحتية", en: "Infrastructure Development" },
      { value: "subdivision", ar: "تقسيم أراضي", en: "Subdivision Development" },
      { value: "vertical", ar: "تطوير رأسي", en: "Vertical Development" },
      { value: "integrated", ar: "تطوير متكامل", en: "Integrated Development" },
    ],
  },
};

export const contributionModelLabels: Record<string, { ar: string; en: string; desc_ar: string; desc_en: string }> = {
  full_inkind: {
    ar: "مساهمة عينية كاملة",
    en: "Full In-Kind Contribution",
    desc_ar: "يساهم المالك بالأرض كاملة كمساهمة عينية في المشروع",
    desc_en: "Owner contributes the entire land as an in-kind contribution",
  },
  partial_exit: {
    ar: "تخارج جزئي",
    en: "Partial Exit",
    desc_ar: "يتخارج المالك من نسبة محددة من قيمة الأرض",
    desc_en: "Owner exits a specified percentage of the land value",
  },
};

export const exitPercentages = [10, 20, 30, 40, 50];

export const PLATFORM_BROKERAGE_RATE = 0.025; // 2.50%
export const PLATFORM_OPERATIONAL_RATE = 0.005; // 0.50%
export const PLATFORM_TOTAL_RATE = 0.03; // 3.00%

export interface LandFormData {
  // Location
  city: string;
  district: string;
  exact_location_lat: string;
  exact_location_lng: string;
  // Land details
  land_area_sqm: string;
  length_m: string;
  width_m: string;
  street_width_m: string;
  usage_type: string;
  // Document info
  plan_number: string;
  plot_number: string;
  parcel_count: string;
  land_boundaries: string;
  street_info: string;
  deed_number: string;
  deed_date: string;
  brokerage_license_number: string;
  // Files
  deed_file_url: string;
  kroki_file_url: string;
  additional_docs_urls: string[];
  image_url: string;
  // Project model
  project_model: string;
  development_subtype: string;
  partnership_goal: string;
  // Contribution
  contribution_model: string;
  exit_percentage: string;
  // Pricing
  estimated_price_per_sqm: string;
  estimated_total_value: string;
  // Vision
  vision_summary: string;
  project_type: string;
  partnership_model: string;
  // Owner
  owner_name: string;
  selected_owner_id: string;
  owner_approved: boolean;
  // Legal
  legal_acknowledgment_accepted: boolean;
  platform_fee_acknowledged: boolean;
}

export const defaultLandForm: LandFormData = {
  city: "",
  district: "",
  exact_location_lat: "",
  exact_location_lng: "",
  land_area_sqm: "",
  length_m: "",
  width_m: "",
  street_width_m: "",
  usage_type: "residential",
  plan_number: "",
  plot_number: "",
  parcel_count: "1",
  land_boundaries: "",
  street_info: "",
  deed_number: "",
  deed_date: "",
  brokerage_license_number: "",
  deed_file_url: "",
  kroki_file_url: "",
  additional_docs_urls: [],
  image_url: "",
  project_model: "development_partnership",
  development_subtype: "",
  partnership_goal: "develop_sell",
  contribution_model: "",
  exit_percentage: "",
  estimated_price_per_sqm: "",
  estimated_total_value: "",
  vision_summary: "",
  project_type: "",
  partnership_model: "",
  owner_name: "",
  selected_owner_id: "",
  owner_approved: false,
  legal_acknowledgment_accepted: false,
  platform_fee_acknowledged: false,
};
