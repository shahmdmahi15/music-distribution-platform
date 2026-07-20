import VerifyMfaForm from "@/components/auth/verify-mfa.form";

export default async function VerifyMfaPage({
  searchParams,
}: {
  searchParams: Promise<{ userId: string }>;
}) {
  const userId = (await searchParams).userId;
  return <VerifyMfaForm userId={userId} />;
}
