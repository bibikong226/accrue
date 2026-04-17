import { redirect } from "next/navigation";

/**
 * Root page redirects to onboarding for new users.
 * In a real app this would check auth state first.
 */
export default function RootPage() {
  redirect("/onboarding");
}
