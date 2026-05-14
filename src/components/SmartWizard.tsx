import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronRight, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface WizardField {
  key: string;
  label: string;
  type: "text" | "textarea" | "chips" | "date" | "number" | "select";
  placeholder?: string;
  required?: boolean;
  chips?: string[];                // for type="chips" — quick-select options
  options?: { value: string; label: string }[]; // for type="select"
  minLength?: number;
  hint?: string;
}

export interface WizardStep {
  title: string;
  subtitle: string;
  icon: string;           // emoji
  fields: WizardField[];
}

export interface SmartWizardProps {
  steps: WizardStep[];
  onComplete: (data: Record<string, string>) => void | Promise<void>;
  isLoading?: boolean;
  accentColor?: string;  // Tailwind bg class e.g. "bg-saffron"
  reviewTitle?: string;  // Title shown on the review step
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SmartWizard({
  steps,
  onComplete,
  isLoading = false,
  accentColor = "bg-saffron",
  reviewTitle = "Review & Generate",
}: SmartWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState<1 | -1>(1);

  const totalSteps = steps.length;
  const isReviewStep = currentStep === totalSteps;
  const progress = (currentStep / totalSteps) * 100;

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateStep = (stepIndex: number): boolean => {
    const step = steps[stepIndex];
    const newErrors: Record<string, string> = {};
    step.fields.forEach((field) => {
      const val = (data[field.key] || "").trim();
      if (field.required && !val) {
        newErrors[field.key] = `${field.label} is required.`;
      } else if (field.minLength && val.length < field.minLength) {
        newErrors[field.key] = `Please enter at least ${field.minLength} characters.`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Navigation ──────────────────────────────────────────────────────────────
  const goNext = () => {
    if (!validateStep(currentStep)) return;
    setDirection(1);
    setCurrentStep((s) => s + 1);
    setErrors({});
  };

  const goBack = () => {
    setDirection(-1);
    setCurrentStep((s) => s - 1);
    setErrors({});
  };

  const updateField = (key: string, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const toggleChip = (key: string, chip: string) => {
    const current = data[key] || "";
    const chips = current ? current.split(", ").filter(Boolean) : [];
    const idx = chips.indexOf(chip);
    if (idx >= 0) chips.splice(idx, 1);
    else chips.push(chip);
    updateField(key, chips.join(", "));
  };

  const isChipSelected = (key: string, chip: string) =>
    (data[key] || "").split(", ").includes(chip);

  // ── Render a single field ──────────────────────────────────────────────────
  const renderField = (field: WizardField) => {
    const value = data[field.key] || "";
    const error = errors[field.key];
    const baseInput =
      "w-full px-4 py-3 rounded-xl border bg-white/70 backdrop-blur-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all text-base";
    const ringColor = error ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-saffron/25 focus:border-saffron";

    return (
      <div key={field.key} className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {field.hint && (
          <p className="text-xs text-gray-400">{field.hint}</p>
        )}

        {field.type === "chips" && (
          <div className="flex flex-wrap gap-2">
            {(field.chips || []).map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => toggleChip(field.key, chip)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                  isChipSelected(field.key, chip)
                    ? "bg-saffron text-white border-saffron shadow-md"
                    : "bg-white text-gray-600 border-gray-200 hover:border-saffron/50 hover:text-saffron"
                )}
              >
                {chip}
              </button>
            ))}
            {/* Also allow free text below chips */}
            <input
              type="text"
              value={value}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder || "Or type here..."}
              className={cn(baseInput, ringColor, "mt-2 w-full")}
            />
          </div>
        )}

        {field.type === "textarea" && (
          <textarea
            value={value}
            onChange={(e) => updateField(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={cn(baseInput, ringColor, "resize-none leading-relaxed")}
          />
        )}

        {field.type === "text" && (
          <input
            type="text"
            value={value}
            onChange={(e) => updateField(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={cn(baseInput, ringColor)}
          />
        )}

        {field.type === "date" && (
          <input
            type="date"
            value={value}
            onChange={(e) => updateField(field.key, e.target.value)}
            className={cn(baseInput, ringColor)}
          />
        )}

        {field.type === "number" && (
          <input
            type="number"
            value={value}
            onChange={(e) => updateField(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={cn(baseInput, ringColor)}
          />
        )}

        {field.type === "select" && (
          <select
            value={value}
            onChange={(e) => updateField(field.key, e.target.value)}
            className={cn(baseInput, ringColor)}
          >
            <option value="">Select...</option>
            {(field.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  };

  // ── Review screen ──────────────────────────────────────────────────────────
  const renderReview = () => (
    <div className="space-y-4">
      {steps.map((step) => (
        <div key={step.title} className="rounded-xl border border-gray-100 bg-white/60 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            {step.icon} {step.title}
          </p>
          <div className="space-y-2">
            {step.fields.map((field) => {
              const val = data[field.key];
              if (!val) return null;
              return (
                <div key={field.key} className="flex gap-2 text-sm">
                  <span className="text-gray-500 shrink-0 font-medium min-w-[120px]">{field.label}:</span>
                  <span className="text-gray-900 break-words">{val}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Slide animation variants ──────────────────────────────────────────────
  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  const currentStepData = !isReviewStep ? steps[currentStep] : null;

  return (
    <div className="w-full">
      {/* ── Progress Bar ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {isReviewStep ? "Review" : `Step ${currentStep + 1} of ${totalSteps}`}
          </span>
          <span className="text-xs font-bold text-saffron">{Math.round(progress)}% complete</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", accentColor)}
            initial={{ width: 0 }}
            animate={{ width: `${isReviewStep ? 100 : progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        {/* Step dots */}
        <div className="flex items-center gap-1.5 mt-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i < currentStep
                  ? cn("bg-saffron", "flex-1")
                  : i === currentStep
                  ? cn("bg-saffron/60", "flex-1")
                  : "bg-gray-200 flex-1"
              )}
            />
          ))}
          <div className={cn("h-1.5 rounded-full transition-all duration-300 flex-1",
            isReviewStep ? "bg-saffron" : "bg-gray-200"
          )} />
        </div>
      </div>

      {/* ── Step Content ──────────────────────────────────────────────────── */}
      <div className="min-h-[340px] relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="w-full"
          >
            {isReviewStep ? (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{reviewTitle}</h3>
                    <p className="text-sm text-gray-500">Confirm your details, then generate</p>
                  </div>
                </div>
                {renderReview()}
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-saffron/10 flex items-center justify-center text-xl">
                    {currentStepData?.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{currentStepData?.title}</h3>
                    <p className="text-sm text-gray-500">{currentStepData?.subtitle}</p>
                  </div>
                </div>
                <div className="space-y-5">
                  {currentStepData?.fields.map(renderField)}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Navigation Buttons ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={currentStep === 0}
          className="gap-2 text-gray-500 hover:text-gray-900 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {isReviewStep ? (
          <Button
            type="button"
            onClick={() => onComplete(data)}
            disabled={isLoading}
            className={cn(
              "h-12 px-8 rounded-xl font-bold text-white gap-2 shadow-lg",
              accentColor,
              "hover:opacity-90"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={goNext}
            className={cn(
              "h-12 px-8 rounded-xl font-bold text-white gap-2 shadow-lg",
              accentColor,
              "hover:opacity-90"
            )}
          >
            {currentStep === totalSteps - 1 ? "Review →" : "Next"}
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
