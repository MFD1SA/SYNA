import React from "react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ icon: Icon, title, description }) => (
  <div className="relative w-full overflow-hidden bg-[hsl(210,30%,4%)]">
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-32 end-[-10%] h-[400px] w-[400px] rounded-full bg-[hsl(200,80%,40%,0.06)] blur-[120px]" />
      <div className="absolute -bottom-32 start-[-8%] h-[300px] w-[300px] rounded-full bg-[hsl(195,85%,50%,0.04)] blur-[100px]" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(200 80% 60%) 0.5px, transparent 0.5px)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[hsl(210,30%,4%)] to-transparent" />
    </div>

    <div className="container relative z-10 py-14 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="mx-auto max-w-2xl text-center"
      >
        <div className="mb-4 inline-flex items-center justify-center rounded-xl border border-[hsl(200,80%,45%,0.15)] bg-[hsl(200,80%,45%,0.06)] p-3">
          <Icon className="h-6 w-6 text-[hsl(200,80%,55%)]" strokeWidth={1.5} />
        </div>
        <h1 className="mb-3 text-3xl font-medium text-white md:text-4xl">{title}</h1>
        <p className="text-base font-light leading-relaxed text-[hsl(210,15%,50%)]">{description}</p>
      </motion.div>
    </div>
  </div>
);

export default PageHeader;
