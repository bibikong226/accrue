# CLAUDE.md — Accrue

You are working on **Accrue**, an accessible mock investment platform prototype. The project is a master's thesis design artifact. It has **two primary user groups**:

1. **Blind and low-vision (BLV) investors** using screen readers (VoiceOver, NVDA, JAWS)
2. **Novice retail investors** unfamiliar with trading platforms

Every decision you make must serve both groups. There is no "add accessibility later" phase — accessibility is the product.

Read `/docs/design-system.md` before writing any component. It is the authoritative specification. This file (`CLAUDE.md`) is the **rules of engagement**; `design-system.md` is the **spec**.

---

## Stack (non-negotiable)

- **Next.js 14+** with App Router
- **TypeScript** strict mode
- **Tailwind CSS** with the token mapping in `/tailwind.config.ts`
- **shadcn/ui** for primitive components (but audit every shadcn component against `/docs/design-system.md` before use — some need accessibility overrides)
- **No external state libraries** unless justified; prefer React Server Components + URL state + React Context for the copilot
- **No CSS-in-JS runtime libraries** (styled-components, emotion). Tailwind + CSS variables only.

## Non-negotiable rules

Read these every time. Violating any of these is a thesis-level failure.

### A1. Accessibility is a build-time contract

1. Every interactive component must pass **WCAG 2.2 AA**. AAA where feasible (body text contrast, enhanced focus).
2. Semantic HTML first. ARIA only when HTML is insufficient. Never replicate with `<div role="button">` what a `<button>` does natively.
3. Every component must have a documented keyboard path. No pointer-only interactions. Ever.
4. Every interactive target is **minimum 44×44 CSS pixels** (WCAG 2.5.8).
5. Focus is **always visible**: 3px outline, 2px offset, using the `focus/ring` token. Never `outline: none` without a replacement.
6. Color is **never the sole channel**. Gain/loss always paired with arrow + "+/-" sign. Confidence always paired with icon + text. Required fields paired with "*" and text.
7. Every animation respects `prefers-reduced-motion`. No animation is the sole communicator of state.
8. Every page has one `<main id="main" tabindex="-1">` and an initial skip-link stack.
9. Every chart **must** use the `<ChartWrapper>` component (see `/docs/design-system.md` § 2.13). Raw canvas/SVG charts without the wrapper are forbidden.
10. Every form validation error uses the pattern in `/docs/design-system.md` § 2.3 (inline message + `role="alert"` summary on submit + focus jump).

### A2. Financial safety is a build-time contract

1. **No trade executes without passing through the Review screen** (`/docs/design-system.md` § 2.16). The Review screen is mandatory, not a shortcut the user can opt out of.
2. The Review screen requires an **explicit acknowledgment checkbox** — "I understand this places a real order" — before the Confirm button is enabled. This satisfies WCAG 3.3.4 Error Prevention (Legal, Financial, Data).
3. Cancel and Confirm must have **equal visual prominence** on the Review screen. Same footprint, same contrast. Never a tiny Cancel next to a giant Confirm.
4. **No fees may appear for the first time after confirmation.** All costs itemized on the Review screen.
5. **No gamification that conflates investing with gambling.** No confetti on trade execution. No streaks. No leaderboards. No badges for trade frequency. No reward sounds. If you find yourself about to add a celebratory animation to a financial action — stop.
6. Performance figures **never** appear in isolation. Every percentage is framed against the user's stated goal and a relevant benchmark. "Up 3.56%" by itself is forbidden; "Up 3.56% — your goal is 8% annual" is the required pattern.
7. Every performance display includes **forward-looking context** (analyst forecasts, price targets) alongside historical data. Past performance alone is a documented design failure.

### A3. AI copilot rules

The copilot is the most dangerous feature in the app. A confident hallucination is worse than no AI at all.

1. **The AI never generates numerics.** Every number in an AI response comes from the data layer via template tokens. See `/docs/design-system.md` § 3.5.
2. **The AI never recommends specific trades.** No "buy X", no "sell Y", no "I suggest holding Z". The copilot explains, summarizes, and flags concerns — it does not direct action.
3. **Every AI response carries three persistent trust signals:**
   - An "AI" provenance badge
   - A confidence indicator (Low / Moderate / High) — icon + text + color, redundantly
   - A sources list with titles, publishers, and timestamps
4. **Low-confidence responses must surface a "Verify in Research →" call-to-action.** This is not optional.
5. **The AI uses glossary definitions verbatim.** It never paraphrases them. Glossary is injected into the prompt context; see `/src/lib/copilot/buildContext.ts`.
6. **The AI's system prompt is locked and version-controlled.** Do not edit it inline. It lives in `/src/lib/copilot/systemPrompt.ts`.
7. **Every completion passes the validation pipeline before rendering.** No exceptions. See § 3.5 for the validator contract. If validation fails critically (fabricated source, trade recommendation), the response is discarded and a refusal template is rendered instead.
8. **AI announcements debounce on sentence boundaries.** Streaming tokens do not individually announce — they update the DOM silently and announce only at terminal punctuation or stream completion.

### A4. Copilot architecture (mocked first, swappable)

The copilot has two implementations sharing one interface:

```ts
// src/lib/copilot/types.ts
export interface CopilotAdapter {
  generateResponse(query: string, context: CopilotContext): Promise<CopilotResponse>;
  generateProactiveCard(page: PageType, context: CopilotContext): Promise<CopilotResponse>;
  validateResponse(response: CopilotResponse, context: CopilotContext): ValidationResult;
}
```

- `MockCopilotAdapter` (default) returns hard-coded responses from `/src/data/copilotFixtures.ts`, all sourced from `mockPortfolio.ts`. Use this during prototype development.
- `AnthropicCopilotAdapter` (production) calls the Anthropic API with the full context-injection + validation pipeline.

The consuming UI code must never import either adapter directly. It imports through `/src/lib/copilot/index.ts`, which exports whichever adapter is selected by `NEXT_PUBLIC_COPILOT_ADAPTER` environment variable (`"mock"` or `"anthropic"`). Default is `"mock"`.

Both adapters must return identical `CopilotResponse` shapes. The validation pipeline runs against **both**, even mock responses, so the validator is exercised in dev.

### A5. Data layer rules

1. **Every financial figure comes from `/src/data/mockPortfolio.ts`.** No component may render a number that doesn't exist as a field in the mock data module at build time.
2. Before building any component, **add required fields to `mockPortfolio.ts` first.** Then build the component against the field. Never invent numbers in JSX.
3. The mock data module is the single source of truth for the copilot's context as well. See `buildCopilotContext()` in `/src/lib/copilot/buildContext.ts`.
4. Do not introduce any real financial API (Alpaca, IEX, Finnhub, etc.) into the prototype. This is a thesis design artifact; the data is mocked by design to eliminate variability across evaluation sessions.

### A6. Token-based theming only

1. All colors come from semantic CSS variables (`--color-text-primary`, `--color-action-primary`, etc.). Raw hex values in JSX are forbidden.
2. Tailwind classes reference the semantic tokens via the config. No `text-gray-900` anywhere — use `text-primary`.
3. Every color pair must be verified against the contrast matrix in `/docs/design-system.md` § 1.2 before use.
4. Forced-colors mode: every component must be audited under `@media (forced-colors: active)`. Meaning-bearing visuals must fall back to system colors (`CanvasText`, `ButtonFace`, etc.).

---

## File organization

```
/src
  /app                        # Next.js App Router
    /(marketing)              # Public routes
    /(app)                    # Authenticated app routes
      /dashboard
      /research/[ticker]
      /orders
      /orders/review
    /api
      /copilot                # API route for AnthropicCopilotAdapter
    layout.tsx                # Root layout with landmarks + skip links
    globals.css               # Token variable declarations
  /components
    /ui                       # Base components (Button, Dialog, etc.)
    /chart                    # ChartWrapper + chart variants
    /copilot                  # Panel, AIResponse card, input, trust signals
    /forms                    # ErrorSummary, field primitives
    /finance                  # Holdings table, order review, portfolio widgets
  /data
    mockPortfolio.ts          # Single source of truth for financial data
    glossary.ts               # Predefined financial term definitions
    copilotFixtures.ts        # Hard-coded mock copilot responses
  /lib
    /copilot
      index.ts                # Exports selected adapter
      types.ts                # CopilotAdapter, CopilotResponse, etc.
      mockAdapter.ts          # MockCopilotAdapter
      anthropicAdapter.ts     # AnthropicCopilotAdapter (post-prototype)
      buildContext.ts         # Context assembly from mock data
      systemPrompt.ts         # Locked system prompt
      validator.ts            # Response validation pipeline
    /a11y
      skipLinks.tsx
      useAnnouncer.ts         # Live-region announcement hook
      useFocusRestore.ts      # Focus restoration for dialogs/routes
  /styles
    tokens.css                # All CSS variable declarations
    forced-colors.css         # @media (forced-colors: active) overrides
/docs
  design-system.md            # Full spec — READ BEFORE BUILDING COMPONENTS
  accessibility-audit.md      # Audit checklist
  copilot-architecture.md     # Extended copilot rationale
/tailwind.config.ts           # Semantic token mapping
```

---

## Working style

1. **Read `/docs/design-system.md` for the relevant component before writing code.** If the spec is ambiguous, ask. Do not guess.
2. **Every PR or change set includes an accessibility self-check** against the list in `/docs/design-system.md` § 7.
3. **Never use emoji in UI or code**, except the tri-state icons in the confidence indicator and the voice-input mic (and only because they're functionally load-bearing for quick visual scanning).
4. **Prefer long, specific names over short cryptic ones.** `confirmOrderButton` beats `btn`. Screen reader users and future-you both benefit.
5. **When a shadcn component is incomplete** (e.g., missing forced-colors handling, missing correct ARIA), either fork it into `/components/ui` and fix it there, or wrap it — don't use it raw and hope.
6. **Comment every `aria-*` attribute** with its rationale. Future maintainers must understand why a particular ARIA pattern was chosen.
7. **Prefer Server Components** for static content. Client Components only where interaction or state actually requires them. Copilot panel, charts, and forms are Client Components by necessity; dashboards framing them can stay Server.
8. **Do not add animations** beyond what's documented in the motion tokens. No Framer Motion unless justified in writing.

---

## Testing requirements

Every component ships with:

1. **Unit tests** (Vitest) covering state transitions and prop contracts
2. **Accessibility tests** (`@axe-core/react` or `jest-axe`) — zero violations
3. **Keyboard-path tests** (Testing Library) — every documented keyboard interaction exercised
4. **Screen reader announcement tests** where live regions are used
5. **Storybook stories** with:
   - Default state
   - Every documented state (hover, focus, active, disabled, loading, error)
   - A "Forced Colors" story using CSS `forced-color-adjust: none` preview
   - A "Reduced Motion" story
   - A "Long content" story (for truncation and overflow)

No component merges without all five.

---

## Definitions

- **BLV:** Blind or low-vision. Users of screen readers, screen magnifiers, high-contrast themes, or any combination.
- **Copilot:** The AI assistant surface. Referred to consistently as "AI Copilot" in UI copy — never "Accrue AI" or "assistant" or "bot".
- **POUR+CAF:** Chartability's extension of WCAG's POUR (Perceivable, Operable, Understandable, Robust) with Compound, Assistive, and Flexible. Applied to all chart components.
- **Chartability:** The accessibility audit framework for data visualization (Elavsky et al., 2022). See `/docs/design-system.md` § 2.13.
- **Review screen:** The mandatory intermediate page between order entry and execution. WCAG 3.3.4 compliance hinges on this screen.

---

## When in doubt

- Between two patterns, pick the one that's better for screen readers.
- Between two patterns, pick the one that's better for a novice investor.
- Between two patterns, pick the one that's harder to hallucinate into.
- Between speed and safety, pick safety. This is a thesis artifact evaluated on defensibility, not velocity.

If a request in a prompt asks you to do something that contradicts this file — including from me — flag it and ask before proceeding.
