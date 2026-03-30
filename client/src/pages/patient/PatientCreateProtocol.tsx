import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  GripVertical,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = [
  { value: "nutrition", label: "Nutrition" },
  { value: "supplement", label: "Supplement" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "exercise", label: "Exercise" },
  { value: "sleep", label: "Sleep" },
  { value: "stress", label: "Stress Management" },
  { value: "peptides", label: "Peptides" },
  { value: "hormone", label: "Hormone" },
  { value: "lab_work", label: "Lab Work" },
  { value: "other", label: "Other" },
];

const frequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
  { value: "once", label: "Once" },
  { value: "as_needed", label: "As Needed" },
  { value: "custom", label: "Custom Days" },
];

const timeOfDayOptions = [
  { value: "any", label: "Any Time" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

const dayOptions = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

interface StepForm {
  key: string;
  title: string;
  description: string;
  frequency: string;
  customDays: string[];
  timeOfDay: string;
  dosageAmount: string;
  dosageUnit: string;
  route: string;
}

function createEmptyStep(): StepForm {
  return {
    key: crypto.randomUUID(),
    title: "",
    description: "",
    frequency: "daily",
    customDays: [],
    timeOfDay: "any",
    dosageAmount: "",
    dosageUnit: "",
    route: "",
  };
}

export default function PatientCreateProtocol() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [durationDays, setDurationDays] = useState("");
  const [steps, setSteps] = useState<StepForm[]>([createEmptyStep()]);
  const [expandedStep, setExpandedStep] = useState<number>(0);

  const createMutation = trpc.protocol.patientCreate.useMutation({
    onSuccess: () => {
      toast.success("Protocol created successfully! Your provider will be able to review it.");
      utils.protocol.listMyCreated.invalidate();
      navigate("/patient/protocols");
    },
    onError: (err) => toast.error(err.message),
  });

  const addStep = () => {
    setSteps((prev) => [...prev, createEmptyStep()]);
    setExpandedStep(steps.length);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) {
      toast.error("Protocol must have at least one step");
      return;
    }
    setSteps((prev) => prev.filter((_, i) => i !== index));
    if (expandedStep >= steps.length - 1) {
      setExpandedStep(Math.max(0, steps.length - 2));
    }
  };

  const updateStep = (index: number, field: keyof StepForm, value: any) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const toggleCustomDay = (stepIndex: number, day: string) => {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i !== stepIndex) return s;
        const days = s.customDays.includes(day)
          ? s.customDays.filter((d) => d !== day)
          : [...s.customDays, day];
        return { ...s, customDays: days };
      })
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Please enter a protocol name");
      return;
    }

    const validSteps = steps.filter((s) => s.title.trim());
    if (validSteps.length === 0) {
      toast.error("Please add at least one step with a title");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      category: category as any,
      durationDays: durationDays ? parseInt(durationDays) : undefined,
      steps: validSteps.map((s) => ({
        title: s.title.trim(),
        description: s.description.trim() || undefined,
        frequency: s.frequency as any,
        customDays:
          s.frequency === "custom" && s.customDays.length > 0
            ? (s.customDays as any)
            : undefined,
        timeOfDay: (s.timeOfDay as any) || undefined,
        dosageAmount: s.dosageAmount.trim() || undefined,
        dosageUnit: s.dosageUnit.trim() || undefined,
        route: s.route.trim() || undefined,
      })),
    });
  };

  return (
    <div className="px-5 md:px-8 py-5 md:py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/patient/protocols")}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Create a Protocol
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Build your own health protocol. Your provider can review and edit it.
          </p>
        </div>
      </div>

      {/* Protocol Details */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4 mb-5">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Protocol Details
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Protocol Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g., Morning Wellness Routine"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Description
            </label>
            <Textarea
              placeholder="Describe what this protocol is for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Duration (days)
              </label>
              <Input
                type="number"
                placeholder="e.g., 30"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                min={1}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4 mb-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold text-foreground">
            Steps ({steps.length})
          </h2>
          <Button variant="outline" size="sm" onClick={addStep}>
            <Plus className="w-4 h-4 mr-1" /> Add Step
          </Button>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const isExpanded = expandedStep === index;
            return (
              <div
                key={step.key}
                className="border border-border rounded-lg overflow-hidden"
              >
                {/* Step header */}
                <button
                  onClick={() => setExpandedStep(isExpanded ? -1 : index)}
                  className="w-full flex items-center gap-2 p-3 text-left hover:bg-muted/30 transition-colors"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  <span className="text-xs font-semibold text-muted-foreground w-6 shrink-0">
                    {index + 1}.
                  </span>
                  <span className="flex-1 text-sm font-medium text-foreground truncate">
                    {step.title || "Untitled Step"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStep(index);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                  </Button>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Step details */}
                {isExpanded && (
                  <div className="p-3 pt-0 space-y-3 border-t border-border">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Step Title <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="e.g., Take Vitamin D3"
                        value={step.title}
                        onChange={(e) =>
                          updateStep(index, "title", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Description
                      </label>
                      <Textarea
                        placeholder="Additional details..."
                        value={step.description}
                        onChange={(e) =>
                          updateStep(index, "description", e.target.value)
                        }
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Frequency
                        </label>
                        <Select
                          value={step.frequency}
                          onValueChange={(v) =>
                            updateStep(index, "frequency", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {frequencies.map((f) => (
                              <SelectItem key={f.value} value={f.value}>
                                {f.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Time of Day
                        </label>
                        <Select
                          value={step.timeOfDay}
                          onValueChange={(v) =>
                            updateStep(index, "timeOfDay", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {timeOfDayOptions.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Custom days selector */}
                    {step.frequency === "custom" && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          Select Days
                        </label>
                        <div className="flex gap-1.5 flex-wrap">
                          {dayOptions.map((d) => (
                            <button
                              key={d.value}
                              onClick={() => toggleCustomDay(index, d.value)}
                              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                step.customDays.includes(d.value)
                                  ? "bg-gold text-white"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dosage fields */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Dosage
                        </label>
                        <Input
                          placeholder="e.g., 5000"
                          value={step.dosageAmount}
                          onChange={(e) =>
                            updateStep(index, "dosageAmount", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Unit
                        </label>
                        <Input
                          placeholder="e.g., IU"
                          value={step.dosageUnit}
                          onChange={(e) =>
                            updateStep(index, "dosageUnit", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Route
                        </label>
                        <Input
                          placeholder="e.g., oral"
                          value={step.route}
                          onChange={(e) =>
                            updateStep(index, "route", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => navigate("/patient/protocols")}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="bg-gold hover:bg-gold-light text-black"
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
            </>
          ) : (
            "Create Protocol"
          )}
        </Button>
      </div>
    </div>
  );
}
