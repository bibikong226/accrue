import { clsx, type ClassValue } from "clsx";

/**
 * Merge Tailwind CSS classes with proper conflict resolution.
 * Uses clsx for conditional class joining.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
