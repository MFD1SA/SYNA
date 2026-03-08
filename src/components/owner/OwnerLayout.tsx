import React from "react";
import OwnerSidebar from "./OwnerSidebar";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const OwnerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <OwnerSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end border-b border-border/60 bg-background/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="flex h-8 items-center gap-2 rounded-lg bg-surface px-3">
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-[10px] font-medium text-primary">
                  {(user?.email?.[0] || "U").toUpperCase()}
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

export default OwnerLayout;
