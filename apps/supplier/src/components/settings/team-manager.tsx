"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import type { SupplierMember } from "@ecomstrait/db/types";
import { inviteMember, removeMember } from "@/lib/team-actions";

export function TeamManager({ members }: { members: SupplierMember[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    const value = email;
    start(async () => {
      const res = await inviteMember(value);
      if (res?.error) setError(res.error);
      else {
        setEmail("");
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    start(async () => {
      await removeMember(id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={invite} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@email.com"
          aria-label="Invite teammate email"
          className="h-11 flex-1 rounded-xl border border-ink-200 bg-white px-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Invite
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {members.length === 0 ? (
        <p className="text-sm text-ink-400">No teammates yet. Invite someone to help manage your store.</p>
      ) : (
        <ul className="divide-y divide-ink-50 rounded-xl border border-ink-100">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900">{m.invited_email}</p>
                <p className="text-xs capitalize text-ink-400">
                  {m.role.replace("_", " ")} · {m.status}
                </p>
              </div>
              <button
                onClick={() => remove(m.id)}
                disabled={pending}
                aria-label={`Remove ${m.invited_email}`}
                className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
