import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, Users, Landmark, Handshake } from "lucide-react";

type MonthlyData = { month: string; users: number; lands: number; deals: number; requests: number };

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const AdminAnalyticsCharts: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [conversionRate, setConversionRate] = useState(0);
  const [dealStages, setDealStages] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const now = new Date();
      const months: MonthlyData[] = [];

      // Get last 6 months of data
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = d.toISOString();
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
        const label = d.toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", year: "2-digit" });

        const [usersRes, landsRes, dealsRes, reqRes] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
          supabase.from("lands").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
          supabase.from("deals").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
          supabase.from("deal_requests").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
        ]);

        months.push({
          month: label,
          users: usersRes.count ?? 0,
          lands: landsRes.count ?? 0,
          deals: dealsRes.count ?? 0,
          requests: reqRes.count ?? 0,
        });
      }
      setMonthly(months);

      // Conversion rate
      const [totalReq, approvedReq] = await Promise.all([
        supabase.from("deal_requests").select("id", { count: "exact", head: true }),
        supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("status", "approved"),
      ]);
      const total = totalReq.count ?? 0;
      const approved = approvedReq.count ?? 0;
      setConversionRate(total > 0 ? Math.round((approved / total) * 100) : 0);

      // Deal stages distribution
      const { data: stageData } = await supabase.from("deals").select("current_stage");
      const stageMap: Record<string, number> = {};
      stageData?.forEach((d) => {
        stageMap[d.current_stage] = (stageMap[d.current_stage] || 0) + 1;
      });
      const stageLabels: Record<string, string> = {
        listed: isAr ? "مُدرج" : "Listed",
        request_submitted: isAr ? "طلب مقدم" : "Submitted",
        owner_review: isAr ? "مراجعة المالك" : "Owner Review",
        owner_approved: isAr ? "موافقة" : "Approved",
        meeting_scheduled: isAr ? "اجتماع" : "Meeting",
        strategy_defined: isAr ? "استراتيجية" : "Strategy",
        documents_exchanged: isAr ? "مستندات" : "Documents",
        agreements_prepared: isAr ? "اتفاقيات" : "Agreements",
        deal_closed: isAr ? "مُغلقة" : "Closed",
        deal_cancelled: isAr ? "ملغية" : "Cancelled",
      };
      setDealStages(
        Object.entries(stageMap).map(([k, v]) => ({ name: stageLabels[k] || k, value: v }))
      );

      setLoading(false);
    };
    fetchAnalytics();
  }, [isAr]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Conversion KPI */}
      <div className="flex items-center gap-3 doma-card p-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm text-muted-foreground">{isAr ? "معدل تحويل الطلبات إلى صفقات" : "Request-to-Deal Conversion"}</p>
          <p className="text-2xl font-medium text-foreground">{conversionRate}%</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Users & Lands bar chart */}
        <div className="doma-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">{isAr ? "المستخدمون والأراضي شهرياً" : "Users & Lands Monthly"}</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="users" fill="hsl(var(--primary))" name={isAr ? "مستخدمون" : "Users"} radius={[4, 4, 0, 0]} />
              <Bar dataKey="lands" fill="hsl(var(--chart-2))" name={isAr ? "أراضي" : "Lands"} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Deals & Requests line chart */}
        <div className="doma-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Handshake className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">{isAr ? "الصفقات والطلبات شهرياً" : "Deals & Requests Monthly"}</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="deals" stroke="hsl(var(--primary))" name={isAr ? "صفقات" : "Deals"} strokeWidth={2} />
              <Line type="monotone" dataKey="requests" stroke="hsl(var(--chart-3))" name={isAr ? "طلبات" : "Requests"} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Deal stages pie chart */}
        {dealStages.length > 0 && (
          <div className="doma-card p-4 sm:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">{isAr ? "توزيع مراحل الصفقات" : "Deal Stage Distribution"}</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={dealStages} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {dealStages.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsCharts;
