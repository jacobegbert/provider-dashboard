/**
 * PortalSwitcher — Landing page
 * - Unauthenticated: shows branding + "Sign In" button
 * - Authenticated admin: shows both portal cards (provider + patient demo)
 * - Authenticated patient: redirects to /patient
 */
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Stethoscope, Heart, ArrowRight, LogIn, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";

const WELLNESS_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663344768429/2VRczM8SEoMgkRv9pxV2Z3/hero-mountains-banner-LwuKoYLPzkmmCGpcpVvH3a.webp";

export default function PortalSwitcher() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // If authenticated non-admin/non-staff user, redirect to patient portal
  // Staff members get redirected to provider portal just like admins
  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (user?.role === "admin" || user?.role === "staff") {
        navigate("/provider");
      } else {
        navigate("/patient");
      }
    }
  }, [loading, isAuthenticated, user]);

  const isAdmin = isAuthenticated && (user?.role === "admin" || user?.role === "staff");

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <img src={WELLNESS_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-white/85 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Logo & branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="mb-6 text-center">
            <span className="text-2xl md:text-3xl font-semibold tracking-[0.2em] uppercase text-foreground leading-none">Black Label</span>
            <span className="block text-sm md:text-base font-medium tracking-[0.35em] uppercase text-muted-foreground leading-tight mt-1">Medicine</span>
          </div>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-px w-8 bg-gold/40" />
            <p className="text-gold text-xs tracking-[0.3em] uppercase font-heading font-light">Concierge Optimization</p>
            <div className="h-px w-8 bg-gold/40" />
          </div>
        </motion.div>

        {/* Loading state */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="text-muted-foreground text-sm font-mono">Loading...</p>
          </motion.div>
        )}

        {/* Not authenticated — show sign-in */}
        {!loading && !isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/90 backdrop-blur-md border border-border rounded-2xl p-8 text-center shadow-lg">
              <Heart className="w-10 h-10 text-red-400 mx-auto mb-4" />
              <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                Welcome to Your Patient Portal
              </h2>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                Sign in to access your personalized health protocols, messages, appointments, and wellness tools.
              </p>
                <Button
                size="lg"
                className="w-full bg-gold hover:bg-gold-dark text-white font-heading font-semibold"
                onClick={() => { window.location.href = getLoginUrl(); }}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In / Create Account
              </Button>
              <p className="text-muted-foreground/60 text-xs mt-4 font-mono">
                If you received an invite link, please use that link directly.
              </p>
            </div>
          </motion.div>
        )}

        {/* Authenticated admin — show both portals */}
        {!loading && isAdmin && (
          <div className="w-full max-w-md space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Link href="/provider">
                <div className="group bg-white/90 backdrop-blur-md border border-border rounded-2xl p-6 cursor-pointer hover:border-gold/30 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-7 h-7 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-heading text-lg font-semibold text-foreground">Provider Dashboard</h2>
                      <p className="text-muted-foreground text-sm mt-0.5">Manage clients, protocols & analytics</p>
                      <p className="text-gold text-xs mt-1 font-mono">{user?.name || "Provider"}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              <Link href="/patient">
                <div className="group bg-white/90 backdrop-blur-md border border-border rounded-2xl p-6 cursor-pointer hover:border-gold/30 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                      <Heart className="w-7 h-7 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-heading text-lg font-semibold text-foreground">Patient Portal</h2>
                      <p className="text-muted-foreground text-sm mt-0.5">View protocols, messages & schedule</p>
                      <p className="text-gold text-xs mt-1 font-mono">Preview as patient</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-muted-foreground/60 text-xs mt-10 text-center font-mono"
            >
              Signed in as {user?.name || user?.email || "admin"}
            </motion.p>
          </div>
        )}
      </div>
    </div>
  );
}
