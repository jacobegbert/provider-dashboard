/**
 * StaffInviteLanding — Staff invite acceptance page
 * Flow:
 * 1. Staff member clicks invite link → lands here with ?token=xxx
 * 2. We verify the token (public, no auth needed)
 * 3. If valid, show welcome + "Create Account / Sign In" button
 * 4. After OAuth login, they return here with the token still in URL
 * 5. We call staff.acceptInvite to promote their account to staff role
 * 6. Redirect to /provider
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Loader2, CheckCircle2, XCircle, Stethoscope, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";

const WELLNESS_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663344768429/2VRczM8SEoMgkRv9pxV2Z3/hero-mountains-banner-LwuKoYLPzkmmCGpcpVvH3a.webp";

export default function StaffInviteLanding() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";

  const verifyQuery = trpc.staff.verifyInvite.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const acceptMutation = trpc.staff.acceptInvite.useMutation({
    onSuccess: () => {
      setAccepted(true);
      toast.success("Welcome to the team! Redirecting to the provider portal...");
      setTimeout(() => {
        window.location.href = "/provider";
      }, 1500);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to accept invite");
      setAccepting(false);
    },
  });

  useEffect(() => {
    if (
      isAuthenticated &&
      !authLoading &&
      verifyQuery.data?.valid &&
      !accepting &&
      !accepted &&
      !acceptMutation.isError
    ) {
      setAccepting(true);
      acceptMutation.mutate({ token });
    }
  }, [isAuthenticated, authLoading, verifyQuery.data, token]);

  const isLoading = authLoading || verifyQuery.isLoading;

  const handleLogin = () => {
    const returnPath = `/staff-invite?token=${token}`;
    window.location.href = getLoginUrl(returnPath);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <img src={WELLNESS_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-white/85 backdrop-blur-sm" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="mx-auto mb-6">
            <span className="text-[18px] font-bold tracking-[0.25em] uppercase text-foreground">BL</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground tracking-tight">
            Black Label Medicine
          </h1>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-px w-8 bg-gold/40" />
            <p className="text-gold text-xs tracking-[0.3em] uppercase font-heading font-light">
              Staff Portal
            </p>
            <div className="h-px w-8 bg-gold/40" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/90 backdrop-blur-md border border-border rounded-2xl p-8 shadow-lg">
            {/* Loading */}
            {isLoading && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">Verifying your invitation...</p>
              </div>
            )}

            {/* No token */}
            {!token && !isLoading && (
              <div className="text-center py-6">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="font-heading text-xl font-semibold text-foreground mb-2">Invalid Link</h2>
                <p className="text-muted-foreground text-sm">
                  This invite link appears to be invalid. Please contact the practice owner for a new invitation.
                </p>
              </div>
            )}

            {/* Invalid / expired / revoked */}
            {token && !isLoading && verifyQuery.data && !verifyQuery.data.valid && (
              <div className="text-center py-6">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                  {verifyQuery.data.reason?.includes("revoked") ? "Invite Revoked" :
                   verifyQuery.data.reason?.includes("used") ? "Already Accepted" : "Invite Expired"}
                </h2>
                <p className="text-muted-foreground text-sm mb-6">{verifyQuery.data.reason}</p>
                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary"
                  onClick={() => navigate("/")}
                >
                  Go to Homepage
                </Button>
              </div>
            )}

            {/* Valid — not logged in */}
            {token && !isLoading && verifyQuery.data?.valid && !isAuthenticated && (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-xl bg-gold/15 flex items-center justify-center mx-auto mb-5">
                  <Stethoscope className="w-7 h-7 text-gold" />
                </div>
                <h2 className="font-serif text-2xl font-light text-foreground mb-2">
                  Welcome, {verifyQuery.data.name}
                </h2>
                <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                  You've been invited to join the Black Label Medicine provider portal as a staff member.
                  You'll have access to manage clients, protocols, scheduling, and more.
                </p>
                <Button
                  size="lg"
                  className="w-full bg-gold hover:bg-gold-dark text-white font-heading font-semibold"
                  onClick={handleLogin}
                >
                  Create Account / Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-muted-foreground/60 text-xs mt-4 font-mono">
                  Secure login powered by Manus
                </p>
              </div>
            )}

            {/* Accepting */}
            {token && !isLoading && verifyQuery.data?.valid && isAuthenticated && accepting && !accepted && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">Setting up your staff access...</p>
              </div>
            )}

            {/* Accepted */}
            {accepted && (
              <div className="text-center py-6">
                <CheckCircle2 className="h-12 w-12 text-gold mx-auto mb-4" />
                <h2 className="font-heading text-xl font-semibold text-foreground mb-2">You're All Set!</h2>
                <p className="text-muted-foreground text-sm mb-2">
                  Your staff access has been activated. Redirecting to the provider portal...
                </p>
              </div>
            )}

            {/* Error */}
            {acceptMutation.isError && !accepted && (
              <div className="text-center py-6">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="font-heading text-xl font-semibold text-foreground mb-2">Something Went Wrong</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  {acceptMutation.error?.message || "Failed to set up your account. Please try again."}
                </p>
                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary"
                  onClick={() => {
                    setAccepting(false);
                    acceptMutation.reset();
                  }}
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
