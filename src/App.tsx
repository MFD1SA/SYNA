import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useUserType } from "@/hooks/useUserType";

// Immediate loading for entry points to prevent layout shift / delays on landing
import Index from "./pages/Index";
import LoginPage from "./pages/Login";

// Lazy loading for heavy dashboard and secondary pages
const NotFound = lazy(() => import("./pages/NotFound"));
const NoAccess = lazy(() => import("./pages/NoAccess"));
const TermsPage = lazy(() => import("./pages/Terms"));
const PrivacyPage = lazy(() => import("./pages/Privacy"));
const UsagePolicyPage = lazy(() => import("./pages/UsagePolicy"));
const AboutPage = lazy(() => import("./pages/About"));
const FAQPage = lazy(() => import("./pages/FAQ"));
const FeatureDetailPage = lazy(() => import("./pages/FeatureDetail"));
const SubscriptionsPage = lazy(() => import("./pages/Subscriptions"));
const OpportunityDetail = lazy(() => import("./pages/OpportunityDetail"));
const Contact = lazy(() => import("./pages/Contact"));

const CrmDashboard = lazy(() => import("./pages/crm/CrmDashboard"));
const CrmDeals = lazy(() => import("./pages/crm/CrmDeals"));
const CrmBrowseLands = lazy(() => import("./pages/crm/CrmBrowseLands"));
const CrmMyRequests = lazy(() => import("./pages/crm/CrmMyRequests"));
const CrmSettings = lazy(() => import("./pages/crm/CrmSettings"));

const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminLands = lazy(() => import("./pages/admin/AdminLands"));
const AdminDevelopers = lazy(() => import("./pages/admin/AdminDevelopers"));
const AdminDeals = lazy(() => import("./pages/admin/AdminDeals"));
const AdminAI = lazy(() => import("./pages/admin/AdminAI"));
const AdminOwners = lazy(() => import("./pages/admin/AdminOwners"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminAuditLog = lazy(() => import("./pages/admin/AdminAuditLog"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const AdminTeam = lazy(() => import("./pages/admin/AdminTeam"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const OwnerDashboard = lazy(() => import("./pages/owner/OwnerDashboard"));
const OwnerLands = lazy(() => import("./pages/owner/OwnerLands"));
const OwnerRequests = lazy(() => import("./pages/owner/OwnerRequests"));
const OwnerDeals = lazy(() => import("./pages/owner/OwnerDeals"));
const OwnerSettings = lazy(() => import("./pages/owner/OwnerSettings"));

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="flex min-h-screen w-full items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-r-2 border-t-2 border-primary"></div>
  </div>
);

// Basic auth check
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
};

// Admin-only route
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();
  if (loading || roleLoading) return <LoadingScreen />;
  if (!user || !isAdmin) return <Navigate to="/admincp" replace />;
  return <>{children}</>;
};

// Developer-only route: must have a record in `developers` table
const DeveloperRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { userType, loading: typeLoading } = useUserType();
  if (authLoading || typeLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (userType === "developer" || userType === "admin") return <>{children}</>;
  if (userType === "owner") return <Navigate to="/owner/dashboard" replace />;
  return <Navigate to="/no-access" replace />;
};

// Owner-only route
const OwnerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { userType, loading: typeLoading } = useUserType();
  if (authLoading || typeLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (userType === "owner" || userType === "admin") return <>{children}</>;
  if (userType === "developer") return <Navigate to="/crm/dashboard" replace />;
  return <Navigate to="/no-access" replace />;
};

// Public-only route (redirect if already logged in)
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { userType, loading: typeLoading } = useUserType();
  if (authLoading || typeLoading) return <LoadingScreen />;
  if (user) {
    if (userType === "admin") return <Navigate to="/admincp/overview" replace />;
    if (userType === "developer") return <Navigate to="/crm/dashboard" replace />;
    if (userType === "owner") return <Navigate to="/owner/dashboard" replace />;
    signOut();
    return <>{children}</>;
  }
  return <>{children}</>;
};

const App: React.FC = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  {/* Public */}
                  <Route path="/" element={<Index />} />
                  <Route path="/subscriptions" element={<SubscriptionsPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/usage-policy" element={<UsagePolicyPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/features/:slug" element={<FeatureDetailPage />} />
                  <Route path="/opportunity/:id" element={<OpportunityDetail />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/no-access" element={<NoAccess />} />

                  {/* Auth */}
                  <Route path="/auth/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
                  <Route path="/auth/register" element={<Navigate to="/auth/login" replace />} />
                  <Route path="/login" element={<Navigate to="/auth/login" replace />} />
                  <Route path="/register" element={<Navigate to="/auth/login" replace />} />

                  {/* CRM — Developer Only */}
                  <Route path="/crm/dashboard" element={<DeveloperRoute><CrmDashboard /></DeveloperRoute>} />
                  <Route path="/crm/browse" element={<DeveloperRoute><CrmBrowseLands /></DeveloperRoute>} />
                  <Route path="/crm/my-requests" element={<DeveloperRoute><CrmMyRequests /></DeveloperRoute>} />
                  <Route path="/crm/deals" element={<DeveloperRoute><CrmDeals /></DeveloperRoute>} />
                  <Route path="/crm/settings" element={<DeveloperRoute><CrmSettings /></DeveloperRoute>} />

                  {/* Admin */}
                  <Route path="/admincp" element={<AdminLogin />} />
                  <Route path="/admincp/overview" element={<AdminRoute><AdminOverview /></AdminRoute>} />
                  <Route path="/admincp/lands" element={<AdminRoute><AdminLands /></AdminRoute>} />
                  <Route path="/admincp/developers" element={<AdminRoute><AdminDevelopers /></AdminRoute>} />
                  <Route path="/admincp/deals" element={<AdminRoute><AdminDeals /></AdminRoute>} />
                  <Route path="/admincp/ai" element={<AdminRoute><AdminAI /></AdminRoute>} />
                  <Route path="/admincp/owners" element={<AdminRoute><AdminOwners /></AdminRoute>} />
                  <Route path="/admincp/audit" element={<AdminRoute><AdminAuditLog /></AdminRoute>} />
                  <Route path="/admincp/content" element={<AdminRoute><AdminContent /></AdminRoute>} />
                  <Route path="/admincp/team" element={<AdminRoute><AdminTeam /></AdminRoute>} />
                  <Route path="/admincp/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

                  {/* Owner */}
                  <Route path="/owner/dashboard" element={<OwnerRoute><OwnerDashboard /></OwnerRoute>} />
                  <Route path="/owner/lands" element={<OwnerRoute><OwnerLands /></OwnerRoute>} />
                  <Route path="/owner/requests" element={<OwnerRoute><OwnerRequests /></OwnerRoute>} />
                  <Route path="/owner/deals" element={<OwnerRoute><OwnerDeals /></OwnerRoute>} />
                  <Route path="/owner/settings" element={<OwnerRoute><OwnerSettings /></OwnerRoute>} />

                  {/* Redirects */}
                  <Route path="/dashboard" element={<Navigate to="/crm/dashboard" replace />} />
                  <Route path="/dashboard/*" element={<Navigate to="/crm/dashboard" replace />} />
                  {/* Legacy CRM redirects */}
                  <Route path="/crm/lands" element={<Navigate to="/crm/browse" replace />} />
                  <Route path="/crm/requests" element={<Navigate to="/crm/my-requests" replace />} />
                  <Route path="/crm/properties" element={<Navigate to="/crm/dashboard" replace />} />
                  <Route path="/crm/units" element={<Navigate to="/crm/dashboard" replace />} />
                  <Route path="/crm/leases" element={<Navigate to="/crm/dashboard" replace />} />
                  <Route path="/crm/receivables" element={<Navigate to="/crm/dashboard" replace />} />
                  <Route path="/crm/maintenance" element={<Navigate to="/crm/dashboard" replace />} />
                  <Route path="/crm/reports" element={<Navigate to="/crm/dashboard" replace />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
