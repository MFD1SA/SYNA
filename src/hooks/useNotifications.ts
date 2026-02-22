import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/hooks/useTenant";

export interface Notification {
  id: string;
  tenant_id: string | null;
  user_id: string;
  type: string;
  title_ar: string;
  title_en: string;
  message_ar: string;
  message_en: string;
  entity_id: string | null;
  entity_type: string | null;
  is_read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    }
    setLoading(false);
  }, [user]);

  const generateNotifications = useCallback(async () => {
    if (!user || !tenantId) return;

    // Check expiring leases (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expiringLeases } = await supabase
      .from("leases")
      .select("id, end_date, unit_id, monthly_rent")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .lte("end_date", thirtyDaysFromNow.toISOString().split("T")[0])
      .gte("end_date", new Date().toISOString().split("T")[0]);

    // Check overdue receivables
    const { data: overdueReceivables } = await supabase
      .from("receivables")
      .select("id, amount, due_date, paid_amount")
      .eq("tenant_id", tenantId)
      .eq("status", "overdue");

    // Get existing notification entity_ids to avoid duplicates
    const { data: existingNotifs } = await supabase
      .from("notifications")
      .select("entity_id, type")
      .eq("user_id", user.id)
      .in("type", ["lease_expiring", "receivable_overdue"]);

    const existingSet = new Set(
      (existingNotifs || []).map((n: any) => `${n.type}:${n.entity_id}`)
    );

    const newNotifications: any[] = [];

    // Generate lease expiring notifications
    (expiringLeases || []).forEach((lease) => {
      if (existingSet.has(`lease_expiring:${lease.id}`)) return;
      const daysLeft = Math.ceil(
        (new Date(lease.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      newNotifications.push({
        tenant_id: tenantId,
        user_id: user.id,
        type: "lease_expiring",
        title_ar: "عقد ينتهي قريباً",
        title_en: "Lease Expiring Soon",
        message_ar: `عقد ينتهي خلال ${daysLeft} يوم - إيجار شهري ${lease.monthly_rent || 0} ر.س`,
        message_en: `Lease expiring in ${daysLeft} days - Monthly rent ${lease.monthly_rent || 0} SAR`,
        entity_id: lease.id,
        entity_type: "lease",
      });
    });

    // Generate overdue receivable notifications
    (overdueReceivables || []).forEach((rec) => {
      if (existingSet.has(`receivable_overdue:${rec.id}`)) return;
      const remaining = (rec.amount || 0) - (rec.paid_amount || 0);
      newNotifications.push({
        tenant_id: tenantId,
        user_id: user.id,
        type: "receivable_overdue",
        title_ar: "مستحق متأخر",
        title_en: "Overdue Receivable",
        message_ar: `مبلغ متأخر ${remaining.toLocaleString()} ر.س - تاريخ الاستحقاق ${rec.due_date}`,
        message_en: `Overdue amount ${remaining.toLocaleString()} SAR - Due date ${rec.due_date}`,
        entity_id: rec.id,
        entity_type: "receivable",
      });
    });

    if (newNotifications.length > 0) {
      await supabase.from("notifications").insert(newNotifications);
      await fetchNotifications();
    }
  }, [user, tenantId, fetchNotifications]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Generate on mount
  useEffect(() => {
    if (tenantId) generateNotifications();
  }, [tenantId, generateNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => fetchNotifications()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead, refresh: fetchNotifications };
};
