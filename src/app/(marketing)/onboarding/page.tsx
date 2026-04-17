"use client";

import { useState, useRef, useEffect, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OnboardingState {
  ageBand: string;
  incomeBand: string;
  emergencyFund: string;
  riskScenarioA: string;
  riskScenarioB: string;
  goalType: string;
  timeHorizon: string;
  lossCeiling: string;
}

type StepErrors = Record<string, string>;

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STEP_NAMES = [
  "Welcome",
  "Age and Income",
  "Emergency Fund",
  "Risk Scenario A",
  "Risk Scenario B",
  "Goal and Timeline",
  "Copilot Introduction",
] as const;

const TOTAL_STEPS = STEP_NAMES.length;

const AGE_BANDS = [
  "18–25",
  "26–35",
  "36–45",
  "46–55",
  "56–65",
  "65+",
] as const;

const INCOME_BANDS = [
  "Under $25k",
  "$25k–$50k",
  "$50k–$100k",
  "$100k–$200k",
  "$200k+",
] as const;

const EMERGENCY_FUND_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "working", label: "Working on it" },
] as const;

const RISK_A_OPTIONS = [
  { value: "sell-all", label: "Sell everything" },
  { value: "sell-some", label: "Sell some" },
  { value: "hold", label: "Hold" },
  { value: "buy-more", label: "Buy more" },
] as const;

const RISK_B_OPTIONS = [
  { value: "guaranteed", label: "Guaranteed $500" },
  { value: "chance", label: "Take the chance (50% chance of $1,500 / 50% chance of $0)" },
] as const;

const TIME_HORIZONS = [
  "Less than 1 year",
  "1–3 years",
  "3–7 years",
  "7–15 years",
  "15+ years",
] as const;

const LOSS_CEILINGS = ["5%", "10%", "15%", "20%", "25%+"] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Derives a human-readable risk level label from the combination of
 * Risk Scenario A and Risk Scenario B answers.
 */
function deriveRiskLevel(scenarioA: string, scenarioB: string): string {
  // Conservative: would sell + takes guarantee
  if (
    (scenarioA === "sell-all" || scenarioA === "sell-some") &&
    scenarioB === "guaranteed"
  ) {
    return "a conservative approach";
  }
  // Aggressive: would hold or buy more + takes chance
  if (
    (scenarioA === "hold" || scenarioA === "buy-more") &&
    scenarioB === "chance"
  ) {
    return "a growth-oriented approach";
  }
  // Moderate: mixed signals
  return "a balanced approach";
}

/**
 * Detects inconsistency between Risk Scenario A and B.
 * Scenario A "sell everything" + Scenario B "take the chance" is inconsistent,
 * as is Scenario A "buy more" + Scenario B "guaranteed".
 */
function detectInconsistency(scenarioA: string, scenarioB: string): boolean {
  if (scenarioA === "sell-all" && scenarioB === "chance") return true;
  if (scenarioA === "buy-more" && scenarioB === "guaranteed") return true;
  return false;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showInconsistency, setShowInconsistency] = useState(false);
  const [errors, setErrors] = useState<StepErrors>({});

  const [formData, setFormData] = useState<OnboardingState>({
    ageBand: "",
    incomeBand: "",
    emergencyFund: "",
    riskScenarioA: "",
    riskScenarioB: "",
    goalType: "",
    timeHorizon: "",
    lossCeiling: "",
  });

  /* a11y: Ref for the live region that announces step changes */
  const liveRegionRef = useRef<HTMLDivElement>(null);
  /* a11y: Ref for the step heading — receives focus on step change */
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  /* a11y: Ref for the first error field for focus management */
  const firstErrorRef = useRef<HTMLElement | null>(null);

  /* a11y: Announce step change to screen readers via polite live region */
  useEffect(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = `Step ${currentStep} of ${TOTAL_STEPS}: ${STEP_NAMES[currentStep - 1]}`;
    }
    // Focus the step heading when step changes (except step 1 on initial load)
    if (stepHeadingRef.current && currentStep > 1) {
      stepHeadingRef.current.focus();
    }
  }, [currentStep]);

  const updateField = useCallback(
    (field: keyof OnboardingState, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error for this field when user makes a selection
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  /* ---------------------------------------------------------------- */
  /*  Validation                                                       */
  /* ---------------------------------------------------------------- */

  function validateStep(step: number): StepErrors {
    const stepErrors: StepErrors = {};

    switch (step) {
      case 2:
        if (!formData.ageBand) stepErrors.ageBand = "Please select your age range.";
        if (!formData.incomeBand) stepErrors.incomeBand = "Please select your household income range.";
        break;
      case 3:
        if (!formData.emergencyFund)
          stepErrors.emergencyFund = "Please answer the emergency fund question.";
        break;
      case 4:
        if (!formData.riskScenarioA)
          stepErrors.riskScenarioA = "Please select what you would do.";
        break;
      case 5:
        if (!formData.riskScenarioB)
          stepErrors.riskScenarioB = "Please select one of the options.";
        break;
      case 6:
        if (!formData.goalType.trim())
          stepErrors.goalType = "Please describe your investment goal.";
        if (!formData.timeHorizon)
          stepErrors.timeHorizon = "Please select a time horizon.";
        if (!formData.lossCeiling)
          stepErrors.lossCeiling = "Please select a maximum acceptable loss.";
        break;
    }

    return stepErrors;
  }

  /* ---------------------------------------------------------------- */
  /*  Navigation                                                       */
  /* ---------------------------------------------------------------- */

  function handleNext(e?: FormEvent) {
    if (e) e.preventDefault();

    // Step 1 (welcome) has no validation
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      // a11y: Focus first failing field
      requestAnimationFrame(() => {
        const firstErrorKey = Object.keys(stepErrors)[0];
        const el = document.getElementById(`field-${firstErrorKey}`);
        if (el) {
          el.focus();
          firstErrorRef.current = el;
        }
      });
      return;
    }

    setErrors({});

    // After step 5, check for inconsistency between Q4 and Q5
    if (currentStep === 5) {
      const isInconsistent = detectInconsistency(
        formData.riskScenarioA,
        formData.riskScenarioB
      );
      if (isInconsistent && !showInconsistency) {
        setShowInconsistency(true);
        return;
      }
      // If already showing inconsistency, user chose to proceed
      setShowInconsistency(false);
    }

    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  }

  function handleBack() {
    setErrors({});
    setShowInconsistency(false);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }

  function handleGoToDashboard() {
    // Store answers in state (prototype only — not persisted)
    // In a real app, this would POST to an API
    router.push("/dashboard");
  }

  /* ---------------------------------------------------------------- */
  /*  Render helpers                                                    */
  /* ---------------------------------------------------------------- */

  function renderRadioGroup(
    groupName: keyof OnboardingState,
    legend: string,
    options: ReadonlyArray<{ value: string; label: string } | string>,
    description?: string
  ) {
    const fieldId = `field-${groupName}`;
    const errorId = `error-${groupName}`;
    const descriptionId = description ? `desc-${groupName}` : undefined;
    const hasError = !!errors[groupName];

    return (
      <fieldset
        id={fieldId}
        tabIndex={-1}
        className="outline-none"
        /* a11y: aria-describedby links error and description to the fieldset */
        aria-describedby={
          [hasError ? errorId : null, descriptionId].filter(Boolean).join(" ") ||
          undefined
        }
      >
        <legend className="text-lg font-medium text-primary mb-4">
          {legend}
        </legend>

        {description && (
          <p id={descriptionId} className="text-sm text-secondary mb-4">
            {description}
          </p>
        )}

        <div className="space-y-3">
          {options.map((option) => {
            const value = typeof option === "string" ? option : option.value;
            const label = typeof option === "string" ? option : option.label;
            const inputId = `${groupName}-${value}`;

            return (
              <label
                key={value}
                htmlFor={inputId}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors min-h-[44px] ${
                  formData[groupName] === value
                    ? "border-action-primary bg-surface-raised"
                    : "border-border-default hover:bg-surface-raised/50"
                } focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring`}
              >
                <input
                  type="radio"
                  id={inputId}
                  name={groupName}
                  value={value}
                  checked={formData[groupName] === value}
                  onChange={() => updateField(groupName, value)}
                  /* a11y: aria-required on required radio groups */
                  aria-required="true"
                  className="h-5 w-5 accent-action-primary flex-shrink-0"
                />
                <span className="text-base text-primary">{label}</span>
              </label>
            );
          })}
        </div>

        {hasError && (
          /* a11y: Error message with role="alert" for immediate announcement */
          <p
            id={errorId}
            role="alert"
            className="mt-3 text-sm text-feedback-error font-medium"
          >
            {errors[groupName]}
          </p>
        )}
      </fieldset>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Step content                                                      */
  /* ---------------------------------------------------------------- */

  function renderStepContent() {
    switch (currentStep) {
      /* ---- Step 1: Welcome ---- */
      case 1:
        return (
          <div className="text-center">
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              className="text-3xl font-semibold text-primary mb-4 outline-none"
            >
              Let&apos;s set up your investment profile
            </h2>
            <p className="text-lg text-secondary mb-8 max-w-lg mx-auto">
              We&apos;ll ask a few questions to understand your goals and comfort
              with risk. This takes about 2 minutes.
            </p>
            {/* Security reassurance per spec section 1.3 */}
            <p className="text-sm text-muted mb-8 max-w-md mx-auto">
              Your answers stay private. We use them to shape your dashboard,
              not to sell you products.
            </p>
            <button
              type="button"
              onClick={() => handleNext()}
              className="inline-flex items-center justify-center rounded-lg bg-action-primary px-8 py-3 text-lg font-medium text-inverse hover:bg-action-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring min-h-[44px] min-w-[44px] transition-colors"
            >
              Get Started
            </button>
          </div>
        );

      /* ---- Step 2: Age & Income ---- */
      case 2:
        return (
          <div>
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              className="text-2xl font-semibold text-primary mb-2 outline-none"
            >
              About You
            </h2>
            <p className="text-sm text-muted mb-6">
              This helps us calibrate recommendations to your life stage. We
              never share this information.
            </p>

            <div className="space-y-8">
              {renderRadioGroup(
                "ageBand",
                "What is your age range?",
                AGE_BANDS.map((b) => ({ value: b, label: b }))
              )}

              {renderRadioGroup(
                "incomeBand",
                "What is your approximate household income?",
                INCOME_BANDS.map((b) => ({ value: b, label: b }))
              )}
            </div>
          </div>
        );

      /* ---- Step 3: Emergency Fund ---- */
      case 3:
        return (
          <div>
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              className="text-2xl font-semibold text-primary mb-2 outline-none"
            >
              Emergency Fund
            </h2>
            <p className="text-sm text-muted mb-6">
              Before investing, it&apos;s important to have a safety net.
            </p>

            {renderRadioGroup(
              "emergencyFund",
              "Do you have at least 3 months of expenses saved?",
              EMERGENCY_FUND_OPTIONS
            )}

            {/* Gentle guidance when user selects "No" */}
            {formData.emergencyFund === "no" && (
              <div
                className="mt-6 rounded-lg border border-feedback-warning bg-surface-raised p-4"
                role="note"
              >
                <p className="text-sm text-primary">
                  We&apos;d suggest building an emergency fund first — it
                  protects you if something unexpected happens. You can still
                  continue and explore the platform.
                </p>
              </div>
            )}
          </div>
        );

      /* ---- Step 4: Risk Scenario A ---- */
      case 4:
        return (
          <div>
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              className="text-2xl font-semibold text-primary mb-2 outline-none"
            >
              Risk Comfort: Scenario A
            </h2>
            <p className="text-sm text-muted mb-6">
              There are no right or wrong answers. We&apos;re gauging your
              comfort level.
            </p>

            {renderRadioGroup(
              "riskScenarioA",
              "Your $10,000 portfolio drops to $8,000 in a month. What would you do?",
              RISK_A_OPTIONS
            )}
          </div>
        );

      /* ---- Step 5: Risk Scenario B ---- */
      case 5:
        return (
          <div>
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              className="text-2xl font-semibold text-primary mb-2 outline-none"
            >
              Risk Comfort: Scenario B
            </h2>
            <p className="text-sm text-muted mb-6">
              One more scenario to understand your preferences.
            </p>

            {renderRadioGroup(
              "riskScenarioB",
              "Pick one: guaranteed $500, or 50% chance of $1,500 / 50% chance of $0.",
              RISK_B_OPTIONS
            )}

            {/* Inconsistency interstitial */}
            {showInconsistency && (
              <div
                className="mt-6 rounded-lg border border-feedback-warning bg-surface-raised p-4"
                role="alert"
              >
                <p className="text-base text-primary font-medium mb-2">
                  We noticed your answers seem a bit different from each other.
                </p>
                <p className="text-sm text-secondary mb-4">
                  In the previous question you indicated you&apos;d{" "}
                  {formData.riskScenarioA === "sell-all"
                    ? "sell everything after a loss"
                    : "buy more after a loss"}
                  , but here you chose{" "}
                  {formData.riskScenarioB === "chance"
                    ? "the riskier option"
                    : "the safer option"}
                  . That&apos;s perfectly fine — people&apos;s risk comfort can
                  vary by situation. You can go back and change your answer, or
                  continue as-is.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center justify-center rounded-lg border border-border-default bg-surface-base px-4 py-2 text-sm font-medium text-primary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring min-h-[44px] min-w-[44px] transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInconsistency(false);
                      setCurrentStep(6);
                    }}
                    className="inline-flex items-center justify-center rounded-lg border border-border-default bg-surface-base px-4 py-2 text-sm font-medium text-primary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring min-h-[44px] min-w-[44px] transition-colors"
                  >
                    Continue Anyway
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      /* ---- Step 6: Goal & Timeline ---- */
      case 6: {
        const goalErrorId = "error-goalType";
        const horizonErrorId = "error-timeHorizon";
        const ceilingErrorId = "error-lossCeiling";

        return (
          <div>
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              className="text-2xl font-semibold text-primary mb-2 outline-none"
            >
              Your Investment Goal
            </h2>
            <p className="text-sm text-muted mb-6">
              Understanding your goal helps us tailor your experience.
            </p>

            <div className="space-y-8">
              {/* Goal type — text input */}
              <div>
                <label
                  htmlFor="field-goalType"
                  className="block text-lg font-medium text-primary mb-2"
                >
                  What are you investing for?
                </label>
                <p
                  id="desc-goalType"
                  className="text-sm text-secondary mb-3"
                >
                  For example: retirement, a house down payment, education, or
                  general wealth building.
                </p>
                <input
                  type="text"
                  id="field-goalType"
                  value={formData.goalType}
                  onChange={(e) => updateField("goalType", e.target.value)}
                  /* a11y: aria-required marks required fields */
                  aria-required="true"
                  /* a11y: aria-describedby links description and error */
                  aria-describedby={
                    [
                      "desc-goalType",
                      errors.goalType ? goalErrorId : null,
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                  aria-invalid={!!errors.goalType}
                  className="w-full rounded-lg border border-border-default bg-surface-base px-4 py-3 text-base text-primary placeholder:text-muted focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-focus-ring min-h-[44px]"
                />
                {errors.goalType && (
                  <p
                    id={goalErrorId}
                    role="alert"
                    className="mt-2 text-sm text-feedback-error font-medium"
                  >
                    {errors.goalType}
                  </p>
                )}
              </div>

              {/* Time horizon */}
              {renderRadioGroup(
                "timeHorizon",
                "What is your investment time horizon?",
                TIME_HORIZONS.map((h) => ({ value: h, label: h })),
                "How long do you plan to keep this money invested?"
              )}

              {/* Loss ceiling */}
              {renderRadioGroup(
                "lossCeiling",
                "What is the largest single-year loss you could accept?",
                LOSS_CEILINGS.map((c) => ({ value: c, label: c })),
                "This helps us understand your overall risk tolerance."
              )}
            </div>
          </div>
        );
      }

      /* ---- Step 7: Copilot Introduction ---- */
      case 7: {
        const riskLevel = deriveRiskLevel(
          formData.riskScenarioA,
          formData.riskScenarioB
        );
        const goalDisplay = formData.goalType.trim() || "your goal";
        const timeDisplay = formData.timeHorizon || "your chosen timeframe";

        return (
          <div className="text-center">
            <h2
              ref={stepHeadingRef}
              tabIndex={-1}
              className="text-2xl font-semibold text-primary mb-4 outline-none"
            >
              Meet Your AI Copilot
            </h2>

            <div className="mx-auto max-w-lg rounded-lg border border-border-default bg-surface-raised p-6 text-left mb-8">
              <p className="text-base text-primary mb-4">
                Hi! I&apos;m your AI Copilot. Based on what you&apos;ve told me,
                here&apos;s how I&apos;ll help:
              </p>
              <p className="text-base text-primary mb-4">
                Since you chose{" "}
                <strong className="font-semibold">{riskLevel}</strong> and told
                me about your{" "}
                <strong className="font-semibold">{goalDisplay}</strong> goal
                for{" "}
                <strong className="font-semibold">{timeDisplay}</strong>,
                I&apos;ll flag any trade that pushes tech above 40% of your
                portfolio.
              </p>
              <p className="text-base text-primary mb-4">
                I&apos;ll always show you where my information comes from, and
                how confident I am.
              </p>
              <p className="text-sm text-secondary">
                I never recommend specific trades. I explain, summarize, and flag
                concerns — the decisions are always yours.
              </p>
            </div>

            {/* Security reassurance */}
            <p className="text-sm text-muted mb-6 max-w-md mx-auto">
              Your profile data stays on your device for this prototype session.
              It is not sent to any third party.
            </p>

            <button
              type="button"
              onClick={handleGoToDashboard}
              className="inline-flex items-center justify-center rounded-lg bg-action-primary px-8 py-3 text-lg font-medium text-inverse hover:bg-action-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring min-h-[44px] min-w-[44px] transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        );
      }

      default:
        return null;
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Main render                                                       */
  /* ---------------------------------------------------------------- */

  const progressPercent = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      {/* a11y: Polite live region announces step changes to screen readers */}
      <div
        ref={liveRegionRef}
        /* a11y: role="status" with aria-live="polite" for non-urgent updates */
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* ---- Progress indicator ---- */}
      {/* a11y: Navigation landmark with ordered list and aria-current for progress */}
      <nav
        aria-label="Registration progress"
        className="mb-8"
      >
        {/* Visual progress bar */}
        <div className="mb-4">
          <p className="text-sm font-medium text-secondary mb-2">
            Step {currentStep} of {TOTAL_STEPS}: {STEP_NAMES[currentStep - 1]}
          </p>
          <div
            className="h-2 w-full rounded-full bg-surface-sunken overflow-hidden"
            /* a11y: progressbar role with value attributes for screen readers */
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
            aria-label={`Registration progress: step ${currentStep} of ${TOTAL_STEPS}`}
          >
            <div
              className="h-full rounded-full bg-action-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* a11y: Semantic ordered list of steps with aria-current="step" */}
        <ol className="flex flex-wrap gap-x-1 gap-y-1">
          {STEP_NAMES.map((name, index) => {
            const stepNum = index + 1;
            const isCurrent = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;

            return (
              <li
                key={name}
                /* a11y: aria-current="step" on the active step per WAI */
                aria-current={isCurrent ? "step" : undefined}
                className={`text-xs px-2 py-1 rounded ${
                  isCurrent
                    ? "bg-action-primary text-inverse font-medium"
                    : isCompleted
                    ? "bg-surface-raised text-secondary"
                    : "text-muted"
                }`}
              >
                <span className="sr-only">
                  {isCompleted
                    ? `Step ${stepNum}, ${name}, completed`
                    : isCurrent
                    ? `Step ${stepNum}, ${name}, current step`
                    : `Step ${stepNum}, ${name}, not yet reached`}
                </span>
                <span aria-hidden="true">
                  {stepNum}. {name}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* ---- Step content ---- */}
      <form
        onSubmit={handleNext}
        noValidate
        className="mb-8"
      >
        {renderStepContent()}

        {/* ---- Navigation buttons ---- */}
        {/* Steps 1 and 7 have their own buttons inline */}
        {currentStep > 1 && currentStep < TOTAL_STEPS && !showInconsistency && (
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center justify-center rounded-lg border border-border-default bg-surface-base px-6 py-3 text-base font-medium text-primary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring min-h-[44px] min-w-[44px] transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg border border-border-default bg-surface-base px-6 py-3 text-base font-medium text-primary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring min-h-[44px] min-w-[44px] transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Back button on step 7 */}
        {currentStep === TOTAL_STEPS && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center justify-center rounded-lg border border-border-default bg-surface-base px-6 py-3 text-base font-medium text-primary hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring min-h-[44px] min-w-[44px] transition-colors"
            >
              Back
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
