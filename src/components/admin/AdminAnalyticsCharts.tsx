import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart, ComposedChart,
} from "recharts";

type MonthlyData = { month: string; users: number; lands: number; deals: number; requests: number };

const AdminAnalyticsCharts: React.FC = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [conversionRate, setConversionRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "revenue">("overview");

  useEffect(() => {
    const fetchAnalytics = async () => {
      const now = new Date();
      const months: MonthlyData[] = [];

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

      const [totalReq, approvedReq] = await Promise.all([
        supabase.from("deal_requests").select("id", { count: "exact", head: true }),
        supabase.from("deal_requests").select("id", { count: "exact", head: true }).eq("status", "approved"),
      ]);
      const total = totalReq.count ?? 0;
      const approved = approvedReq.count ?? 0;
      setConversionRate(total > 0 ? Math.round((approved / total) * 100) : 0);

      setLoading(false);
    };
    fetchAnalytics();
  }, [isAr]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-[320px] animate-pulse rounded-xl bg-gray-100/60" />
      </div>
    );
  }

  const tooltipStyle = {
    borderRadius: 10,
    border: "none",
    boxShadow: "0 4px 24px -4px rgba(0,0,0,0.1)",
    fontSize: 12,
    padding: "10px 14px",
  };

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 border-b border-gray-100">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-[13px] font-medium transition-colors relative ${
            activeTab === "overview"
              ? "text-[#2B4C66]"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {isAr ? "نظرة عامة" : "Overview"}
          {activeTab === "overview" && (
            <span className="absolute bottom-0 start-0 end-0 h-[2px] bg-[#2B4C66] rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("revenue")}
          className={`px-4 py-2.5 text-[13px] font-medium transition-colors relative ${
            activeTab === "revenue"
              ? "text-[#2B4C66]"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {isAr ? "الطلبات والصفقات" : "Requests & Deals"}
          {activeTab === "revenue" && (
            <span className="absolute bottom-0 start-0 end-0 h-[2px] bg-[#2B4C66] rounded-full" />
          )}
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-[12px] text-gray-500">
        {activeTab === "overview" ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#2B4C66]" />
              {isAr ? "مستخدمون" : "Users"}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#C2A86B]" />
              {isAr ? "أراضي" : "Lands"}
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2B4C66]" />
              {isAr ? "صفقات" : "Deals"}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#C2A86B]" />
              {isAr ? "طلبات" : "Requests"}
            </span>
          </>
        )}
      </div>

      {/* Charts */}
      {activeTab === "overview" ? (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={monthly} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2B4C66" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#2B4C66" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="barFill2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C2A86B" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#C2A86B" stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} dy={8} />
            <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(43,76,102,0.04)" }} />
            <Bar dataKey="users" fill="url(#barFill)" name={isAr ? "مستخدمون" : "Users"} radius={[6, 6, 0, 0]} barSize={28} />
            <Bar dataKey="lands" fill="url(#barFill2)" name={isAr ? "أراضي" : "Lands"} radius={[6, 6, 0, 0]} barSize={28} />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={monthly} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="areaDeals" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2B4C66" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#2B4C66" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="areaRequests" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C2A86B" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#C2A86B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} dy={8} />
            <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="deals" stroke="#2B4C66" fill="url(#areaDeals)" name={isAr ? "صفقات" : "Deals"} strokeWidth={2.5} dot={{ r: 4, fill: "#2B4C66", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }} />
            <Area type="monotone" dataKey="requests" stroke="#C2A86B" fill="url(#areaRequests)" name={isAr ? "طلبات" : "Requests"} strokeWidth={2.5} dot={{ r: 4, fill: "#C2A86B", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }} />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Conversion KPI inline */}
      <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-gray-50 to-transparent px-5 py-3.5 border border-gray-100">
        <div className="h-10 w-10 rounded-lg bg-[#2B4C66]/10 flex items-center justify-center">
          <span className="text-[16px] font-bold text-[#2B4C66]">{conversionRate}%</span>
        </div>
        <div>
          <p className="text-[13px] font-medium text-gray-700">{isAr ? "معدل التحويل" : "Conversion Rate"}</p>
          <p className="text-[11px] text-gray-400">{isAr ? "من الطلبات إلى الصفقات" : "Requests to Deals"}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsCharts;
