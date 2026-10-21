import { PRACTICE_NAME, DEMO_DISCLAIMER } from "@shared/demo";
import { trpc } from "@/lib/trpc";

export function Wordmark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <span className={`mark ${tone === "light" ? "light" : ""}`}>
      <i aria-hidden="true">E</i>
      <span>
        <b>{PRACTICE_NAME}</b>
        <small>Private portal</small>
      </span>
    </span>
  );
}

export function DemoBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return <div className="banner">{DEMO_DISCLAIMER}</div>;
}

export function SampleTag() {
  return <span className="tag">Sample template · not medical guidance</span>;
}

export function useSignOut() {
  return trpc.auth.logout.useMutation({
    onSettled: () => {
      window.location.href = "/login";
    },
  });
}
