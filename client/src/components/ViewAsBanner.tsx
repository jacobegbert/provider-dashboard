/**
 * ViewAsBanner — shown at the top of the patient portal when an admin
 * is previewing as a specific patient. Provides a clear visual indicator
 * and a button to exit back to the provider dashboard.
 */
import { useViewAs } from "@/contexts/ViewAsContext";
import { Eye, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function ViewAsBanner() {
  const { isImpersonating } = useViewAs();
  const [, setLocation] = useLocation();

  if (!isImpersonating) return null;

  return (
    <div className="sticky top-0 z-50 bg-gold/90 text-white px-4 py-2 flex items-center justify-between backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Eye className="h-4 w-4" />
        <span>Provider Preview Mode — You are viewing this patient's portal</span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-white hover:bg-white/20 gap-1.5"
        onClick={() => setLocation("/provider/clients")}
      >
        <ArrowLeft className="h-3 w-3" />
        Close Preview
      </Button>
    </div>
  );
}
