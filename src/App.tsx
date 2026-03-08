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
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NoAccess from "./pages/NoAccess";
import TermsPage from "./pages/Terms";
import PrivacyPage from "./pages/Privacy";
import UsagePolicyPage from "./pages/UsagePolicy";
import AboutPage from "./pages/About";
import FAQPage from "./pages/FAQ";
import FeatureDetailPage from "./pages/FeatureDetail";
import SubscriptionsPage from "./pages/Subscriptions";
import LoginPage from "./pages/Login";
import CrmDashboard from "./pages/crm/CrmDashboard";
import CrmDeals from "./pages/crm/CrmDeals";
import CrmBrowseLands from "./pages/crm/CrmBrowseLands";
import CrmMyRequests from "./pages/crm/CrmMyRequests";
import CrmSettings from "./pages/crm/CrmSettings";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminLands from "./pages/admin/AdminLands";
import AdminDevelopers from "./pages/admin/AdminDevelopers";
import AdminDeals from "./pages/admin/AdminDeals";
import AdminAI from "./pages/admin/AdminAI";
import AdminOwners from "./pages/admin/AdminOwners";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminContent from "./pages/admin/AdminContent";
import AdminTeam from "./pages/admin/AdminTeam";
import AdminTargets from "./pages/admin/AdminTargets";
import AdminSettings from "./pages/admin/AdminSettings";
import OpportunityDetail from "./pages/OpportunityDetail";
import Contact from "./pages/Contact";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerRequests from "./pages/owner/OwnerRequests";
import OwnerDeals from "./pages/owner/OwnerDeals";
import OwnerSettings from "./pages/owner/OwnerSettings";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center text-muted-foreground">...</div>
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
    // User has no role — sign them out silently and show login page
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
              <Route path="/admincp/targets" element={<AdminRoute><AdminTargets /></AdminRoute>} />
              <Route path="/admincp/team" element={<AdminRoute><AdminTeam /></AdminRoute>} />
              <Route path="/admincp/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

              {/* Owner */}
              <Route path="/owner/dashboard" element={<OwnerRoute><OwnerDashboard /></OwnerRoute>} />
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
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
