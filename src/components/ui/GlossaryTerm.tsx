"use client";

import { useState, useRef, useId } from "react";
import { glossary } from "@/data/glossary";

interface GlossaryTermProps {
  term: string;
  children?: React.ReactNode;
}

/**
 * Inline glossary tooltip per § 2.2.
 *
 * - Trigger is <button type="button"> with dotted underline — NEVER <span> with tabindex
 * - HTML title attribute FORBIDDEN
 * - Popover uses role="tooltip" via aria-describedby
 * - Escape closes, focus stays on trigger
 * - On focus, VoiceOver announces the full definition as part of the button description
 * - Definition from glossary.ts — used VERBATIM, never AI-paraphrased
 */
export function GlossaryTerm({ term, children }: GlossaryTermProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();
  const descriptionId = useId();

  const entry = glossary.find(
    (g) => g.term.toLowerCase() === term.toLowerCase()
  );
  const definition = entry?.definition ?? `Definition not found for "${term}".`;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      setIsOpen(false);
      /* a11y: Focus stays on trigger after closing per § 2.2 */
      buttonRef.current?.focus();
    }
  }

  return (
    <span className="relative inline-block" onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        /* a11y: aria-describedby ALWAYS points to the hidden definition so VoiceOver
           reads the full definition on focus, even when the tooltip is visually closed.
           This satisfies § 2.2: "On focus, VoiceOver announces the full definition
           as part of the button description." */
        aria-describedby={descriptionId}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onClick={() => setIsOpen((prev) => !prev)}
        className="text-inherit font-inherit underline decoration-dotted decoration-[1.5px] underline-offset-2 decoration-feedback-warning cursor-help focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring rounded min-h-[44px] inline-flex items-center"
      >
        {children ?? term}
      </button>

      {/* a11y: Hidden description always in the DOM so VoiceOver reads it on focus.
          This is the sr-only version that's always available. */}
      <span id={descriptionId} className="sr-only">
        {term}: {definition}
      </span>

      {/* Visual tooltip — only shown on hover/focus/click */}
      {isOpen && (
        <span
          id={tooltipId}
          /* a11y: role="tooltip" for the visual popover */
          role="tooltip"
          /* a11y: aria-hidden because the sr-only description above already provides
             the content to screen readers. This prevents double-announcement. */
          aria-hidden="true"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 rounded-lg bg-surface-raised border border-border-default shadow-md text-sm text-primary"
        >
          <strong className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
            {term}
          </strong>
          {definition}
        </span>
      )}
    </span>
  );
}
