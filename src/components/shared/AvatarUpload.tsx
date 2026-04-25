import React, { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildSafeStoragePath, SAFE_IMAGE_MIMES, UnsafeFileTypeError } from "@/lib/storageSafe";

interface AvatarUploadProps {
  /** Current image URL */
  currentUrl: string | null;
  /** Display name for the initial fallback */
  displayName: string;
  /** Called with the new public URL after upload */
  onUpload: (url: string) => void;
  /** Called when image is removed */
  onRemove: () => void;
  /** Storage subfolder: "avatars" | "logos" */
  folder?: string;
  /** Size class: "sm" = 64px, "md" = 80px, "lg" = 96px */
  size?: "sm" | "md" | "lg";
  /** Label text */
  label?: string;
  /** Is Arabic */
  isAr?: boolean;
}

const sizeMap = { sm: "h-16 w-16", md: "h-20 w-20", lg: "h-24 w-24" };
const textSizeMap = { sm: "text-lg", md: "text-xl", lg: "text-2xl" };

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentUrl, displayName, onUpload, onRemove,
  folder = "avatars", size = "md", label, isAr = false,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const initial = displayName?.trim()?.charAt(0)?.toUpperCase() || "?";
  const sizeClass = sizeMap[size];
  const textClass = textSizeMap[size];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      // 5MB max. Bail before touching storage.
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      // P2.1 — MIME validation + extension derived from the validated MIME
      // (never from file.name). Blocks double-extension tricks and
      // filenames without a dot. Throws UnsafeFileTypeError on mismatch,
      // which we surface to the console — the <input accept=...> attribute
      // already gave the user a filtered picker, so a hit here means
      // someone deliberately bypassed the picker.
      const filename = buildSafeStoragePath(folder, file, SAFE_IMAGE_MIMES);
      const { error } = await supabase.storage.from("site-assets").upload(filename, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("site-assets").getPublicUrl(filename);
      onUpload(data.publicUrl);
    } catch (err) {
      if (err instanceof UnsafeFileTypeError) {
        console.warn("Rejected upload:", err.message);
      } else {
        console.error("Upload error:", err);
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-4">
      {/* Avatar circle */}
      <div className={`relative ${sizeClass} rounded-full overflow-hidden shrink-0 group`}>
        {currentUrl ? (
          <img src={currentUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br from-[#2B4C66] to-[#1E374B] flex items-center justify-center`}>
            <span className={`${textClass} font-semibold text-white`}>{initial}</span>
          </div>
        )}
        {/* Hover overlay */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : (
            <Camera className="h-5 w-5 text-white" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Controls */}
      <div className="space-y-1.5">
        {label && <p className="text-xs font-medium text-foreground">{label}</p>}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-[11px] gap-1"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            {isAr ? "رفع صورة" : "Upload"}
          </Button>
          {currentUrl && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] gap-1 text-destructive hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-3 w-3" />
              {isAr ? "إزالة" : "Remove"}
            </Button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {isAr ? "JPG, PNG أو WebP. الحد الأقصى 5MB" : "JPG, PNG or WebP. Max 5MB"}
        </p>
      </div>

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
    </div>
  );
};

export default AvatarUpload;
