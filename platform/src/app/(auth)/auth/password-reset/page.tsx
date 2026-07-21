import { PasswordResetForm } from "@/components/auth/password-reset.form";

export default async function PasswordResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token: string }>;
}) {
  const token = (await searchParams).token;
  return <PasswordResetForm token={token} />;
}
