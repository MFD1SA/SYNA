import React from "react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  backgroundImage?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ icon: Icon, title, description, backgroundImage }) => (
  <div className="relative w-full overflow-hidden bg-primary pt-48 pb-24">
    {/* Cinematic Background Layer */}
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-primary/40 z-10" />
      {backgroundImage ? (
        <img
          src={backgroundImage}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center grayscale opacity-30 contrast-125 scale-105"
        />
      ) : (
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,_var(--accent)_0.5px,_transparent_0.5px)] bg-[size:40px_40px] opacity-10" />
      )}
    </div>

    <div className="container relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl"
      >
        <div className="mb-12 flex items-center gap-6">
          <div className="h-0.5 w-12 bg-accent" />
          <Icon className="h-5 w-5 text-accent/80" strokeWidth={1.5} />
        </div>
        
        <h1 className="cinematic-header text-white mb-10 leading-[1.1] border-s-[6px] border-accent ps-10">
          {title}
        </h1>
        
        <p className="executive-sub text-white/50 max-w-2xl ps-12">
          {description}
        </p>
      </motion.div>
    </div>
  </div>
);

export default PageHeader;
