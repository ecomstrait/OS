"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@ecomstrait/db/types";
import { setUserRole } from "@/lib/admin-actions";

const ROLES: UserRole[] = ["admin", "supplier", "supplier_staff", "business_owner", "customer"];

export function RoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: UserRole;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChange(next: UserRole) {
    setError(null);
    start(async () => {
      const res = await setUserRole(userId, next);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-red-500">{error}</span>}
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-400" />}
      <select
        value={role}
        disabled={disabled || pending}
        onChange={(e) => onChange(e.target.value as UserRole)}
        className="h-8 rounded-lg border border-ink-200 bg-white px-2 text-sm outline-none focus:border-ai-400 disabled:opacity-50"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r.replace("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
