import type { ReactNode } from "react";
import { Redirect, Route, Switch } from "wouter";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "./components/ErrorBoundary";
import { trpc } from "./lib/trpc";
import ClinicApp from "./pages/ClinicApp";
import LoginPage from "./pages/LoginPage";
import PatientApp from "./pages/PatientApp";

function Opening() {
  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
      <p className="eyebrow"><Loader2 size={16} style={{ verticalAlign: "middle" }} aria-hidden="true" /> Opening the portal</p>
    </div>
  );
}

function Guard({ area, children }: { area: "patient" | "clinic"; children: ReactNode }) {
  const me = trpc.auth.me.useQuery();
  if (me.isLoading) return <Opening />;
  if (!me.data) return <Redirect to="/login" />;
  if (area === "patient" && me.data.role !== "user") return <Redirect to="/clinic" />;
  if (area === "clinic" && me.data.role === "user") return <Redirect to="/patient" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <a className="skip" href="#main">Skip to content</a>
      <Switch>
        <Route path="/" component={LoginPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/patient/:section">
          <Guard area="patient"><PatientApp /></Guard>
        </Route>
        <Route path="/patient">
          <Guard area="patient"><PatientApp /></Guard>
        </Route>
        <Route path="/clinic/pharmacy">
          <Guard area="clinic"><ClinicApp /></Guard>
        </Route>
        <Route path="/clinic/patient/:id">
          <Guard area="clinic"><ClinicApp /></Guard>
        </Route>
        <Route path="/clinic">
          <Guard area="clinic"><ClinicApp /></Guard>
        </Route>
        <Route path="/provider/:rest*">
          <Redirect to="/clinic" />
        </Route>
        <Route path="/provider">
          <Redirect to="/clinic" />
        </Route>
        <Route>
          <main id="main" style={{ padding: 32 }}>
            <p className="eyebrow">404</p>
            <h1 className="display" style={{ fontSize: 56 }}>That page is not in the portal.</h1>
            <a className="btn" href="/login">Back to sign in</a>
          </main>
        </Route>
      </Switch>
    </ErrorBoundary>
  );
}
