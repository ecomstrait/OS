import Link from "next/link";
import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = { title: "Create your supplier account" };

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-950">Become a supplier</h1>
        <p className="mt-1 text-sm text-ink-500">
          Create your account, then complete onboarding to get verified.
        </p>
      </div>

      <SignupForm />

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-ink-100" />
        <span className="text-xs text-ink-400">or</span>
        <span className="h-px flex-1 bg-ink-100" />
      </div>

      <GoogleButton label="Sign up with Google" />

      <p className="text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
