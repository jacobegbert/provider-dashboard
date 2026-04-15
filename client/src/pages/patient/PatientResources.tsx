/**
 * PatientResources — Patient view of shared educational content
 * Design: Warm Scandinavian — sage green, terracotta, stone palette
 */
import { useState } from "react";
import {
  FileText,
  Link2,
  BookOpen,
  Activity,
  Search,
  Filter,
  Download,
  ExternalLink,
  Eye,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Streamdown } from "streamdown";
import { useViewAs } from "@/contexts/ViewAsContext";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "nutrition", label: "Nutrition" },
  { value: "exercise", label: "Exercise" },
  { value: "supplement", label: "Supplements" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "hormone", label: "Hormones" },
  { value: "peptides", label: "Peptides" },
  { value: "lab_education", label: "Lab Education" },
  { value: "recovery", label: "Recovery" },
  { value: "mental_health", label: "Mental Health" },
] as const;

type ResourceType = "file" | "link" | "article";

const TYPE_ICONS: Record<ResourceType, typeof FileText> = {
  file: FileText,
  link: Link2,
  article: BookOpen,
};

function getCategoryColor(cat: string) {
  const map: Record<string, string> = {
    nutrition: "bg-green-100 text-green-800 border-green-200",
    exercise: "bg-teal-100 text-teal-800 border-teal-200",
    supplement: "bg-purple-100 text-purple-800 border-purple-200",
    lifestyle: "bg-amber-100 text-amber-800 border-amber-200",
    hormone: "bg-rose-100 text-rose-800 border-rose-200",
    lab_education: "bg-cyan-100 text-cyan-800 border-cyan-200",
    recovery: "bg-teal-100 text-teal-800 border-teal-200",
    mental_health: "bg-indigo-100 text-indigo-800 border-indigo-200",
    general: "bg-muted text-foreground border-border",
  };
  return map[cat] || map.general;
}

function formatFileSize(bytes: number | null | undefined) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PatientResources() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showArticle, setShowArticle] = useState<any>(null);

  // Get patient record
  const { viewAsPatientId } = useViewAs();
  const myRecordQuery = trpc.patient.myRecord.useQuery(
    viewAsPatientId ? { viewAs: viewAsPatientId } : undefined
  );
  const myRecord = myRecordQuery.data;
  const patientId = myRecord?.id;

  // Get shared resources
  const resourcesQuery = trpc.resource.listForPatient.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );
  const sharedResources = resourcesQuery.data || [];

  // Mark as viewed
  const markViewedMutation = trpc.resource.markViewed.useMutation({
    onSuccess: () => {
      resourcesQuery.refetch();
    },
  });

  function handleOpen(item: any) {
    const resource = item.resource;
    const share = item.share;

    // Mark as viewed if not already
    if (!share.isViewed) {
      markViewedMutation.mutate({ shareId: share.id });
    }

    if (resource.type === "file" && resource.fileUrl) {
      window.open(resource.fileUrl, "_blank");
    } else if (resource.type === "link" && resource.externalUrl) {
      window.open(resource.externalUrl, "_blank");
    } else if (resource.type === "article") {
      setShowArticle(item);
    }
  }

  // Filtering
  const filtered = sharedResources.filter((item: any) => {
    const r = item.resource;
    if (filterCategory !== "all" && r.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = r.title?.toLowerCase().includes(q);
      const matchDesc = r.description?.toLowerCase().includes(q);
      const matchTags = r.tags?.some((t: string) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  const unviewedCount = sharedResources.filter((item: any) => !item.share.isViewed).length;

  if (!patientId && !myRecordQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-heading font-medium text-foreground mb-2">Resources</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your provider hasn't shared any resources with you yet. Check back later.
        </p>
      </div>
    );
  }

  if (myRecordQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-semibold text-foreground">Resources</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Educational content shared by your provider
          {unviewedCount > 0 && (
            <Badge className="ml-2 bg-red-500 text-white text-[10px]">{unviewedCount} new</Badge>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resource List */}
      {filtered.length === 0 ? (
        <Card className="bg-card/50 border-dashed">
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-heading font-medium text-foreground mb-2">
              {sharedResources.length === 0 ? "No resources shared yet" : "No matching resources"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {sharedResources.length === 0
                ? "Your provider will share educational content with you here."
                : "Try adjusting your search or filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item: any) => {
            const resource = item.resource;
            const share = item.share;
            const TypeIcon = TYPE_ICONS[resource.type as ResourceType] || FileText;
            const isNew = !share.isViewed;

            return (
              <Card
                key={share.id}
                className={`bg-card/80 hover:bg-card transition-colors cursor-pointer ${
                  isNew ? "border-l-4 border-l-sage" : ""
                }`}
                onClick={() => handleOpen(item)}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div
                      className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg ${
                        isNew ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <TypeIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-heading font-medium text-foreground text-sm sm:text-base leading-tight">
                            {resource.title}
                            {isNew && (
                              <Badge className="ml-2 bg-gold/15 text-gold text-[10px] align-middle">New</Badge>
                            )}
                          </h3>
                          {resource.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                              {resource.description}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {resource.type === "file" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gold">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {resource.type === "link" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gold">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          {resource.type === "article" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gold">
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Provider message */}
                      {share.message && (
                        <div className="mt-2 p-2 rounded-md bg-gold/5 border border-gold/10">
                          <div className="flex items-start gap-1.5">
                            <MessageSquare className="h-3 w-3 text-gold mt-0.5 shrink-0" />
                            <p className="text-xs text-foreground/80 italic">{share.message}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] ${getCategoryColor(resource.category)}`}>
                          {CATEGORIES.find((c) => c.value === resource.category)?.label || resource.category}
                        </Badge>
                        {resource.fileSize && (
                          <span className="text-[10px] text-muted-foreground">{formatFileSize(resource.fileSize)}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          {share.isViewed ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-gold" /> Viewed
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" /> Shared {new Date(share.sharedAt).toLocaleDateString()}
                            </>
                          )}
                        </span>
                        {resource.tags?.slice(0, 2).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-[10px] bg-background">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Portal Guides ───────── */}
      <div className="space-y-3 pt-2">
        <h2 className="text-lg font-heading font-semibold text-foreground">Portal Guides</h2>
        <p className="text-sm text-muted-foreground">Step-by-step guides for using portal features.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/patient/protocol-guide">
            <Card className="bg-card/80 hover:bg-card transition-colors cursor-pointer border-border/50 h-full">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading font-medium text-foreground text-sm">Protocols & History Guide</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Learn how to complete your daily protocol steps, use Complete All, and review your completion history on the calendar.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/patient/biomarker-guide">
            <Card className="bg-card/80 hover:bg-card transition-colors cursor-pointer border-border/50 h-full">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading font-medium text-foreground text-sm">Biomarker Tracking Guide</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Learn how to set up custom biomarkers, log entries, and track your health metrics over time.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/patient/vo2max-guide">
            <Card className="bg-card/80 hover:bg-card transition-colors cursor-pointer border-border/50 h-full">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading font-medium text-foreground text-sm">Norwegian 4x4 &amp; VO2 Max Guide</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">The science-backed interval training method for improving VO2 Max — the strongest predictor of longevity and all-cause mortality.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* ── View Article Dialog ───────── */}
      <Dialog open={showArticle !== null} onOpenChange={(open) => { if (!open) setShowArticle(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{showArticle?.resource?.title}</DialogTitle>
            {showArticle?.resource?.description && (
              <DialogDescription>{showArticle.resource.description}</DialogDescription>
            )}
          </DialogHeader>
          {showArticle?.share?.message && (
            <div className="p-3 rounded-md bg-gold/5 border border-gold/10 mb-4">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gold mb-0.5">Note from your provider</p>
                  <p className="text-sm text-foreground/80">{showArticle.share.message}</p>
                </div>
              </div>
            </div>
          )}
          <div className="prose prose-sm max-w-none text-foreground">
            <Streamdown>{showArticle?.resource?.content || ""}</Streamdown>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
