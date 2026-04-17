import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light" : "Switch to dark"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={cn(
        "h-9 w-9 rounded-full flex items-center justify-center text-slate-400 hover:text-[#2B4C66] hover:bg-[#2B4C66]/10 dark:hover:bg-white/5 dark:hover:text-white transition-colors",
        className,
      )}
    >
      {isDark ? <Sun className="h-4 w-4" strokeWidth={1.5} /> : <Moon className="h-4 w-4" strokeWidth={1.5} />}
    </button>
  );
};

export default ThemeToggle;
