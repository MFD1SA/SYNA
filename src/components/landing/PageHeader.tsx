import React from "react";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ icon: Icon, title, description }) => (
  <div className="relative w-full overflow-hidden bg-[hsl(210,25%,8%)]">
    {/* Cinematic background effects */}
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-32 end-[-10%] h-[400px] w-[400px] rounded-full bg-[hsl(187,65%,28%,0.08)] blur-[120px]" />
      <div className="absolute -bottom-32 start-[-8%] h-[300px] w-[300px] rounded-full bg-[hsl(40,72%,52%,0.06)] blur-[100px]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(187 65% 60%) 0.5px, transparent 0.5px)`,
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[hsl(210,25%,8%)] to-transparent" />
    </div>

    <div className="container relative z-10 py-14 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-4 inline-flex items-center justify-center rounded-full border border-[hsl(187,55%,40%,0.3)] bg-[hsl(187,55%,40%,0.1)] p-3">
          <Icon className="h-6 w-6 text-[hsl(187,55%,50%)]" strokeWidth={1.5} />
        </div>
        <h1 className="mb-3 text-3xl font-medium text-white md:text-4xl">{title}</h1>
        <p className="text-base font-light leading-relaxed text-[hsl(210,15%,60%)]">{description}</p>
      </div>
    </div>
  </div>
);

export default PageHeader;
