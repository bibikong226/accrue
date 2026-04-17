import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
      },
      colors: {
        /* Surfaces */
        "surface-base": "var(--color-surface-base)",
        "surface-raised": "var(--color-surface-raised)",
        "surface-overlay": "var(--color-surface-overlay)",
        "surface-sunken": "var(--color-surface-sunken)",

        /* Text */
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        "text-inverse": "var(--color-text-inverse)",

        /* Borders */
        "border-default": "var(--color-border-default)",
        "border-strong": "var(--color-border-strong)",

        /* Focus */
        "focus-ring": "var(--color-focus-ring)",

        /* Actions */
        "action-primary": "var(--color-action-primary)",
        "action-primary-hover": "var(--color-action-primary-hover)",
        "action-destructive": "var(--color-action-destructive)",
        "action-destructive-hover": "var(--color-action-destructive-hover)",

        /* Feedback */
        "feedback-success": "var(--color-feedback-success)",
        "feedback-error": "var(--color-feedback-error)",
        "feedback-warning": "var(--color-feedback-warning)",
        "feedback-info": "var(--color-feedback-info)",

        /* Financial */
        gain: "var(--color-gain)",
        loss: "var(--color-loss)",

        /* AI Confidence */
        "ai-confidence-high": "var(--color-ai-confidence-high)",
        "ai-confidence-medium": "var(--color-ai-confidence-medium)",
        "ai-confidence-low": "var(--color-ai-confidence-low)",
      },
    },
  },
  plugins: [],
};

export default config;
