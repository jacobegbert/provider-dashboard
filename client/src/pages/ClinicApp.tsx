import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { DemoBanner, SampleTag, useSignOut, Wordmark } from "@/components/PortalChrome";
import DataHubPage from "@/pages/DataHubPage";
import { usePortalEvents } from "@/hooks/usePortalEvents";
import { actionLabel, doseLine, errorText, formatTime, formatWhen, kindLabel, statusLabel } from "@/lib/format";
import { trpc } from "@/lib/trpc";

type Kind = "medication" | "peptide" | "regenerative" | "note";
type ItemStatus = "active" | "paused" | "clinic_managed" | "completed";

const EMPTY_ITEM = {
  kind: "medication" as Kind,
  name: "",
  dose: "",
  unit: "",
  route: "",
  frequency: "",
  instructions: "",
  status: "active" as ItemStatus,
  isSampleTemplate: false,
};

export default function ClinicApp() {
  const [location] = useLocation();
  const params = useParams();
  const patientId = params.id ? Number(params.id) : null;
  const pharmacy = location.startsWith("/clinic/pharmacy");
  const hub = location.startsWith("/clinic/data-hub");
  const me = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();
  const signOut = useSignOut();

  usePortalEvents((event) => {
    if (event.type === "message") {
      void utils.portal.clinic.roster.invalidate();
      void utils.portal.clinic.chart.invalidate();
    }
  });

  return (
    <div className="clinic-shell">
      <DemoBanner show={Boolean(me.data?.demoMode)} />
      <header className="clinic-top">
        <Wordmark />
        <div className="who">
          <b>{me.data?.name}</b>
          <button className="btn quiet tiny" type="button" onClick={() => signOut.mutate()}>Sign out</button>
        </div>
      </header>
      <div className="clinic-frame">
        <nav className="side-nav" aria-label="Clinic">
          <div className="side-brand"><Wordmark tone="light" /></div>
          <Link href="/clinic" aria-current={!pharmacy && !hub ? "page" : undefined}>Patients</Link>
          <Link href="/clinic/pharmacy" aria-current={pharmacy ? "page" : undefined}>Pharmacy queue</Link>
          {me.data?.role === "admin" ? <Link href="/clinic/data-hub" aria-current={hub ? "page" : undefined}>Data hub</Link> : null}
        </nav>
        <main id="main">
          {hub ? <DataHubPage /> : pharmacy ? <Pharmacy /> : <Patients patientId={patientId} />}
        </main>
      </div>
    </div>
  );
}

function Patients({ patientId }: { patientId: number | null }) {
  const roster = trpc.portal.clinic.roster.useQuery();
  const pane = patientId ? "chart" : "roster";
  return (
    <div className="split" data-pane={pane}>
      <aside className="roster" aria-label="Patient list">
        <div style={{ padding: "16px 16px 8px" }}>
          <p className="eyebrow">Charts</p>
          <h1 className="display" style={{ fontSize: 42 }}>Today’s list.</h1>
        </div>
        {roster.error ? <p className="alert" role="alert">{errorText(roster.error)}</p> : null}
        {roster.data?.map((patient) => (
          <Link
            key={patient.id}
            className="row"
            href={`/clinic/patient/${patient.id}`}
            aria-current={patient.id === patientId ? "page" : undefined}
          >
            <strong>{patient.firstName} {patient.lastName}</strong>
            <span className="fine">
              {statusLabel(patient.intakeStatus)} intake
              {patient.unpublished ? " · unpublished edits" : ` · plan v${patient.planVersion}`}
              {patient.unread ? ` · ${patient.unread} new` : ""}
              {!patient.hasLogin ? " · no portal login" : ""}
            </span>
          </Link>
        ))}
      </aside>
      <section className="workspace">
        {patientId ? <Chart patientId={patientId} /> : (
          <div style={{ padding: 24 }}>
            <p className="lede">Select a chart to edit the draft plan. Patients see it only after you publish.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function Chart({ patientId }: { patientId: number }) {
  const chart = trpc.portal.clinic.chart.useQuery({ patientId });
  const utils = trpc.useUtils();
  const publish = trpc.portal.clinic.publish.useMutation({
    onSuccess: () => {
      void utils.portal.clinic.chart.invalidate({ patientId });
      void utils.portal.clinic.roster.invalidate();
      void utils.portal.pharmacy.queue.invalidate();
    },
  });
  if (chart.isLoading) return <p className="eyebrow">Opening the chart</p>;
  if (chart.error || !chart.data) return <p className="alert" role="alert">{errorText(chart.error)}</p>;
  const data = chart.data;
  return (
    <div className="chart-layout">
      <div>
        <Link className="fine back-link" href="/clinic">All patients</Link>
        <p className="eyebrow">Draft plan · patients see version {data.plan.version}</p>
        <h1 className="display" style={{ fontSize: 56 }}>{data.patient.firstName} {data.patient.lastName}</h1>
        <p className="fine">{data.patient.email} · {data.patient.dateOfBirth} · {data.patient.healthGoals.join(", ") || "No goals listed"}</p>
        <SummaryEditor patientId={patientId} summary={data.plan.summary} />
        {data.draftItems.map((item) => (
          <ItemEditor key={item.id} patientId={patientId} item={item} />
        ))}
        <AddItem patientId={patientId} />
        <div className="publish-bar">
          <p>{data.plan.unpublished ? "The draft differs from the published plan." : `Published ${formatWhen(data.plan.publishedAt)}. No unpublished edits.`}</p>
          <button className="btn gold" type="button" disabled={!data.plan.unpublished || publish.isPending} onClick={() => publish.mutate({ patientId })}>
            {publish.isPending ? "Publishing…" : "Publish to patient"}
          </button>
        </div>
        {publish.data?.changed ? <p className="live-note" role="status">Published version {publish.data.version}. {publish.data.ordersCreated ? `${publish.data.ordersCreated} mock pharmacy order${publish.data.ordersCreated === 1 ? "" : "s"} queued.` : "No pharmacy order. Regenerative lines and notes stay on the chart."}</p> : null}
        {publish.error ? <p className="alert" role="alert">{errorText(publish.error)}</p> : null}
        <Messages patientId={patientId} messages={data.messages} />
      </div>
      <aside className="stack-cards">
        <Guidance patientId={patientId} drafts={data.guidance} />
        <IntakeReview patientId={patientId} intake={data.intake} />
        <section className="panel">
          <p className="label">Mock orders for this chart</p>
          {data.orders.length === 0 ? <p className="fine">None yet.</p> : null}
          <ul className="activity">
            {data.orders.slice(0, 5).map((order) => (
              <li key={order.id}><strong>{order.drugName}</strong> · {order.changeType} · {statusLabel(order.status)}</li>
            ))}
          </ul>
          <Link className="btn quiet tiny" href="/clinic/pharmacy" style={{ marginTop: 10 }}>Open the queue</Link>
        </section>
        <section className="panel">
          <p className="label">Recorded activity</p>
          <ul className="activity">
            {data.activity.length === 0 ? <li>No portal actions yet.</li> : null}
            {data.activity.map((entry) => (
              <li key={entry.id}>{actionLabel(entry.action)} · {formatTime(entry.createdAt)}</li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}

function SummaryEditor({ patientId, summary }: { patientId: number; summary: string }) {
  const [value, setValue] = useState(summary);
  const [dirty, setDirty] = useState(false);
  const save = trpc.portal.clinic.saveSummary.useMutation();
  const utils = trpc.useUtils();
  useEffect(() => {
    if (!dirty) setValue(summary);
  }, [summary, dirty]);
  return (
    <form className="stack" style={{ marginTop: 16 }} onSubmit={(event) => {
      event.preventDefault();
      save.mutate({ patientId, summary: value }, {
        onSuccess: () => {
          setDirty(false);
          void utils.portal.clinic.chart.invalidate({ patientId });
          void utils.portal.clinic.roster.invalidate();
        },
      });
    }}>
      <label className="field">
        <span>Plan summary</span>
        <textarea value={value} maxLength={4000} onChange={(event) => { setValue(event.target.value); setDirty(true); }} />
      </label>
      <div><button className="btn quiet tiny" type="submit" disabled={!dirty || save.isPending}>Save summary draft</button></div>
    </form>
  );
}

function ItemEditor({ patientId, item }: { patientId: number; item: {
  id: number; kind: Kind; name: string; dose: string | null; unit: string | null; route: string | null;
  frequency: string | null; instructions: string | null; status: ItemStatus; isSampleTemplate: boolean;
} }) {
  const utils = trpc.useUtils();
  const update = trpc.portal.clinic.updateItem.useMutation({
    onSuccess: () => void utils.portal.clinic.chart.invalidate({ patientId }),
  });
  const remove = trpc.portal.clinic.removeItem.useMutation({
    onSuccess: () => {
      void utils.portal.clinic.chart.invalidate({ patientId });
      void utils.portal.clinic.roster.invalidate();
    },
  });
  const [confirm, setConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    kind: item.kind,
    name: item.name,
    dose: item.dose ?? "",
    unit: item.unit ?? "",
    route: item.route ?? "",
    frequency: item.frequency ?? "",
    instructions: item.instructions ?? "",
    status: item.status,
    isSampleTemplate: item.isSampleTemplate,
  });

  function save(event: FormEvent) {
    event.preventDefault();
    update.mutate({
      patientId,
      itemId: item.id,
      ...form,
      dose: form.dose || null,
      unit: form.unit || null,
      route: form.route || null,
      frequency: form.frequency || null,
      instructions: form.instructions || null,
    }, {
      onSuccess: () => {
        setEditing(false);
        void utils.portal.clinic.chart.invalidate({ patientId });
        void utils.portal.clinic.roster.invalidate();
      },
    });
  }

  if (!editing) {
    return (
      <article className="item">
        <header>
          <div>
            <p className="fine">{kindLabel(item.kind)}</p>
            <h3>{item.name}</h3>
            {doseLine(item) ? <p className="dose">{doseLine(item)}</p> : null}
          </div>
          <button className="btn quiet tiny" type="button" onClick={() => setEditing(true)} aria-label={`Edit ${item.name}`}>
            Edit
          </button>
        </header>
        {item.instructions ? <p>{item.instructions}</p> : null}
        {item.isSampleTemplate ? <SampleTag /> : null}
      </article>
    );
  }

  return (
    <form className="editor" onSubmit={save}>
      <header className="item" style={{ border: 0, padding: 0 }}>
        <div>
          <p className="fine">{kindLabel(item.kind)}</p>
          <h3>{item.name}</h3>
          <p className="dose">{doseLine(item)}</p>
        </div>
        {item.isSampleTemplate ? <SampleTag /> : null}
      </header>
      <div className="grid-2">
        <label className="field"><span>Kind</span>
          <select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as Kind })}>
            <option value="medication">Medicine</option>
            <option value="peptide">Peptide</option>
            <option value="regenerative">Regenerative protocol</option>
            <option value="note">Note</option>
          </select>
        </label>
        <label className="field"><span>Status</span>
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ItemStatus })}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="clinic_managed">Clinic-managed</option>
            <option value="completed">Completed</option>
          </select>
        </label>
      </div>
      <label className="field"><span>Name</span>
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={256} />
      </label>
      {form.kind !== "note" ? (
        <div className="grid-2">
          <label className="field"><span>Dose</span><input value={form.dose} onChange={(event) => setForm({ ...form, dose: event.target.value })} maxLength={64} /></label>
          <label className="field"><span>Unit</span><input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} maxLength={32} /></label>
          <label className="field"><span>Route</span><input value={form.route} onChange={(event) => setForm({ ...form, route: event.target.value })} maxLength={64} /></label>
          <label className="field"><span>Frequency</span><input value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })} maxLength={128} /></label>
        </div>
      ) : null}
      <label className="field"><span>Instructions</span>
        <textarea value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} maxLength={4000} />
      </label>
      <label className="check">
        <input type="checkbox" checked={form.isSampleTemplate} onChange={(event) => setForm({ ...form, isSampleTemplate: event.target.checked })} />
        Label as a sample template, not medical guidance
      </label>
      {form.kind === "regenerative" ? <p className="fine">Regenerative lines stay clinic-managed. Publishing them does not create a pharmacy order.</p> : null}
      {form.kind === "medication" || form.kind === "peptide" ? <p className="fine">A changed dose queues a mock pharmacy order on publish. Nothing is sent to a real pharmacy.</p> : null}
      <div className="editor-actions">
        <button className="btn tiny" type="submit" disabled={update.isPending}>Save draft line</button>
        {confirm ? (
          <button className="btn danger tiny" type="button" onClick={() => remove.mutate({ patientId, itemId: item.id })}>Confirm remove</button>
        ) : (
          <button className="btn danger tiny" type="button" onClick={() => setConfirm(true)}>Remove</button>
        )}
      </div>
      {update.error ? <p className="alert" role="alert">{errorText(update.error)}</p> : null}
    </form>
  );
}

function AddItem({ patientId }: { patientId: number }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_ITEM);
  const utils = trpc.useUtils();
  const add = trpc.portal.clinic.addItem.useMutation({
    onSuccess: () => {
      setForm(EMPTY_ITEM);
      setOpen(false);
      void utils.portal.clinic.chart.invalidate({ patientId });
      void utils.portal.clinic.roster.invalidate();
    },
  });
  if (!open) return <button className="btn quiet" type="button" style={{ marginTop: 16 }} onClick={() => setOpen(true)}>Add protocol item</button>;
  return (
    <form className="panel" style={{ marginTop: 16 }} onSubmit={(event) => {
      event.preventDefault();
      add.mutate({
        patientId,
        ...form,
        status: form.kind === "regenerative" ? "clinic_managed" : form.status,
      });
    }}>
      <p className="label">New draft line</p>
      <div className="grid-2">
        <label className="field"><span>Kind</span>
          <select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as Kind })}>
            <option value="medication">Medicine</option>
            <option value="peptide">Peptide</option>
            <option value="regenerative">Regenerative protocol</option>
            <option value="note">Note</option>
          </select>
        </label>
        <label className="field"><span>Name</span>
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={256} />
        </label>
      </div>
      {form.kind !== "note" ? (
        <div className="grid-2">
          <label className="field"><span>Dose</span><input value={form.dose} onChange={(event) => setForm({ ...form, dose: event.target.value })} maxLength={64} /></label>
          <label className="field"><span>Unit</span><input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} maxLength={32} /></label>
          <label className="field"><span>Route</span><input value={form.route} onChange={(event) => setForm({ ...form, route: event.target.value })} maxLength={64} /></label>
          <label className="field"><span>Frequency</span><input value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })} maxLength={128} /></label>
        </div>
      ) : null}
      <label className="field"><span>Instructions</span>
        <textarea value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} maxLength={4000} />
      </label>
      <label className="check">
        <input type="checkbox" checked={form.isSampleTemplate} onChange={(event) => setForm({ ...form, isSampleTemplate: event.target.checked })} />
        Sample template
      </label>
      {add.error ? <p className="alert" role="alert">{errorText(add.error)}</p> : null}
      <div className="editor-actions">
        <button className="btn tiny" type="submit" disabled={add.isPending}>Add to draft</button>
        <button className="btn quiet tiny" type="button" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}

function Messages({ patientId, messages }: { patientId: number; messages: Array<{ id: number; senderName: string; content: string; createdAt: Date | string; mine: boolean }> }) {
  const [text, setText] = useState("");
  const utils = trpc.useUtils();
  const send = trpc.portal.clinic.sendMessage.useMutation({
    onSuccess: () => {
      setText("");
      void utils.portal.clinic.chart.invalidate({ patientId });
    },
  });
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ fontFamily: "var(--serif)", fontSize: 32, fontWeight: 500 }}>Messages</h2>
      <div className="thread" style={{ marginTop: 12 }}>
        {messages.map((message) => (
          <article key={message.id} className={message.mine ? "bubble mine" : "bubble"}>
            <small>{message.senderName} · {formatTime(message.createdAt)}</small>
            {message.content}
          </article>
        ))}
      </div>
      <form className="composer" onSubmit={(event) => { event.preventDefault(); send.mutate({ patientId, content: text }); }}>
        <label className="field">
          <span>Reply</span>
          <textarea value={text} onChange={(event) => setText(event.target.value)} required maxLength={4000} />
        </label>
        <button className="btn" type="submit" disabled={send.isPending}>Send</button>
      </form>
      {send.error ? <p className="alert" role="alert">{errorText(send.error)}</p> : null}
    </section>
  );
}

function Guidance({ patientId, drafts }: { patientId: number; drafts: Array<{ id: number; title: string; body: string; modelId: string }> }) {
  const utils = trpc.useUtils();
  const request = trpc.portal.clinic.requestGuidance.useMutation({
    onSuccess: () => void utils.portal.clinic.chart.invalidate({ patientId }),
  });
  const review = trpc.portal.clinic.reviewGuidance.useMutation({
    onSuccess: () => {
      void utils.portal.clinic.chart.invalidate({ patientId });
      void utils.portal.clinic.roster.invalidate();
    },
  });
  return (
    <section className="panel">
      <p className="label">Guidance drafts</p>
      <p className="fine">Suggestions stay here until you approve one. Approval adds a draft note. The patient still cannot see it until you publish.</p>
      <button className="btn tiny" type="button" style={{ marginTop: 10 }} disabled={request.isPending} onClick={() => request.mutate({ patientId })}>
        {request.isPending ? "Drafting…" : "Request draft suggestions"}
      </button>
      {request.error ? <p className="alert" role="alert">{errorText(request.error)}</p> : null}
      {drafts.map((draft) => (
        <article key={draft.id} style={{ marginTop: 14 }}>
          <span className="tag clay">Unreviewed · not visible to the patient</span>
          <h3 style={{ marginTop: 8 }}>{draft.title}</h3>
          <p className="fine">{draft.body}</p>
          <div className="editor-actions" style={{ marginTop: 8 }}>
            <button className="btn tiny" type="button" onClick={() => review.mutate({ draftId: draft.id, decision: "approved" })}>Approve into draft note</button>
            <button className="btn quiet tiny" type="button" onClick={() => review.mutate({ draftId: draft.id, decision: "dismissed" })}>Dismiss</button>
          </div>
        </article>
      ))}
    </section>
  );
}

function IntakeReview({ patientId, intake }: { patientId: number; intake: {
  status: string; goals: string; currentMedications: string; conditions: string; reviewedByProvider: boolean; providerNotes: string | null;
} }) {
  const [notes, setNotes] = useState(intake.providerNotes ?? "");
  const utils = trpc.useUtils();
  const review = trpc.portal.clinic.reviewIntake.useMutation({
    onSuccess: () => void utils.portal.clinic.chart.invalidate({ patientId }),
  });
  useEffect(() => setNotes(intake.providerNotes ?? ""), [intake.providerNotes]);
  return (
    <section className="panel">
      <p className="label">Intake · {statusLabel(intake.status)}</p>
      <p><strong>Goals.</strong> {intake.goals || "Not answered."}</p>
      <p><strong>Current list.</strong> {intake.currentMedications || "Not answered."}</p>
      <p><strong>Conditions.</strong> {intake.conditions || "Not answered."}</p>
      <form className="stack" onSubmit={(event) => { event.preventDefault(); review.mutate({ patientId, providerNotes: notes }); }}>
        <label className="field">
          <span>Review note</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={4000} />
        </label>
        <button className="btn tiny" type="submit" disabled={review.isPending}>{intake.reviewedByProvider ? "Update review" : "Mark reviewed"}</button>
      </form>
      {review.error ? <p className="alert" role="alert">{errorText(review.error)}</p> : null}
    </section>
  );
}

function Pharmacy() {
  const queue = trpc.portal.pharmacy.queue.useQuery();
  const utils = trpc.useUtils();
  const setStatus = trpc.portal.pharmacy.setStatus.useMutation({
    onSuccess: () => void utils.portal.pharmacy.queue.invalidate(),
  });
  if (queue.isLoading) return <p className="eyebrow" style={{ padding: 18 }}>Loading the queue</p>;
  if (queue.error || !queue.data) return <p className="alert" role="alert">{errorText(queue.error)}</p>;
  return (
    <div className="workspace">
      <p className="eyebrow">{queue.data.adapterName}</p>
      <h1 className="display">Pharmacy queue.</h1>
      <p className="lede">Mock adapter only. Orders are stored for the clinic to track. Nothing is transmitted to a pharmacy, and there is no e-prescribing.</p>
      <div style={{ overflowX: "auto", marginTop: 18 }}>
        <table className="queue">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Item</th>
              <th>Change</th>
              <th>Status</th>
              <th>Mock action</th>
            </tr>
          </thead>
          <tbody>
            {queue.data.orders.map((order) => (
              <tr key={order.id}>
                <td>{order.patientName}</td>
                <td>{order.drugName}<br /><span className="fine">{order.details}</span></td>
                <td>{order.changeType}</td>
                <td>{statusLabel(order.status)}<br /><span className="fine">{order.externalId}</span></td>
                <td>
                  {order.status === "queued" || order.status === "accepted" ? (
                    <div className="editor-actions">
                      <button className="btn tiny" type="button" onClick={() => setStatus.mutate({ orderId: order.id, status: "filled" })}>Mark filled</button>
                      <button className="btn quiet tiny" type="button" onClick={() => setStatus.mutate({ orderId: order.id, status: "cancelled" })}>Cancel</button>
                    </div>
                  ) : <span className="fine">Closed</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {setStatus.error ? <p className="alert" role="alert">{errorText(setStatus.error)}</p> : null}
    </div>
  );
}
