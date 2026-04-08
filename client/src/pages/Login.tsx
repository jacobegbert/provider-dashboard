/**
 * Login — Email + password authentication page for Black Label Medicine.
 * When arriving from an invite link (?returnTo=/invite?token=xxx), shows
 * a signup/signin toggle so new patients can create an account.
 */
import { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, Mail, Eye, EyeOff, User } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();

  // Detect invite flow from returnTo param
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const returnTo = params.get("returnTo") ?? "/";
  const inviteToken = useMemo(() => {
    try {
      const url = new URL(returnTo, window.location.origin);
      return url.searchParams.get("token") || "";
    } catch {
      return "";
    }
  }, [returnTo]);
  const isInviteFlow = !!inviteToken;

  const [mode, setMode] = useState<"signin" | "signup">(isInviteFlow ? "signup" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectAfterAuth = () => {
    window.location.href = returnTo;
  };

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: redirectAfterAuth,
    onError: (err) => setError(err.message || "Invalid email or password"),
  });

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => {
      // Signup auto-links the invite + sets session cookie, go to patient portal
      window.location.href = "/patient";
    },
    onError: (err) => setError(err.message || "Failed to create account"),
  });

  const isPending = loginMutation.isPending || signupMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "signup") {
      signupMutation.mutate({
        name: name.trim(),
        email: email.trim(),
        password,
        inviteToken,
      });
    } else {
      loginMutation.mutate({ email: email.trim(), password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Black Label Medicine</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup" ? "Create your patient account" : "Sign in to your account"}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {mode === "signup" ? "Create Account" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {mode === "signup"
                ? "Set up your login to access the patient portal"
                : "Enter your credentials to continue"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9"
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={mode === "signup" ? "Create a password (min 6 chars)" : "••••••••"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    required
                    minLength={mode === "signup" ? 6 : undefined}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {error}
                </p>
              )}

              {mode === "signin" && (
                <div className="text-right">
                  <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">
                    Forgot password?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mode === "signup" ? "Creating account…" : "Signing in…"}
                  </>
                ) : mode === "signup" ? (
                  "Create Account"
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            {/* Toggle between signin / signup */}
            {isInviteFlow && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
                >
                  {mode === "signin"
                    ? "New patient? Create an account"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Black Label Medicine · Concierge Optimization
        </p>
      </div>
    </div>
  );
}
