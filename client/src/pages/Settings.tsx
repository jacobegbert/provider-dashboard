/*
 * Settings Page — Provider profile and preferences
 * Design: Warm Command Center — Scandinavian Functionalism
 * Includes push notification subscription
 */
import { useState, useEffect } from "react";
import { User, Bell, Shield, Smartphone, CheckCircle2, XCircle, Calendar, Loader2, Unlink, RefreshCw, Save, Database, Download, HardDrive, Users, UserPlus, Mail, Trash2, Copy, Clock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const isSupported = "Notification" in window && "serviceWorker" in navigator;
    setSupported(isSupported);
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, []);

  const subscribe = async () => {
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === "granted") {
        setSubscribed(true);
        toast.success("Push notifications enabled");
        // Show a test notification
        new Notification("Black Label Medicine", {
          body: "Notifications are now active. You'll be alerted when patients need attention.",
          icon: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663344768429/YCQjczTLHVIxeVLr.png",
        });
      } else {
        toast.error("Notification permission denied");
      }
    } catch {
      toast.error("Could not enable notifications");
    }
  };

  return { permission, supported, subscribed, subscribe };
}

function GoogleCalendarSection() {
  const status = trpc.googleCalendar.status.useQuery();
  const getAuthUrl = trpc.googleCalendar.getAuthUrl.useMutation();
  const disconnect = trpc.googleCalendar.disconnect.useMutation();
  const syncAll = trpc.appointment.syncAllToGoogle.useMutation();
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();

  // Check for ?gcal=connected in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("gcal") === "connected") {
      toast.success("Google Calendar connected successfully!");
      utils.googleCalendar.status.invalidate();
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleConnect = async () => {
    try {
      const result = await getAuthUrl.mutateAsync({ origin: window.location.origin });
      window.location.href = result.url;
    } catch {
      toast.error("Failed to start Google Calendar connection");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect.mutateAsync();
      utils.googleCalendar.status.invalidate();
      toast.success("Google Calendar disconnected");
    } catch {
      toast.error("Failed to disconnect Google Calendar");
    }
  };

  const handleSyncAll = async () => {
    try {
      const result = await syncAll.mutateAsync();
      toast.success(`Synced ${result.synced} appointments${result.failed > 0 ? ` (${result.failed} failed)` : ""}`);
    } catch {
      toast.error("Failed to sync appointments");
    }
  };

  if (status.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking connection...
      </div>
    );
  }

  if (status.data?.connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-gold/5">
          <CheckCircle2 className="h-5 w-5 text-gold mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Google Calendar Connected</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Syncing with {status.data.googleEmail || "your Google account"}.
              New appointments will automatically appear in your Google Calendar.
            </p>
          </div>
          <Badge className="bg-gold/10 text-gold border-gold/15 text-[10px] shrink-0">Connected</Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={handleSyncAll}
            disabled={syncAll.isPending}
          >
            {syncAll.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            Sync All Appointments
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 text-red-400 hover:text-red-400"
            onClick={handleDisconnect}
            disabled={disconnect.isPending}
          >
            {disconnect.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5 mr-1.5" />}
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Connect your Google Calendar</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automatically sync appointments to your Google Calendar. When you create, update, or cancel
            an appointment, it will be reflected in your calendar.
          </p>
          <Button
            className="bg-gold hover:bg-gold-light text-black h-8 text-xs mt-3"
            onClick={handleConnect}
            disabled={getAuthUrl.isPending}
          >
            {getAuthUrl.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5 mr-1.5" />}
            Connect Google Calendar
          </Button>
        </div>
      </div>
      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
        <p className="font-medium text-foreground mb-1">What we access</p>
        <p>
          We only request permission to create, update, and delete calendar events. We cannot read
          your existing calendar events or access any other Google services.
        </p>
      </div>
    </div>
  );
}

function ProfileSection() {
  const profileQuery = trpc.providerProfile.get.useQuery();
  const upsertProfile = trpc.providerProfile.upsert.useMutation();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    practiceName: "",
    title: "",
  });
  const [initialized, setInitialized] = useState(false);

  // Load profile data into form when query returns
  useEffect(() => {
    if (profileQuery.data && !initialized) {
      setForm({
        firstName: profileQuery.data.firstName || "",
        lastName: profileQuery.data.lastName || "",
        email: profileQuery.data.email || "",
        phone: profileQuery.data.phone || "",
        practiceName: profileQuery.data.practiceName || "",
        title: profileQuery.data.title || "",
      });
      setInitialized(true);
    } else if (profileQuery.isSuccess && !profileQuery.data && !initialized) {
      // No profile yet — leave defaults empty
      setInitialized(true);
    }
  }, [profileQuery.data, profileQuery.isSuccess, initialized]);

  const handleSave = async () => {
    try {
      await upsertProfile.mutateAsync(form);
      utils.providerProfile.get.invalidate();
      toast.success("Profile saved successfully");
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (profileQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading profile...
      </div>
    );
  }

  const initials = (form.firstName?.[0] || "J") + (form.lastName?.[0] || "E");
  const displayName = form.firstName && form.lastName
    ? `${form.title ? form.title + " " : ""}${form.firstName} ${form.lastName}`
    : "Provider";

  return (
    <CardContent className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gold/15 flex items-center justify-center">
          <span className="text-xl font-bold text-gold font-heading">{initials.toUpperCase()}</span>
        </div>
        <div>
          <p className="font-heading font-semibold text-foreground">{displayName}</p>
          <p className="text-sm text-muted-foreground">
            {form.practiceName || "Black Label Medicine"} — Concierge Optimization
          </p>
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">Title</Label>
          <Input
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Dr."
            className="mt-1 h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Practice Name</Label>
          <Input
            value={form.practiceName}
            onChange={(e) => updateField("practiceName", e.target.value)}
            placeholder="Black Label Medicine"
            className="mt-1 h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">First Name</Label>
          <Input
            value={form.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            placeholder="First name"
            className="mt-1 h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Last Name</Label>
          <Input
            value={form.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            placeholder="Last name"
            className="mt-1 h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Email</Label>
          <Input
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="email@example.com"
            className="mt-1 h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Phone</Label>
          <Input
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="(555) 000-0000"
            className="mt-1 h-9 text-sm"
          />
        </div>
      </div>
      <Button
        className="bg-gold hover:bg-gold-light text-black h-8 text-xs"
        onClick={handleSave}
        disabled={upsertProfile.isPending}
      >
        {upsertProfile.isPending ? (
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        ) : (
          <Save className="h-3.5 w-3.5 mr-1.5" />
        )}
        Save Changes
      </Button>
    </CardContent>
  );
}

function BackupSection() {
  const backupsQuery = trpc.backup.list.useQuery();
  const createBackup = trpc.backup.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Backup created — ${data.totalRows} rows across ${data.tableCount} tables`);
      backupsQuery.refetch();
    },
    onError: () => toast.error("Failed to create backup"),
  });

  const backups = backupsQuery.data || [];

  const handleDownload = async (key: string) => {
    try {
      // We can't use useQuery dynamically, so fetch directly
      const resp = await fetch(`/api/trpc/backup.download?input=${encodeURIComponent(JSON.stringify({ json: { key } }))}`, {
        credentials: "include",
      });
      const json = await resp.json();
      const url = json?.result?.data?.json?.url;
      if (url) {
        window.open(url, "_blank");
      } else {
        toast.error("Could not get download URL");
      }
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
        <HardDrive className="h-5 w-5 text-gold mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Database Backup</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Export all patient data, protocols, assignments, messages, and notes to a JSON file stored securely in S3.
            Backups can be downloaded at any time.
          </p>
          <Button
            className="bg-gold hover:bg-gold-light text-black h-8 text-xs mt-3"
            onClick={() => createBackup.mutate()}
            disabled={createBackup.isPending}
          >
            {createBackup.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Database className="h-3.5 w-3.5 mr-1.5" />
            )}
            {createBackup.isPending ? "Creating Backup..." : "Create Backup Now"}
          </Button>
        </div>
      </div>

      {backups.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Backups</p>
          <div className="space-y-1.5">
            {backups.slice(0, 10).map((backup, i) => {
              const date = new Date(backup.timestamp);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Database className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {backup.totalRows} rows · {backup.tableCount} tables
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-gold hover:text-gold"
                    onClick={() => handleDownload(backup.key)}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Download
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamManagementSection() {
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const utils = trpc.useUtils();

  const invitesQuery = trpc.staff.listInvites.useQuery();
  const membersQuery = trpc.staff.listMembers.useQuery();
  const sendInvite = trpc.staff.invite.useMutation({
    onSuccess: (data) => {
      toast.success(`Invite sent to ${inviteEmail}${data.emailSent ? " (email delivered)" : ""}`);
      setInviteName("");
      setInviteEmail("");
      setShowInviteForm(false);
      utils.staff.listInvites.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to send invite"),
  });
  const revokeInvite = trpc.staff.revokeInvite.useMutation({
    onSuccess: () => {
      toast.success("Invite revoked");
      utils.staff.listInvites.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const removeMember = trpc.staff.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Staff member removed");
      utils.staff.listMembers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleInvite = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error("Please enter both name and email");
      return;
    }
    sendInvite.mutate({ name: inviteName.trim(), email: inviteEmail.trim(), origin: window.location.origin });
  };

  const pendingInvites = (invitesQuery.data || []).filter(i => !i.usedAt && !i.revokedAt && new Date(i.expiresAt) > new Date());
  const members = membersQuery.data || [];

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-gold" />
            Team Management
          </CardTitle>
          {!showInviteForm && (
            <Button
              size="sm"
              className="bg-gold hover:bg-gold-light text-black h-8 text-xs"
              onClick={() => setShowInviteForm(true)}
            >
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              Invite Staff
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invite Form */}
        {showInviteForm && (
          <div className="p-4 rounded-xl bg-muted/40 border border-border/40 space-y-3">
            <p className="text-sm font-medium text-foreground">Invite a Staff Member</p>
            <p className="text-xs text-muted-foreground">They'll receive an email with a link to create their account and access the provider portal.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  placeholder="e.g. Jane Smith"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  placeholder="e.g. jane@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="mt-1 h-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-gold hover:bg-gold-light text-black h-8 text-xs"
                onClick={handleInvite}
                disabled={sendInvite.isPending}
              >
                {sendInvite.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Mail className="h-3.5 w-3.5 mr-1.5" />}
                Send Invitation
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => { setShowInviteForm(false); setInviteName(""); setInviteEmail(""); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Active Staff Members */}
        {members.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Active Staff</p>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center">
                      <User className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.name || "Staff Member"}</p>
                      <p className="text-xs text-muted-foreground">{m.email || "No email"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      Last active: {m.lastSignedIn ? new Date(m.lastSignedIn).toLocaleDateString() : "Never"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm(`Remove ${m.name || "this staff member"}? They will lose access to the provider portal.`)) {
                          removeMember.mutate({ userId: m.id });
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Pending Invitations</p>
            <div className="space-y-2">
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.name}</p>
                      <p className="text-xs text-muted-foreground">{inv.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      Expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        const url = `${window.location.origin}/staff-invite?token=${inv.token}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Invite link copied to clipboard");
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Link
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => revokeInvite.mutate({ id: inv.id })}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {members.length === 0 && pendingInvites.length === 0 && !showInviteForm && (
          <div className="text-center py-6">
            <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No staff members yet</p>
            <p className="text-xs text-muted-foreground mt-1">Invite your assistant to give them their own access to the portal.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const push = usePushNotifications();
  const [prefs, setPrefs] = useState({
    newMessages: true,
    appointmentReminders: true,
    weeklySummary: false,
    missedTasks: true,
    newPatients: true,
  });

  const toggle = (key: keyof typeof prefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    toast("Preference updated");
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account, notifications, and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-gold" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <ProfileSection />
        </Card>

        {/* Push Notifications Setup */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-gold" />
              Push Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
              {push.supported ? (
                push.permission === "granted" ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-gold mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Notifications Active</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        You'll receive browser notifications for important events.
                      </p>
                    </div>
                    <Badge className="bg-gold/10 text-gold border-gold/15 text-[10px] shrink-0">Enabled</Badge>
                  </>
                ) : (
                  <>
                    <Bell className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Enable Push Notifications</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Get instant alerts when patients need attention, send messages, or complete tasks.
                      </p>
                      <Button
                        className="bg-gold hover:bg-gold-light text-black h-8 text-xs mt-3"
                        onClick={push.subscribe}
                      >
                        <Bell className="h-3.5 w-3.5 mr-1.5" />
                        Enable Notifications
                      </Button>
                    </div>
                  </>
                )
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Notifications Not Supported</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your browser doesn't support push notifications. Try using Chrome or Edge.
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-gold" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { key: "newMessages" as const, label: "New Messages", desc: "When a patient sends you a message" },
              { key: "appointmentReminders" as const, label: "Appointment Reminders", desc: "30 minutes before scheduled appointments" },
              { key: "missedTasks" as const, label: "Missed Tasks", desc: "When patients miss protocol tasks" },
              { key: "newPatients" as const, label: "New Patient Registrations", desc: "When a patient accepts their invite" },
              { key: "weeklySummary" as const, label: "Weekly Summary", desc: "Practice overview every Monday morning" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={prefs[item.key]}
                  onCheckedChange={() => toggle(item.key)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Google Calendar Integration */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gold" />
              Google Calendar Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoogleCalendarSection />
          </CardContent>
        </Card>

        {/* Team Management — only visible to owner (admin) */}
        {user?.role === "admin" && <TeamManagementSection />}

        {/* Database Backups */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
              <Database className="h-4 w-4 text-gold" />
              Database Backups
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BackupSection />
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-gold" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
              <Shield className="h-5 w-5 text-gold mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Secure Authentication</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your account is protected with OAuth 2.0 authentication. All data is encrypted in transit.
                </p>
              </div>
              <Badge className="bg-gold/10 text-gold border-gold/15 text-[10px] shrink-0">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
