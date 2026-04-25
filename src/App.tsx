import React, { lazy, Suspense, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import CookieBanner from "@/components/shared/CookieBanner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useUserType } from "@/hooks/useUserType";
import { isImpersonationSession } from "@/integrations/supabase/impersonateClient";

// Immediate loading for entry points to prevent layout shift / delays on landing.
// Only Index stays eager — it's the single page that must paint without any
// network-gated JS chunk. LoginPage used to sit in this eager list too, but a
// cold marketing visitor who never signs in was paying for its bundle (and
// every shared dep transitively pulled in) on first paint. Moving it into
// the lazy bucket cuts the entry chunk by the Login bundle size and defers
// the download until the user actually navigates to /auth/login.
import Index from "./pages/Index";

// Lazy loading for heavy dashboard and secondary pages
const LoginPage = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const NoAccess = lazy(() => import("./pages/NoAccess"));
const TermsPage = lazy(() => import("./pages/Terms"));
const PrivacyPage = lazy(() => import("./pages/Privacy"));
const UsagePolicyPage = lazy(() => import("./pages/UsagePolicy"));
const AboutPage = lazy(() => import("./pages/About"));
const FAQPage = lazy(() => import("./pages/FAQ"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const ForOwners = lazy(() => import("./pages/ForOwners"));
const ForDevelopers = lazy(() => import("./pages/ForDevelopers"));
const Partnerships = lazy(() => import("./pages/Partnerships"));
const PartnershipsOwners = lazy(() => import("./pages/PartnershipsOwners"));
const PartnershipsDevelopers = lazy(() => import("./pages/PartnershipsDevelopers"));
const BlogPage = lazy(() => import("./pages/Blog"));
const OpportunityDetail = lazy(() => import("./pages/OpportunityDetail"));
const OffersPage = lazy(() => import("./pages/OffersPage"));
const OfferDetailPage = lazy(() => import("./pages/OfferDetailPage"));
const Contact = lazy(() => import("./pages/Contact"));
const RegisterPage = lazy(() => import("./pages/Register"));
const SetPasswordPage = lazy(() => import("./pages/SetPassword"));

const ImpersonateCallback = lazy(() => import("./pages/ImpersonateCallback"));

const CrmDashboard = lazy(() => import("./pages/crm/CrmDashboard"));
const CrmDeals = lazy(() => import("./pages/crm/CrmDeals"));
const CrmBrowseLands = lazy(() => import("./pages/crm/CrmBrowseLands"));
const CrmMyRequests = lazy(() => import("./pages/crm/CrmMyRequests"));
const CrmSettings = lazy(() => import("./pages/crm/CrmSettings"));

const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminLands = lazy(() => import("./pages/admin/AdminLands"));
const AdminDevelopers = lazy(() => import("./pages/admin/AdminDevelopers"));
const AdminDeals = lazy(() => import("./pages/admin/AdminDeals"));
const AdminOffers = lazy(() => import("./pages/admin/AdminOffers"));
const AdminOwners = lazy(() => import("./pages/admin/AdminOwners"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminAuditLog = lazy(() => import("./pages/admin/AdminAuditLog"));
const AdminMonitoring = lazy(() => import("./pages/admin/AdminMonitoring"));
const AdminTeam = lazy(() => import("./pages/admin/AdminTeam"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

// SEO Control Center
const AdminSeoLayout = lazy(() => import("./pages/admin/seo/AdminSeoLayout"));
const AdminSeoOverview = lazy(() => import("./pages/admin/seo/AdminSeoOverview"));
const AdminSeoPages = lazy(() => import("./pages/admin/seo/AdminSeoPages"));
const AdminSeoPageDetail = lazy(() => import("./pages/admin/seo/AdminSeoPageDetail"));
const AdminSeoTemplates = lazy(() => import("./pages/admin/seo/AdminSeoTemplates"));
const AdminSeoEntities = lazy(() => import("./pages/admin/seo/AdminSeoEntities"));
const AdminSeoRules = lazy(() => import("./pages/admin/seo/AdminSeoRules"));
const AdminSeoRedirects = lazy(() => import("./pages/admin/seo/AdminSeoRedirects"));
const AdminSeoIssues = lazy(() => import("./pages/admin/seo/AdminSeoIssues"));
const AdminSeoQueue = lazy(() => import("./pages/admin/seo/AdminSeoQueue"));

// Public SEO-generated page renderer
const SeoRouteHandler = lazy(() => import("./pages/seo/SeoRouteHandler"));

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

// Compact loader for route guards — renders inline without reserving full viewport height
const RouteLoader = () => (
  <div className="flex w-full items-center justify-center py-20">
    <div className="h-6 w-6 animate-spin rounded-full border-r-2 border-t-2 border-primary"></div>
  </div>
);

// Basic auth check
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <RouteLoader />;
  if (!user) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
};

// Admin-only route
// The nested <ErrorBoundary> scopes a crash inside the admin panel to the
// panel itself — a broken admin page won't blank the public marketing site.
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();
  if (loading || roleLoading) return <RouteLoader />;
  if (!user || !isAdmin) return <Navigate to="/admincp" replace />;
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

// Developer-only route: only actual developers allowed
// Admins must use impersonate (Login button) to access developer dashboards
// Impersonation tabs (sessionStorage-based) are allowed through ONLY when a
// real Supabase session is present — otherwise a leftover sessionStorage flag
// from a past impersonation would let a signed-out tab render the CRM frame
// (RLS would deny data, but the shell would still leak layout + any cached
// react-query state from the previous user).
const DeveloperRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { userType, loading: typeLoading } = useUserType();
  // Impersonation tabs bypass role checks — the session was validated by
  // ImpersonateCallback — but they still require a live auth session.
  if (isImpersonationSession()) {
    if (authLoading) return <RouteLoader />;
    if (!user) return <Navigate to="/auth/login" replace />;
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }
  if (authLoading || typeLoading) return <RouteLoader />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (userType === "developer") return <ErrorBoundary>{children}</ErrorBoundary>;
  if (userType === "admin") return <Navigate to="/admincp/developers" replace />;
  if (userType === "owner") return <Navigate to="/owner/dashboard" replace />;
  return <Navigate to="/no-access" replace />;
};

// Owner-only route: only actual owners allowed
// Admins must use impersonate (Login button) to access owner dashboards
const OwnerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { userType, loading: typeLoading } = useUserType();
  // Impersonation tabs — same guarantee as DeveloperRoute: require a real session.
  if (isImpersonationSession()) {
    if (authLoading) return <RouteLoader />;
    if (!user) return <Navigate to="/auth/login" replace />;
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }
  if (authLoading || typeLoading) return <RouteLoader />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (userType === "owner") return <ErrorBoundary>{children}</ErrorBoundary>;
  if (userType === "admin") return <Navigate to="/admincp/owners" replace />;
  if (userType === "developer") return <Navigate to="/crm/dashboard" replace />;
  return <Navigate to="/no-access" replace />;
};

// Public-only route (redirect if already logged in)
// Admin users are NOT redirected — they stay on the login page so they don't
// accidentally land in the admin panel when visiting the developer/owner login.
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { userType, loading: typeLoading } = useUserType();
  const [cleaningUp, setCleaningUp] = useState(false);

  // A logged-in user with no recognized role (userType === "none") has a
  // dangling session — sign them out synchronously BEFORE rendering the
  // login form so they can't re-submit credentials on top of a half-dead
  // session, and can't see the login screen while a parallel signOut
  // is racing to finish. Hold on a loading screen until cleanup resolves.
  // NOTE: useUserType returns the literal string "none" (not null) for this
  // state — the previous `userType === null` check was dead code.
  useEffect(() => {
    if (!authLoading && !typeLoading && user && userType === "none" && !cleaningUp) {
      setCleaningUp(true);
      signOut().finally(() => setCleaningUp(false));
    }
  }, [authLoading, typeLoading, user, userType, signOut, cleaningUp]);

  if (authLoading || typeLoading || cleaningUp) return <LoadingScreen />;
  if (user) {
    if (userType === "developer") return <Navigate to="/crm/dashboard" replace />;
    if (userType === "owner") return <Navigate to="/owner/dashboard" replace />;
    if (userType === "admin") {
      // Admin stays on login page — they should use /admincp instead.
      return <>{children}</>;
    }
    // userType === "none": signOut is in flight (triggered above). Render a
    // loader; once auth state clears, the component re-renders with !user
    // and falls through to the default branch below.
    return <LoadingScreen />;
  }
  return <>{children}</>;
};

const App: React.FC = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  {/* Public */}
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/for-owners" element={<ForOwners />} />
                  <Route path="/for-developers" element={<ForDevelopers />} />
                  <Route path="/partnerships" element={<Partnerships />} />
                  <Route path="/partnerships/owners" element={<PartnershipsOwners />} />
                  <Route path="/partnerships/developers" element={<PartnershipsDevelopers />} />
                  <Route path="/blog" element={<BlogPage />} />
                  {/* /for-investors removed — system is owner + developer only */}
                  <Route path="/opportunities" element={<Navigate to="/offers" replace />} />
                  <Route path="/opportunity/:id" element={<OpportunityDetail />} />
                  <Route path="/offers" element={<OffersPage />} />
                  <Route path="/offers/:id" element={<OfferDetailPage />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/usage-policy" element={<UsagePolicyPage />} />
                  <Route path="/no-access" element={<NoAccess />} />
                  <Route path="/impersonate-callback" element={<ImpersonateCallback />} />
                  {/* Legacy redirects */}
                  <Route path="/subscriptions" element={<Navigate to="/how-it-works" replace />} />
                  <Route path="/features/:slug" element={<Navigate to="/about" replace />} />

                  {/* Auth */}
                  <Route path="/auth/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
                  <Route path="/auth/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
                  <Route path="/auth/set-password" element={<SetPasswordPage />} />
                  <Route path="/login" element={<Navigate to="/auth/login" replace />} />
                  <Route path="/register" element={<Navigate to="/auth/register" replace />} />

                  {/* CRM — Developer Only */}
                  <Route path="/crm/dashboard" element={<DeveloperRoute><CrmDashboard /></DeveloperRoute>} />
                  <Route path="/crm/browse" element={<DeveloperRoute><CrmBrowseLands /></DeveloperRoute>} />
                  <Route path="/crm/my-requests" element={<DeveloperRoute><CrmMyRequests /></DeveloperRoute>} />
                  <Route path="/crm/deals" element={<DeveloperRoute><CrmDeals /></DeveloperRoute>} />
                  <Route path="/crm/settings" element={<DeveloperRoute><CrmSettings /></DeveloperRoute>} />

                  {/* Admin — login page has its own guard for already-authed admins */}
                  <Route path="/admincp" element={<Suspense fallback={<LoadingScreen />}><AdminLogin /></Suspense>} />
                  <Route path="/admincp/overview" element={<AdminRoute><AdminOverview /></AdminRoute>} />
                  <Route path="/admincp/lands" element={<AdminRoute><AdminLands /></AdminRoute>} />
                  <Route path="/admincp/developers" element={<AdminRoute><AdminDevelopers /></AdminRoute>} />
                  <Route path="/admincp/deals" element={<AdminRoute><AdminDeals /></AdminRoute>} />
                  <Route path="/admincp/offers" element={<AdminRoute><AdminOffers /></AdminRoute>} />
                  <Route path="/admincp/owners" element={<AdminRoute><AdminOwners /></AdminRoute>} />
                  <Route path="/admincp/audit" element={<AdminRoute><AdminAuditLog /></AdminRoute>} />
                  <Route path="/admincp/monitoring" element={<AdminRoute><AdminMonitoring /></AdminRoute>} />
                  <Route path="/admincp/team" element={<AdminRoute><AdminTeam /></AdminRoute>} />
                  <Route path="/admincp/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

                  {/* SEO Control Center — nested tabs */}
                  <Route path="/admincp/seo" element={<AdminRoute><AdminSeoLayout /></AdminRoute>}>
                    <Route index element={<AdminSeoOverview />} />
                    <Route path="pages" element={<AdminSeoPages />} />
                    <Route path="pages/:id" element={<AdminSeoPageDetail />} />
                    <Route path="templates" element={<AdminSeoTemplates />} />
                    <Route path="entities" element={<AdminSeoEntities />} />
                    <Route path="rules" element={<AdminSeoRules />} />
                    <Route path="redirects" element={<AdminSeoRedirects />} />
                    <Route path="queue" element={<AdminSeoQueue />} />
                    <Route path="issues" element={<AdminSeoIssues />} />
                  </Route>

                  {/* Public SEO-generated pages */}
                  <Route path="/sa/:city" element={<SeoRouteHandler />} />
                  <Route path="/sa/:city/:district" element={<SeoRouteHandler />} />
                  <Route path="/properties/:type" element={<SeoRouteHandler />} />
                  <Route path="/services/:service" element={<SeoRouteHandler />} />
                  <Route path="/services/:service/sa/:city" element={<SeoRouteHandler />} />
                  <Route path="/developers/:slug" element={<SeoRouteHandler />} />
                  <Route path="/companies/:slug" element={<SeoRouteHandler />} />
                  <Route path="/topics/:slug" element={<SeoRouteHandler />} />

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
              {/* PDPL cookie notice — self-hiding after user decides once */}
              <CookieBanner />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
