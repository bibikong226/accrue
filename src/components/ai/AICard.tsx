"use client";
import { useId } from "react";

type Confidence = "high" | "moderate" | "low";

export interface AISource {
  id: string;
  label: string;
  provider: string;
  kind: "real" | "prototype";
  url?: string;
  updatedISO?: string;
}

export interface AICardProps {
  confidence: Confidence;
  body: React.ReactNode;
  sources: AISource[];
  query?: string;
}

const CONF: Record<Confidence, string> = {
  high: "High", moderate: "Moderate", low: "Low",
};

export function AICard({ confidence, body, sources, query }: AICardProps) {
  const id = useId();
  const sourceSummary = sources
    .map(s => `${s.label} from ${s.provider}${s.kind === "prototype" ? " (prototype)" : ""}`)
    .join(", ");

  return (
    <article
      className={`ai-card ai-card--${confidence}`}
      aria-labelledby={`${id}-label`}
      aria-describedby={`${id}-body`}
      tabIndex={0}
    >
      {/* Hidden; announced FIRST by screen readers via aria-labelledby */}
      <span id={`${id}-label`} className="sr-only">
        AI insight, {CONF[confidence]} confidence. Sources: {sourceSummary}.
      </span>

      <header className="ai-card__head">
        <span className="ai-badge" aria-hidden="true">AI</span>
        <span className={`conf-chip conf-chip--${confidence}`} aria-hidden="true">
          <span className="conf-dot" />
          Confidence: {CONF[confidence]}
        </span>
      </header>

      <p id={`${id}-body`} className="ai-card__body">{body}</p>

      <footer className="ai-card__foot">
        <details>
          <summary>Sources ({sources.length})</summary>
          <ol>
            {sources.map(s => (
              <li key={s.id}>
                {s.url
                  ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>
                  : <span>{s.label}</span>}
                {" — "}{s.provider}
                {s.kind === "prototype" && (
                  <span className="source-badge" aria-label="prototype data">PROTOTYPE</span>
                )}
              </li>
            ))}
          </ol>
        </details>

        {confidence === "low" && query && (
          <a href={`/research?q=${encodeURIComponent(query)}`} className="btn btn--accent btn--small">
            Verify in Research →
          </a>
        )}
      </footer>
    </article>
  );
}
