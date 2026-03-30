/**
 * ViewAs Context — enables admin/provider to preview the patient portal
 * as a specific patient by passing ?viewAs=<patientId> in the URL.
 *
 * All patient pages that call trpc.patient.myRecord.useQuery() should
 * use useViewAsPatientId() to pass the viewAs parameter.
 */
import { createContext, useContext, useMemo } from "react";
import { useSearch } from "wouter";

interface ViewAsContextValue {
  /** The patient ID being impersonated, or undefined if not impersonating */
  viewAsPatientId: number | undefined;
  /** Whether the current session is an admin preview */
  isImpersonating: boolean;
}

const ViewAsContext = createContext<ViewAsContextValue>({
  viewAsPatientId: undefined,
  isImpersonating: false,
});

export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const viewAsRaw = params.get("viewAs");
  const viewAsPatientId = viewAsRaw ? parseInt(viewAsRaw, 10) : undefined;
  const isImpersonating = viewAsPatientId !== undefined && !isNaN(viewAsPatientId);

  const value = useMemo(
    () => ({ viewAsPatientId: isImpersonating ? viewAsPatientId : undefined, isImpersonating }),
    [viewAsPatientId, isImpersonating]
  );

  return <ViewAsContext.Provider value={value}>{children}</ViewAsContext.Provider>;
}

/**
 * Returns the viewAs patient ID if the admin is impersonating.
 * Use this to pass { viewAs: viewAsPatientId } to trpc.patient.myRecord.useQuery().
 */
export function useViewAs() {
  return useContext(ViewAsContext);
}
