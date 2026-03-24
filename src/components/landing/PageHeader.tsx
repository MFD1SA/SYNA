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
  <div className="relative w-full overflow-hidden bg-primary pt-40 pb-20">
    {/* Background image component */}
    {backgroundImage && (
      <div className="absolute inset-0">
        <img
          src={backgroundImage}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-20 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/40 to-primary" />
        <div className="luxury-grid absolute inset-0 opacity-10" />
      </div>
    )}

    <div className="container relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="max-w-3xl"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px w-8 bg-accent" />
          <Icon className="h-4 w-4 text-accent" strokeWidth={2} />
        </div>
        
        <h1 className="mb-6 text-4xl font-medium tracking-tight text-white md:text-6xl border-s-4 border-accent ps-8 uppercase leading-tight">
          {title}
        </h1>
        
        <p className="text-lg font-light leading-relaxed text-white/50 text-balance ps-9">
          {description}
        </p>
      </motion.div>
    </div>
  </div>
);

export default PageHeader;
