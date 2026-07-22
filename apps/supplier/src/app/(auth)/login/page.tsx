import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-950">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-500">Log in to your supplier account.</p>
      </div>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-ink-100" />
        <span className="text-xs text-ink-400">or</span>
        <span className="h-px flex-1 bg-ink-100" />
      </div>

      <GoogleButton />

      <p className="text-center text-sm text-ink-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-brand-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
