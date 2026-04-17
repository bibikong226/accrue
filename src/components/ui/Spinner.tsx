/**
 * Loading spinner.
 * aria-hidden="true" because the parent button/region announces the loading state.
 * Respects prefers-reduced-motion by stopping animation.
 */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      /* a11y: Hidden from screen readers — parent element communicates busy state */
      aria-hidden="true"
      className={`animate-spin h-4 w-4 motion-reduce:animate-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
