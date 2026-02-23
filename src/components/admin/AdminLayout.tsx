import React from "react";
import AdminSidebar from "./AdminSidebar";

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex min-h-screen bg-background">
    <AdminSidebar />
    <main className="flex-1 overflow-auto">
      <div className="container py-8">{children}</div>
    </main>
  </div>
);

export default AdminLayout;
