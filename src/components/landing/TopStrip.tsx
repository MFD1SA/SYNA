import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Globe } from "lucide-react";

const TopStrip: React.FC = () => {
  const { lang, toggleLang } = useLanguage();
  const isAr = lang === "ar";

  return (
    <div
      className="top-strip w-full z-[60] relative"
      dir={isAr ? "rtl" : "ltr"}
      style={{
        background: "hsl(var(--strip-bg))",
        borderBottom: "1px solid hsl(var(--strip-accent) / 0.12)",
      }}
    >
      <div
        className="container h-full flex items-center justify-between"
        style={{ height: "40px" }}
      >
        {/* Left / Start — Navigation links */}
        <div className="flex items-center gap-6">
          <Link
            to="/about"
            className="strip-link"
            style={{
              fontSize: "10px",
              fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
              fontWeight: 500,
              letterSpacing: isAr ? "0.03em" : "0.18em",
              color: "hsl(var(--strip-fg))",
              textTransform: isAr ? "none" : "uppercase",
              textDecoration: "none",
              transition: "color 0.25s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color =
                "hsl(var(--strip-accent))")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color = "hsl(var(--strip-fg))")
            }
          >
            {isAr ? "من نحن" : "About"}
          </Link>

          {/* Divider */}
          <span
            style={{
              width: "1px",
              height: "12px",
              background: "hsl(var(--strip-fg) / 0.2)",
              display: "inline-block",
            }}
          />

          <Link
            to="/contact"
            className="strip-link"
            style={{
              fontSize: "10px",
              fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
              fontWeight: 500,
              letterSpacing: isAr ? "0.03em" : "0.18em",
              color: "hsl(var(--strip-fg))",
              textTransform: isAr ? "none" : "uppercase",
              textDecoration: "none",
              transition: "color 0.25s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color =
                "hsl(var(--strip-accent))")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color = "hsl(var(--strip-fg))")
            }
          >
            {isAr ? "تواصل معنا" : "Contact"}
          </Link>

          <span
            style={{
              width: "1px",
              height: "12px",
              background: "hsl(var(--strip-fg) / 0.2)",
              display: "inline-block",
            }}
          />

          <Link
            to="/auth?role=owner"
            className="strip-link"
            style={{
              fontSize: "10px",
              fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
              fontWeight: 500,
              letterSpacing: isAr ? "0.03em" : "0.18em",
              color: "hsl(var(--strip-fg))",
              textTransform: isAr ? "none" : "uppercase",
              textDecoration: "none",
              transition: "color 0.25s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color =
                "hsl(var(--strip-accent))")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color = "hsl(var(--strip-fg))")
            }
          >
            {isAr ? "خدماتنا" : "Services"}
          </Link>
        </div>

        {/* Right / End — Language + Badge */}
        <div className="flex items-center gap-5">
          {/* Institutional badge */}
          <span
            style={{
              fontSize: "9px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              letterSpacing: "0.22em",
              color: "hsl(var(--strip-accent))",
              textTransform: "uppercase",
              opacity: 0.75,
              paddingInlineEnd: "4px",
            }}
          >
            شراكات موثّقة
          </span>

          <span
            style={{
              width: "1px",
              height: "12px",
              background: "hsl(var(--strip-fg) / 0.2)",
              display: "inline-block",
            }}
          />

          {/* Language toggle */}
          <button
            onClick={toggleLang}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "10px",
              fontFamily: isAr ? "'Inter', sans-serif" : "'Cairo', sans-serif",
              fontWeight: 500,
              letterSpacing: isAr ? "0.18em" : "0.03em",
              color: "hsl(var(--strip-fg))",
              textTransform: isAr ? "uppercase" : "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              transition: "color 0.25s",
              padding: 0,
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color =
                "hsl(var(--strip-accent))")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color =
                "hsl(var(--strip-fg))")
            }
          >
            <Globe
              size={11}
              style={{ color: "hsl(var(--strip-accent))", opacity: 0.7 }}
            />
            {isAr ? "English" : "العربية"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopStrip;
