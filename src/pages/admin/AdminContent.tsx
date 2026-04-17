import React from "react";
import AdminVisualContent from "./AdminVisualContent";

/**
 * AdminContent now serves as the unified visual content management page.
 * The old content-completeness dashboard has been removed in favor of
 * the hero-image management system built in AdminVisualContent.
 */
const AdminContent: React.FC = () => <AdminVisualContent />;

export default AdminContent;
