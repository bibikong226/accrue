"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { findGlossaryEntry } from "@/data/glossary";

interface GlossaryTermProps {
  /** The glossary term name, e.g. "ETF", "Cost basis" */
  termKey: string;
  children: React.ReactNode;
}

/**
 * GlossaryTerm — renders an inline button that reveals a financial term definition.
 *
 * Accessibility contract:
 * - Always a <button type="button"> (never <span tabindex>)
 * - aria-describedby ALWAYS points to the sr-only definition, even when tooltip is closed
 * - Escape key closes the visual tooltip
 * - Definition comes from glossary.ts verbatim (CLAUDE.md A3.5)
 * - Minimum 44px height touch target
 * - Visible focus indicator: 3px solid #2563EB, 2px offset
 */
export default function GlossaryTerm({ termKey, children }: GlossaryTermProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();

  const entry = findGlossaryEntry(termKey);
  const definitionId = `glossary-def-${uniqueId}`;
  const tooltipId = `glossary-tooltip-${uniqueId}`;

  if (!entry) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[GlossaryTerm] No glossary entry found for key: "${termKey}"`);
    }
    return <span>{children}</span>;
  }

  /* Close tooltip on Escape */
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  /* Close tooltip on outside click */
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <span className="relative inline-block">
      {/*
        The sr-only definition is ALWAYS in the DOM so aria-describedby
        works regardless of tooltip visibility.
      */}
      <span id={definitionId} className="sr-only">
        {/* a11y: persistent sr-only definition ensures screen readers always have access to the term meaning */}
        {entry.definition}
      </span>

      <button
        ref={buttonRef}
        type="button"
        /* a11y: aria-describedby always references the sr-only definition so screen readers announce it on focus */
        aria-describedby={definitionId}
        /* a11y: aria-expanded communicates whether the visual tooltip is currently shown */
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={[
          "inline-flex items-center min-h-[44px]",
          "border-b-2 border-dotted border-action-primary",
          "text-action-primary font-medium cursor-pointer",
          "bg-transparent px-0",
          "hover:border-action-primary-hover hover:text-action-primary-hover",
          "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
        ].join(" ")}
      >
        {children}
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          /* a11y: role="tooltip" identifies this as supplementary description content */
          role="tooltip"
          className={[
            "absolute z-50 left-0 top-full mt-2",
            "w-72 p-4 rounded-lg shadow-lg",
            "bg-surface-raised border border-border-default",
            "text-sm text-primary leading-relaxed",
          ].join(" ")}
        >
          <p className="font-semibold mb-1">{entry.term}</p>
          <p>{entry.definition}</p>
        </div>
      )}
    </span>
  );
}
