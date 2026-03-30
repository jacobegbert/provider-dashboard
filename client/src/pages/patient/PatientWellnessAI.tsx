/**
 * Patient Wellness AI — Friendly AI wellness assistant for patients
 * Features: Chat interface with wellness-focused prompts, file upload for lab results
 * Design: Warm, approachable with sage/gold accents
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message, type ContentPart } from "@/components/AIChatBox";
import {
  Sparkles,
  Apple,
  Moon,
  Dumbbell,
  Heart,
  FlaskConical,
  HelpCircle,
} from "lucide-react";

const WELLNESS_TOPICS = [
  {
    icon: Apple,
    label: "Nutrition",
    prompt: "I'd like some guidance on nutrition. Can you help me understand what foods and eating patterns would best support my health goals? I'm looking for practical, easy-to-follow advice.",
    color: "text-green-600 bg-green-50",
  },
  {
    icon: Moon,
    label: "Sleep",
    prompt: "I've been having trouble with my sleep quality. Can you suggest some evidence-based strategies to improve my sleep? I'd like tips I can start implementing tonight.",
    color: "text-indigo-600 bg-indigo-50",
  },
  {
    icon: Dumbbell,
    label: "Exercise",
    prompt: "I want to optimize my exercise routine for my health goals. Can you help me understand what types of exercise would be most beneficial and how to structure my weekly routine?",
    color: "text-orange-600 bg-orange-50",
  },
  {
    icon: Heart,
    label: "Stress Management",
    prompt: "I've been feeling stressed lately and it's affecting my health. Can you share some practical stress management techniques that align with a functional medicine approach?",
    color: "text-rose-600 bg-rose-50",
  },
  {
    icon: FlaskConical,
    label: "Understanding My Labs",
    prompt: "I recently got lab results and I'd like help understanding what the numbers mean. Can you explain common lab markers in simple terms and what optimal ranges look like?",
    color: "text-gold bg-gold/10",
  },
  {
    icon: HelpCircle,
    label: "Prepare for My Visit",
    prompt: "I have an upcoming appointment with Dr. Egbert. Can you help me prepare? I'd like to organize my questions, symptoms, and updates to make the most of our time together.",
    color: "text-gold bg-gold/10",
  },
];

export default function PatientWellnessAI() {
  const [messages, setMessages] = useState<Message[]>([]);

  const chatMutation = trpc.ai.patientChat.useMutation({
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
          content: `I'm sorry, I encountered an issue. Please try again or message Dr. Egbert's office directly for help.`,
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
    chatMutation.mutate({ messages: newMessages });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-gold/15 flex items-center justify-center border border-gold/20">
          <Sparkles className="h-5 w-5 text-gold" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-light text-foreground tracking-tight">
            Wellness Assistant
          </h1>
          <p className="text-xs text-muted-foreground font-mono tracking-wider">
            YOUR AI HEALTH COMPANION
          </p>
        </div>
      </div>

      {/* Topic cards — only show when no messages */}
      {messages.length === 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Choose a topic or ask me anything about your wellness journey — you can also upload images and documents
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {WELLNESS_TOPICS.map((topic) => (
              <button
                key={topic.label}
                onClick={() => handleSendMessage(topic.prompt)}
                disabled={chatMutation.isPending}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-gold/20 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${topic.color}`}>
                  <topic.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-foreground group-hover:text-gold transition-colors">
                  {topic.label}
                </p>
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
        placeholder="Ask about nutrition, sleep, exercise, or upload lab results..."
        height={messages.length === 0 ? "350px" : "550px"}
        emptyStateMessage="I'm here to help you on your wellness journey"
        suggestedPrompts={[
          "What should I eat before my morning workout?",
          "How can I improve my energy levels naturally?",
          "Explain my supplement protocol in simple terms",
        ]}
        enableFileUpload={true}
      />

      {/* Disclaimer */}
      <p className="text-[11px] text-muted-foreground/60 text-center font-mono">
        This AI assistant provides general wellness information. For medical concerns, please contact Dr. Egbert's office directly.
      </p>
    </div>
  );
}
