import React from "react";
import CrmSidebar from "./CrmSidebar";

const CrmLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex min-h-screen bg-background">
    <CrmSidebar />
    <main className="flex-1 overflow-auto">
      <div className="container py-8">{children}</div>
    </main>
  </div>
);

export default CrmLayout;
