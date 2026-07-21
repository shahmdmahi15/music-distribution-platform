import { VerifyForm } from "@/components/auth/verify.form";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token: string }>;
}) {
  const token = (await searchParams).token;
  return <VerifyForm token={token} />;
}
