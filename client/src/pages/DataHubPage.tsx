import { useState } from "react";
import { errorText, formatTime } from "@/lib/format";
import { trpc } from "@/lib/trpc";

type DestinationKey = "slack" | "gohighlevel" | "viktor" | "webhook";

const COPY: Record<DestinationKey, string> = {
  slack: "Posts the gated payload to the configured Slack channel.",
  gohighlevel: "A BAA-covered destination can sync a contact and a zero-amount invoice stub. Otherwise only the de-identified summary is offered.",
  viktor: "Posts to a Slack channel for Viktor. There is no separate Viktor API in this portal.",
  webhook: "POSTs the gated JSON to the configured URL.",
};

export default function DataHubPage() {
  const me = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();
  const overview = trpc.portal.hub.overview.useQuery(undefined, { enabled: me.data?.role === "admin" });
  const sync = trpc.portal.hub.sync.useMutation({
    onSuccess: () => void utils.portal.hub.overview.invalidate(),
  });
  const setDestination = trpc.portal.hub.setDestination.useMutation({
    onSuccess: () => void utils.portal.hub.overview.invalidate(),
  });
  const [result, setResult] = useState("");

  if (me.isLoading || (me.data?.role === "admin" && overview.isLoading)) return <p className="eyebrow">Opening the data hub</p>;
  if (me.data?.role !== "admin") {
    return <p className="alert" role="alert">The data hub is limited to the practice admin.</p>;
  }
  if (overview.error || !overview.data) return <p className="alert" role="alert">{errorText(overview.error)}</p>;
  const data = overview.data;

  return (
    <div className="workspace">
      <p className="eyebrow">{data.source.label}</p>
      <h1 className="display">Charm data hub.</h1>
      <p className="lede">
        One server-side sync pulls patients, labs, and medications from Charm FHIR into this portal.
        Credentials stay in environment variables. This process is using the {data.source.id === "mock" ? "mock adapter and fictional charts" : "live Charm adapter"}.
        Nothing here is a prescription, and patients do not see imported medications until you publish the draft.
      </p>
      <div className="editor-actions" style={{ marginTop: 16 }}>
        <button
          className="btn"
          type="button"
          disabled={sync.isPending}
          onClick={() => {
            setResult("");
            sync.mutate(undefined, {
              onSuccess: (summary) => {
                const charts = summary.patients === 1 ? "1 chart" : `${summary.patients} charts`;
                const labs = summary.labs === 1 ? "1 lab row" : `${summary.labs} lab rows`;
                const medications = summary.medications === 1 ? "1 draft medication" : `${summary.medications} draft medications`;
                setResult(`Synced ${charts}, ${labs}, and ${medications}. ${summary.deliveries} deliveries sent, ${summary.suppressed} held by a kill switch.`);
              },
            });
          }}
        >
          {sync.isPending ? "Syncing" : "Sync from Charm"}
        </button>
      </div>
      {result ? <p className="live-note" role="status">{result}</p> : null}
      {sync.error ? <p className="alert" role="alert">{errorText(sync.error)}</p> : null}

      <section className="hub-list" aria-labelledby="destinations-heading">
        <h2 id="destinations-heading">Destinations</h2>
        {data.destinations.map((destination) => (
          <article className="panel dest-card" key={destination.key}>
            <header>
              <div>
                <h3>{destination.label}</h3>
                <p className="fine">{COPY[destination.key]}</p>
              </div>
              <span className={destination.baaCovered ? "tag pine" : "tag clay"}>
                {destination.baaCovered ? "BAA covered" : "Safe Harbor only"}
              </span>
            </header>
            <p>
              <span className={destination.enabled ? "tag" : "tag quiet"}>
                {destination.enabled ? "Delivery armed" : "Kill switch on"}
              </span>
            </p>
            <label className="check">
              <input
                type="checkbox"
                checked={destination.enabled}
                onChange={(event) => setDestination.mutate({
                  key: destination.key,
                  enabled: event.target.checked,
                  baaCovered: destination.baaCovered,
                })}
              />
              Allow delivery
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={destination.baaCovered}
                onChange={(event) => setDestination.mutate({
                  key: destination.key,
                  enabled: destination.enabled,
                  baaCovered: event.target.checked,
                })}
              />
              BAA covered — identified contact fields may be sent
            </label>
          </article>
        ))}
      </section>
      {setDestination.error ? <p className="alert" role="alert">{errorText(setDestination.error)}</p> : null}

      <section style={{ marginTop: 28 }} aria-labelledby="sends-heading">
        <h2 id="sends-heading">Recent sends</h2>
        <p className="fine">The log records the policy outcome. It does not copy names, dates of birth, or contact details.</p>
        {data.sends.length === 0 ? <p className="lede">No deliveries yet. Every destination starts with the kill switch on.</p> : null}
        {data.sends.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="queue">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Destination</th>
                  <th>Result</th>
                  <th>Policy</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {data.sends.map((send) => (
                  <tr key={send.id}>
                    <td>{formatTime(send.createdAt)}</td>
                    <td>{send.destinationKey}</td>
                    <td>{send.status}{send.externalId ? <><br /><span className="fine">{send.externalId}</span></> : null}</td>
                    <td>{send.deidentified ? "De-identified" : "Identified"}</td>
                    <td>{send.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
