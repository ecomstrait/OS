"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "@ecomstrait/auth/client";
import { Button, TextField } from "@/components/ui";
import { authCallbackUrl } from "@/lib/site-url";

/**
 * Both states (the request form, and the "check your inbox" confirmation)
 * live in one component — unlike signup, which navigates to a separate
 * /verify-email page, here the heading text depends on which state we're in,
 * so page.tsx stays a thin shell and this owns both.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    const supabase = createClient();
    // The recovery link Supabase emails carries a `?code=` back to our existing
    // /auth/callback (same PKCE exchange signup confirmation already uses);
    // `next` tells that route where to send the now-signed-in visitor.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${authCallbackUrl()}?next=/reset-password`,
    });
    if (error) {
      setError(error.message);
      setStatus("idle");
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <MailCheck className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink-950">Check your inbox</h1>
          <p className="mt-2 text-sm text-ink-500">
            If an account exists for <span className="font-medium text-ink-800">{email}</span>,
            we&apos;ve sent a link to reset your password.
          </p>
        </div>
        <p className="text-sm text-ink-500">
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">Back to log in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-950">Forgot your password?</h1>
        <p className="mt-1 text-sm text-ink-500">
          Enter the email on your account and we&apos;ll send you a link to reset it.
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField id="email" label="Email" type="email" required autoComplete="email" placeholder="you@business.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
        </Button>
      </form>
      <p className="text-center text-sm text-ink-500">
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">Back to log in</Link>
      </p>
    </div>
  );
}
