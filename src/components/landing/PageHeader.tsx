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
  <div className="relative w-full overflow-hidden bg-card border-b border-border/40">
    {/* Background image */}
    {backgroundImage && (
      <img
        src={backgroundImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-40 mix-blend-overlay"
      />
    )}

    {/* Elegant subtle gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-card/95" />

    <div className="container relative z-10 py-20 md:py-28 pt-28 md:pt-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="mx-auto max-w-2xl text-center"
      >
        <div className="mb-6 inline-flex items-center justify-center rounded-2xl border border-muted/50 bg-muted/30 p-4 shadow-sm backdrop-blur-md">
          <Icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="mb-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">{title}</h1>
        <p className="text-lg font-light leading-relaxed text-muted-foreground">{description}</p>
      </motion.div>
    </div>
  </div>
);

export default PageHeader;
