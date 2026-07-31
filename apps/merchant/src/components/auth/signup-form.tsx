"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@ecomstrait/auth/client";
import { Button, TextField } from "@/components/ui";
import { authCallbackUrl } from "@/lib/site-url";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setStatus("loading");
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Entrepreneurs use the `business_owner` role (self-assignable at signup).
        data: { full_name: fullName, role: "business_owner" },
        emailRedirectTo: authCallbackUrl(),
      },
    });
    if (error) {
      setError(error.message);
      setStatus("idle");
      return;
    }
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TextField id="fullName" label="Full name" required autoComplete="name" placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <TextField id="email" label="Email" type="email" required autoComplete="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField id="password" label="Password" type="password" required autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
      </Button>
    </form>
  );
}
