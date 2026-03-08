import React from "react";
import OwnerSidebar from "./OwnerSidebar";

const OwnerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex min-h-screen bg-background">
    <OwnerSidebar />
    <main className="flex-1 overflow-auto">
      <div className="container py-8">{children}</div>
    </main>
  </div>
);

export default OwnerLayout;
