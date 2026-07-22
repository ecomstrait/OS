import Link from "next/link";
import type { Metadata } from "next";
import { MailCheck } from "lucide-react";

export const metadata: Metadata = { title: "Confirm your email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <MailCheck className="h-6 w-6" />
      </span>
      <div>
        <h1 className="text-2xl font-bold text-ink-950">Check your inbox</h1>
        <p className="mt-2 text-sm text-ink-500">
          We sent a confirmation link{email ? " to " : ""}
          {email ? <span className="font-medium text-ink-800">{email}</span> : ""}. Click it to
          activate your account and continue to onboarding.
        </p>
      </div>
      <p className="text-sm text-ink-500">
        Already confirmed?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
