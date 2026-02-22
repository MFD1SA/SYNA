import React, { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, FileText, Receipt, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const NotificationDropdown: React.FC = () => {
  const { lang } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [open, setOpen] = useState(false);

  const t = {
    ar: {
      title: "الإشعارات",
      markAllRead: "تحديد الكل كمقروء",
      noNotifications: "لا توجد إشعارات",
      leaseExpiring: "عقد ينتهي قريباً",
      overdueReceivable: "مستحق متأخر",
    },
    en: {
      title: "Notifications",
      markAllRead: "Mark all as read",
      noNotifications: "No notifications",
      leaseExpiring: "Lease Expiring Soon",
      overdueReceivable: "Overdue Receivable",
    },
  };

  const labels = t[lang];

  const getIcon = (type: string) => {
    switch (type) {
      case "lease_expiring": return <FileText className="h-4 w-4 text-amber-500" />;
      case "receivable_overdue": return <Receipt className="h-4 w-4 text-destructive" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const timeAgo = (date: string) =>
    formatDistanceToNow(new Date(date), { addSuffix: true, locale: lang === "ar" ? ar : enUS });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground">
          <Bell className="h-4 w-4" strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <h3 className="text-sm font-medium text-foreground">{labels.title}</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 gap-1 text-xs text-muted-foreground">
              <CheckCheck className="h-3 w-3" />
              {labels.markAllRead}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="mb-2 h-8 w-8 opacity-30" />
              <p className="text-sm font-light">{labels.noNotifications}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  lang={lang}
                  onRead={markAsRead}
                  getIcon={getIcon}
                  timeAgo={timeAgo}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

const NotificationItem: React.FC<{
  notification: Notification;
  lang: "ar" | "en";
  onRead: (id: string) => void;
  getIcon: (type: string) => React.ReactNode;
  timeAgo: (date: string) => string;
}> = ({ notification, lang, onRead, getIcon, timeAgo }) => {
  const title = lang === "ar" ? notification.title_ar : notification.title_en;
  const message = lang === "ar" ? notification.message_ar : notification.message_en;

  return (
    <button
      onClick={() => !notification.is_read && onRead(notification.id)}
      className={`flex w-full gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/50 ${
        !notification.is_read ? "bg-primary/5" : ""
      }`}
    >
      <div className="mt-0.5 shrink-0">{getIcon(notification.type)}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs font-light text-muted-foreground line-clamp-2">{message}</p>
        <p className="mt-1 text-[11px] text-muted-foreground/70">{timeAgo(notification.created_at)}</p>
      </div>
      {!notification.is_read && (
        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
};

export default NotificationDropdown;
