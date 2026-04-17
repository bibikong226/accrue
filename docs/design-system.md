# /docs/design-system.md — Accrue Design System

This is the authoritative specification for every component, token, and pattern in Accrue. Read the relevant section before writing code. If a section is ambiguous or silent, flag it and ask before inventing.

**Cross-reference:** `/CLAUDE.md` in the project root for rules of engagement; this file for specs.

---

# § 0. Design principles

1. **Accessibility is the product.** Semantic HTML → ARIA → custom widget → visual-only. Never skip levels.
2. **Redundant encoding.** Color + text + icon. Motion + text. Sound + visible state.
3. **Uncertainty is first-class.** Confidence and sources precede the claim.
4. **Finance safeguards over UX smoothness.** WCAG 3.3.4 wins over Nielsen's flexibility heuristic every time.
5. **Escape hatches.** Every chart toggles to a table. Every AI answer links to Research. Every Low confidence surfaces a verification CTA.

---

# § 1. Foundations

## § 1.1 Color tokens

### Primitives

```css
/* /src/styles/tokens.css */
:root {
  /* Brand */
  --accrue-green-500: #1F7A4D;
  --accrue-green-600: #185F3C;
  --accrue-green-400: #2B9C62;

  --accrue-blue-500: #0B5FFF;  /* Focus / link */
  --accrue-blue-600: #0848C7;

  /* Signal */
  --signal-red-500: #B3261E;    /* Loss / destructive */
  --signal-red-600: #8C1E17;
  --signal-amber-500: #9C5400;  /* Caution / Low confidence */
  --signal-info-500: #0A5FAD;   /* Info / Moderate confidence */

  /* Neutrals (10-step ramp) */
  --neutral-0:   #FFFFFF;
  --neutral-50:  #F7F8F9;
  --neutral-100: #EDEFF2;
  --neutral-200: #D9DDE3;
  --neutral-300: #B8BFC8;
  --neutral-500: #7A838F;
  --neutral-700: #4A535E;
  --neutral-800: #2E353E;
  --neutral-900: #1A1F25;
  --neutral-950: #0E0F10;
}
```

### Semantic tokens (light theme)

```css
:root {
  /* Surfaces */
  --color-surface-base: var(--neutral-0);
  --color-surface-raised: var(--neutral-50);
  --color-surface-overlay: var(--neutral-0);

  /* Text — AA minimum 4.5:1, AAA target 7:1 on surface-base */
  --color-text-primary: var(--neutral-900);      /* 16.5:1 on white */
  --color-text-secondary: var(--neutral-700);    /* 9.2:1 on white */
  --color-text-muted: var(--neutral-500);        /* 4.6:1 — AA only, use for non-essential */
  --color-text-on-accent: var(--neutral-0);

  /* Borders */
  --color-border-default: var(--neutral-200);
  --color-border-strong: var(--neutral-500);
  --color-border-focus: var(--accrue-blue-500);

  /* Focus */
  --color-focus-ring: var(--accrue-blue-500);

  /* Actions */
  --color-action-primary: var(--accrue-green-500);
  --color-action-primary-hover: var(--accrue-green-600);
  --color-action-destructive: var(--signal-red-500);
  --color-action-destructive-hover: var(--signal-red-600);

  /* Feedback */
  --color-feedback-success: var(--accrue-green-500);
  --color-feedback-warning: var(--signal-amber-500);
  --color-feedback-error: var(--signal-red-500);
  --color-feedback-info: var(--signal-info-500);

  /* Financial semantics — direction arrow required alongside */
  --color-gain: var(--accrue-green-500);
  --color-loss: var(--signal-red-500);
  --color-neutral-change: var(--neutral-700);

  /* AI confidence */
  --color-ai-confidence-low: var(--signal-amber-500);
  --color-ai-confidence-moderate: var(--signal-info-500);
  --color-ai-confidence-high: var(--accrue-green-500);
}
```

### Dark theme

```css
[data-theme="dark"] {
  --color-surface-base: var(--neutral-950);
  --color-surface-raised: var(--neutral-900);
  --color-text-primary: var(--neutral-50);       /* 16.1:1 on neutral-950 */
  --color-text-secondary: var(--neutral-200);    /* 11.3:1 */
  --color-text-muted: var(--neutral-300);        /* 7.8:1 */
  --color-border-default: var(--neutral-700);
  --color-action-primary: var(--accrue-green-400);
  /* ... mirror all semantic tokens at equivalent contrast ratios */
}
```

### Forced-colors mode

```css
@media (forced-colors: active) {
  :root {
    --color-text-primary: CanvasText;
    --color-text-secondary: CanvasText;
    --color-surface-base: Canvas;
    --color-border-default: CanvasText;
    --color-focus-ring: Highlight;
    --color-action-primary: ButtonFace;
    --color-text-on-accent: ButtonText;
    --color-action-destructive: LinkText; /* system links approximate destructive styling */
  }

  /* Override shadow-only elevation; forced-colors strips shadows */
  .elevated { border: 1px solid CanvasText; box-shadow: none; }

  /* Preserve focus ring visibility */
  :focus-visible {
    outline: 3px solid Highlight !important;
    outline-offset: 2px !important;
  }
}
```

### Contrast matrix (all AA+ at text size; AAA where noted)

| Foreground | Background | Ratio | WCAG |
|---|---|---|---|
| `--color-text-primary` | `--color-surface-base` | 16.5:1 | AAA |
| `--color-text-secondary` | `--color-surface-base` | 9.2:1 | AAA |
| `--color-text-muted` | `--color-surface-base` | 4.6:1 | AA (body), AAA (large) |
| `--color-action-primary` (`#1F7A4D`) | `--color-surface-base` | 6.9:1 | AAA |
| `--color-focus-ring` | `--color-surface-base` | 8.2:1 | AAA |
| `--color-action-destructive` | `--color-surface-base` | 6.4:1 | AAA |
| `--color-text-on-accent` on `--color-action-primary` | — | 5.8:1 | AA |

Recompute on any palette change. Fail the build on any pair under 4.5:1.

### Color usage rules

- **Gain/loss:** Green/red is a supplement. Always render an arrow (▲/▼) and a sign (+/−) alongside. Minimum text: `"+$1,234 (▲ 2.4%)"`.
- **Confidence:** Icon + word + color. Never color alone. Screen reader announces the word first.
- **Error states:** Red border + icon + inline text. Never red alone.
- **Links:** Underlined in running text. Distinguishable from adjacent text by more than color (WCAG 1.4.1).

---

## § 1.2 Typography

### Font stack

```css
:root {
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}
```

### Scale (1.125 modular, rem-based so user zoom is respected)

```css
:root {
  --text-xs:   0.75rem;   /* 12px — captions, meta */
  --text-sm:   0.875rem;  /* 14px — helper text */
  --text-base: 1rem;      /* 16px — body */
  --text-md:   1.125rem;  /* 18px — body emphasis */
  --text-lg:   1.25rem;   /* 20px */
  --text-xl:   1.5rem;    /* 24px */
  --text-2xl:  1.875rem;  /* 30px */
  --text-3xl:  2.25rem;   /* 36px */
  --text-4xl:  3rem;      /* 48px — H1 hero */

  --leading-tight:  1.2;
  --leading-normal: 1.5;
  --leading-loose:  1.65;

  --tracking-tight:  -0.01em;
  --tracking-normal: 0;
  --tracking-wide:   0.04em;
}
```

### Rules

- Body: `--text-base` / `--leading-normal`. Users who enable "Readable" preference bump to `--text-md` / `--leading-loose`.
- Max line length 65ch for prose. Min line length 45ch.
- Headings form a single document outline per page: one H1, nested H2–H6. Never skip levels.
- **All numeric values use `font-variant-numeric: tabular-nums`.** Currency, share counts, percentages, dates. Apply at the element level via a `.tabular` utility class.

### Tabular number utility

```css
.tabular {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}
```

---

## § 1.3 Spacing

8px base. Never ship a raw pixel value in JSX — use tokens.

```css
:root {
  --space-1:  0.25rem;  /* 4px */
  --space-2:  0.5rem;   /* 8px */
  --space-3:  0.75rem;  /* 12px */
  --space-4:  1rem;     /* 16px */
  --space-5:  1.25rem;  /* 20px */
  --space-6:  1.5rem;   /* 24px */
  --space-8:  2rem;     /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

---

## § 1.4 Layout and breakpoints

```css
:root {
  --bp-sm: 480px;
  --bp-md: 768px;
  --bp-lg: 960px;
  --bp-xl: 1280px;

  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
}
```

- 12-column grid at ≥960px
- 8-column at 768–959px
- 4-column stacked at <768px
- Minimum touch target: 44×44 CSS pixels (WCAG 2.5.8)

---

## § 1.5 Motion

```css
:root {
  --duration-100: 100ms;
  --duration-150: 150ms;
  --duration-200: 200ms;
  --duration-300: 300ms;

  --ease-standard:   cubic-bezier(0.2, 0, 0, 1);
  --ease-emphasized: cubic-bezier(0.2, 0, 0, 1.4);
  --ease-decelerate: cubic-bezier(0, 0, 0, 1);
  --ease-accelerate: cubic-bezier(0.3, 0, 1, 1);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Motion rules:**
- Animation is never the sole communicator of state.
- No auto-scroll on focus change (breaks screen magnifiers).
- Parallax, auto-playing video, and marquees are forbidden.

---

## § 1.6 Elevation

```css
:root {
  --elevation-0: none;
  --elevation-1: 0 1px 2px rgba(14, 15, 16, 0.06), 0 1px 3px rgba(14, 15, 16, 0.1);
  --elevation-2: 0 4px 6px rgba(14, 15, 16, 0.05), 0 10px 15px rgba(14, 15, 16, 0.1);
  --elevation-3: 0 10px 15px rgba(14, 15, 16, 0.08), 0 20px 25px rgba(14, 15, 16, 0.1);
}

@media (forced-colors: active) {
  .elevated-1, .elevated-2, .elevated-3 {
    border: 1px solid CanvasText;
    box-shadow: none;
  }
}
```

Shadows are invisible in forced colors. Elevated surfaces must fall back to a 1px border.

---

## § 1.7 Focus

```css
:focus { outline: none; }

:focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 2px;
  border-radius: 4px;
}

@media (forced-colors: active) {
  :focus-visible {
    outline: 3px solid Highlight;
    outline-offset: 2px;
  }
}
```

Every focus ring must pass WCAG 2.4.11 Focus Appearance (2.2): minimum 2px thick, 3:1 contrast against adjacent colors.

---

# § 2. Component inventory

Every component is specified across nine dimensions. Read the relevant section in full before writing.

---

## § 2.1 Button

**Visual.** Five variants: `primary` (green fill), `secondary` (neutral border), `tertiary` (label only with underline on hover/focus), `destructive` (red fill), `icon-only` (44×44, glyph + visually hidden label). Corner radius 8px.

**States:** default, hover, focus-visible, active, disabled, loading, error.

**Semantic HTML:** native `<button type="button">` (or `type="submit"` in forms). Never `<div role="button">`.

**ARIA:**
- `aria-label` for icon-only
- `aria-busy="true"` while loading
- `aria-disabled="true"` instead of HTML `disabled` when the button must remain discoverable in tab order
- `aria-describedby` for risk warnings on destructive buttons

**Keyboard:** Tab in/out. Enter or Space activates. Esc has no effect (closes parent dialog).

**Screen reader:**
- Primary: "Buy shares, button."
- Icon-only: "Add to watchlist, button."
- Loading: "Placing order, busy, button."
- Destructive: "Cancel pending order, button. This action cannot be undone."

**Focus:** Enters via tab sequence. Destructive → dialog → focus moves in, returns to button on dismiss.

**Forced colors:** `ButtonFace`/`ButtonText`, with leading warning glyph on destructive.

**Code:**

```tsx
// /src/components/ui/Button.tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "tertiary" | "destructive" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
  iconOnlyLabel?: string;
  describedBy?: string;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", isLoading, iconOnlyLabel, describedBy, children, className, type = "button", ...rest }, ref) => {
    const accessibleProps = variant === "icon" ? { "aria-label": iconOnlyLabel } : {};
    return (
      <button
        ref={ref}
        type={type}
        aria-busy={isLoading || undefined}
        aria-disabled={isLoading || undefined}
        aria-describedby={describedBy}
        className={cn(
          "inline-flex items-center justify-center gap-2",
          "min-h-[44px] min-w-[44px] px-4 rounded-lg",
          "text-base font-medium",
          "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2",
          "focus-visible:outline-[color:var(--color-focus-ring)]",
          "transition-colors duration-150",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          variantStyles[variant],
          className
        )}
        {...accessibleProps}
        {...rest}
      >
        {isLoading && <Spinner aria-hidden="true" />}
        <span className={variant === "icon" ? "sr-only" : undefined}>{children}</span>
      </button>
    );
  }
);
Button.displayName = "Button";
```

---

## § 2.2 Form inputs

**Variants:** text, number, select (native by default), combobox (WAI-ARIA editable combobox with list autocomplete), radio group, checkbox, switch.

**Universal rules:**
- Minimum 48px height, 1.5px border, 8px radius
- Labels **above** the field, never as placeholder-only
- Numeric inputs use `inputmode="decimal"` and `tabular-nums`
- Error state: 2px red border + icon + message referenced by `aria-describedby` + `aria-invalid="true"` (applied on blur, not per-keystroke)
- Required: HTML `required` attribute + visible "(required)" text — never asterisk-only

**Combobox keyboard:**

| Key | Result |
|---|---|
| Down | Opens listbox; moves virtual focus to next option |
| Up | Moves virtual focus to previous option |
| Home/End | First/last option |
| Enter | Commits focused option, closes listbox, returns focus to input |
| Escape | Closes listbox; second press clears input |
| Printable | Types into input; listbox filters and reopens |
| Tab | Commits current string and leaves field |

**Screen reader examples:**
- Text: "Annual contribution, required, edit text. Enter a whole dollar amount between 1 and 7,000."
- Combobox closed: "Choose sector, combo box, collapsed, edit."
- Combobox with 3 matches: "Technology, 1 of 3."
- Radio group: "Risk tolerance, radio group. Moderate, radio button, 2 of 4, not selected."
- Switch: "Enable dividend reinvestment, switch, on."

**Combobox code:**

```tsx
// /src/components/forms/Combobox.tsx
<label htmlFor={id}>{label}</label>
<p id={`${id}-help`}>{helpText}</p>
<input
  id={id}
  role="combobox"
  aria-expanded={open}
  aria-controls={`${id}-listbox`}
  aria-autocomplete="list"
  aria-activedescendant={activeId}
  aria-describedby={`${id}-help`}
  aria-required={required || undefined}
  aria-invalid={error ? "true" : undefined}
  aria-errormessage={error ? `${id}-error` : undefined}
  value={query}
  onChange={handleChange}
  onKeyDown={handleComboKeys}
/>
<ul id={`${id}-listbox`} role="listbox" hidden={!open}>
  {options.map((o, i) => (
    <li key={o.id} id={o.id} role="option" aria-selected={i === activeIndex}>
      {o.label}
    </li>
  ))}
</ul>
{error && <p id={`${id}-error`} className="text-error">{error}</p>}
```

---

## § 2.3 Form validation

**Pattern:**
1. Inline error below each invalid field, referenced by `aria-describedby` + `aria-errormessage`, `aria-invalid="true"` applied on blur.
2. On submit, a consolidated `<div role="alert">` summary at the top of the form listing every error as a keyboard link targeting its field.
3. Focus programmatically moves to the summary on submit failure. Clicking a summary link moves focus to the corresponding field (not scroll — focus).

**Message content:**
- Specific ("Enter an amount between $1 and $7,000")
- Actionable (state the fix)
- Non-blaming (imperative voice)

**Code:**

```tsx
// /src/components/forms/ErrorSummary.tsx
import { useEffect, useRef } from "react";

interface ErrorSummaryProps {
  errors: { id: string; label: string; message: string }[];
}

export function ErrorSummary({ errors }: ErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length) ref.current?.focus();
  }, [errors]);

  if (!errors.length) return null;

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      aria-labelledby="error-summary-title"
      className="border-2 border-[color:var(--color-feedback-error)] p-4 rounded-lg mb-6"
    >
      <h2 id="error-summary-title" className="text-lg font-semibold mb-2">
        {`${errors.length} ${errors.length === 1 ? "error" : "errors"} in form. Fix these to continue:`}
      </h2>
      <ul className="list-disc ml-6">
        {errors.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              onClick={(ev) => {
                ev.preventDefault();
                document.getElementById(e.id)?.focus();
              }}
            >
              {e.label}: {e.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## § 2.4 Tooltip (glossary terms)

**Visual.** Jargon inside running text renders as a `<button>` with a 1.5px dotted underline in info blue. On hover or focus, a 280px popover opens below with: (a) one-sentence plain-language definition, (b) "Learn more" link to glossary page, (c) "Ask AI" button.

**Semantic HTML.** Trigger is `<button type="button">`. Popover body is `<div role="tooltip">`. **HTML `title` attribute is forbidden** — inaccessible to touch, inconsistently announced.

**Keyboard:**

| Key | Result |
|---|---|
| Tab to trigger | Opens tooltip |
| Shift+Tab away | Closes tooltip |
| Esc (on trigger) | Closes tooltip; focus stays on trigger |
| Tab from trigger | Moves focus into "Learn more" / "Ask AI" actions |

**Screen reader:**
- Trigger focus: "Expense ratio, button. The annual percentage of assets charged by a fund to cover operating costs."
- On Tab into actions: "Learn more about expense ratio, link."

**Code:**

```tsx
// /src/components/ui/GlossaryTerm.tsx
"use client";
import { useId, useState, useRef } from "react";
import { glossary } from "@/data/glossary";

export function GlossaryTerm({ term }: { term: keyof typeof glossary }) {
  const id = useId();
  const tooltipId = `${id}-tip`;
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-describedby={tooltipId}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        className="underline decoration-dotted decoration-2 underline-offset-2 cursor-help text-[color:var(--color-feedback-info)]"
      >
        {term}
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        hidden={!open}
        className="absolute bg-surface-raised border p-3 rounded-lg shadow-md max-w-[280px]"
      >
        {glossary[term]}
      </span>
    </>
  );
}
```

---

## § 2.5 Modal / dialog

**Visual.** Centered card, min 320px / max 560px, 24px padding, 16px radius. 60% opacity scrim. Elevation-3.

**ARIA:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (title ID), `aria-describedby` (description ID, omit if body has interactive structure).

**Keyboard:**
- Tab wraps inside dialog; Shift+Tab wraps backward
- Enter activates focused button
- Esc closes dialog

**Focus management:**
1. On open: save `document.activeElement` as invoker
2. Move focus to first interactive control (or `tabindex="-1"` heading if text must be read first)
3. Trap focus inside; apply `inert` to sibling root nodes
4. On close: restore focus to invoker

**Order confirmation dialogs:** Primary action disabled until user has tabbed through / acknowledged — the "explicit user action" required by WCAG 3.3.4.

**Code:**

```tsx
// /src/components/ui/Dialog.tsx
"use client";
import { useEffect, useRef, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  labelId: string;
  descId?: string;
  children: ReactNode;
}

export function Dialog({ open, onClose, labelId, descId, children }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const invokerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    invokerRef.current = document.activeElement as HTMLElement;

    const first = ref.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      invokerRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        aria-describedby={descId}
        className="bg-surface-overlay rounded-2xl p-6 max-w-[560px] w-full elevated-3"
      >
        {children}
      </div>
    </div>
  );
}
```

---

## § 2.6 Tabs

**Visual.** Horizontal strip. Selected tab has 4px bottom green indicator. Transparent 2px side borders preserve definition under forced colors.

**Activation:** **Manual** (Enter/Space commits), not automatic. Panels in Accrue load financial data; automatic activation on arrow key would fire unnecessary fetches.

**ARIA:**
- `role="tablist"` + `aria-label`
- Each tab: `role="tab"`, `aria-selected`, `aria-controls="panelId"`, `tabindex="0"` on selected, `tabindex="-1"` on others (roving tabindex)
- Each panel: `role="tabpanel"`, `aria-labelledby="tabId"`, `tabindex="0"` if first child is non-focusable

**Keyboard:**

| Key | Result |
|---|---|
| Tab | Enters tablist at selected; next Tab exits into panel |
| Left/Right | Move focus between tabs, wrap at ends |
| Home/End | First/last tab |
| Enter or Space | Activates focused tab |
| Shift+Tab from panel | Returns to selected tab |

---

## § 2.7 Accordion

**Semantic HTML.** Each header is a `<button>` wrapped in heading (`<h3><button>…</button></h3>`). Panel is `<div id="…">`.

**Do not add `role="region"` unless the accordion has ≤6 panels** — more creates landmark proliferation per APG guidance.

**ARIA:**
- Trigger: `aria-expanded`, `aria-controls="panelId"`, optionally `aria-disabled="true"`

**Single show/hide (not a group):** use the Disclosure pattern, not Accordion.

---

## § 2.8 Data table

**Visual.** Semantic `<table>` with visible `<caption>`, sticky header, 4% neutral zebra striping (decorative only), right-aligned tabular-numeric columns. Sortable headers are full-width `<button>` inside `<th>`.

**ARIA:**
- `aria-sort="ascending"|"descending"|"none"` on the currently sorted `<th>` only
- `aria-label` on sort button: `"Sort by total return, currently descending"`
- A visually hidden `role="status" aria-live="polite"` region announces sort changes: `"Sorted by total return descending."`
- Virtualized tables: `aria-rowcount`, `aria-colcount`

**Row selection:** checkbox in first column with explicit `aria-label` describing the row (e.g., "Select row for AAPL, Apple Inc").

**Code:**

```tsx
// /src/components/finance/SortableHeader.tsx
type SortDir = "ascending" | "descending" | "none";

interface SortableHeaderProps {
  field: string;
  label: string;
  sort: { field: string; dir: SortDir };
  onSort: (next: { field: string; dir: SortDir }) => void;
}

export function SortableHeader({ field, label, sort, onSort }: SortableHeaderProps) {
  const current: SortDir = sort.field === field ? sort.dir : "none";
  const next: SortDir = current === "ascending" ? "descending" : "ascending";

  return (
    <th scope="col" aria-sort={current} className="text-right tabular">
      <button
        type="button"
        aria-label={`Sort by ${label}, currently ${current}`}
        onClick={() => onSort({ field, dir: next })}
        className="inline-flex items-center gap-1 w-full justify-end"
      >
        {label}
        <SortGlyph dir={current} aria-hidden="true" />
      </button>
    </th>
  );
}

// Paired live-region status:
export function SortLive({ message }: { message: string }) {
  return (
    <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </span>
  );
}
```

---

## § 2.9 Card (clickable)

**One-interactive-element rule.** The whole card is a single `<a>` wrapping the heading — preserves a single tab stop and a single accessible name. Nesting a second link violates HTML and creates duplicate focus targets.

```tsx
// /src/components/ui/CardLink.tsx
export function CardLink({ id, href, title, summary }: {
  id: string;
  href: string;
  title: string;
  summary?: string;
}) {
  const headingId = `card-${id}-heading`;
  const descId = summary ? `card-${id}-desc` : undefined;
  return (
    <a
      href={href}
      aria-labelledby={headingId}
      aria-describedby={descId}
      className="block p-4 rounded-lg border hover:bg-surface-raised focus-visible:outline"
    >
      <h3 id={headingId} className="text-lg font-semibold">{title}</h3>
      {summary && <p id={descId} className="text-secondary">{summary}</p>}
    </a>
  );
}
```

---

## § 2.10 Alert / banner / toast

| Component | Role | Live region | Use case |
|---|---|---|---|
| Alert | `role="alert"` | Assertive implicit | Blocking errors ("Order rejected") |
| Status | `role="status"` | Polite implicit | Success, progress, sort changes |
| Toast | `role="status"` | Polite | Transient confirmation |
| Banner | `<section aria-labelledby>` | None | Persistent page-level info |

**Toast rules (WCAG 2.2.1 Timing Adjustable):**
- Close button
- Pause on hover/focus
- Minimum 5–8 seconds, scaled to content length
- A user preference `prefersPersistentNotifications` converts toasts to banners (critical for BLV users who cannot re-read a disappeared message)

**Code:**

```tsx
// /src/components/ui/Toast.tsx
"use client";
import { useEffect, useState } from "react";

interface ToastProps {
  id: string;
  tone: "success" | "error" | "info";
  children: React.ReactNode;
  onDismiss: () => void;
  persistent?: boolean;
}

export function Toast({ id, tone, children, onDismiss, persistent }: ToastProps) {
  const [paused, setPaused] = useState(false);
  const ttl = persistent ? Infinity : Math.max(5000, String(children).length * 40);

  useEffect(() => {
    if (paused || ttl === Infinity) return;
    const t = window.setTimeout(onDismiss, ttl);
    return () => window.clearTimeout(t);
  }, [paused, ttl, onDismiss]);

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => { if (e.key === "Escape") onDismiss(); }}
      className={`toast toast--${tone}`}
    >
      <Icon name={tone} aria-hidden="true" />
      <p>{children}</p>
      <button type="button" onClick={onDismiss} aria-label={`Dismiss notification ${id}`}>×</button>
    </div>
  );
}
```

---

## § 2.11 Navigation

**Primary nav:** `<nav aria-label="Main">` with `<ul><li><a>` structure. Current page marked with `aria-current="page"`.

**Breadcrumb:** `<nav aria-label="Breadcrumb">` with `<ol>`, last item `aria-current="page"`.

**Mobile disclosure:** trigger with `aria-expanded`, `aria-controls`. When open, focus is trapped between toggle and last link; on close, focus returns to toggle.

**Landmark inventory (enforced):**

| Landmark | Element | Accessible name |
|---|---|---|
| banner | `<header>` | (implicit) |
| navigation primary | `<nav aria-label="Main">` | "Main" |
| navigation breadcrumb | `<nav aria-label="Breadcrumb">` | "Breadcrumb" |
| search | `<form role="search" aria-label="Search Accrue">` | "Search Accrue" |
| main | `<main id="main" tabindex="-1">` | (implicit) |
| complementary copilot | `<aside aria-label="AI Copilot">` | "AI Copilot" |
| complementary sidebar | `<aside aria-label="Account summary">` | "Account summary" |
| contentinfo | `<footer>` | (implicit) |

**Skip links:**

```html
<a href="#main" class="skip-link">Skip to main content</a>
<a href="#nav-main" class="skip-link">Skip to navigation</a>
<a href="#copilot" class="skip-link">Skip to AI Copilot</a>
```

Skip links must set focus AND scroll. `<main>` and `<aside>` get `tabindex="-1"`. On SPA route change, move focus to the H1 of the new page and announce the new page title via a polite live region.

---

## § 2.12 Progress indicator

**Bar:** prefer native `<progress max={100} value={40}>`. For custom, `<div role="progressbar" aria-valuenow={40} aria-valuemin={0} aria-valuemax={100}>`. For indeterminate, **omit `aria-valuenow`** entirely.

**Stepper (onboarding):** `<nav aria-label="Onboarding"><ol>` with current `<li>` carrying `aria-current="step"`.

**Screen reader examples:**
- Determinate: "Portfolio sync, 40 percent, progress bar"
- Indeterminate: "Loading research, progress bar, busy"
- Stepper: "Onboarding. list, 5 items. Step 1, Identity, completed, link. Step 2, Funding, current step, link."

---

## § 2.13 Chart wrapper (CRITICAL)

Every chart in Accrue **must** be rendered through `<ChartWrapper>`. Raw canvas or SVG without the wrapper is a build failure.

**Visual.** `<figure>` containing: H3 heading, one-sentence text summary, keyboard hint ("Press T to view as table"), chart canvas, toggle button that swaps canvas for semantic `<table>`, "Download CSV" secondary action.

**Semantic alternatives (all three required, per Lundgard & Satyanarayan 2022 four-level model):**
1. **Encoding-level summary:** "Line chart of portfolio value by day from Jan 1 to April 15, 2026."
2. **Statistics-level summary:** "Min $42,100, max $48,900, mean $46,200."
3. **Trend-level summary** (DEFAULT): "Portfolio value rose 8.2% over the period, with a 3.4% dip in mid-February that recovered by early March."
4. **Contextual summary** (expandable): "Mid-February dip coincides with broader market correction; recovery outpaced S&P 500 by 1.1%."

**ARIA:**
- Root `role="figure"` with `aria-labelledby` (heading) and `aria-describedby` (summary + hint)
- Summary region `aria-live="polite"` (re-announces on date range change)
- Toggle button `aria-pressed`
- Canvas/SVG inside is `aria-hidden="true"` because the table + summary carry the semantics

**Keyboard:**

| Key (when chart has focus) | Result |
|---|---|
| T | Toggle between chart and table view |
| Left/Right | Previous/next data point (chart view) |
| Home/End | First/last data point |
| +/- | Zoom in/out (if applicable) |
| 0 | Reset zoom |

**Chart type specifics:**

| Chart | Table columns | Default summary pattern |
|---|---|---|
| Line (price history) | Date, Value | "{series} rose/fell {pct}% from {start} to {end}, with {inflection}" |
| Donut (allocation) | Segment, Value, Percent | "Portfolio is {diversification} — {n} segments, largest is {top} at {pct}%" |
| Treemap (allocation) | Segment, Parent, Value | Same as donut |
| Candlestick | Date, Open, High, Low, Close | "{ticker} {rose/fell} {pct}% over {range}, trading range ${low}–${high}" |
| Bar (earnings) | Quarter, Actual, Estimate, Surprise | "{n} of {total} quarters beat estimate; average surprise {pct}%" |
| Comparison (vs benchmark) | Date, Portfolio, Benchmark | "Portfolio {out/under}performed {benchmark} by {delta} pp over {range}" |
| Analyst rating dist | Rating, Count, Percent | "{dominant} consensus — {pct}% {rating}, based on {n} analysts" |
| Goal progress | — | "On track: {pct}% of goal, projected to reach {goal} by {date}" |

**Forced colors:** Chart data must use distinct shapes/patterns (solid, dashed, dotted, hatched) in addition to color. Under forced colors, color is stripped — patterns must carry the encoding.

**Library recommendation:** **Highcharts with the Accessibility module** has the most complete built-in a11y (keyboard nav, sonification, screen reader table, description generator). Recharts + custom wrapper is acceptable for simpler charts. Chart.js needs significant accessibility bolt-on and is not recommended for production. D3 requires full custom a11y implementation.

**Code (core wrapper):**

```tsx
// /src/components/chart/ChartWrapper.tsx
"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface Series {
  label: string;
  points: { x: string | number; y: number }[];
}

interface ChartWrapperProps {
  id: string;
  title: string;
  summary: string;             // Trend-level summary, mandatory
  statisticsSummary?: string;  // Optional expandable stat-level
  contextualSummary?: string;  // Optional expandable contextual
  series: Series[];
  renderChart: () => ReactNode; // Consumer supplies the actual chart (Highcharts, Recharts, etc.)
}

export function ChartWrapper({ id, title, summary, statisticsSummary, contextualSummary, series, renderChart }: ChartWrapperProps) {
  const [asTable, setAsTable] = useState(false);
  const [expandedSummary, setExpandedSummary] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const headingId = `${id}-heading`;
  const summaryId = `${id}-summary`;
  const hintId = `${id}-hint`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "t" || e.key === "T") && rootRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        setAsTable((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <figure
      ref={rootRef as any}
      role="figure"
      aria-labelledby={headingId}
      aria-describedby={`${summaryId} ${hintId}`}
      className="chart-wrapper"
      tabIndex={-1}
    >
      <h3 id={headingId} className="text-lg font-semibold">{title}</h3>

      <p id={summaryId} aria-live="polite" className="text-secondary">
        {summary}
      </p>

      {(statisticsSummary || contextualSummary) && (
        <button
          type="button"
          aria-expanded={expandedSummary}
          onClick={() => setExpandedSummary((v) => !v)}
          className="text-sm underline"
        >
          {expandedSummary ? "Hide more detail" : "More detail"}
        </button>
      )}
      {expandedSummary && (
        <div className="text-sm mt-2">
          {statisticsSummary && <p>{statisticsSummary}</p>}
          {contextualSummary && <p>{contextualSummary}</p>}
        </div>
      )}

      <p id={hintId} className="text-sm text-muted">
        Press <kbd>T</kbd> to switch between chart and data table.
      </p>

      <button
        type="button"
        aria-pressed={asTable}
        onClick={() => setAsTable((v) => !v)}
        className="text-sm"
      >
        {asTable ? "View as chart" : "View as table"}
      </button>

      {asTable ? (
        <table aria-labelledby={headingId} className="w-full mt-4">
          <caption className="sr-only">{title} — tabular data</caption>
          <thead>
            <tr>
              <th scope="col" className="text-left">Label</th>
              {series.map((s) => (
                <th scope="col" key={s.label} className="text-right">{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {series[0].points.map((_, i) => (
              <tr key={series[0].points[i].x}>
                <th scope="row">{series[0].points[i].x}</th>
                {series.map((s) => (
                  <td key={s.label} className="text-right tabular">
                    {s.points[i].y.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div aria-hidden="true" className="chart-canvas mt-4">
          {renderChart()}
        </div>
      )}

      <button type="button" className="text-sm mt-2" onClick={() => downloadCSV(id, series)}>
        Download data (CSV)
      </button>
    </figure>
  );
}

function downloadCSV(id: string, series: Series[]) {
  const header = ["Label", ...series.map((s) => s.label)].join(",");
  const rows = series[0].points.map((_, i) =>
    [series[0].points[i].x, ...series.map((s) => s.points[i].y)].join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## § 2.14 AI response card (CRITICAL)

**Visual.** Bounded card with:
- "AI" badge top-left (persistent, not dismissible)
- Confidence indicator top-right: icon + word + color
- Response body
- Inline superscript source markers [1], [2] on numeric claims
- Collapsible "Sources (N)" disclosure with title, publisher, timestamp per entry
- "Verify in Research →" CTA for Low confidence responses
- Feedback row: Helpful / Not helpful / Report

**Confidence colors and glyphs (UI):**

| Level | Color token | Glyph | Screen reader prefix |
|---|---|---|---|
| Low | `--color-ai-confidence-low` (amber) | ⚠ | "Low confidence." |
| Moderate | `--color-ai-confidence-moderate` (blue) | ⓘ | "Moderate confidence." |
| High | `--color-ai-confidence-high` (green) | ✓ | "High confidence." |

**ARIA:**
- Response body in `role="log" aria-live="polite" aria-atomic="false" aria-relevant="additions text"`
- Heading has `tabIndex={-1}` so focus can move to it on stream completion (only if user preference is "jump to response"; default is announce-in-background)
- Sources list is an `<ol aria-label="Sources">`
- Feedback buttons are a `role="group" aria-label="Rate this response"` with `aria-pressed` on Helpful/Not helpful

**Uncertainty templates (copy pinned in `/src/lib/copilot/systemPrompt.ts`):**

| Tier | Pattern |
|---|---|
| High | "Based on [source], [claim]. Sources: [1], [2]." |
| Moderate | "[Claim], based on [source]. Note: this reflects [caveat]. Sources: [1]." |
| Low | "I'm not fully confident here. My best understanding, from [source], is [claim], but you should verify this before acting. Verify in Research →." |
| Refusal | "I can't help with that — it's outside what I'm designed to do. For [topic], please consult a qualified professional. I can help with [alternative]." |
| Data gap | "I don't have current data on [X]. The most recent I have is [Y, timestamp]. Try refreshing, or check Research for live figures." |

**Code:**

```tsx
// /src/components/copilot/AIResponse.tsx
"use client";
import { useEffect, useRef } from "react";
import type { CopilotResponse, ConfidenceLevel } from "@/lib/copilot/types";

const CONFIDENCE: Record<ConfidenceLevel, { icon: string; label: string; sr: string; tokenClass: string }> = {
  low:      { icon: "⚠", label: "Low confidence",      sr: "Low confidence.",      tokenClass: "ai-conf-low" },
  moderate: { icon: "ⓘ", label: "Moderate confidence", sr: "Moderate confidence.", tokenClass: "ai-conf-moderate" },
  high:     { icon: "✓", label: "High confidence",     sr: "High confidence.",     tokenClass: "ai-conf-high" },
};

interface AIResponseProps {
  response: CopilotResponse;
  streaming?: boolean;
  onFeedback?: (f: "up" | "down") => void;
  feedback?: "up" | "down";
  focusOnComplete?: boolean;  // user preference
}

export function AIResponse({ response, streaming, onFeedback, feedback, focusOnComplete }: AIResponseProps) {
  const { id, content, confidence, sources } = response;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const c = CONFIDENCE[confidence];

  useEffect(() => {
    if (!streaming && focusOnComplete) headingRef.current?.focus();
  }, [streaming, focusOnComplete]);

  return (
    <section
      role="log"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions text"
      aria-labelledby={`${id}-heading`}
      className={`ai-card ${c.tokenClass}`}
    >
      <header className="flex items-center justify-between">
        <h3 id={`${id}-heading`} ref={headingRef} tabIndex={-1} className="flex items-center gap-2">
          <span className="ai-badge" aria-hidden="true">AI</span>
          <span>Copilot response</span>
        </h3>

        <p className="ai-conf" role="status">
          <span aria-hidden="true">{c.icon} {c.label}</span>
          <span className="sr-only">{c.sr}</span>
        </p>
      </header>

      <div className="ai-body">
        {content}
        {streaming && <span aria-hidden="true" className="ai-caret">▍</span>}
      </div>

      {confidence === "low" && (
        <a href={`/research?q=${encodeURIComponent(id)}`} className="ai-verify-cta">
          Verify in Research →
        </a>
      )}

      <details className="ai-sources">
        <summary>Sources ({sources.length})</summary>
        <ol aria-label="Sources">
          {sources.map((s, i) => (
            <li key={s.url || s.id}>
              <span aria-hidden="true">[{i + 1}]</span>{" "}
              {s.url ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.title} <span className="sr-only">(opens in new tab)</span>
                </a>
              ) : (
                <span>{s.title}</span>
              )}
              {" — "}
              <span className="text-muted">{s.publisher}</span>{" · "}
              <time dateTime={s.updatedISO}>updated {new Date(s.updatedISO).toLocaleDateString()}</time>
            </li>
          ))}
        </ol>
      </details>

      {onFeedback && (
        <div role="group" aria-label="Rate this response" className="ai-feedback">
          <button type="button" aria-pressed={feedback === "up"} onClick={() => onFeedback("up")}>Helpful</button>
          <button type="button" aria-pressed={feedback === "down"} onClick={() => onFeedback("down")}>Not helpful</button>
        </div>
      )}
    </section>
  );
}
```

---

## § 2.15 Glossary term

See § 2.4 — the glossary term is a specialized tooltip trigger. Key differences:

- **Always resolves definitions from `/src/data/glossary.ts`, never from the AI.**
- The AI may reference glossary terms in its responses but must use the exact verbatim text (injected via the copilot context).
- Visually distinguishable from running text: 1.5px dotted underline in `--color-feedback-info`.

---

## § 2.16 Order review screen (CRITICAL)

**Visual.** Single-column review card under prominent H1: "You are about to: Buy 10 shares of VTSAX"

**Content (in order):**
1. H1 (focused on route change)
2. `<dl>` breakdown: ticker, quantity, order type, estimated cost, allocation impact, fees — every field mandatory
3. Embedded copilot pre-trade risk card (`<AIResponse>`)
4. Acknowledgment checkbox: "I understand this places a real order."
5. Two equally-sized buttons: **Confirm** (primary) and **Cancel** (secondary, same footprint)

**Rules (WCAG 3.3.4 compliance):**
- Confirm button disabled until the acknowledgment checkbox is checked
- Cancel and Confirm have equal visual prominence
- No fee may appear for the first time on this screen — all costs itemized on the preceding entry screen and carried forward
- The risk card is rendered inline; if its confidence is Low, the verification CTA must be visible before the user can check the acknowledgment

**Code (spine):**

```tsx
// /src/app/(app)/orders/review/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { AIResponse } from "@/components/copilot/AIResponse";
import type { CopilotResponse } from "@/lib/copilot/types";
import { fmtUSD } from "@/lib/format";

interface OrderReviewProps {
  order: { ticker: string; verb: "Buy" | "Sell"; qty: number; type: string; cost: number; fees: number; impact: string };
  risk: CopilotResponse;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function OrderReview({ order, risk, onConfirm, onCancel }: OrderReviewProps) {
  const [ack, setAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const h1Ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => { h1Ref.current?.focus(); }, []);

  return (
    <main aria-labelledby="review-heading" className="max-w-xl mx-auto p-6">
      <h1 id="review-heading" ref={h1Ref} tabIndex={-1} className="text-2xl font-semibold mb-6">
        You are about to: {order.verb} {order.qty} shares of {order.ticker}
      </h1>

      <dl className="grid grid-cols-2 gap-y-3 mb-8">
        <dt className="text-secondary">Ticker</dt><dd className="tabular text-right">{order.ticker}</dd>
        <dt className="text-secondary">Quantity</dt><dd className="tabular text-right">{order.qty}</dd>
        <dt className="text-secondary">Order type</dt><dd className="text-right">{order.type}</dd>
        <dt className="text-secondary">Estimated cost</dt><dd className="tabular text-right">{fmtUSD(order.cost)}</dd>
        <dt className="text-secondary">Allocation impact</dt><dd className="text-right">{order.impact}</dd>
        <dt className="text-secondary">Fees</dt><dd className="tabular text-right">{fmtUSD(order.fees)}</dd>
      </dl>

      <AIResponse response={risk} />

      <form
        className="mt-8"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!ack || submitting) return;
          setSubmitting(true);
          await onConfirm();
        }}
      >
        <label className="flex items-start gap-2 mb-6">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
            className="mt-1"
          />
          <span>I understand this places a real order.</span>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-4 rounded-lg border-2 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            aria-disabled={!ack || submitting}
            disabled={!ack || submitting}
            className="min-h-[44px] px-4 rounded-lg bg-primary text-on-accent font-medium disabled:opacity-40"
          >
            {submitting ? "Placing order…" : "Confirm order"}
          </button>
        </div>
      </form>
    </main>
  );
}
```

---

## § 2.17 Skip links and landmarks

See § 2.11 for the landmark inventory. Also:

- One `<main>` per page (WCAG 2.4.1 Bypass Blocks)
- `<main>` has `tabindex="-1"` so skip links can move focus to it
- Skip links programmatically focus AND scroll:

```tsx
// /src/lib/a11y/skipLinks.tsx
export function SkipLinks() {
  return (
    <nav aria-label="Skip links" className="skip-links">
      {[
        { href: "#main", label: "Skip to main content" },
        { href: "#nav-main", label: "Skip to navigation" },
        { href: "#copilot", label: "Skip to AI Copilot" },
      ].map(({ href, label }) => (
        <a
          key={href}
          href={href}
          onClick={(e) => {
            e.preventDefault();
            const target = document.querySelector<HTMLElement>(href);
            target?.focus({ preventScroll: false });
            target?.scrollIntoView({ block: "start" });
          }}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
```

On SPA route change (Next.js App Router), move focus to the new page's H1 and announce the page title in a polite live region:

```tsx
// /src/lib/a11y/useAnnouncer.ts
"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function RouteAnnouncer() {
  const pathname = usePathname();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const title = document.title;
    setMessage(`Navigated to ${title}`);
    const h1 = document.querySelector<HTMLHeadingElement>("main h1");
    h1?.focus?.();
  }, [pathname]);

  return (
    <div role="status" aria-live="polite" className="sr-only">{message}</div>
  );
}
```

---

# § 3. AI copilot architecture

## § 3.1 Adapter interface (mock ↔ real)

```ts
// /src/lib/copilot/types.ts
export type ConfidenceLevel = "low" | "moderate" | "high";
export type PageType = "dashboard" | "research" | "order_entry" | "order_review" | "holdings";

export interface Source {
  id: string;
  title: string;
  publisher: string;
  updatedISO: string;
  url?: string;
}

export interface CopilotResponse {
  id: string;
  content: string;
  confidence: ConfidenceLevel;
  sources: Source[];
  followUpSuggestions: string[];
  createdAt: string;
}

export interface CopilotContext {
  portfolio: { totalValue: number; allocationBySector: Record<string, number>; /* ... */ };
  positions: Record<string, { shares: number; avgCost: number; currentPrice: number; /* ... */ }>;
  market: Record<string, { last: number; dayChangePct: number; /* ... */ }>;
  glossary: Record<string, string>;
  user: { riskTolerance: string; goal: { type: string; target: number; byDate: string } };
  news: { id: string; title: string; publisher: string; ts: string; ticker?: string }[];
  riskRules: string[];
  requestedTicker?: string;
  requestedChart?: { type: string; series: unknown };
}

export interface ValidationResult {
  ok: boolean;
  reason?: "fabricated_source" | "trade_recommendation" | "forbidden_pattern" | "numeric_mismatch" | "malformed";
  severity: "none" | "downgrade" | "critical";
}

export interface CopilotAdapter {
  generateResponse(query: string, context: CopilotContext): Promise<CopilotResponse>;
  generateProactiveCard(page: PageType, context: CopilotContext): Promise<CopilotResponse>;
  validateResponse(response: CopilotResponse, context: CopilotContext): ValidationResult;
}
```

```ts
// /src/lib/copilot/index.ts
import { MockCopilotAdapter } from "./mockAdapter";
import { AnthropicCopilotAdapter } from "./anthropicAdapter";

const adapter = process.env.NEXT_PUBLIC_COPILOT_ADAPTER === "anthropic"
  ? new AnthropicCopilotAdapter()
  : new MockCopilotAdapter();

export const copilot = adapter;
```

The UI imports `copilot` only. It never knows which adapter is active.

## § 3.2 Mock adapter

```ts
// /src/lib/copilot/mockAdapter.ts
import type { CopilotAdapter, CopilotContext, CopilotResponse, PageType, ValidationResult } from "./types";
import { fixtures } from "@/data/copilotFixtures";
import { validateResponse } from "./validator";

export class MockCopilotAdapter implements CopilotAdapter {
  async generateResponse(query: string, context: CopilotContext): Promise<CopilotResponse> {
    const matched = fixtures.byQuery[query.trim().toLowerCase()]
      ?? fixtures.default(context);
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 400));
    return matched;
  }

  async generateProactiveCard(page: PageType, context: CopilotContext): Promise<CopilotResponse> {
    await new Promise((r) => setTimeout(r, 200));
    return fixtures.proactive[page](context);
  }

  validateResponse(response: CopilotResponse, context: CopilotContext): ValidationResult {
    return validateResponse(response, context);
  }
}
```

`copilotFixtures.ts` is hand-authored against `mockPortfolio.ts`. Every fixture response references a real source object and real numbers from the mock data.

## § 3.3 Anthropic adapter (production)

```ts
// /src/lib/copilot/anthropicAdapter.ts
import type { CopilotAdapter, CopilotContext, CopilotResponse, PageType, ValidationResult } from "./types";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { validateResponse } from "./validator";

export class AnthropicCopilotAdapter implements CopilotAdapter {
  async generateResponse(query: string, context: CopilotContext): Promise<CopilotResponse> {
    const res = await fetch("/api/copilot", {
      method: "POST",
      body: JSON.stringify({ query, context, systemPrompt: SYSTEM_PROMPT }),
    });
    if (!res.ok) return refusalResponse("I'm having trouble right now. Try Research or rephrase your question.");
    const raw = (await res.json()) as CopilotResponse;
    const validation = validateResponse(raw, context);
    if (validation.severity === "critical") {
      return refusalResponse("I can't help with that — please consult a qualified professional.");
    }
    if (validation.severity === "downgrade") {
      return { ...raw, confidence: "low" };
    }
    return raw;
  }

  async generateProactiveCard(page: PageType, context: CopilotContext): Promise<CopilotResponse> {
    // Same flow with a proactive-specific prompt
    // ...
    throw new Error("implement");
  }

  validateResponse(response: CopilotResponse, context: CopilotContext): ValidationResult {
    return validateResponse(response, context);
  }
}

function refusalResponse(content: string): CopilotResponse {
  return {
    id: crypto.randomUUID(),
    content,
    confidence: "low",
    sources: [],
    followUpSuggestions: [],
    createdAt: new Date().toISOString(),
  };
}
```

The actual Anthropic SDK call lives server-side in `/src/app/api/copilot/route.ts` (never in the client — API key must not ship to the browser).

## § 3.4 System prompt (locked, version-controlled)

```ts
// /src/lib/copilot/systemPrompt.ts
export const SYSTEM_PROMPT = `
You are Accrue's AI Copilot. You help novice investors and blind/low-vision
users understand their portfolio and markets. Follow these rules without
exception:

1. NEVER generate numerical values. If a number is not in CONTEXT, respond:
   "I don't have that data."
2. NEVER recommend specific trades. Do not tell users to buy, sell, or hold.
   Do not predict future prices.
3. NEVER speculate beyond provided CONTEXT. If CONTEXT is silent on a topic,
   say so.
4. ALWAYS cite from CONTEXT.sources. Every factual claim must map to a
   source id.
5. If uncertain, use the Low-confidence phrasing template and set
   confidence="low".
6. Use CONTEXT.glossary definitions VERBATIM when defining terms.
7. Use CONTEXT.risk_rules verbatim for risk questions.
8. Refuse out-of-scope questions (tax, legal, personal financial planning
   beyond education) with the refusal template.

Uncertainty phrasing templates:
- High confidence: "Based on [source], [claim]. Sources: [1], [2]."
- Moderate: "[Claim], based on [source]. Note: this reflects [caveat]. Sources: [1]."
- Low: "I'm not fully confident here. My best understanding, from [source], is [claim], but you should verify this before acting. Verify in Research →."
- Refusal: "I can't help with that — it's outside what I'm designed to do. For [topic], please consult a qualified professional. I can help with [alternative]."
- Data gap: "I don't have current data on [X]. The most recent I have is [Y, timestamp]. Try refreshing, or check Research for live figures."

Output strict JSON matching this schema, no additional prose before or after:
{
  "content": string,
  "confidence": "low" | "moderate" | "high",
  "sources": [
    { "id": string, "title": string, "publisher": string, "updatedISO": string, "url"?: string }
  ],
  "followUpSuggestions": string[]
}

Any literal numeric in "content" MUST appear verbatim in CONTEXT. Reference
numerics using handlebars tokens like {{portfolio.totalValue}} or
{{positions.AAPL.dayChangePct}}, which will be rendered post-generation.
`;
```

Do not edit this string ad hoc. Changes must be versioned, reviewed, and paired with red-team tests.

## § 3.5 Validation pipeline

```ts
// /src/lib/copilot/validator.ts
import type { CopilotContext, CopilotResponse, ValidationResult } from "./types";

const FORBIDDEN_PATTERNS = [
  /\b(will reach|expect(ed)? to hit|target price of|set to rally|guaranteed return|risk[-\s]?free)\b/i,
  /\b(you should (buy|sell)|i recommend (buying|selling|holding)|sell now|buy now)\b/i,
];

export function validateResponse(response: CopilotResponse, context: CopilotContext): ValidationResult {
  // 1. Schema check
  if (!response.content || !response.confidence || !Array.isArray(response.sources)) {
    return { ok: false, reason: "malformed", severity: "critical" };
  }

  // 2. Forbidden pattern
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(response.content)) {
      return { ok: false, reason: "forbidden_pattern", severity: "critical" };
    }
  }

  // 3. Source existence
  const contextSourceIds = new Set(collectContextSourceIds(context));
  for (const s of response.sources) {
    if (!contextSourceIds.has(s.id)) {
      return { ok: false, reason: "fabricated_source", severity: "critical" };
    }
  }

  // 4. Numeric match — every literal number in content must be resolvable from context
  const numericLiterals = extractNumericLiterals(response.content);
  const contextNumerics = collectContextNumerics(context);
  for (const n of numericLiterals) {
    if (!contextNumerics.has(n)) {
      // Tolerate single-decimal rounding drift
      const drift = [...contextNumerics].some((c) => Math.abs(Number(c) - Number(n)) < 0.1);
      if (!drift) {
        return { ok: false, reason: "numeric_mismatch", severity: "downgrade" };
      }
    }
  }

  return { ok: true, severity: "none" };
}

function extractNumericLiterals(content: string): Set<string> {
  const out = new Set<string>();
  const matches = content.match(/\d[\d,]*(\.\d+)?/g) ?? [];
  for (const m of matches) out.add(m.replace(/,/g, ""));
  return out;
}

function collectContextNumerics(context: CopilotContext): Set<string> {
  const out = new Set<string>();
  const walk = (v: unknown) => {
    if (typeof v === "number") out.add(String(v));
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v as object).forEach(walk);
  };
  walk(context);
  return out;
}

function collectContextSourceIds(context: CopilotContext): string[] {
  return [...(context.news ?? []).map((n) => n.id), "glossary", "portfolio", "market"];
}
```

## § 3.6 Proactive trigger dispatcher

```ts
// /src/lib/copilot/triggers.ts
import type { CopilotContext, CopilotResponse, PageType } from "./types";
import { copilot } from ".";

type Priority = "safety" | "user" | "info";
type QueuedMessage = { response: CopilotResponse; priority: Priority; announce: boolean };

class TriggerDispatcher {
  private lastProactiveAt = 0;
  private queue: QueuedMessage[] = [];

  async onPageLoad(page: PageType, context: CopilotContext, firstLoad: boolean): Promise<QueuedMessage | null> {
    if (page === "dashboard" && firstLoad) {
      const response = await copilot.generateProactiveCard(page, context);
      return { response, priority: "info", announce: false };
    }
    if (page === "research" && context.requestedTicker) {
      const response = await copilot.generateProactiveCard(page, context);
      return { response, priority: "info", announce: false };
    }
    if (page === "order_review") {
      const response = await copilot.generateProactiveCard(page, context);
      return { response, priority: "safety", announce: true };
    }
    return null;
  }

  dispatch(msg: QueuedMessage): QueuedMessage | null {
    const now = Date.now();
    if (now - this.lastProactiveAt < 30_000 && msg.priority === "info") {
      this.queue.push(msg);
      return null;
    }
    if (msg.priority === "safety") {
      this.queue = [msg, ...this.queue];
    }
    this.lastProactiveAt = now;
    return msg;
  }
}

export const triggerDispatcher = new TriggerDispatcher();
```

## § 3.7 Copilot panel component

```tsx
// /src/components/copilot/CopilotPanel.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { copilot } from "@/lib/copilot";
import { AIResponse } from "./AIResponse";
import { buildCopilotContext } from "@/lib/copilot/buildContext";
import type { CopilotResponse } from "@/lib/copilot/types";

export function CopilotPanel() {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState<CopilotResponse[]>([]);
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keyboard: Ctrl+/ toggles panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || submitting) return;
    setSubmitting(true);
    const context = await buildCopilotContext();
    const response = await copilot.generateResponse(query, context);
    setMessages((prev) => [...prev, response]);
    setQuery("");
    setSubmitting(false);
  }

  return (
    <aside
      id="copilot"
      aria-label="AI Copilot"
      tabIndex={-1}
      className={`copilot-panel ${open ? "open" : "collapsed"}`}
    >
      <header>
        <h2>AI Copilot</h2>
        <button type="button" aria-label="Close AI Copilot" onClick={() => setOpen(false)}>×</button>
      </header>

      <div role="log" aria-live="polite" aria-relevant="additions" className="copilot-messages">
        {messages.map((m) => <AIResponse key={m.id} response={m} />)}
      </div>

      <form onSubmit={handleSubmit}>
        <label htmlFor="copilot-input" className="sr-only">Ask a question</label>
        <textarea
          id="copilot-input"
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          placeholder="Ask a question…"
          rows={3}
        />
        <button type="submit" disabled={!query.trim() || submitting}>
          {submitting ? "Thinking…" : "Send"}
        </button>
      </form>
    </aside>
  );
}
```

---

# § 4. Data layer (mock)

## § 4.1 `/src/data/mockPortfolio.ts`

Authoritative source of all financial numbers. Every component reads from here.

**Required top-level fields:**
- `user`: `{ name, riskTolerance, experienceLevel, timeHorizon, goal }`
- `portfolio`: `{ totalValue, cashBalance, totalGainLoss, totalGainLossPercent, diversificationRating, allocationBySector }`
- `holdings`: `Array<Holding>`
- `transactions`: `Array<Transaction>`
- `goalProgress`: `{ target, current, projectedDate, onTrack }`

**Required per-holding fields:**
- `symbol, name, shares, avgCost, currentPrice, marketValue, gainLoss, gainLossPercent, direction`
- `priceHistory: { "1D": DataPoint[], "1W": DataPoint[], "1M": DataPoint[], "3M": DataPoint[], "1Y": DataPoint[], "5Y": DataPoint[] }`
- `fundamentals: { peRatio, marketCap, dividendYield, beta, /* ... */ }`
- `analystRatings: { strongBuy, buy, hold, sell, strongSell, priceTarget }`
- `earningsHistory: Array<{ quarter, actual, estimate, surprise }>`
- `relatedNews: Array<{ id, title, publisher, ts, summary, url }>`

**Required order-entry fields:**
- `estimatedFees`, `currentAskPrice`, `currentBidPrice`, `projectedPortfolioImpact`

Before building any component, add required fields here first. Do not invent numbers in JSX.

## § 4.2 `/src/data/glossary.ts`

Every financial term used anywhere in the UI has a definition here. Static module. The AI uses these verbatim via context injection.

## § 4.3 `/src/data/copilotFixtures.ts`

Hand-authored mock copilot responses. Every fixture pulls numbers from `mockPortfolio.ts` via template token expansion. Every fixture passes the validator.

**Required fixtures:**
- Proactive: dashboard load, research load, order review (risk check)
- Reactive: "Explain today's change", "Summarize my holdings", "What is [glossary term]", "Is this trade aligned with my goals?", "Explain this chart"

---

# § 5. Onboarding (§ 1 of existing design requirements)

**Conversational multi-step registration** — one question per screen:

1. Welcome + privacy reassurance
2. Risk tolerance
3. Financial goals
4. Experience level
5. Time horizon
6. Copilot introduction ("I'm the AI Copilot. I'll help you understand what you're looking at.")

**Requirements:**
- Stepper visible on every step (`§ 2.12`)
- Progress announced to screen readers: "Step 2 of 6, Your goals"
- Privacy reassurance inline on Step 1 ("Your information is encrypted and never sold.") — not buried in ToS
- Back button on every step except Step 1; keyboard navigable
- Final step's copilot intro references the data collected in earlier steps ("Since you chose Moderate risk tolerance, I'll flag trades that push your concentration above 40%.")

---

# § 6. Page-level specifications

## § 6.1 Dashboard

**Above the fold (no scroll):**
- Total portfolio value with today's change (arrow + sign + percent)
- Allocation donut chart (via `<ChartWrapper>`) with diversification indicator (Low / Moderate / Well Diversified)
- Primary action: "Make a trade"
- Goal progress bar (via native `<progress>` or `<div role="progressbar">`)

**Below the fold (progressive disclosure):**
- Holdings table (§ 2.8)
- News feed filtered to user's holdings only
- Watchlist

**Copilot proactive card on first load:** "Your portfolio is up 1.2% today, driven by Tech (+2.8%). Sources: [portfolio data]."

## § 6.2 Research / [ticker]

**Layout:**
- Ticker + company name as H1
- Current price with day change (arrow + sign + percent)
- Price history chart (via `<ChartWrapper>`) with timeframe selector
- Tabs (§ 2.6, manual activation): Overview, Fundamentals, Analysts, Earnings, News
- Inline copilot card: ticker summary

**Copilot hand-off banner:** If URL contains `?referrer=copilot`, show the banner pattern from § 3.4.

## § 6.3 Order entry

- Form fields (§ 2.2): ticker combobox, quantity number input, order type select
- Inline cost breakdown updates as quantity changes (debounced live region)
- "Review order" button → navigates to /orders/review

## § 6.4 Order review

See § 2.16.

---

# § 7. Accessibility audit checklist

Run before any merge.

## Structural
- [ ] One H1 per page
- [ ] Heading hierarchy unbroken (no H2 → H4 skip)
- [ ] One `<main>` per page with `id="main"` and `tabindex="-1"`
- [ ] Landmarks labelled per § 2.11 inventory
- [ ] Skip links functional (focus moves AND scrolls)

## Keyboard
- [ ] Every interactive element reachable via Tab
- [ ] Tab order follows DOM order (no `tabindex > 0`)
- [ ] Focus never trapped except in intentional dialogs
- [ ] Every dialog restores focus to invoker on close
- [ ] Every keyboard shortcut documented in the help dialog

## Screen reader
- [ ] Every interactive element has an accessible name
- [ ] Every form field has an associated `<label>`
- [ ] Every error is announced (role="alert" or aria-live)
- [ ] Every async content change in a live region is appropriately polite/assertive
- [ ] Chart summaries are accurate (spot-check three)

## Visual
- [ ] Every text pair passes WCAG 1.4.3 (4.5:1) or 1.4.6 (7:1) for body
- [ ] Every UI component boundary passes 1.4.11 (3:1)
- [ ] Focus ring visible and meets 2.4.11 Focus Appearance (2.2)
- [ ] Forced-colors rendering inspected; no meaning lost
- [ ] Page still usable at 400% zoom and 320px width (1.4.10 Reflow)

## Finance safety
- [ ] No trade bypasses the Review screen
- [ ] Acknowledgment checkbox present on Review
- [ ] Cancel and Confirm equally prominent
- [ ] All fees disclosed upfront
- [ ] No gamification patterns introduced

## AI
- [ ] Every AI response carries confidence + sources + badge
- [ ] Low-confidence responses show "Verify in Research" CTA
- [ ] Validator exercised in dev (MockAdapter runs it)
- [ ] Numeric literals in every tested response resolve to mock data
- [ ] Forbidden patterns not present in any fixture

## Motion
- [ ] Every animation respects `prefers-reduced-motion`
- [ ] No auto-playing media
- [ ] No parallax or decorative motion

---

# § 8. References (thesis-grounded)

See `/docs/references.md` for the full bibliography. Primary anchors for implementation decisions:

- **WCAG 2.2** (W3C, 2023) — normative conformance target
- **ARIA Authoring Practices Guide** (W3C, 2024) — pattern reference
- **Chartability POUR+CAF** (Elavsky, Bennett, & Moritz, 2022) — chart audit framework
- **Lundgard & Satyanarayan (2022)** — four-level chart description model
- **Meyer (2023)** — BLV data visualization thesis
- **Chaudhry & Kulkarni (2021)** — investing app design patterns
- **Sifat (2023)** — AI and retail investment
- **Ditaranto (2023)** — Investor perception of risk and UX
- **Singh (2025)** — StockStop
- **Nielsen (1995)** — usability heuristics
- **Bachtiar & Mulia (2023)** — fintech UX
- **Seo et al. (2024)** — conversational AI for BLV users
- **Reinders et al. (2025)** — accessible AI assistants
- **Amershi et al. (2019)** — human-AI interaction guidelines
- **Lee & See (2004)** — trust in automation
- **Bansal et al. (2021)** — AI explanations and team performance
- **Ji et al. (2023)** — hallucination in natural language generation
- **Zhang et al. (2023)** — hallucination in LLMs
- **Shabsigh & Boukherouaa (2023)** — GenAI in finance risk considerations

---

**End of spec.** If a section is silent on a decision you need to make, flag it and ask before inventing.
