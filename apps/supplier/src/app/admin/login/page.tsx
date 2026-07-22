import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink-950 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2 text-white">
          <ShieldCheck className="h-6 w-6 text-ai-400" />
          <span className="text-lg font-bold">
            EcomStrait <span className="text-ai-400">Admin</span>
          </span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-ink-950">Admin sign in</h1>
          <p className="mb-5 mt-1 text-sm text-ink-500">Restricted to platform administrators.</p>
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
