import React from "react";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ icon: Icon, title, description }) => (
  <div className="w-full border-b border-border/60 bg-gradient-to-b from-primary/5 to-background">
    <div className="container py-14 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-4 inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="mb-3 text-3xl font-medium text-foreground md:text-4xl">{title}</h1>
        <p className="text-base font-light leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  </div>
);

export default PageHeader;
