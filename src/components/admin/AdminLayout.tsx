import React from "react";
import AdminSidebar from "./AdminSidebar";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === "ar";

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 w-64 rounded-lg bg-surface ps-9 text-xs"
                placeholder={isAr ? "بحث سريع..." : "Quick search..."}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="flex h-8 items-center gap-2 rounded-lg bg-surface px-3">
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-[10px] font-medium text-primary">
                  {(user?.email?.[0] || "A").toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-light text-muted-foreground hidden sm:inline" dir="ltr">
                {user?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
