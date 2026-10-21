import { DEMO_CLINICIAN, DEMO_DISCLAIMER, DEMO_PATIENT, PRACTICE_NAME } from "@shared/demo";
import { FormEvent, useState } from "react";
import { Redirect } from "wouter";
import { Wordmark } from "@/components/PortalChrome";
import { errorText } from "@/lib/format";
import { trpc } from "@/lib/trpc";

export default function LoginPage() {
  const me = trpc.auth.me.useQuery();
  const login = trpc.auth.login.useMutation({
    onSuccess: (result) => {
      window.location.href = result.user.role === "user" ? "/patient" : "/clinic";
    },
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (me.data?.role === "user") return <Redirect to="/patient" />;
  if (me.data) return <Redirect to="/clinic" />;

  function submit(event: FormEvent) {
    event.preventDefault();
    login.mutate({ email, password });
  }

  return (
    <div className="login">
      <section className="login-story">
        <Wordmark tone="light" />
        <div>
          <h1>Care, written plainly.</h1>
          <p>
            {PRACTICE_NAME} keeps the treatment plan, labs, and messages in one calm place for the patient and the clinic.
          </p>
        </div>
        <p className="fine" style={{ color: "rgba(246,241,232,0.66)" }}>{DEMO_DISCLAIMER}</p>
      </section>
      <main id="main" className="login-panel">
        <p className="eyebrow">Sign in</p>
        <h2>Choose a demo role.</h2>
        <div className="demo-row stack">
          <button
            className="demo-card"
            type="button"
            onClick={() => login.mutate({ email: DEMO_CLINICIAN.email, password: DEMO_CLINICIAN.password })}
          >
            <strong>Clinic · {DEMO_CLINICIAN.name}</strong>
            <span>{DEMO_CLINICIAN.email}</span>
          </button>
          <button
            className="demo-card"
            type="button"
            onClick={() => login.mutate({ email: DEMO_PATIENT.email, password: DEMO_PATIENT.password })}
          >
            <strong>Patient · {DEMO_PATIENT.name}</strong>
            <span>{DEMO_PATIENT.email}</span>
          </button>
        </div>
        <form className="stack" onSubmit={submit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {login.error ? <p className="alert" role="alert">{errorText(login.error)}</p> : null}
          <button className="btn" type="submit" disabled={login.isPending}>
            {login.isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="fine" style={{ marginTop: 18 }}>
          Demo clinic password <code>cedar-grove</code>. Demo patient password <code>harbor-lane</code>.
        </p>
      </main>
    </div>
  );
}
