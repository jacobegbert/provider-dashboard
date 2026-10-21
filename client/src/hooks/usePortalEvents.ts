import { useEffect, useRef } from "react";

export type PortalEventName = "plan" | "message";

export function usePortalEvents(onEvent: (event: { type: PortalEventName }) => void, enabled = true) {
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    if (!enabled) return;
    const source = new EventSource("/api/events");
    const onPlan = () => handler.current({ type: "plan" });
    const onMessage = () => handler.current({ type: "message" });
    source.addEventListener("plan", onPlan);
    source.addEventListener("message", onMessage);
    return () => source.close();
  }, [enabled]);
}
