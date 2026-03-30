/*
 * Messages Page — Conversation list + chat view with real tRPC data
 * Design: Warm Command Center — Scandinavian Functionalism
 * Mobile: list/detail pattern (show conversations OR chat, not both)
 * Desktop: side-by-side layout
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearch } from "wouter";
import { Search, Send, Paperclip, MoreVertical, MessageSquare, ChevronLeft, FileText, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function Messages() {
  const { user } = useAuth();
  const searchParams = useSearch();
  const initialPatientId = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    const p = params.get("patient");
    return p ? parseInt(p) : null;
  }, []);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(initialPatientId);
  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [showNewConv, setShowNewConv] = useState(false);
  const [newConvPatientId, setNewConvPatientId] = useState("");
  const [newConvMessage, setNewConvMessage] = useState("");
  // Mobile: track whether we're viewing the chat (true) or the list (false)
  const [mobileShowChat, setMobileShowChat] = useState(!!initialPatientId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // tRPC
  const utils = trpc.useUtils();
  const { data: conversations = [], isLoading: convLoading } = trpc.message.conversations.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const { data: patients = [] } = trpc.patient.list.useQuery();
  const { data: chatMessages = [], isLoading: msgLoading } = trpc.message.listForPatient.useQuery(
    { patientId: selectedPatientId! },
    { enabled: !!selectedPatientId, refetchInterval: 30000 }
  );

  const sendMutation = trpc.message.send.useMutation({
    onSuccess: () => {
      utils.message.listForPatient.invalidate({ patientId: selectedPatientId! });
      utils.message.conversations.invalidate();
      setNewMessage("");
    },
    onError: (e) => toast.error(e.message),
  });

  const markReadMutation = trpc.message.markRead.useMutation({
    onSuccess: () => utils.message.conversations.invalidate(),
  });

  const deleteAttachmentMutation = trpc.message.deleteAttachment.useMutation({
    onSuccess: () => {
      utils.message.listForPatient.invalidate({ patientId: selectedPatientId! });
      utils.message.conversations.invalidate();
      toast.success("Attachment deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  // Select a conversation (works for both mobile and desktop)
  const selectConversation = useCallback((patientId: number) => {
    setSelectedPatientId(patientId);
    setMobileShowChat(true);
  }, []);

  // Go back to conversation list (mobile only)
  const goBackToList = useCallback(() => {
    setMobileShowChat(false);
  }, []);

  // Auto-select from URL param or first conversation (desktop only)
  useEffect(() => {
    if (initialPatientId && conversations.length > 0) {
      const found = conversations.find((c: any) => c.patient.id === initialPatientId);
      if (found) {
        if (selectedPatientId !== initialPatientId) {
          setSelectedPatientId(initialPatientId);
          setMobileShowChat(true);
        }
      } else {
        // Patient has no existing conversation — open new conversation dialog pre-filled
        setNewConvPatientId(initialPatientId.toString());
        setShowNewConv(true);
      }
    } else if (initialPatientId && conversations.length === 0 && !convLoading) {
      // No conversations loaded yet but we have a patient param — open new conversation
      setNewConvPatientId(initialPatientId.toString());
      setShowNewConv(true);
    } else if (!selectedPatientId && conversations.length > 0) {
      setSelectedPatientId(conversations[0].patient.id);
    }
  }, [conversations, selectedPatientId, initialPatientId, convLoading]);

  // Mark messages as read when selecting a conversation
  useEffect(() => {
    if (selectedPatientId) {
      markReadMutation.mutate({ patientId: selectedPatientId });
    }
  }, [selectedPatientId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const filtered = useMemo(() => {
    return conversations.filter((c: any) => {
      const name = `${c.patient.firstName} ${c.patient.lastName}`.toLowerCase();
      return name.includes(search.toLowerCase());
    });
  }, [conversations, search]);

  const selectedConv = conversations.find((c: any) => c.patient.id === selectedPatientId);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedPatientId || !selectedConv) return;
    const patient = selectedConv.patient;
    sendMutation.mutate({
      receiverId: patient.userId || patient.id,
      patientId: selectedPatientId,
      content: newMessage.trim(),
      origin: window.location.origin,
    });
  };

  const handleStartNewConversation = () => {
    if (!newConvPatientId || !newConvMessage.trim()) return;
    const patientId = parseInt(newConvPatientId);
    const patient = patients.find((p: any) => p.id === patientId);
    if (!patient) return;
    sendMutation.mutate({
      receiverId: patient.userId || patient.id,
      patientId,
      content: newConvMessage.trim(),
      origin: window.location.origin,
    }, {
      onSuccess: () => {
        setSelectedPatientId(patientId);
        setMobileShowChat(true);
        setShowNewConv(false);
        setNewConvPatientId("");
        setNewConvMessage("");
        toast.success("Message sent");
      },
    });
  };

  const [uploading, setUploading] = useState(false);

  const handleAttach = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File must be under 10MB");
        return;
      }
      setUploading(true);
      try {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await fetch("/api/upload/attachment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            fileData: base64Data,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Upload failed" }));
          throw new Error(err.error || "Upload failed");
        }
        const { url, fileName } = await res.json();
        if (selectedPatientId && selectedConv) {
          sendMutation.mutate({
            receiverId: selectedConv.patient.userId || selectedConv.patient.id,
            patientId: selectedPatientId,
            content: `📎 [${fileName}](${url})`,
            origin: window.location.origin,
          });
        }
        toast.success("File sent");
      } catch (err: any) {
        toast.error(err.message || "Failed to upload file");
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const formatTime = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatMessageTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  // Patients not yet in conversations (for new conversation dialog)
  const patientsWithoutConv = patients.filter((p: any) =>
    !conversations.some((c: any) => c.patient.id === p.id)
  );

  // ─── Loading state ───
  if (convLoading) {
    return (
      <div className="flex h-full">
        <div className="w-full md:w-[340px] border-r border-border p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="h-9 bg-muted rounded" />
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded" />)}
          </div>
        </div>
        <div className="hidden md:flex flex-1 items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading conversations...</p>
        </div>
      </div>
    );
  }

  // ─── Conversation List Panel ───
  const ConversationList = (
    <div className={`
      ${mobileShowChat ? "hidden" : "flex"} md:flex
      w-full md:w-[340px] md:min-w-[340px]
      border-r border-border flex-col bg-card h-full
    `}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-heading font-bold text-lg text-foreground">Messages</h1>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowNewConv(true)}>
            <MessageSquare className="h-3 w-3" /> New
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-0 h-9 text-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="py-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? "No conversations match your search" : "No conversations yet"}
              </p>
              {!search && (
                <Button variant="outline" size="sm" className="mt-3 h-7 text-xs" onClick={() => setShowNewConv(true)}>
                  Start a Conversation
                </Button>
              )}
            </div>
          ) : (
            filtered.map((conv: any) => (
              <button
                key={conv.patient.id}
                onClick={() => selectConversation(conv.patient.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                  selectedPatientId === conv.patient.id ? "bg-gold/8" : "hover:bg-muted/50"
                }`}
              >
                <div className="relative shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-sm font-semibold font-heading text-gold">
                    {getInitials(conv.patient.firstName, conv.patient.lastName)}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                      {conv.patient.firstName} {conv.patient.lastName}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {formatTime(conv.lastMessage.createdAt)}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 line-clamp-1 ${conv.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                    {conv.lastMessage.senderId === user?.id ? "You: " : ""}
                    {conv.lastMessage.content}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // ─── Chat Panel ───
  const ChatPanel = selectedPatientId && selectedConv ? (
    <div className={`
      ${mobileShowChat ? "flex" : "hidden"} md:flex
      flex-1 flex-col h-full
    `}>
      {/* Chat header */}
      <div className="flex items-center justify-between px-3 md:px-6 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {/* Back button — mobile only */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 md:hidden"
            onClick={goBackToList}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-sm font-semibold font-heading text-gold shrink-0">
            {getInitials(selectedConv.patient.firstName, selectedConv.patient.lastName)}
          </div>
          <div className="min-w-0">
            <h2 className="font-heading font-semibold text-sm text-foreground truncate">
              {selectedConv.patient.firstName} {selectedConv.patient.lastName}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {selectedConv.patient.status === "active" ? "Active Patient" : selectedConv.patient.status}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => window.location.href = `/provider/clients`}>
              View Client Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = `/provider/schedule`}>
              Schedule Appointment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              markReadMutation.mutate({ patientId: selectedPatientId });
              toast.success("Marked all as read");
            }}>
              Mark All as Read
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4">
        <div className="space-y-3 md:space-y-4 max-w-2xl mx-auto">
          {msgLoading ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          ) : chatMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Send the first message to start the conversation</p>
            </div>
          ) : (
            chatMessages.map((msg: any) => {
              const isProvider = msg.senderId === user?.id;
              const attachMatch = msg.content.match(/^📎 \[(.*?)\]\((.*?)\)$/);
              const attachName = attachMatch?.[1] || "";
              const attachUrl = attachMatch?.[2] || "";
              const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
              const isImage = attachMatch ? imageExts.some(ext => attachName.toLowerCase().endsWith(ext)) : false;
              return (
                <div key={msg.id} className={`flex ${isProvider ? "justify-end" : "justify-start"} group/msg`}>
                  <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl overflow-hidden relative ${
                    isProvider ? "bg-gold text-white rounded-br-md" : "bg-muted/70 text-foreground rounded-bl-md"
                  } ${isImage && attachMatch ? "p-1" : "px-3 py-2 md:px-4 md:py-2.5"}`}>
                    {/* Delete button for sender's attachments */}
                    {attachMatch && isProvider && (
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
                    {attachMatch ? (
                      isImage ? (
                        <div>
                          <a href={attachUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={attachUrl}
                              alt={attachName}
                              className="rounded-xl max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              loading="lazy"
                            />
                          </a>
                          <p className={`text-xs mt-1.5 px-2 pb-1 truncate ${isProvider ? "text-white/70" : "text-muted-foreground"}`}>
                            {attachName}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <a
                            href={attachUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 group flex-1 min-w-0 ${isProvider ? "text-white" : "text-foreground"}`}
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isProvider ? "bg-white/15" : "bg-gold/10"
                            }`}>
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate group-hover:underline">{attachName}</p>
                              <p className={`text-[10px] ${isProvider ? "text-white/60" : "text-muted-foreground"}`}>Tap to download</p>
                            </div>
                          </a>
                        </div>
                      )
                    ) : (
                      msg.content === "[Attachment deleted]" ? (
                        <p className="text-sm leading-relaxed italic opacity-60">Attachment deleted</p>
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )
                    )}
                    <p className={`text-[10px] mt-1 ${isImage && attachMatch ? "px-2 pb-1" : ""} ${isProvider ? "text-white/60" : "text-muted-foreground"}`}>
                      {formatMessageTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <div className="border-t border-border bg-card p-3 md:p-4 shrink-0">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={handleAttach} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" /> : <Paperclip className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            className="flex-1 bg-muted/50 border-0 h-9 text-sm"
          />
          <Button
            size="icon"
            className="h-9 w-9 bg-gold hover:bg-gold-light text-black shrink-0"
            onClick={handleSend}
            disabled={sendMutation.isPending || !newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  ) : (
    // No conversation selected — desktop empty state
    <div className={`
      ${mobileShowChat ? "flex" : "hidden"} md:flex
      flex-1 items-center justify-center
    `}>
      <div className="text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Select a conversation or start a new one</p>
        <Button variant="outline" size="sm" className="mt-4 h-8 text-xs gap-1.5" onClick={() => setShowNewConv(true)}>
          <MessageSquare className="h-3.5 w-3.5" /> New Conversation
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {ConversationList}
      {ChatPanel}

      {/* New Conversation Dialog */}
      <Dialog open={showNewConv} onOpenChange={setShowNewConv}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">New Conversation</DialogTitle>
            <DialogDescription>Send a message to a client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Client</Label>
              <Select value={newConvPatientId} onValueChange={setNewConvPatientId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a client..." /></SelectTrigger>
                <SelectContent>
                  {patients.map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.firstName} {p.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Message</Label>
              <Input
                value={newConvMessage}
                onChange={(e) => setNewConvMessage(e.target.value)}
                placeholder="Type your message..."
                className="mt-1"
                onKeyDown={(e) => e.key === "Enter" && handleStartNewConversation()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewConv(false)}>Cancel</Button>
            <Button className="bg-gold hover:bg-gold-light text-black" onClick={handleStartNewConversation} disabled={sendMutation.isPending}>
              {sendMutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
