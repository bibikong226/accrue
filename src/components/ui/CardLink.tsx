import Link from "next/link";

interface CardLinkProps {
  href: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

/**
 * Accessible card link per § 12.2.
 * Uses one interactive <a> element with aria-labelledby for heading
 * and aria-describedby for description.
 */
export function CardLink({ href, title, description, children }: CardLinkProps) {
  const titleId = `card-title-${title.replace(/\s+/g, "-").toLowerCase()}`;
  const descId = description
    ? `card-desc-${title.replace(/\s+/g, "-").toLowerCase()}`
    : undefined;

  return (
    <Link
      href={href}
      /* a11y: aria-labelledby points to the heading so screen readers announce the card name */
      aria-labelledby={titleId}
      /* a11y: aria-describedby points to the description for additional context */
      aria-describedby={descId}
      className="block rounded-2xl border border-border-default bg-surface-raised p-5 hover:border-action-primary hover:shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      <h3 id={titleId} className="text-base font-semibold text-primary">
        {title}
      </h3>
      {description && (
        <p id={descId} className="mt-1 text-sm text-secondary">
          {description}
        </p>
      )}
      {children}
    </Link>
  );
}
