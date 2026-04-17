"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { announce } from "@/lib/a11y/useAnnouncer";

/* ─── Step definitions ─── */
const STEP_COUNT = 8;

const STEP_LABELS = [
  "Welcome",
  "Investment Experience",
  "Financial Goals",
  "Emergency Fund",
  "Risk Tolerance",
  "Time Horizon",
  "Reaction to Loss",
  "Copilot Introduction",
];

/* ─── Step data types ─── */
interface OnboardingData {
  name: string;
  experience: string;
  goal: string;
  goalAmount: string;
  emergencyFund: string;
  riskTolerance: string;
  timeHorizon: string;
  lossReaction: string;
  agreeToTerms: boolean;
}

const defaultData: OnboardingData = {
  name: "",
  experience: "",
  goal: "",
  goalAmount: "",
  emergencyFund: "",
  riskTolerance: "",
  timeHorizon: "",
  lossReaction: "",
  agreeToTerms: false,
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inconsistencyWarning, setInconsistencyWarning] = useState("");

  const mainRef = useRef<HTMLDivElement>(null);

  /* Focus heading on step change */
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.focus();
    }
    announce(`Step ${step + 1} of ${STEP_COUNT}: ${STEP_LABELS[step]}`, "polite");
  }, [step]);

  /* Inconsistency detection between risk tolerance (Q4) and loss reaction (Q5) */
  useEffect(() => {
    if (data.riskTolerance && data.lossReaction) {
      if (
        data.riskTolerance === "aggressive" &&
        data.lossReaction === "sell-everything"
      ) {
        setInconsistencyWarning(
          "You selected aggressive risk tolerance but indicated you would sell everything during a downturn. These answers may be inconsistent. Consider whether your risk tolerance truly matches how you would react to losses."
        );
      } else if (
        data.riskTolerance === "conservative" &&
        data.lossReaction === "buy-more"
      ) {
        setInconsistencyWarning(
          "You selected conservative risk tolerance but indicated you would buy more during a downturn. You might be more risk-tolerant than you think. Consider revisiting your risk tolerance."
        );
      } else {
        setInconsistencyWarning("");
      }
    }
  }, [data.riskTolerance, data.lossReaction]);

  const updateField = (field: keyof OnboardingData, value: string | boolean) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateStep = (): boolean => {
    const errs: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!data.name.trim()) errs.name = "Please enter your name.";
        break;
      case 1:
        if (!data.experience)
          errs.experience = "Please select your experience level.";
        break;
      case 2:
        if (!data.goal) errs.goal = "Please select a financial goal.";
        break;
      case 3:
        if (!data.emergencyFund)
          errs.emergencyFund = "Please select your emergency fund status.";
        break;
      case 4:
        if (!data.riskTolerance)
          errs.riskTolerance = "Please select your risk tolerance.";
        break;
      case 5:
        if (!data.timeHorizon)
          errs.timeHorizon = "Please select your investment time horizon.";
        break;
      case 6:
        if (!data.lossReaction)
          errs.lossReaction = "Please select how you would react to a loss.";
        break;
      case 7:
        if (!data.agreeToTerms)
          errs.agreeToTerms =
            "Please agree to the terms to continue.";
        break;
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      announce(Object.values(errs)[0], "assertive");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < STEP_COUNT - 1) {
      setStep((s) => s + 1);
    } else {
      announce("Registration complete. Redirecting to dashboard.", "polite");
      router.push("/dashboard");
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-primary mb-6">
        Set Up Your Account
      </h1>

      {/* ─── Progress Navigation ─── */}
      <nav aria-label="Registration progress" className="mb-8">
        <ol className="flex items-center gap-1 flex-wrap">
          {STEP_LABELS.map((label, i) => (
            <li
              key={label}
              className="flex items-center text-xs"
            >
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                  i === step
                    ? "bg-action-primary text-inverse"
                    : i < step
                      ? "bg-gain text-inverse"
                      : "bg-surface-sunken text-muted"
                }`}
                aria-current={i === step ? "step" : undefined}
              >
                {i < step ? "\u2713" : i + 1}
              </span>
              <span
                className={`ml-1 mr-2 hidden sm:inline ${
                  i === step ? "font-semibold text-primary" : "text-muted"
                }`}
              >
                {label}
              </span>
              {i < STEP_LABELS.length - 1 && (
                <span className="text-border-default mr-1" aria-hidden="true">
                  &rarr;
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* ─── Live region for step announcements ─── */}
      <div aria-live="polite" className="sr-only">
        Step {step + 1} of {STEP_COUNT}: {STEP_LABELS[step]}
      </div>

      {/* ─── Step Content ─── */}
      <div
        ref={mainRef}
        tabIndex={-1}
        className="bg-surface-raised border border-border-default rounded-lg p-6 mb-6 focus:outline-none"
      >
        {/* Step 0: Welcome */}
        {step === 0 && (
          <>
            <h2 className="text-lg font-semibold text-primary mb-4">
              Welcome to Accrue
            </h2>
            <p className="text-sm text-secondary mb-4">
              Accrue is a beginner-friendly investment platform designed with
              accessibility at its core. Let us get to know you so we can
              personalize your experience.
            </p>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-primary mb-1"
              >
                What should we call you? <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id="name"
                type="text"
                value={data.name}
                onChange={(e) => updateField("name", e.target.value)}
                aria-invalid={errors.name ? "true" : undefined}
                aria-describedby={errors.name ? "name-error" : undefined}
                placeholder="Your first name"
                className={`w-full min-h-[44px] px-3 py-2 rounded-md border ${
                  errors.name
                    ? "border-feedback-error"
                    : "border-border-default"
                } bg-surface-base text-primary focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2`}
              />
              {errors.name && (
                <p
                  id="name-error"
                  className="text-sm text-feedback-error mt-1"
                  role="alert"
                >
                  {errors.name}
                </p>
              )}
            </div>
            <p className="text-xs text-muted">
              Your information is secure and only used to personalize your
              experience. Accrue never shares your data with third parties.
            </p>
          </>
        )}

        {/* Step 1: Investment Experience */}
        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-primary mb-4">
              Investment Experience
            </h2>
            <fieldset>
              <legend className="text-sm font-semibold text-primary mb-3">
                How would you describe your investment experience?{" "}
                <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </legend>
              <div className="space-y-2">
                {[
                  {
                    value: "none",
                    label: "No experience",
                    desc: "I have never invested before.",
                  },
                  {
                    value: "beginner",
                    label: "Beginner",
                    desc: "I have made a few investments but am still learning.",
                  },
                  {
                    value: "intermediate",
                    label: "Intermediate",
                    desc: "I invest regularly and understand basic concepts.",
                  },
                  {
                    value: "advanced",
                    label: "Advanced",
                    desc: "I have significant experience with various investment types.",
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 min-h-[44px] rounded-md border cursor-pointer focus-within:outline-3 focus-within:outline-focus-ring focus-within:outline-offset-2 ${
                      data.experience === opt.value
                        ? "border-action-primary bg-green-50"
                        : "border-border-default hover:bg-surface-sunken"
                    }`}
                  >
                    <input
                      type="radio"
                      name="experience"
                      value={opt.value}
                      checked={data.experience === opt.value}
                      onChange={(e) =>
                        updateField("experience", e.target.value)
                      }
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm font-medium text-primary">
                        {opt.label}
                      </span>
                      <p className="text-xs text-muted">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.experience && (
                <p
                  className="text-sm text-feedback-error mt-2"
                  role="alert"
                >
                  {errors.experience}
                </p>
              )}
            </fieldset>
          </>
        )}

        {/* Step 2: Financial Goals */}
        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-primary mb-4">
              Financial Goals
            </h2>
            <fieldset>
              <legend className="text-sm font-semibold text-primary mb-3">
                What is your primary investment goal?{" "}
                <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </legend>
              <div className="space-y-2">
                {[
                  {
                    value: "retirement",
                    label: "Save for retirement",
                    desc: "Build long-term wealth for when I stop working.",
                  },
                  {
                    value: "growth",
                    label: "Grow my wealth",
                    desc: "Increase my net worth over time through investing.",
                  },
                  {
                    value: "income",
                    label: "Generate income",
                    desc: "Earn regular dividends or interest from my investments.",
                  },
                  {
                    value: "save",
                    label: "Save for a specific goal",
                    desc: "A house, education, travel, or other milestone.",
                  },
                  {
                    value: "learn",
                    label: "Learn about investing",
                    desc: "I am here to learn and start small.",
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 min-h-[44px] rounded-md border cursor-pointer focus-within:outline-3 focus-within:outline-focus-ring focus-within:outline-offset-2 ${
                      data.goal === opt.value
                        ? "border-action-primary bg-green-50"
                        : "border-border-default hover:bg-surface-sunken"
                    }`}
                  >
                    <input
                      type="radio"
                      name="goal"
                      value={opt.value}
                      checked={data.goal === opt.value}
                      onChange={(e) => updateField("goal", e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm font-medium text-primary">
                        {opt.label}
                      </span>
                      <p className="text-xs text-muted">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.goal && (
                <p className="text-sm text-feedback-error mt-2" role="alert">
                  {errors.goal}
                </p>
              )}
            </fieldset>
          </>
        )}

        {/* Step 3: Emergency Fund */}
        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold text-primary mb-4">
              Emergency Fund
            </h2>
            <fieldset>
              <legend className="text-sm font-semibold text-primary mb-3">
                Do you have an emergency fund?{" "}
                <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </legend>
              <div className="space-y-2">
                {[
                  {
                    value: "yes",
                    label: "Yes, I have 3+ months saved",
                    desc: "I have enough savings to cover at least 3 months of living expenses.",
                  },
                  {
                    value: "working",
                    label: "I'm working on it",
                    desc: "I am building my emergency fund but have not reached 3 months yet.",
                  },
                  {
                    value: "no",
                    label: "No, not yet",
                    desc: "I do not currently have a dedicated emergency fund.",
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 min-h-[44px] rounded-md border cursor-pointer focus-within:outline-3 focus-within:outline-focus-ring focus-within:outline-offset-2 ${
                      data.emergencyFund === opt.value
                        ? "border-action-primary bg-green-50"
                        : "border-border-default hover:bg-surface-sunken"
                    }`}
                  >
                    <input
                      type="radio"
                      name="emergencyFund"
                      value={opt.value}
                      checked={data.emergencyFund === opt.value}
                      onChange={(e) =>
                        updateField("emergencyFund", e.target.value)
                      }
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm font-medium text-primary">
                        {opt.label}
                      </span>
                      <p className="text-xs text-muted">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.emergencyFund && (
                <p
                  className="text-sm text-feedback-error mt-2"
                  role="alert"
                >
                  {errors.emergencyFund}
                </p>
              )}
            </fieldset>

            {/* Gentle guidance when user selects "No" */}
            {data.emergencyFund === "no" && (
              <div
                className="mt-4 p-3 border-2 border-feedback-warning rounded-md bg-yellow-50"
                role="status"
              >
                <p className="text-sm text-primary font-medium mb-1">
                  A note before you continue
                </p>
                <p className="text-xs text-secondary">
                  We&apos;d suggest building an emergency fund first &mdash; it
                  protects you if something unexpected happens. You can still
                  continue, but we&apos;ll recommend conservative options.
                </p>
              </div>
            )}
          </>
        )}

        {/* Step 4: Risk Tolerance (Q4) */}
        {step === 4 && (
          <>
            <h2 className="text-lg font-semibold text-primary mb-4">
              Risk Tolerance
            </h2>
            <fieldset>
              <legend className="text-sm font-semibold text-primary mb-3">
                How much risk are you comfortable taking?{" "}
                <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </legend>
              <div className="space-y-2">
                {[
                  {
                    value: "conservative",
                    label: "Conservative",
                    desc: "I prefer stability over higher returns. I do not want to lose money.",
                  },
                  {
                    value: "moderate",
                    label: "Moderate",
                    desc: "I can handle some ups and downs for potentially better returns.",
                  },
                  {
                    value: "aggressive",
                    label: "Aggressive",
                    desc: "I am comfortable with significant short-term losses for potentially higher long-term returns.",
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 min-h-[44px] rounded-md border cursor-pointer focus-within:outline-3 focus-within:outline-focus-ring focus-within:outline-offset-2 ${
                      data.riskTolerance === opt.value
                        ? "border-action-primary bg-green-50"
                        : "border-border-default hover:bg-surface-sunken"
                    }`}
                  >
                    <input
                      type="radio"
                      name="riskTolerance"
                      value={opt.value}
                      checked={data.riskTolerance === opt.value}
                      onChange={(e) =>
                        updateField("riskTolerance", e.target.value)
                      }
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm font-medium text-primary">
                        {opt.label}
                      </span>
                      <p className="text-xs text-muted">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.riskTolerance && (
                <p
                  className="text-sm text-feedback-error mt-2"
                  role="alert"
                >
                  {errors.riskTolerance}
                </p>
              )}
            </fieldset>
            <p className="text-xs text-muted mt-3">
              There is no right or wrong answer. Your risk tolerance helps us
              show relevant guidance and alerts.
            </p>
          </>
        )}

        {/* Step 5: Time Horizon */}
        {step === 5 && (
          <>
            <h2 className="text-lg font-semibold text-primary mb-4">
              Time Horizon
            </h2>
            <fieldset>
              <legend className="text-sm font-semibold text-primary mb-3">
                When do you plan to use this money?{" "}
                <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </legend>
              <div className="space-y-2">
                {[
                  {
                    value: "short",
                    label: "Less than 3 years",
                    desc: "I may need this money soon.",
                  },
                  {
                    value: "medium",
                    label: "3 to 10 years",
                    desc: "I have some time before I need this money.",
                  },
                  {
                    value: "long",
                    label: "More than 10 years",
                    desc: "I am investing for the long term.",
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 min-h-[44px] rounded-md border cursor-pointer focus-within:outline-3 focus-within:outline-focus-ring focus-within:outline-offset-2 ${
                      data.timeHorizon === opt.value
                        ? "border-action-primary bg-green-50"
                        : "border-border-default hover:bg-surface-sunken"
                    }`}
                  >
                    <input
                      type="radio"
                      name="timeHorizon"
                      value={opt.value}
                      checked={data.timeHorizon === opt.value}
                      onChange={(e) =>
                        updateField("timeHorizon", e.target.value)
                      }
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm font-medium text-primary">
                        {opt.label}
                      </span>
                      <p className="text-xs text-muted">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.timeHorizon && (
                <p
                  className="text-sm text-feedback-error mt-2"
                  role="alert"
                >
                  {errors.timeHorizon}
                </p>
              )}
            </fieldset>
          </>
        )}

        {/* Step 6: Reaction to Loss (Q5 — compared with Q4 for inconsistency) */}
        {step === 6 && (
          <>
            <h2 className="text-lg font-semibold text-primary mb-4">
              Reaction to Loss
            </h2>
            <fieldset>
              <legend className="text-sm font-semibold text-primary mb-3">
                If your portfolio lost 20% of its value in a month, what would
                you most likely do?{" "}
                <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </legend>
              <div className="space-y-2">
                {[
                  {
                    value: "sell-everything",
                    label: "Sell everything",
                    desc: "I would cut my losses and move to cash.",
                  },
                  {
                    value: "sell-some",
                    label: "Sell some positions",
                    desc: "I would reduce my riskiest holdings.",
                  },
                  {
                    value: "hold",
                    label: "Hold steady",
                    desc: "I would do nothing and wait for recovery.",
                  },
                  {
                    value: "buy-more",
                    label: "Buy more",
                    desc: "I would see it as a buying opportunity.",
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 min-h-[44px] rounded-md border cursor-pointer focus-within:outline-3 focus-within:outline-focus-ring focus-within:outline-offset-2 ${
                      data.lossReaction === opt.value
                        ? "border-action-primary bg-green-50"
                        : "border-border-default hover:bg-surface-sunken"
                    }`}
                  >
                    <input
                      type="radio"
                      name="lossReaction"
                      value={opt.value}
                      checked={data.lossReaction === opt.value}
                      onChange={(e) =>
                        updateField("lossReaction", e.target.value)
                      }
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm font-medium text-primary">
                        {opt.label}
                      </span>
                      <p className="text-xs text-muted">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.lossReaction && (
                <p
                  className="text-sm text-feedback-error mt-2"
                  role="alert"
                >
                  {errors.lossReaction}
                </p>
              )}
            </fieldset>

            {/* Inconsistency warning */}
            {inconsistencyWarning && (
              <div
                className="mt-4 p-3 border-2 border-feedback-warning rounded-md bg-yellow-50"
                role="alert"
              >
                <p className="text-sm text-primary font-medium mb-1">
                  Inconsistency Detected
                </p>
                <p className="text-xs text-secondary">
                  {inconsistencyWarning}
                </p>
              </div>
            )}
          </>
        )}

        {/* Step 7: Copilot Introduction */}
        {step === 7 && (
          <>
            <h2 className="text-lg font-semibold text-primary mb-4">
              Meet the AI Copilot
            </h2>
            <div className="bg-surface-sunken rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <span
                  className="inline-block px-1.5 py-0.5 text-xs font-medium bg-feedback-info text-inverse rounded flex-shrink-0 mt-0.5"
                  aria-label="AI generated content"
                >
                  AI
                </span>
                <div>
                  <p className="text-sm text-primary">
                    Welcome{data.name ? `, ${data.name}` : ""}! Based on your
                    answers, you are a{" "}
                    {data.experience === "none"
                      ? "first-time investor"
                      : data.experience === "beginner"
                        ? "beginner investor"
                        : data.experience === "intermediate"
                          ? "intermediate investor"
                          : "experienced investor"}{" "}
                    with a{" "}
                    {data.riskTolerance === "conservative"
                      ? "conservative"
                      : data.riskTolerance === "moderate"
                        ? "moderate"
                        : "aggressive"}{" "}
                    risk tolerance and a{" "}
                    {data.timeHorizon === "short"
                      ? "short-term"
                      : data.timeHorizon === "medium"
                        ? "medium-term"
                        : "long-term"}{" "}
                    outlook.
                  </p>
                  <p className="text-sm text-secondary mt-2">
                    I am here to help you learn, not to tell you what to buy or
                    sell. I will explain concepts, summarize data, and flag
                    potential concerns. Every response I give includes a
                    confidence level and sources so you can verify what I say.
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-gain font-medium">
                      <span aria-hidden="true">&#9679;</span> Confidence: High
                    </span>
                    <span className="text-muted">Source: Accrue platform</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-secondary mb-4">
              You can access the AI Copilot anytime by clicking &quot;Ask
              Accrue&quot; in the top navigation or pressing{" "}
              <kbd className="px-1.5 py-0.5 bg-surface-sunken border border-border-default rounded text-xs font-mono">
                Ctrl+/
              </kbd>
              .
            </p>
            <div className="mb-4">
              <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.agreeToTerms}
                  onChange={(e) =>
                    updateField("agreeToTerms", e.target.checked)
                  }
                  className="mt-1 w-5 h-5 rounded border-border-default text-action-primary focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
                />
                <span className="text-sm text-primary">
                  I understand that Accrue is a research prototype, no real money
                  is involved, and the AI Copilot does not provide financial
                  advice.
                </span>
              </label>
              {errors.agreeToTerms && (
                <p
                  className="text-sm text-feedback-error mt-1 ml-8"
                  role="alert"
                >
                  {errors.agreeToTerms}
                </p>
              )}
            </div>
            <p className="text-xs text-muted">
              Your answers are stored locally and used to personalize your
              experience within this prototype. No data leaves your device.
            </p>
          </>
        )}
      </div>

      {/* ─── Navigation Buttons ─── */}
      <div className="flex gap-4">
        {step > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="min-h-[44px] min-w-[44px] px-6 py-2 rounded-md border border-border-default text-secondary font-medium hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          className="min-h-[44px] min-w-[44px] px-6 py-2 rounded-md bg-action-primary text-inverse font-medium hover:bg-action-primary-hover focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        >
          {step === STEP_COUNT - 1 ? "Get Started" : "Continue"}
        </button>
      </div>
    </>
  );
}
