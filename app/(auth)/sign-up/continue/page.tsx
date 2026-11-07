import type { Metadata } from "next";

import { ContinueSignUpForm } from "@/components/auth/continue-sign-up-form";

export const metadata: Metadata = { title: "Finish signing up" };

export default function ContinueSignUpPage() {
  return <ContinueSignUpForm />;
}
