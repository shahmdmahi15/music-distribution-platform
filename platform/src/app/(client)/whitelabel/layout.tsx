import { meAction } from "@/actions/auth/me.action";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";

export const dynamic = "force-dynamic";

/**
 * Server-level access boundary for the WhiteLabel Management Console.
 * Guarantees that unapproved or unpaid clients can never access /whitelabel/* routes.
 */
export default async function WhiteLabelConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await meAction();

  if (!me.success || !me.user) {
    redirect("/auth/login?redirect=/whitelabel");
  }

  // If user is a client and does NOT have an active, approved WhiteLabel,
  // redirect them immediately to the application status & onboarding hub at `/`
  if (me.user.role === Role.CLIENT && !me.user.isWhiteLabelActive) {
    redirect("/");
  }

  return <>{children}</>;
}
