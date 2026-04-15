/**
 * Resources — Provider educational content library
 * Upload files, create articles, share links, and distribute to patients
 * Design: Warm Command Center — Scandinavian Functionalism
 */
import { useState, useRef } from "react";
import {
  FileText,
  Link2,
  BookOpen,
  Upload,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Share2,
  Trash2,
  Archive,
  Eye,
  Download,
  ExternalLink,
  Users,
  X,
  Check,
  Loader2,
  Edit3,
  Tag,
  Activity,
  ClipboardList,
  Heart,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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

const TYPE_LABELS: Record<ResourceType, string> = {
  file: "File",
  link: "Link",
  article: "Article",
};

function getCategoryColor(cat: string) {
  const map: Record<string, string> = {
    nutrition: "bg-green-100 text-green-800 border-green-200",
    exercise: "bg-primary/15 text-primary border-primary/20",
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

export default function Resources() {
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<ResourceType>("file");
  const [showShare, setShowShare] = useState<any>(null);
  const [showArticle, setShowArticle] = useState<any>(null);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // Create form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("general");
  const [formUrl, setFormUrl] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formTags, setFormTags] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Share state
  const [selectedPatients, setSelectedPatients] = useState<number[]>([]);
  const [shareMessage, setShareMessage] = useState("");

  // Queries
  const resourcesQuery = trpc.resource.list.useQuery();
  const allResources = resourcesQuery.data || [];
  const patientsQuery = trpc.patient.list.useQuery();
  const patients = patientsQuery.data || [];

  // Mutations
  const createMutation = trpc.resource.create.useMutation({
    onSuccess: () => {
      utils.resource.list.invalidate();
      setShowCreate(false);
      resetForm();
      toast.success("Resource created", { description: "Your resource has been added to the library." });
    },
  });

  const updateMutation = trpc.resource.update.useMutation({
    onSuccess: () => {
      utils.resource.list.invalidate();
      setShowEdit(null);
      toast.success("Resource updated");
    },
  });

  const deleteMutation = trpc.resource.delete.useMutation({
    onSuccess: () => {
      utils.resource.list.invalidate();
      toast.success("Resource deleted");
    },
  });

  const archiveMutation = trpc.resource.archive.useMutation({
    onSuccess: () => {
      utils.resource.list.invalidate();
      toast.success("Resource archived");
    },
  });

  const shareMutation = trpc.resource.share.useMutation({
    onSuccess: () => {
      utils.resource.list.invalidate();
      setShowShare(null);
      setSelectedPatients([]);
      setShareMessage("");
      toast.success("Resource shared", { description: "Selected patients can now view this resource." });
    },
  });

  function resetForm() {
    setFormTitle("");
    setFormDesc("");
    setFormCategory("general");
    setFormUrl("");
    setFormContent("");
    setFormTags("");
    setSelectedFile(null);
    setCreateType("file");
  }

  async function handleCreate() {
    if (!formTitle.trim()) return;

    if (createType === "file" && selectedFile) {
      setUploading(true);
      try {
        // Read file as base64
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        // Upload to S3
        const uploadRes = await fetch("/api/upload/attachment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            fileName: selectedFile.name,
            mimeType: selectedFile.type,
            fileData: base64,
          }),
        });

        if (!uploadRes.ok) throw new Error("Upload failed");
        const { url, key } = await uploadRes.json();

        await createMutation.mutateAsync({
          title: formTitle.trim(),
          description: formDesc.trim() || undefined,
          type: "file",
          category: formCategory as any,
          fileKey: key,
          fileUrl: url,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          fileSize: selectedFile.size,
          tags: formTags ? formTags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        });
      } catch (err: any) {
        toast.error("Upload failed", { description: err.message });
      } finally {
        setUploading(false);
      }
    } else if (createType === "link") {
      if (!formUrl.trim()) {
        toast.error("URL required");
        return;
      }
      await createMutation.mutateAsync({
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        type: "link",
        category: formCategory as any,
        externalUrl: formUrl.trim(),
        tags: formTags ? formTags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      });
    } else if (createType === "article") {
      if (!formContent.trim()) {
        toast.error("Article content required");
        return;
      }
      await createMutation.mutateAsync({
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        type: "article",
        category: formCategory as any,
        content: formContent.trim(),
        tags: formTags ? formTags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      });
    }
  }

  async function handleEdit() {
    if (!showEdit || !formTitle.trim()) return;
    await updateMutation.mutateAsync({
      id: showEdit.id,
      title: formTitle.trim(),
      description: formDesc.trim() || null,
      category: formCategory as any,
      externalUrl: showEdit.type === "link" ? formUrl.trim() || null : undefined,
      content: showEdit.type === "article" ? formContent.trim() || null : undefined,
      tags: formTags ? formTags.split(",").map((t) => t.trim()).filter(Boolean) : null,
    });
  }

  function openEdit(resource: any) {
    setFormTitle(resource.title);
    setFormDesc(resource.description || "");
    setFormCategory(resource.category);
    setFormUrl(resource.externalUrl || "");
    setFormContent(resource.content || "");
    setFormTags(resource.tags?.join(", ") || "");
    setShowEdit(resource);
  }

  // Filtering
  const filtered = allResources.filter((r: any) => {
    if (filterCategory !== "all" && r.category !== filterCategory) return false;
    if (filterType !== "all" && r.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = r.title?.toLowerCase().includes(q);
      const matchDesc = r.description?.toLowerCase().includes(q);
      const matchTags = r.tags?.some((t: string) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-foreground">Educational Resources</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload and share educational content with your patients
          </p>
        </div>
        <Button
          className="bg-gold hover:bg-gold-light text-black gap-1.5"
          onClick={() => {
            resetForm();
            setShowCreate(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Resource
        </Button>
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
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="file">Files</SelectItem>
            <SelectItem value="link">Links</SelectItem>
            <SelectItem value="article">Articles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-heading font-bold text-foreground">{allResources.length}</p>
            <p className="text-xs text-muted-foreground">Total Resources</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-heading font-bold text-foreground">
              {allResources.filter((r: any) => r.type === "file").length}
            </p>
            <p className="text-xs text-muted-foreground">Files</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-heading font-bold text-foreground">
              {allResources.filter((r: any) => r.type === "link").length}
            </p>
            <p className="text-xs text-muted-foreground">Links</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-heading font-bold text-foreground">
              {allResources.filter((r: any) => r.type === "article").length}
            </p>
            <p className="text-xs text-muted-foreground">Articles</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Patient Portal Guides ───────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground">Patient Portal Guides</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Built-in educational guides available in the patient portal</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/patient/vo2max-guide">
            <Card className="bg-card/80 hover:bg-card transition-colors cursor-pointer border-border/50 h-full group">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-medium text-foreground text-sm">Norwegian 4x4 & VO2 Max Guide</h3>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">The science-backed interval training method for improving VO2 Max — the strongest predictor of longevity and all-cause mortality.</p>
                    <Badge variant="outline" className="text-[10px] bg-primary/15 text-primary border-primary/20 mt-2">Exercise</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/patient/protocol-guide">
            <Card className="bg-card/80 hover:bg-card transition-colors cursor-pointer border-border/50 h-full group">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-medium text-foreground text-sm">Protocol Tracking Guide</h3>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">How to navigate assigned protocols, mark steps as complete, and track progress through your personalized care plan.</p>
                    <Badge variant="outline" className="text-[10px] bg-muted text-foreground border-border mt-2">General</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/patient/biomarker-guide">
            <Card className="bg-card/80 hover:bg-card transition-colors cursor-pointer border-border/50 h-full group">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-medium text-foreground text-sm">Biomarker Tracking Guide</h3>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Learn how to set up custom biomarkers, log entries, and track your health metrics over time.</p>
                    <Badge variant="outline" className="text-[10px] bg-cyan-100 text-cyan-800 border-cyan-200 mt-2">Lab Education</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Resource Grid */}
      {filtered.length === 0 ? (
        <Card className="bg-card/50 border-dashed">
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-heading font-medium text-foreground mb-2">
              {allResources.length === 0 ? "No resources yet" : "No matching resources"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {allResources.length === 0
                ? "Upload files, create articles, or share links to build your educational content library."
                : "Try adjusting your search or filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((resource: any) => {
            const TypeIcon = TYPE_ICONS[resource.type as ResourceType] || FileText;
            return (
              <Card key={resource.id} className="bg-card/80 hover:bg-card transition-colors group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading font-medium text-foreground text-sm leading-tight truncate">
                          {resource.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {TYPE_LABELS[resource.type as ResourceType]}
                          {resource.fileSize ? ` · ${formatFileSize(resource.fileSize)}` : ""}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setShowShare(resource)}>
                          <Share2 className="h-4 w-4 mr-2" /> Share with Patients
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(resource)}>
                          <Edit3 className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        {resource.type === "file" && resource.fileUrl && (
                          <DropdownMenuItem onClick={() => window.open(resource.fileUrl, "_blank")}>
                            <Download className="h-4 w-4 mr-2" /> Download
                          </DropdownMenuItem>
                        )}
                        {resource.type === "link" && resource.externalUrl && (
                          <DropdownMenuItem onClick={() => window.open(resource.externalUrl, "_blank")}>
                            <ExternalLink className="h-4 w-4 mr-2" /> Open Link
                          </DropdownMenuItem>
                        )}
                        {resource.type === "article" && (
                          <DropdownMenuItem onClick={() => setShowArticle(resource)}>
                            <Eye className="h-4 w-4 mr-2" /> View Article
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => archiveMutation.mutate({ id: resource.id })}>
                          <Archive className="h-4 w-4 mr-2" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm("Delete this resource? This will also remove it from all patients.")) {
                              deleteMutation.mutate({ id: resource.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {resource.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{resource.description}</p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] ${getCategoryColor(resource.category)}`}>
                      {CATEGORIES.find((c) => c.value === resource.category)?.label || resource.category}
                    </Badge>
                    {resource.tags?.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-[10px] bg-background">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-gold hover:text-gold"
                      onClick={() => setShowShare(resource)}
                    >
                      <Share2 className="h-3 w-3" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Create Resource Dialog ───────── */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setShowCreate(false); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Resource</DialogTitle>
            <DialogDescription>Upload a file, share a link, or write an article for your patients.</DialogDescription>
          </DialogHeader>

          {/* Type selector */}
          <div className="flex gap-2 mb-4">
            {(["file", "link", "article"] as ResourceType[]).map((type) => {
              const Icon = TYPE_ICONS[type];
              return (
                <Button
                  key={type}
                  variant={createType === type ? "default" : "outline"}
                  size="sm"
                  className={createType === type ? "bg-gold hover:bg-gold-light text-black" : ""}
                  onClick={() => setCreateType(type)}
                >
                  <Icon className="h-4 w-4 mr-1.5" />
                  {TYPE_LABELS[type]}
                </Button>
              );
            })}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Title</label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Resource title" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Brief description..."
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type-specific fields */}
            {createType === "file" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mp3,.wav"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-gold/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-5 w-5 text-gold" />
                      <span className="text-sm text-foreground">{selectedFile.name}</span>
                      <span className="text-xs text-muted-foreground">({formatFileSize(selectedFile.size)})</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">Click to select a file</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">PDF, DOC, images, audio, video</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {createType === "link" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">URL</label>
                <Input
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  type="url"
                />
              </div>
            )}

            {createType === "article" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Content</label>
                <Textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Write your article content here... (supports markdown)"
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                <Tag className="h-3.5 w-3.5 inline mr-1" />
                Tags
              </label>
              <Input
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                placeholder="e.g., testosterone, injection, guide (comma-separated)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>Cancel</Button>
            <Button
              className="bg-gold hover:bg-gold-light text-black gap-1.5"
              onClick={handleCreate}
              disabled={createMutation.isPending || uploading || !formTitle.trim()}
            >
              {(createMutation.isPending || uploading) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {uploading ? "Uploading..." : "Create Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Resource Dialog ───────── */}
      <Dialog open={showEdit !== null} onOpenChange={(open) => { if (!open) setShowEdit(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Resource</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Title</label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
              <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showEdit?.type === "link" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">URL</label>
                <Input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} type="url" />
              </div>
            )}
            {showEdit?.type === "article" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Content</label>
                <Textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={8} className="font-mono text-sm" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Tags</label>
              <Input value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="comma-separated" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(null)}>Cancel</Button>
            <Button
              className="bg-gold hover:bg-gold-light text-black"
              onClick={handleEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Share Resource Dialog ───────── */}
      <Dialog open={showShare !== null} onOpenChange={(open) => { if (!open) { setShowShare(null); setSelectedPatients([]); setShareMessage(""); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Share Resource</DialogTitle>
            <DialogDescription>
              Select patients to share "{showShare?.title}" with.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Select Patients</label>
              <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                {patients.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">No patients found</p>
                ) : (
                  patients.map((p: any) => {
                    const isSelected = selectedPatients.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                          isSelected ? "bg-gold/10" : "hover:bg-accent"
                        }`}
                        onClick={() => {
                          setSelectedPatients((prev) =>
                            isSelected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                          );
                        }}
                      >
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            isSelected ? "bg-gold border-gold text-white" : "border-border"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <span className="text-sm text-foreground">
                          {p.firstName} {p.lastName}
                        </span>
                        <Badge variant="outline" className="ml-auto text-[10px]">{p.status}</Badge>
                      </div>
                    );
                  })
                )}
              </div>
              {selectedPatients.length > 0 && (
                <p className="text-xs text-gold mt-1.5">{selectedPatients.length} patient(s) selected</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Message (optional)</label>
              <Textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                placeholder="Add a note for your patients..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowShare(null); setSelectedPatients([]); setShareMessage(""); }}>Cancel</Button>
            <Button
              className="bg-gold hover:bg-gold-light text-black gap-1.5"
              onClick={() => {
                if (showShare && selectedPatients.length > 0) {
                  shareMutation.mutate({
                    resourceId: showShare.id,
                    patientIds: selectedPatients,
                    message: shareMessage.trim() || undefined,
                  });
                }
              }}
              disabled={shareMutation.isPending || selectedPatients.length === 0}
            >
              {shareMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              Share with {selectedPatients.length} Patient{selectedPatients.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Article Dialog ───────── */}
      <Dialog open={showArticle !== null} onOpenChange={(open) => { if (!open) setShowArticle(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{showArticle?.title}</DialogTitle>
            {showArticle?.description && (
              <DialogDescription>{showArticle.description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
            {showArticle?.content}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
