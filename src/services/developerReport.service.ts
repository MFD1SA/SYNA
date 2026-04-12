import { supabase } from "@/integrations/supabase/client";

/* ── Types ── */

export type ReportStatus = "generating" | "completed" | "failed" | "expired";

export interface DeveloperReportData {
  company_name: string;
  brand_name: string | null;
  cr_number: string | null;
  email: string | null;
  phone: string | null;
  verification_status: "verified" | "pending" | "unverified";
  registered_at: string;
  website: string | null;
  website_status: "active" | "inactive" | "unknown";
  total_requests: number;
  accepted_requests: number;
  rejected_requests: number;
  pending_requests: number;
  cancelled_requests: number;
  avg_response_hours: number | null;
  reliability_score: "high" | "medium" | "low";
  reliability_factors: string[];
  professional_summary_ar: string;
  professional_summary_en: string;
  generated_at: string;
}

export interface DeveloperReport {
  id: string;
  deal_request_id: string | null;
  developer_id: string;
  requested_by: string;
  status: ReportStatus;
  report_data: DeveloperReportData | null;
  cache_key: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

/* ── Status labels ── */
export const reportStatusLabels: Record<ReportStatus, { ar: string; en: string }> = {
  generating: { ar: "جاري التوليد", en: "Generating" },
  completed: { ar: "مكتمل", en: "Completed" },
  failed: { ar: "فشل", en: "Failed" },
  expired: { ar: "منتهي الصلاحية", en: "Expired" },
};

export const reportStatusColors: Record<ReportStatus, string> = {
  generating: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  expired: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export const reliabilityLabels: Record<string, { ar: string; en: string }> = {
  high: { ar: "موثوقية عالية", en: "High Reliability" },
  medium: { ar: "موثوقية متوسطة", en: "Medium Reliability" },
  low: { ar: "موثوقية منخفضة", en: "Low Reliability" },
};

export const reliabilityColors: Record<string, string> = {
  high: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  low: "bg-destructive/10 text-destructive border-destructive/20",
};

/* ── API Functions ── */

/** Get existing report for a deal request or developer (uses cache) */
export async function getReport(params: {
  dealRequestId?: string;
  developerId?: string;
}): Promise<DeveloperReport | null> {
  let query = supabase
    .from("developer_reports" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (params.dealRequestId) {
    query = query.eq("deal_request_id", params.dealRequestId);
  } else if (params.developerId) {
    query = query.eq("developer_id", params.developerId);
  } else {
    return null;
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data as DeveloperReport | null;
}

/** Request generation of a new developer report via Edge Function */
export async function generateReport(params: {
  dealRequestId: string;
  developerId: string;
}): Promise<{ success: boolean; error?: string; report?: DeveloperReport }> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-developer-report", {
      body: {
        deal_request_id: params.dealRequestId,
        developer_id: params.developerId,
      },
    });

    if (error) return { success: false, error: error.message };
    if (data?.error) return { success: false, error: data.error };
    return { success: true, report: data.report as DeveloperReport };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Get all reports for admin view */
export async function getAllReports(limit = 50): Promise<DeveloperReport[]> {
  const { data, error } = await supabase
    .from("developer_reports" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data || []) as DeveloperReport[];
}

/** Check if a valid (non-expired) cached report exists */
export function isCacheValid(report: DeveloperReport | null, maxAgeHours = 72): boolean {
  if (!report) return false;
  if (report.status !== "completed") return false;
  const age = Date.now() - new Date(report.created_at).getTime();
  return age < maxAgeHours * 60 * 60 * 1000;
}
