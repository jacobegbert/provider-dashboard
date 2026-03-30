import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Loader2, Send, User, Sparkles, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Streamdown } from "streamdown";

/**
 * Content part types for multimodal messages
 */
export type TextContentPart = { type: "text"; text: string };
export type ImageContentPart = { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } };
export type FileContentPart = { type: "file_url"; file_url: { url: string; mime_type?: string } };
export type ContentPart = TextContentPart | ImageContentPart | FileContentPart;

/**
 * Message type matching server-side LLM Message interface — supports multimodal content
 */
export type Message = {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
};

/**
 * Pending attachment before it's uploaded
 */
export type PendingAttachment = {
  file: File;
  previewUrl?: string; // data URL for image preview
  uploading: boolean;
};

export type AIChatBoxProps = {
  messages: Message[];
  onSendMessage: (content: string | ContentPart[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  height?: string | number;
  emptyStateMessage?: string;
  suggestedPrompts?: string[];
  /** Enable file upload (default: true) */
  enableFileUpload?: boolean;
};

/** Helper: extract display text from message content */
function getTextContent(content: string | ContentPart[]): string {
  if (typeof content === "string") return content;
  return content
    .filter((p): p is TextContentPart => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

/** Helper: extract image URLs from message content */
function getImageUrls(content: string | ContentPart[]): string[] {
  if (typeof content === "string") return [];
  return content
    .filter((p): p is ImageContentPart => p.type === "image_url")
    .map((p) => p.image_url.url);
}

/** Helper: extract file URLs from message content */
function getFileUrls(content: string | ContentPart[]): { url: string; mimeType?: string }[] {
  if (typeof content === "string") return [];
  return content
    .filter((p): p is FileContentPart => p.type === "file_url")
    .map((p) => ({ url: p.file_url.url, mimeType: p.file_url.mime_type }));
}

/** Get a display name from a URL */
function getFileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split("/");
    const last = parts[parts.length - 1];
    // Remove the random suffix pattern (e.g., -a1b2c3d4)
    return decodeURIComponent(last).replace(/-[a-f0-9]{8}\./i, ".");
  } catch {
    return "Document";
  }
}

const ACCEPTED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
].join(",");

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function AIChatBox({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Type your message...",
  className,
  height = "600px",
  emptyStateMessage = "Start a conversation with AI",
  suggestedPrompts,
  enableFileUpload = true,
}: AIChatBoxProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayMessages = messages.filter((msg) => msg.role !== "system");

  const [minHeightForLastMessage, setMinHeightForLastMessage] = useState(0);

  useEffect(() => {
    if (containerRef.current && inputAreaRef.current) {
      const containerHeight = containerRef.current.offsetHeight;
      const inputHeight = inputAreaRef.current.offsetHeight;
      const scrollAreaHeight = containerHeight - inputHeight;
      const userMessageReservedHeight = 56;
      const calculatedHeight = scrollAreaHeight - 32 - userMessageReservedHeight;
      setMinHeightForLastMessage(Math.max(0, calculatedHeight));
    }
  }, []);

  const scrollToBottom = () => {
    const viewport = scrollAreaRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]'
    ) as HTMLDivElement;
    if (viewport) {
      requestAnimationFrame(() => {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      });
    }
  };

  /** Upload a file to S3 via the attachment endpoint */
  const uploadFile = useCallback(async (file: File): Promise<{ url: string; mimeType: string } | null> => {
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // strip data:...;base64,
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;

      const res = await fetch("/api/upload/attachment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          fileData: base64,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      const data = await res.json();
      return { url: data.url, mimeType: file.type };
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" exceeds the 10MB limit.`);
        continue;
      }

      // Create preview for images
      let previewUrl: string | undefined;
      if (file.type.startsWith("image/")) {
        previewUrl = URL.createObjectURL(file);
      }

      setAttachments((prev) => [...prev, { file, previewUrl, uploading: false }]);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => {
      const att = prev[index];
      if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if ((!trimmedInput && attachments.length === 0) || isLoading || isUploading) return;

    if (attachments.length > 0) {
      // Upload all attachments first
      setIsUploading(true);
      setAttachments((prev) => prev.map((a) => ({ ...a, uploading: true })));

      const uploadResults: ContentPart[] = [];
      for (const att of attachments) {
        const result = await uploadFile(att.file);
        if (result) {
          if (result.mimeType.startsWith("image/")) {
            uploadResults.push({
              type: "image_url",
              image_url: { url: result.url, detail: "auto" },
            });
          } else {
            uploadResults.push({
              type: "file_url",
              file_url: { url: result.url, mime_type: result.mimeType },
            });
          }
        }
      }

      // Build multimodal content array
      const contentParts: ContentPart[] = [];
      if (trimmedInput) {
        contentParts.push({ type: "text", text: trimmedInput });
      }
      contentParts.push(...uploadResults);

      if (contentParts.length > 0) {
        onSendMessage(contentParts);
      }

      // Clean up
      attachments.forEach((a) => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
      setAttachments([]);
      setIsUploading(false);
    } else {
      onSendMessage(trimmedInput);
    }

    setInput("");
    scrollToBottom();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  /** Render message content — handles both string and multimodal */
  const renderMessageContent = (message: Message) => {
    const text = getTextContent(message.content);
    const images = getImageUrls(message.content);
    const files = getFileUrls(message.content);

    return (
      <>
        {/* Images */}
        {images.length > 0 && (
          <div className={cn("flex flex-wrap gap-2", text ? "mb-2" : "")}>
            {images.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={url}
                  alt="Uploaded image"
                  className="max-w-[240px] max-h-[200px] rounded-md object-cover border border-border/30 hover:opacity-90 transition-opacity"
                />
              </a>
            ))}
          </div>
        )}

        {/* Files */}
        {files.length > 0 && (
          <div className={cn("flex flex-col gap-1.5", text ? "mb-2" : "")}>
            {files.map((f, i) => (
              <a
                key={i}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors",
                  message.role === "user"
                    ? "bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background/60 hover:bg-background/80 text-foreground border border-border/30"
                )}
              >
                <FileText className="size-4 shrink-0" />
                <span className="truncate">{getFileNameFromUrl(f.url)}</span>
              </a>
            ))}
          </div>
        )}

        {/* Text */}
        {text && (
          message.role === "assistant" ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Streamdown>{text}</Streamdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm">{text}</p>
          )
        )}
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col bg-card text-card-foreground rounded-lg border shadow-sm",
        className
      )}
      style={{ height }}
    >
      {/* Messages Area */}
      <div ref={scrollAreaRef} className="flex-1 overflow-hidden">
        {displayMessages.length === 0 ? (
          <div className="flex h-full flex-col p-4">
            <div className="flex flex-1 flex-col items-center justify-center gap-6 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <Sparkles className="size-12 opacity-20" />
                <p className="text-sm">{emptyStateMessage}</p>
              </div>

              {suggestedPrompts && suggestedPrompts.length > 0 && (
                <div className="flex max-w-2xl flex-wrap justify-center gap-2">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => onSendMessage(prompt)}
                      disabled={isLoading}
                      className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col space-y-4 p-4">
              {displayMessages.map((message, index) => {
                const isLastMessage = index === displayMessages.length - 1;
                const shouldApplyMinHeight =
                  isLastMessage && !isLoading && minHeightForLastMessage > 0;

                return (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3",
                      message.role === "user"
                        ? "justify-end items-start"
                        : "justify-start items-start"
                    )}
                    style={
                      shouldApplyMinHeight
                        ? { minHeight: `${minHeightForLastMessage}px` }
                        : undefined
                    }
                  >
                    {message.role === "assistant" && (
                      <div className="size-8 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="size-4 text-primary" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2.5",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {renderMessageContent(message)}
                    </div>

                    {message.role === "user" && (
                      <div className="size-8 shrink-0 mt-1 rounded-full bg-secondary flex items-center justify-center">
                        <User className="size-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div
                  className="flex items-start gap-3"
                  style={
                    minHeightForLastMessage > 0
                      ? { minHeight: `${minHeightForLastMessage}px` }
                      : undefined
                  }
                >
                  <div className="size-8 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="size-4 text-primary" />
                  </div>
                  <div className="rounded-lg bg-muted px-4 py-2.5">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Attachment Preview Bar */}
      {attachments.length > 0 && (
        <div className="flex gap-2 px-4 pt-3 pb-1 border-t bg-background/30 flex-wrap">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="relative group flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs"
            >
              {att.previewUrl ? (
                <img src={att.previewUrl} alt="" className="size-8 rounded object-cover" />
              ) : (
                <FileText className="size-4 text-muted-foreground" />
              )}
              <span className="max-w-[120px] truncate text-muted-foreground">
                {att.file.name}
              </span>
              {att.uploading ? (
                <Loader2 className="size-3 animate-spin text-muted-foreground" />
              ) : (
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="ml-1 rounded-full p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form
        ref={inputAreaRef}
        onSubmit={handleSubmit}
        className="flex gap-2 p-4 border-t bg-background/50 items-end"
      >
        {enableFileUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              className="shrink-0 h-[38px] w-[38px] text-muted-foreground hover:text-foreground"
              title="Attach file or image"
            >
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Paperclip className="size-4" />
              )}
            </Button>
          </>
        )}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 max-h-32 resize-none min-h-9"
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          disabled={(!input.trim() && attachments.length === 0) || isLoading || isUploading}
          className="shrink-0 h-[38px] w-[38px]"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
