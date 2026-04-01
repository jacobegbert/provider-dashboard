// PatientMessages.tsx — Black Label Medicine Patient Messages
// Uses REAL tRPC data — determines sender by comparing senderId to current user
// Supports file/image attachments via /api/upload/attachment
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Send, Loader2, MessageCircle, Paperclip, X, FileText, Image as ImageIcon, Download, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useViewAs } from "@/contexts/ViewAsContext";

/** Detect if a message is an attachment (markdown link with 📎 prefix) */
function parseAttachment(content: string): { isAttachment: boolean; fileName: string; url: string; isImage: boolean } | null {
  const match = content.match(/^📎 \[(.*?)\]\((.*?)\)$/);
  if (!match) return null;
  const fileName = match[1];
  const url = match[2];
  const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const isImage = imageExts.some(ext => fileName.toLowerCase().endsWith(ext));
  return { isAttachment: true, fileName, url, isImage };
}

export default function PatientMessages() {
  const { user } = useAuth();
  const { viewAsPatientId } = useViewAs();
  const myRecordQuery = trpc.patient.myRecord.useQuery(
    viewAsPatientId ? { viewAs: viewAsPatientId } : undefined
  );
  const myRecord = myRecordQuery.data;
  const patientId = myRecord?.id;

  const messagesQuery = trpc.message.listForPatient.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId, refetchInterval: 30000 }
  );

  const sendMutation = trpc.message.send.useMutation({
    onSuccess: () => {
      messagesQuery.refetch();
      setNewMessage("");
    },
  });

  const deleteAttachmentMutation = trpc.message.deleteAttachment.useMutation({
    onSuccess: () => {
      messagesQuery.refetch();
      toast.success("Attachment deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<{
    file: File;
    previewUrl: string | null;
    isImage: boolean;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messages = messagesQuery.data || [];
  const isLoading = myRecordQuery.isLoading || messagesQuery.isLoading;

  // The patient's provider userId — from the patient record's providerId
  const providerUserId = myRecord?.providerId;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!newMessage.trim() || !patientId || !providerUserId) return;
    sendMutation.mutate({
      patientId,
      receiverId: providerUserId,
      content: newMessage.trim(),
      origin: window.location.origin,
    });
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }

    // Validate type
    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Supported files: images (JPEG, PNG, GIF, WebP), PDF, DOC/DOCX");
      return;
    }

    const isImage = file.type.startsWith("image/");
    const previewUrl = isImage ? URL.createObjectURL(file) : null;
    setAttachmentPreview({ file, previewUrl, isImage });

    // Reset the file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearAttachment = () => {
    if (attachmentPreview?.previewUrl) {
      URL.revokeObjectURL(attachmentPreview.previewUrl);
    }
    setAttachmentPreview(null);
  };

  const handleSendAttachment = async () => {
    if (!attachmentPreview || !patientId || !providerUserId) return;

    setUploading(true);
    try {
      // Read file as base64
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data:...;base64, prefix
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(attachmentPreview.file);
      });

      // Upload to server
      const res = await fetch("/api/upload/attachment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fileName: attachmentPreview.file.name,
          mimeType: attachmentPreview.file.type,
          fileData: base64Data,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }

      const { url, fileName } = await res.json();

      // Send as a message with the file URL
      sendMutation.mutate({
        patientId,
        receiverId: providerUserId,
        content: `📎 [${fileName}](${url})`,
      });

      clearAttachment();
      toast.success("File sent");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: typeof messages }[] = [];
  let currentDate = "";
  for (const msg of messages) {
    const msgDate = new Date(msg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: currentDate, messages: [] });
    }
    groupedMessages[groupedMessages.length - 1].messages.push(msg);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!patientId) {
    return (
      <div className="flex items-center justify-center h-full py-32 px-6 text-center">
        <div>
          <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Your patient profile is being set up. Messaging will be available soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full md:h-screen">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Chat header */}
      <div className="px-5 md:px-8 py-3 md:py-4 border-b border-border flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gold/10 flex items-center justify-center border border-gold/15">
          <span className="text-gold text-sm md:text-base font-semibold">BL</span>
        </div>
        <div className="flex-1">
          <h2 className="font-heading text-sm md:text-base font-semibold text-foreground">Black Label Medicine</h2>
          <p className="text-[10px] md:text-xs text-gold font-medium">Your Care Team</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 md:px-8 py-4 space-y-5">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No messages yet. Send a message to start a conversation with your care team.</p>
            </div>
          ) : (
            groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] md:text-xs text-muted-foreground font-medium px-2">{group.date}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Messages in this date group */}
                <div className="space-y-3">
                  {group.messages.map((msg: any, idx: number) => {
                    const isFromMe = msg.senderId === user?.id;
                    const attachment = parseAttachment(msg.content);

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02, duration: 0.3 }}
                        className={`flex gap-2.5 md:gap-3 ${isFromMe ? "flex-row-reverse" : "flex-row"} group/msg`}
                      >
                        {/* Avatar — show for provider messages */}
                        {!isFromMe && (
                          <div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-1 border border-gold/15">
                            <span className="text-gold text-[10px] md:text-xs font-semibold">BL</span>
                          </div>
                        )}

                        {/* Bubble */}
                        <div className={`max-w-[80%] md:max-w-[65%] ${isFromMe ? "items-end" : "items-start"}`}>
                          <div
                            className={`rounded-2xl overflow-hidden relative ${
                              isFromMe
                                ? "bg-gold text-white rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            } ${attachment?.isImage ? "p-1" : "px-3.5 md:px-4 py-2.5 md:py-3"}`}
                          >
                            {/* Delete button for sender's attachments */}
                            {attachment && isFromMe && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Delete this attachment? This cannot be undone.")) {
                                    deleteAttachmentMutation.mutate({ messageId: msg.id });
                                  }
                                }}
                                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/50 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover/msg:opacity-100 transition-opacity"
                                title="Delete attachment"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-white" />
                              </button>
                            )}
                            {attachment ? (
                              attachment.isImage ? (
                                <div>
                                  <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={attachment.url}
                                      alt={attachment.fileName}
                                      className="rounded-xl max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                      loading="lazy"
                                    />
                                  </a>
                                  <p className={`text-xs mt-1.5 px-2 pb-1 truncate ${isFromMe ? "text-white/70" : "text-muted-foreground"}`}>
                                    {attachment.fileName}
                                  </p>
                                </div>
                              ) : (
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2.5 group ${isFromMe ? "text-white" : "text-foreground"}`}
                                >
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                    isFromMe ? "bg-white/15" : "bg-gold/10"
                                  }`}>
                                    <FileText className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate group-hover:underline">{attachment.fileName}</p>
                                    <p className={`text-[10px] ${isFromMe ? "text-white/60" : "text-muted-foreground"}`}>
                                      Tap to download
                                    </p>
                                  </div>
                                  <Download className={`h-4 w-4 shrink-0 ${isFromMe ? "text-white/60" : "text-muted-foreground"}`} />
                                </a>
                              )
                            ) : (
                              msg.content === "[Attachment deleted]" ? (
                                <p className="text-sm md:text-base leading-relaxed italic opacity-60">Attachment deleted</p>
                              ) : (
                                <p className="text-sm md:text-base leading-relaxed">{msg.content}</p>
                              )
                            )}
                          </div>
                          <p className={`text-[10px] md:text-xs text-muted-foreground mt-1 ${isFromMe ? "text-right" : "text-left"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Attachment preview bar */}
      {attachmentPreview && (
        <div className="px-4 md:px-8 py-2 border-t border-border bg-muted/30 shrink-0">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            {attachmentPreview.isImage && attachmentPreview.previewUrl ? (
              <img src={attachmentPreview.previewUrl} alt="Preview" className="h-14 w-14 rounded-lg object-cover" />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-gold/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-gold" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">{attachmentPreview.file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(attachmentPreview.file.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              onClick={clearAttachment}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center shrink-0"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Message input — on mobile, pad bottom to clear fixed nav */}
      <div className="px-4 md:px-8 py-3 md:py-4 pb-[calc(0.75rem+60px)] md:pb-4 border-t border-border bg-white shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-2 md:gap-3">
          {/* Attachment button */}
          <button
            onClick={handleFileSelect}
            disabled={uploading}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full hover:bg-muted flex items-center justify-center shrink-0 transition-colors disabled:opacity-50"
            title="Attach file or image"
          >
            <Paperclip className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (attachmentPreview ? handleSendAttachment() : handleSend())}
            placeholder={attachmentPreview ? "Add a caption (optional)..." : "Type a message..."}
            className="flex-1 bg-muted rounded-full px-4 md:px-5 py-2.5 md:py-3 text-sm md:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage/30"
          />

          <button
            onClick={attachmentPreview ? handleSendAttachment : handleSend}
            disabled={uploading || sendMutation.isPending || (!newMessage.trim() && !attachmentPreview)}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gold flex items-center justify-center hover:bg-gold-light transition-colors shrink-0 disabled:opacity-50"
          >
            {uploading || sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 md:w-5 md:h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
