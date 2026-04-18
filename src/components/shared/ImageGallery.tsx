import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  images: string[];
  isAr?: boolean;
  className?: string;
}

/**
 * Thumbnail grid that opens a full-screen lightbox on click. Supports
 * keyboard navigation (arrows + Esc) and RTL layout. Safe to mount
 * with an empty array — renders nothing.
 */
const ImageGallery: React.FC<Props> = ({ images, isAr = false, className = "" }) => {
  const [active, setActive] = useState<number | null>(null);
  const valid = (images || []).filter(Boolean);
  if (!valid.length) return null;

  const close = () => setActive(null);
  const prev = () => setActive((i) => (i === null ? null : (i - 1 + valid.length) % valid.length));
  const next = () => setActive((i) => (i === null ? null : (i + 1) % valid.length));

  React.useEffect(() => {
    if (active === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") (isAr ? prev : next)();
      else if (e.key === "ArrowLeft") (isAr ? next : prev)();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, isAr]);

  return (
    <>
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 ${className}`}>
        {valid.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className="group relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50 aspect-[4/3]"
            aria-label={isAr ? `صورة ${i + 1}` : `Image ${i + 1}`}
          >
            <img
              src={src}
              alt={isAr ? `صورة ${i + 1}` : `Image ${i + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {active !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); close(); }}
            className="absolute top-4 end-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <X className="h-5 w-5" />
          </button>

          {valid.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); (isAr ? next : prev)(); }}
                className="absolute start-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label={isAr ? "التالي" : "Previous"}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); (isAr ? prev : next)(); }}
                className="absolute end-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label={isAr ? "السابق" : "Next"}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <img
            src={valid[active]}
            alt={isAr ? `صورة ${active + 1}` : `Image ${active + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {valid.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-[13px] bg-black/40 rounded-full px-3 py-1">
              {active + 1} / {valid.length}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ImageGallery;
