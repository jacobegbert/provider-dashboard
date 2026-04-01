import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Router as WouterRouter, useLocation, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import PatientLayout from "./components/PatientLayout";
import Home from "./pages/Home";
import Clients from "./pages/Clients";
import Messages from "./pages/Messages";
import Protocols from "./pages/Protocols";
import Schedule from "./pages/Schedule";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import AttentionQueue from "./pages/AttentionQueue";
import ProtocolBuilder from "./pages/ProtocolBuilder";
import PatientHome from "./pages/patient/PatientHome";
import PatientProtocols from "./pages/patient/PatientProtocols";
import PatientMessages from "./pages/patient/PatientMessages";
import PatientSchedule from "./pages/patient/PatientSchedule";
import PatientProfile from "./pages/patient/PatientProfile";
import PatientDocuments from "./pages/PatientDocuments";
import PatientWellnessAI from "./pages/patient/PatientWellnessAI";
import PatientVitals from "./pages/patient/PatientVitals";
import PortalSwitcher from "./pages/PortalSwitcher";
import GoLiveGuide from "./pages/GoLiveGuide";
import Notifications from "./pages/Notifications";
import AIAdvisor from "./pages/AIAdvisor";
import Resources from "./pages/Resources";
import PatientResources from "./pages/patient/PatientResources";
import PatientNotifications from "./pages/patient/PatientNotifications";
import PatientPrivacy from "./pages/patient/PatientPrivacy";
import InviteLanding from "./pages/InviteLanding";
import StaffInviteLanding from "./pages/StaffInviteLanding";
import PatientCreateProtocol from "./pages/patient/PatientCreateProtocol";
import PatientIntake from "./pages/patient/PatientIntake";
import PatientServiceAgreement from "./pages/patient/PatientServiceAgreement";
import PatientBiomarkerGuide from "./pages/patient/PatientBiomarkerGuide";
import PatientProtocolGuide from "./pages/patient/PatientProtocolGuide";
import PatientVO2MaxGuide from "./pages/patient/PatientVO2MaxGuide";
import { ViewAsProvider } from "./contexts/ViewAsContext";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import SmsConsent from "./pages/SmsConsent";
import PublicLanding from "./pages/PublicLanding";
import Debug from "./pages/Debug";
import Billing from "./pages/Billing";
import PatientBilling from "./pages/patient/PatientBilling";
import Plans from "./pages/Plans";
import Login from "./pages/Login";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

/**
 * RoleGuard — prevents non-admin users from accessing provider routes.
 * While auth is loading, shows a spinner. If the user is not admin,
 * redirects to /patient.
 */
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  // Not authenticated — let the normal auth flow handle redirect
  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  // Authenticated but not admin or staff — redirect to patient portal
  if (user?.role !== "admin" && user?.role !== "staff") {
    return <Redirect to="/patient" />;
  }

  return <>{children}</>;
}

function ProviderPages() {
  return (
    <AdminGuard>
      <DashboardLayout>
        <Switch>
          <Route path="/provider" component={Home} />
          <Route path="/provider/clients" component={Clients} />
          <Route path="/provider/messages" component={Messages} />
          <Route path="/provider/protocols" component={Protocols} />
          <Route path="/provider/protocols/builder" component={ProtocolBuilder} />
          <Route path="/provider/schedule" component={Schedule} />
          <Route path="/provider/analytics" component={Analytics} />
          <Route path="/provider/attention" component={AttentionQueue} />
          <Route path="/provider/notifications" component={Notifications} />
          <Route path="/provider/resources" component={Resources} />
          <Route path="/provider/ai-advisor" component={AIAdvisor} />
          <Route path="/provider/billing" component={Billing} />
          <Route path="/provider/plans" component={Plans} />
          <Route path="/provider/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </DashboardLayout>
    </AdminGuard>
  );
}
/**
 * PatientGuard — prevents unauthenticated users from accessing patient routes.
 * While auth is loading, shows a spinner. If not authenticated, redirects to login.
 */
function PatientGuard({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to={`/login?returnTo=${encodeURIComponent("/patient")}`} />;
  }

  return <>{children}</>;
}

function PatientPages() {
  return (
    <PatientGuard>
    <ViewAsProvider>
    <PatientLayout>
      <Switch>
        <Route path="/patient" component={PatientHome} />
        <Route path="/patient/protocols/create" component={PatientCreateProtocol} />
        <Route path="/patient/protocols" component={PatientProtocols} />
        <Route path="/patient/documents" component={PatientDocuments} />
        <Route path="/patient/messages" component={PatientMessages} />
        <Route path="/patient/schedule" component={PatientSchedule} />
        <Route path="/patient/vitals" component={PatientVitals} />
        <Route path="/patient/resources" component={PatientResources} />
        <Route path="/patient/wellness-ai" component={PatientWellnessAI} />
        <Route path="/patient/notifications" component={PatientNotifications} />
        <Route path="/patient/privacy" component={PatientPrivacy} />
        <Route path="/patient/intake" component={PatientIntake} />
        <Route path="/patient/service-agreement" component={PatientServiceAgreement} />
        <Route path="/patient/biomarker-guide" component={PatientBiomarkerGuide} />
        <Route path="/patient/protocol-guide" component={PatientProtocolGuide} />
        <Route path="/patient/vo2max-guide" component={PatientVO2MaxGuide} />
        <Route path="/patient/billing" component={PatientBilling} />
        <Route path="/patient/profile" component={PatientProfile} />
        <Route component={NotFound} />
      </Switch>
    </PatientLayout>
    </ViewAsProvider>
    </PatientGuard>
  );
}

function AppRouter() {
  const [location] = useLocation();

  // Determine which section we're in
  if (location.startsWith("/provider")) {
    return <ProviderPages />;
  }
  if (location.startsWith("/patient")) {
    return <PatientPages />;
  }

  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={PortalSwitcher} />
      <Route path="/login" component={Login} />
      <Route path="/invite" component={InviteLanding} />
      <Route path="/staff-invite" component={StaffInviteLanding} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />
      <Route path="/main" component={PublicLanding} />
      <Route path="/sms-consent" component={SmsConsent} />
      <Route path="/debug" component={Debug} />
      <Route path="/guide" component={GoLiveGuide} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
