/**
 * PatientPrivacy — Privacy & Security settings for patient portal
 * Shows account info, login method, and security details.
 * Design: Warm Scandinavian — sage green, terracotta, stone palette
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useViewAs } from "@/contexts/ViewAsContext";
import {
  ArrowLeft,
  Shield,
  Lock,
  Mail,
  User,
  Clock,
  Fingerprint,
  ShieldCheck,
  Loader2,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

export default function PatientPrivacy() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { viewAsPatientId } = useViewAs();
  const myRecordQuery = trpc.patient.myRecord.useQuery(
    viewAsPatientId ? { viewAs: viewAsPatientId } : undefined
  );
  const myRecord = myRecordQuery.data;

  if (myRecordQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const loginMethod = user?.loginMethod || "email";
  const loginMethodLabel =
    loginMethod === "google" ? "Google Account" :
    loginMethod === "apple" ? "Apple ID" :
    loginMethod === "microsoft" ? "Microsoft Account" :
    loginMethod === "github" ? "GitHub" :
    "Email & Password";

  const lastSignedIn = user?.lastSignedIn
    ? new Date(user.lastSignedIn).toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className="px-5 md:px-8 py-5 md:py-8 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/patient/profile")}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">Privacy & Security</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Your account security settings</p>
        </div>
      </div>

      {/* Account info */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 md:px-5 py-3 md:py-4 border-b border-border">
          <h2 className="font-heading text-sm md:text-base font-semibold text-foreground">Account Information</h2>
        </div>
        <div className="divide-y divide-border">
          {[
            { icon: User, label: "Account Name", value: user?.name || "—" },
            { icon: Mail, label: "Email", value: user?.email || myRecord?.email || "—" },
            { icon: Fingerprint, label: "Login Method", value: loginMethodLabel },
            { icon: Clock, label: "Last Sign-In", value: lastSignedIn },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-3.5">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] md:text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm md:text-base text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security features */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 md:px-5 py-3 md:py-4 border-b border-border">
          <h2 className="font-heading text-sm md:text-base font-semibold text-foreground">Security Features</h2>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-3.5">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-gold" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Encrypted Connection</p>
              <p className="text-xs text-muted-foreground">All data is transmitted over HTTPS with TLS encryption</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-gold shrink-0" />
          </div>
          <div className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-3.5">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-gold" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Secure Authentication</p>
              <p className="text-xs text-muted-foreground">Your session is protected with JWT-based authentication</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-gold shrink-0" />
          </div>
          <div className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-3.5">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
              <Fingerprint className="w-4 h-4 text-gold" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Data Isolation</p>
              <p className="text-xs text-muted-foreground">Your health data is isolated and only accessible to you and your provider</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-gold shrink-0" />
          </div>
        </div>
      </div>

      {/* SMS Notifications */}
      {myRecord?.phone && (
        <SmsConsentSection smsOptIn={myRecord.smsOptIn ?? null} />
      )}

      {/* Data privacy */}
      <div className="bg-card rounded-xl border border-border p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-heading text-sm md:text-base font-semibold text-foreground mb-1">Your Data, Your Control</h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              Black Label Medicine takes your privacy seriously. Your health records, messages, and personal information
              are stored securely and are only shared with your designated healthcare provider. We never sell or share
              your data with third parties.
            </p>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-2">
              If you have questions about your data or wish to request data deletion, please contact your provider directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SmsConsentSection({ smsOptIn }: { smsOptIn: boolean | null }) {
  const [optimistic, setOptimistic] = useState<boolean | null>(smsOptIn);
  const utils = trpc.useUtils();
  const mutation = trpc.patient.updateSmsConsent.useMutation({
    onSuccess: (data) => {
      setOptimistic(data.smsOptIn);
      utils.patient.myRecord.invalidate();
    },
  });

  const isOptedIn = optimistic === true;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 md:px-5 py-3 md:py-4 border-b border-border">
        <h2 className="font-heading text-sm md:text-base font-semibold text-foreground">SMS Notifications</h2>
      </div>
      <div className="px-4 md:px-5 py-3 md:py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Text message notifications</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receive appointment reminders, new messages, and protocol updates via SMS.
              Msg & data rates may apply. Reply STOP to unsubscribe at any time.
            </p>
          </div>
          <button
            onClick={() => mutation.mutate({ optIn: !isOptedIn })}
            disabled={mutation.isPending}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isOptedIn ? "bg-gold" : "bg-muted-foreground/30"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isOptedIn ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
