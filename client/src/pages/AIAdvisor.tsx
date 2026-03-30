/**
 * AI Clinical Advisor — Provider's AI-powered clinical assistant
 * Features: Chat interface, quick-action prompts, patient context selector, file upload
 * Design: Premium editorial with gold accents
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message, type ContentPart } from "@/components/AIChatBox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  FlaskConical,
  FileText,
  Pill,
  Activity,
  Sparkles,
  User,
} from "lucide-react";

const QUICK_ACTIONS = [
  {
    icon: FlaskConical,
    label: "Lab Interpretation",
    prompt: "Help me interpret the following lab results for a patient. I'll provide the values — please analyze them through a functional medicine lens, noting optimal ranges (not just reference ranges), potential root causes for any out-of-range markers, and recommended follow-up tests.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: Pill,
    label: "Protocol Design",
    prompt: "Help me design a comprehensive protocol for a patient. I'll describe their condition, goals, and current status. Please suggest a phased approach including supplements, lifestyle modifications, dietary recommendations, and monitoring milestones.",
    color: "text-gold bg-gold/10",
  },
  {
    icon: FileText,
    label: "Progress Note",
    prompt: "Help me draft a clinical progress note for a patient visit. I'll provide the key findings and discussion points. Please format it as a structured SOAP note (Subjective, Objective, Assessment, Plan) appropriate for a concierge medicine practice.",
    color: "text-purple-600 bg-purple-50",
  },
  {
    icon: Activity,
    label: "Biomarker Analysis",
    prompt: "I'd like to analyze a set of biomarkers for optimization. I'll provide the patient's current values. Please evaluate them against optimal functional medicine ranges, identify patterns or correlations between markers, and suggest targeted interventions for optimization.",
    color: "text-red-400 bg-red-500/10",
  },
  {
    icon: Brain,
    label: "Differential Diagnosis",
    prompt: "Help me think through differential considerations for a complex case. I'll describe the patient's symptoms, history, and current findings. Please provide a structured differential with supporting and opposing evidence for each consideration, along with recommended workup.",
    color: "text-amber-600 bg-amber-50",
  },
  {
    icon: Sparkles,
    label: "Treatment Planning",
    prompt: "Help me create a treatment plan for a patient transitioning between protocol phases. I'll describe their current protocol, progress, and goals. Please suggest next steps, protocol adjustments, and timeline considerations.",
    color: "text-gold bg-gold/10",
  },
];

export default function AIAdvisor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("none");

  // Get patient list for context selector
  const patientsQuery = trpc.patient.list.useQuery();
  const patients = patientsQuery.data || [];

  const chatMutation = trpc.ai.providerChat.useMutation({
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.content },
      ]);
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I encountered an error: ${error.message}. Please try again.`,
        },
      ]);
    },
  });

  const handleSendMessage = (content: string | ContentPart[]) => {
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages(newMessages);

    chatMutation.mutate({
      messages: newMessages,
      patientId: selectedPatientId !== "none" ? parseInt(selectedPatientId) : undefined,
    });
  };

  const handleQuickAction = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const selectedPatient = useMemo(() => {
    if (selectedPatientId === "none") return null;
    return patients.find((p) => p.id === parseInt(selectedPatientId));
  }, [selectedPatientId, patients]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-gold/15 flex items-center justify-center border border-gold/20">
              <Brain className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-light text-foreground tracking-tight">
                Clinical Advisor
              </h1>
              <p className="text-xs text-muted-foreground font-mono tracking-wider">
                AI-POWERED CLINICAL ASSISTANT
              </p>
            </div>
          </div>
        </div>

        {/* Patient context selector */}
        <div className="flex items-center gap-3">
          {selectedPatient && (
            <Badge variant="outline" className="border-gold/30 text-gold-dark bg-gold/5 font-mono text-xs">
              <User className="h-3 w-3 mr-1" />
              {selectedPatient.firstName} {selectedPatient.lastName}
            </Badge>
          )}
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger className="w-[220px] text-sm">
              <SelectValue placeholder="Select patient context..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No patient context</SelectItem>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={String(patient.id)}>
                  {patient.firstName} {patient.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick actions — only show when no messages */}
      {messages.length === 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-3 font-heading">Quick Actions</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.prompt)}
                disabled={chatMutation.isPending}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-gold/30 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-gold-dark transition-colors">
                    {action.label}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat interface */}
      <AIChatBox
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={chatMutation.isPending}
        placeholder={
          selectedPatient
            ? `Ask about ${selectedPatient.firstName}'s care...`
            : "Ask a clinical question or attach lab results..."
        }
        height={messages.length === 0 ? "400px" : "600px"}
        emptyStateMessage="Ask me anything about clinical protocols, lab interpretation, or patient care — you can also upload images and PDFs"
        suggestedPrompts={[
          "What supplements support mitochondrial function?",
          "Optimal testosterone ranges for male optimization",
          "Design a gut healing protocol",
        ]}
        enableFileUpload={true}
      />

      {/* Disclaimer */}
      <p className="text-[11px] text-muted-foreground/60 text-center font-mono">
        AI-generated suggestions require clinical review. Not a substitute for professional medical judgment.
      </p>
    </div>
  );
}
