/*
 * PatientDocuments — Patient portal view of their documents + upload
 * Design: Warm Scandinavian — sage green, terracotta, stone palette
 */
import { useState, useMemo, useRef } from "react";
import {
  FileText, Download, Search, Filter, Loader2,
  File, Image, FileSpreadsheet, Upload, X, Plus, Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useViewAs } from "@/contexts/ViewAsContext";

const categoryLabels: Record<string, string> = {
  lab_results: "Lab Results",
  treatment_plan: "Treatment Plan",
  intake_form: "Intake Form",
  consent: "Consent",
  imaging: "Imaging",
  prescription: "Prescription",
  notes: "Notes",
  other: "Other",
};

const categoryColors: Record<string, string> = {
  lab_results: "bg-primary/10 text-primary border-primary/20",
  treatment_plan: "bg-gold/10 text-gold border-gold/15",
  intake_form: "bg-amber-50 text-amber-700 border-amber-200",
  consent: "bg-purple-50 text-purple-700 border-purple-200",
  imaging: "bg-pink-50 text-pink-700 border-pink-200",
  prescription: "bg-red-50 text-red-700 border-red-200",
  notes: "bg-muted text-muted-foreground border-border",
  other: "bg-muted text-muted-foreground border-border",
};

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.includes("spreadsheet") || mimeType.includes("csv") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("pdf")) return FileText;
  return File;
}

export default function PatientDocuments() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("other");
  const [uploadDescription, setUploadDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const utils = trpc.useUtils();
  const { viewAsPatientId } = useViewAs();
  const myRecordQuery = trpc.patient.myRecord.useQuery(
    viewAsPatientId ? { viewAs: viewAsPatientId } : undefined
  );
  const patientId = myRecordQuery.data?.id;
  const documentsQuery = trpc.document.listForPatient.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );
  const documents = documentsQuery.data ?? [];

  const deleteMutation = trpc.document.deleteOwn.useMutation({
    onSuccess: () => {
      toast.success("Document deleted");
      if (patientId) utils.document.listForPatient.invalidate({ patientId });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete document");
      setDeleteTarget(null);
    },
  });

  const filtered = useMemo(() => {
    return documents.filter((doc: any) => {
      const matchesSearch = doc.fileName.toLowerCase().includes(search.toLowerCase()) ||
        (doc.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [documents, search, categoryFilter]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Unsupported file type. Please upload images, PDFs, or Word documents.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 16MB.");
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !patientId) return;
    setUploading(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // Remove data:... prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          fileSize: selectedFile.size,
          patientId,
          category: uploadCategory,
          description: uploadDescription || undefined,
          fileData: base64,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }

      toast.success("Document uploaded successfully");
      setUploadOpen(false);
      setSelectedFile(null);
      setUploadCategory("other");
      setUploadDescription("");
      documentsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadCategory("other");
    setUploadDescription("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">My Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View, download, and upload documents for your care team
          </p>
        </div>
        <Button
          onClick={() => { resetUpload(); setUploadOpen(true); }}
          className="bg-gold hover:bg-gold-light text-black gap-2"
          size="sm"
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-0 h-9 text-sm"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
            <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="lab_results">Lab Results</SelectItem>
            <SelectItem value="treatment_plan">Treatment Plans</SelectItem>
            <SelectItem value="intake_form">Intake Forms</SelectItem>
            <SelectItem value="consent">Consent</SelectItem>
            <SelectItem value="imaging">Imaging</SelectItem>
            <SelectItem value="prescription">Prescriptions</SelectItem>
            <SelectItem value="notes">Notes</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents list */}
      {documentsQuery.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((doc: any) => {
            const IconComponent = getFileIcon(doc.mimeType);
            return (
              <Card key={doc.id} className="border-border/60 shadow-sm hover:shadow-md transition-all group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                      <IconComponent className="h-5 w-5 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold text-foreground truncate">{doc.fileName}</h3>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${categoryColors[doc.category] || ""}`}>
                          {categoryLabels[doc.category] || doc.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>·</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{doc.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                      {doc.uploadedBy === myRecordQuery.data?.userId && (
                        <button
                          onClick={() => setDeleteTarget({ id: doc.id, name: doc.fileName })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground mb-1">No documents yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {documents.length === 0
              ? "Upload your lab results, imaging, or other documents for your care team to review."
              : "No documents match your search criteria."}
          </p>
          {documents.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { resetUpload(); setUploadOpen(true); }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Upload Your First Document
            </Button>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Upload Document</DialogTitle>
            <DialogDescription>
              Upload lab results, imaging, or other documents for your care team to review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* File picker */}
            <div>
              <Label className="text-sm font-medium mb-2 block">File</Label>
              {selectedFile ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    {(() => { const Icon = getFileIcon(selectedFile.type); return <Icon className="h-4 w-4 text-gold" />; })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="p-1 rounded-md hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-6 text-center cursor-pointer hover:border-gold/40 hover:bg-gold/5 transition-all"
                >
                  <Upload className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Click to select a file</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Images, PDFs, Word docs · Max 16MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Category */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Category</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lab_results">Lab Results</SelectItem>
                  <SelectItem value="imaging">Imaging</SelectItem>
                  <SelectItem value="intake_form">Intake Form</SelectItem>
                  <SelectItem value="prescription">Prescription</SelectItem>
                  <SelectItem value="notes">Notes</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Description (optional)</Label>
              <Textarea
                placeholder="Brief description of this document..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                className="resize-none h-20 text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setUploadOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="bg-gold hover:bg-gold-light text-black gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate({ id: deleteTarget.id })}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Deleting...</>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
