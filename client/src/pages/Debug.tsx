import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Debug() {
  const debugQuery = trpc.auth.debug.useQuery();

  if (debugQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (debugQuery.error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Debug Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-red-600 whitespace-pre-wrap">
              {debugQuery.error.message}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = debugQuery.data;

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Session Diagnostic</h1>
      <p className="text-muted-foreground text-sm">
        This page shows what the server sees for your current session.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Your User Record</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="font-medium">ID</dt>
              <dd>{data?.currentUser.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">Name</dt>
              <dd>{data?.currentUser.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">Email</dt>
              <dd>{data?.currentUser.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">Role</dt>
              <dd className={data?.currentUser.role === "staff" || data?.currentUser.role === "admin" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                {data?.currentUser.role}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">OpenID</dt>
              <dd className="font-mono text-xs">{data?.currentUser.openId}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Owner Resolution</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="font-medium">OWNER_EMAIL env</dt>
              <dd className="font-mono text-xs">{data?.ownerEmail}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">Owner Lookup</dt>
              <dd>{data?.ownerLookup}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">Resolved Owner ID</dt>
              <dd>{data?.resolvedOwnerId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">Patient Count</dt>
              <dd>{data?.patientCount}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Access Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm">
            <span className="font-medium">adminProcedure would pass?</span>
            <span className={data?.adminCheckWouldPass ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
              {data?.adminCheckWouldPass ? "YES ✓" : "NO ✗"}
            </span>
          </div>
          {!data?.adminCheckWouldPass && (
            <p className="text-red-600 text-sm mt-2">
              Role must be "admin" or "staff" to access provider data. Current role: "{data?.currentUser.role}"
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
