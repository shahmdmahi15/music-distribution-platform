import { RegisterForm } from "@/components/auth/register.form";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Initializing registration secure portal...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
