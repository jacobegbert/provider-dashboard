// InstallPrompt.tsx — PWA "Add to Home Screen" prompt
// Handles Android (beforeinstallprompt) and iOS (manual instructions)
import { useState, useEffect } from "react";
import { X, Share, PlusSquare, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "blm-install-dismissed";
const DISMISS_DAYS = 14; // Don't show again for 14 days after dismissal

function isDismissed(): boolean {
  const val = localStorage.getItem(DISMISS_KEY);
  if (!val) return false;
  const dismissedAt = parseInt(val, 10);
  if (isNaN(dismissedAt)) return false;
  return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already installed or recently dismissed
    if (isStandalone() || isDismissed()) return;

    // Android / Chrome: capture the install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: show manual instructions after a short delay
    if (isIOS()) {
      const timer = setTimeout(() => {
        setShowIOSPrompt(true);
        setVisible(true);
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setVisible(false);
    setDeferredPrompt(null);
    setShowIOSPrompt(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  // iOS prompt — manual instructions
  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-20 left-3 right-3 z-[60] animate-in slide-in-from-bottom-4 duration-500 md:left-auto md:right-4 md:max-w-sm">
        <div className="bg-card border border-border/60 rounded-lg shadow-xl p-4 relative">
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted/50 text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <div className="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center shrink-0">
              <span
                className="text-[10px] font-bold text-gold"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                BL
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Add to Home Screen
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Install Black Label Medicine for quick access and a full-screen experience.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-flex">1.</span> Tap
                <Share className="w-3.5 h-3.5 text-foreground inline" strokeWidth={1.6} />
                <span className="font-medium text-foreground">Share</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
              <span className="flex items-center gap-1.5">
                <span className="inline-flex">2.</span> Scroll down, tap
                <PlusSquare className="w-3.5 h-3.5 text-foreground inline" strokeWidth={1.6} />
                <span className="font-medium text-foreground">Add to Home Screen</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android / Chrome — programmatic install
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-20 left-3 right-3 z-[60] animate-in slide-in-from-bottom-4 duration-500 md:left-auto md:right-4 md:max-w-sm">
        <div className="bg-card border border-border/60 rounded-lg shadow-xl p-4 relative">
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted/50 text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <div className="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center shrink-0">
              <span
                className="text-[10px] font-bold text-gold"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                BL
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Install Black Label Medicine
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Add to your home screen for quick access and a full-screen experience.
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-foreground text-background text-sm font-medium tracking-wide transition-colors hover:bg-foreground/90"
            >
              <Download className="w-4 h-4" strokeWidth={1.6} />
              Install App
            </button>
            <button
              onClick={dismiss}
              className="px-4 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
