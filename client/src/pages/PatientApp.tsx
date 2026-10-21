import { Beaker, ClipboardList, House, MessageCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { DemoBanner, SampleTag, useSignOut, Wordmark } from "@/components/PortalChrome";
import { usePortalEvents } from "@/hooks/usePortalEvents";
import { doseLine, errorText, formatTime, formatWhen, statusLabel } from "@/lib/format";
import { trpc } from "@/lib/trpc";

const NAV = [
  { href: "/patient", id: "home", label: "Plan", icon: House },
  { href: "/patient/labs", id: "labs", label: "Labs", icon: Beaker },
  { href: "/patient/messages", id: "messages", label: "Messages", icon: MessageCircle },
  { href: "/patient/intake", id: "intake", label: "Intake", icon: ClipboardList },
];

export default function PatientApp() {
  const [location] = useLocation();
  const section = location.split("/")[2] || "home";
  const me = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();
  const signOut = useSignOut();
  const [notice, setNotice] = useState("");

  usePortalEvents((event) => {
    if (event.type === "plan") {
      setNotice("Your clinician published an updated plan.");
      void utils.portal.patient.home.invalidate();
    }
    if (event.type === "message") {
      setNotice("A new message is in your thread.");
      void utils.portal.patient.messages.invalidate();
      void utils.portal.patient.home.invalidate();
    }
  });

  return (
    <div className="patient-shell">
      <DemoBanner show={Boolean(me.data?.demoMode)} />
      <div className="patient-stage">
        <header className="patient-top" style={{ paddingInline: 0 }}>
          <Wordmark />
          <div className="who">
            <b>{me.data?.name}</b>
            <button className="btn quiet tiny" type="button" onClick={() => signOut.mutate()} disabled={signOut.isPending}>
              Sign out
            </button>
          </div>
        </header>
        <main id="main">
          <div aria-live="polite">{notice ? <p className="live-note">{notice}</p> : null}</div>
          {section === "labs" ? <Labs /> : null}
          {section === "messages" ? <Messages /> : null}
          {section === "intake" ? <Intake /> : null}
          {section !== "labs" && section !== "messages" && section !== "intake" ? <Home /> : null}
        </main>
      </div>
      <nav className="tabbar" aria-label="Patient">
        {NAV.map((item) => {
          const Icon = item.icon;
          const current = section === item.id || (item.id === "home" && section === "home");
          return (
            <Link key={item.id} href={item.href} aria-current={current ? "page" : undefined}>
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function Home() {
  const home = trpc.portal.patient.home.useQuery(undefined, { refetchInterval: 15000 });
  if (home.isLoading) return <p className="eyebrow">Loading your plan</p>;
  if (home.error) return <p className="alert" role="alert">{errorText(home.error)}</p>;
  const data = home.data!;
  const groups = [
    ["medication", "Medicines"],
    ["peptide", "Peptides"],
    ["regenerative", "Regenerative protocols"],
    ["note", "Notes"],
  ] as const;

  return (
    <>
      <p className="eyebrow">Published plan · Version {data.plan.version} · {formatWhen(data.plan.publishedAt)}</p>
      <h1 className="display">{data.patient.firstName}, your plan.</h1>
      <p className="lede">{data.plan.summary}</p>
      <div className="home-grid">
        <div>
          {groups.map(([kind, label]) => {
            const items = data.plan.items.filter((item) => item.kind === kind);
            if (items.length === 0) return null;
            return (
              <section className="plan-block" key={kind} aria-labelledby={`group-${kind}`}>
                <h2 id={`group-${kind}`}>{label}</h2>
                {items.map((item) => (
                  <article className="item" key={item.id}>
                    <header>
                      <h3>{item.name}</h3>
                      <span className={item.status === "clinic_managed" ? "tag" : "tag pine"}>{statusLabel(item.status)}</span>
                    </header>
                    {doseLine(item) ? <p className="dose">{doseLine(item)}</p> : null}
                    {item.instructions ? <p>{item.instructions}</p> : null}
                    {item.isSampleTemplate ? <SampleTag /> : null}
                    {item.kind === "regenerative" ? (
                      <p className="fine">Held by the clinic. Publishing this line does not send it to a pharmacy.</p>
                    ) : null}
                  </article>
                ))}
              </section>
            );
          })}
        </div>
        <aside className="stack-cards">
          <section className="side-card">
            <p className="label">Intake</p>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 32, fontWeight: 500 }}>{statusLabel(data.intake.status)}</h2>
            <p className="fine">{data.intake.reviewedByProvider ? "Your clinician has reviewed it." : "Waiting on clinic review, or still open."}</p>
            <Link className="btn tiny" href="/patient/intake" style={{ marginTop: 12 }}>Open intake</Link>
          </section>
          <section className="side-card">
            <p className="label">Latest labs</p>
            <ul className="activity">
              {data.labHighlights.map((lab) => (
                <li key={lab.name}><strong>{lab.name}</strong> {lab.value} {lab.unit} · {lab.collectedOn}</li>
              ))}
            </ul>
            <Link className="btn quiet tiny" href="/patient/labs" style={{ marginTop: 12 }}>See the timeline</Link>
          </section>
          <section className="side-card">
            <p className="label">Recent messages</p>
            {data.messages.length === 0 ? <p className="fine">No messages yet.</p> : null}
            {data.messages.map((message) => (
              <p key={message.id} style={{ marginTop: 8 }}><strong>{message.senderName}.</strong> {message.content}</p>
            ))}
            <Link className="btn quiet tiny" href="/patient/messages" style={{ marginTop: 12 }}>Open messages</Link>
          </section>
        </aside>
      </div>
    </>
  );
}

function Spark({ values }: { values: number[] }) {
  const nums = values.filter((value) => !Number.isNaN(value));
  if (nums.length < 2) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const width = 140;
  const height = 42;
  const points = nums.map((value, index) => {
    const x = (index / (nums.length - 1)) * width;
    const y = max === min ? height / 2 : height - ((value - min) / (max - min)) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline fill="none" stroke="#1e3d32" strokeWidth="2" points={points} />
    </svg>
  );
}

function Labs() {
  const labs = trpc.portal.patient.labs.useQuery();
  if (labs.isLoading) return <p className="eyebrow">Loading labs</p>;
  if (labs.error) return <p className="alert" role="alert">{errorText(labs.error)}</p>;
  return (
    <>
      <p className="eyebrow">Lab timeline</p>
      <h1 className="display">Values over time.</h1>
      <p className="lede">These figures are fictional demo results. A movement up or down is a description of the series, not a diagnosis.</p>
      {labs.data!.series.map((series) => {
        const latest = series.points[series.points.length - 1];
        const previous = series.points[series.points.length - 2];
        let trend = "One result so far.";
        if (latest && previous && !Number.isNaN(latest.numeric) && !Number.isNaN(previous.numeric)) {
          const delta = latest.numeric - previous.numeric;
          trend = Math.abs(delta) < 0.05 ? "Steady since the prior draw." : delta > 0 ? "Up from the prior draw." : "Down from the prior draw.";
        }
        return (
          <section className="series" key={series.name} aria-label={`${series.name}, ${trend}`}>
            <div className="series-head">
              <div>
                <h2 style={{ fontFamily: "var(--serif)", fontSize: 36, fontWeight: 500 }}>{series.name}</h2>
                <p className="fine">{trend} Sample range {series.referenceLow ?? "—"}–{series.referenceHigh ?? "—"} {series.unit}.</p>
              </div>
              <Spark values={series.points.map((point) => point.numeric)} />
            </div>
            <div className="points">
              {series.points.map((point) => (
                <div key={point.collectedOn}>
                  <strong>{point.value}</strong>
                  <span className="fine">{series.unit}<br />{point.collectedOn}</span>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

function Messages() {
  const thread = trpc.portal.patient.messages.useQuery();
  const send = trpc.portal.patient.sendMessage.useMutation({
    onSuccess: () => {
      setText("");
      void thread.refetch();
    },
  });
  const [text, setText] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    send.mutate({ content: text });
  }

  if (thread.isLoading) return <p className="eyebrow">Loading messages</p>;
  if (thread.error) return <p className="alert" role="alert">{errorText(thread.error)}</p>;

  return (
    <>
      <p className="eyebrow">Messages</p>
      <h1 className="display">With the clinic.</h1>
      <div className="thread" aria-live="polite">
        {thread.data!.messages.map((message) => (
          <article key={message.id} className={message.mine ? "bubble mine" : "bubble"}>
            <small>{message.senderName} · {formatTime(message.createdAt)}</small>
            {message.content}
          </article>
        ))}
      </div>
      <form className="composer" onSubmit={submit}>
        <label className="field">
          <span>Message</span>
          <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={4000} required />
        </label>
        <button className="btn" type="submit" disabled={send.isPending}>Send</button>
      </form>
      {send.error ? <p className="alert" role="alert">{errorText(send.error)}</p> : null}
    </>
  );
}

function Intake() {
  const intake = trpc.portal.patient.intake.useQuery();
  const save = trpc.portal.patient.saveIntake.useMutation({
    onSuccess: () => void intake.refetch(),
  });
  if (intake.isLoading || !intake.data) return <p className="eyebrow">Loading intake</p>;
  const locked = intake.data.status === "completed";
  return (
    <>
      <p className="eyebrow">Intake · {statusLabel(intake.data.status)}</p>
      <h1 className="display">Tell the clinic what matters.</h1>
      {intake.data.reviewedByProvider ? (
        <p className="live-note">Reviewed {formatWhen(intake.data.reviewedAt)}. {intake.data.providerNotes}</p>
      ) : null}
      <IntakeForm
        initial={intake.data}
        locked={locked}
        pending={save.isPending}
        error={save.error ? errorText(save.error) : ""}
        onSave={(values, submit) => save.mutate({ ...values, submit })}
      />
    </>
  );
}

function IntakeForm({
  initial,
  locked,
  pending,
  error,
  onSave,
}: {
  initial: { goals: string; currentMedications: string; conditions: string };
  locked: boolean;
  pending: boolean;
  error: string;
  onSave: (values: { goals: string; currentMedications: string; conditions: string }, submit: boolean) => void;
}) {
  const [goals, setGoals] = useState(initial.goals);
  const [currentMedications, setCurrentMedications] = useState(initial.currentMedications);
  const [conditions, setConditions] = useState(initial.conditions);
  return (
    <form className="stack" onSubmit={(event) => { event.preventDefault(); onSave({ goals, currentMedications, conditions }, true); }}>
      <label className="field">
        <span>What you want to work on</span>
        <textarea value={goals} onChange={(event) => setGoals(event.target.value)} disabled={locked} maxLength={4000} />
      </label>
      <label className="field">
        <span>Medications and supplements you already use</span>
        <textarea value={currentMedications} onChange={(event) => setCurrentMedications(event.target.value)} disabled={locked} maxLength={4000} />
      </label>
      <label className="field">
        <span>Conditions the clinic should know</span>
        <textarea value={conditions} onChange={(event) => setConditions(event.target.value)} disabled={locked} maxLength={4000} />
      </label>
      {error ? <p className="alert" role="alert">{error}</p> : null}
      {locked ? <p className="fine">Submitted. Ask the clinic if something needs to change.</p> : (
        <div className="editor-actions">
          <button className="btn quiet" type="button" disabled={pending} onClick={() => onSave({ goals, currentMedications, conditions }, false)}>Save progress</button>
          <button className="btn" type="submit" disabled={pending}>Submit intake</button>
        </div>
      )}
    </form>
  );
}
