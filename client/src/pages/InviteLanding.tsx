/**
 * InviteLanding — Patient invite acceptance page
 * Flow:
 * 1. Patient clicks invite link → lands here with ?token=xxx
 * 2. We verify the token (public, no auth needed)
 * 3. If valid, show welcome + "Create Account / Sign In" button
 * 4. After OAuth login, they return here with the token still in URL
 * 5. We call invite.accept to link their account to the patient record
 * 6. Redirect to /patient
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Loader2, CheckCircle2, XCircle, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";

const WELLNESS_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663344768429/2VRczM8SEoMgkRv9pxV2Z3/hero-mountains-banner-LwuKoYLPzkmmCGpcpVvH3a.webp";

export default function InviteLanding() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Extract token from URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";

  // Verify the invite token (public — works without auth)
  const verifyQuery = trpc.invite.verify.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const acceptMutation = trpc.invite.accept.useMutation({
    onSuccess: () => {
      setAccepted(true);
      toast.success("Welcome! Your account has been linked.");
      // Redirect to patient portal after a short delay
      setTimeout(() => navigate("/patient"), 1500);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to accept invite");
      setAccepting(false);
    },
  });

  const isAdmin = user?.role === "admin" || user?.role === "staff";

  // Auto-accept: if user is authenticated (and NOT admin) and invite is valid, accept it
  useEffect(() => {
    if (
      isAuthenticated &&
      !isAdmin &&
      !authLoading &&
      verifyQuery.data?.valid &&
      !accepting &&
      !accepted &&
      !acceptMutation.isError
    ) {
      setAccepting(true);
      acceptMutation.mutate({ token });
    }
  }, [isAuthenticated, isAdmin, authLoading, verifyQuery.data, token]);

  const isLoading = authLoading || verifyQuery.isLoading;

  // Handle login redirect — pass the current invite URL as returnPath
  const handleLogin = () => {
    const returnPath = `/invite?token=${token}`;
    window.location.href = getLoginUrl(returnPath);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <img src={WELLNESS_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-white/85 backdrop-blur-sm" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
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
              Concierge Optimization
            </p>
            <div className="h-px w-8 bg-gold/40" />
          </div>
        </motion.div>

        {/* Content card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/90 backdrop-blur-md border border-border rounded-2xl p-8 shadow-lg">
            {/* Loading state */}
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
                <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                  Invalid Link
                </h2>
                <p className="text-muted-foreground text-sm">
                  This invite link appears to be invalid. Please contact your provider for a new invitation.
                </p>
              </div>
            )}

            {/* Invalid / expired token */}
            {token && !isLoading && verifyQuery.data && !verifyQuery.data.valid && (
              <div className="text-center py-6">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                  {verifyQuery.data.reason === "This invite has already been used"
                    ? "Already Accepted"
                    : "Invite Expired"}
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  {verifyQuery.data.reason}
                </p>
                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary"
                  onClick={() => navigate("/")}
                >
                  Go to Homepage
                </Button>
              </div>
            )}

            {/* Valid token — not logged in yet */}
            {token && !isLoading && verifyQuery.data?.valid && !isAuthenticated && (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                  <Heart className="w-7 h-7 text-red-400" />
                </div>
                <h2 className="font-serif text-2xl font-light text-foreground mb-2">
                  Welcome, {verifyQuery.data.patientFirstName}
                </h2>
                <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                  Dr. Egbert has invited you to join Black Label Medicine's patient portal.
                  Create an account to access your personalized health protocols, messages, and more.
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

            {/* Admin warning — admin is logged in, can't accept */}
            {token && !isLoading && verifyQuery.data?.valid && isAuthenticated && isAdmin && !accepted && (
              <div className="text-center py-6">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                  Admin Account Detected
                </h2>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  You're currently logged in as the provider/admin. Patient invites must be accepted from a separate patient account. Please open this link in an incognito window or a different browser.
                </p>
                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary"
                  onClick={() => navigate("/provider")}
                >
                  Return to Provider Dashboard
                </Button>
              </div>
            )}

            {/* Valid token — logged in, accepting */}
            {token && !isLoading && verifyQuery.data?.valid && isAuthenticated && !isAdmin && accepting && !accepted && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">Setting up your patient portal...</p>
              </div>
            )}

            {/* Accepted! */}
            {accepted && (
              <div className="text-center py-6">
                <CheckCircle2 className="h-12 w-12 text-gold mx-auto mb-4" />
                <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                  You're All Set!
                </h2>
                <p className="text-muted-foreground text-sm mb-2">
                  Your account has been linked. Redirecting to your patient portal...
                </p>
              </div>
            )}

            {/* Error state */}
            {acceptMutation.isError && !accepted && (
              <div className="text-center py-6">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                  Something Went Wrong
                </h2>
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
