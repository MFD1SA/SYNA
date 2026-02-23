import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TermsPage from "./pages/Terms";
import PrivacyPage from "./pages/Privacy";
import UsagePolicyPage from "./pages/UsagePolicy";
import AboutPage from "./pages/About";
import FAQPage from "./pages/FAQ";
import SubscriptionsPage from "./pages/Subscriptions";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import CrmDashboard from "./pages/crm/CrmDashboard";
import CrmLands from "./pages/crm/CrmLands";
import CrmRequests from "./pages/crm/CrmRequests";
import CrmDeals from "./pages/crm/CrmDeals";
import CrmBrowseLands from "./pages/crm/CrmBrowseLands";
import CrmMyRequests from "./pages/crm/CrmMyRequests";
import CrmProperties from "./pages/crm/CrmProperties";
import CrmUnits from "./pages/crm/CrmUnits";
import CrmLeases from "./pages/crm/CrmLeases";
import CrmReceivables from "./pages/crm/CrmReceivables";
import CrmMaintenance from "./pages/crm/CrmMaintenance";
import CrmReports from "./pages/crm/CrmReports";
import CrmSettings from "./pages/crm/CrmSettings";
import AdminOverview from "./pages/admin/AdminOverview";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">...</div>;
  if (!user) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();
  if (loading || roleLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">...</div>;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (!isAdmin) return <Navigate to="/crm/dashboard" replace />;
  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">...</div>;
  if (user) return <Navigate to="/crm/dashboard" replace />;
  return <>{children}</>;
};

const App: React.FC = () => (
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

              {/* Auth */}
              <Route path="/auth/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path="/auth/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
              <Route path="/login" element={<Navigate to="/auth/login" replace />} />
              <Route path="/register" element={<Navigate to="/auth/register" replace />} />

              {/* CRM */}
              <Route path="/crm/dashboard" element={<ProtectedRoute><CrmDashboard /></ProtectedRoute>} />
              <Route path="/crm/lands" element={<ProtectedRoute><CrmLands /></ProtectedRoute>} />
              <Route path="/crm/requests" element={<ProtectedRoute><CrmRequests /></ProtectedRoute>} />
              <Route path="/crm/deals" element={<ProtectedRoute><CrmDeals /></ProtectedRoute>} />
              <Route path="/crm/browse" element={<ProtectedRoute><CrmBrowseLands /></ProtectedRoute>} />
              <Route path="/crm/my-requests" element={<ProtectedRoute><CrmMyRequests /></ProtectedRoute>} />
              <Route path="/crm/properties" element={<ProtectedRoute><CrmProperties /></ProtectedRoute>} />
              <Route path="/crm/units" element={<ProtectedRoute><CrmUnits /></ProtectedRoute>} />
              <Route path="/crm/leases" element={<ProtectedRoute><CrmLeases /></ProtectedRoute>} />
              <Route path="/crm/receivables" element={<ProtectedRoute><CrmReceivables /></ProtectedRoute>} />
              <Route path="/crm/maintenance" element={<ProtectedRoute><CrmMaintenance /></ProtectedRoute>} />
              <Route path="/crm/reports" element={<ProtectedRoute><CrmReports /></ProtectedRoute>} />
              <Route path="/crm/settings" element={<ProtectedRoute><CrmSettings /></ProtectedRoute>} />

              {/* Admin */}
              <Route path="/admin/overview" element={<AdminRoute><AdminOverview /></AdminRoute>} />

              {/* Redirects */}
              <Route path="/dashboard" element={<Navigate to="/crm/dashboard" replace />} />
              <Route path="/dashboard/*" element={<Navigate to="/crm/dashboard" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
