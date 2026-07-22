import type { Metadata } from "next";
import { createAdminClient } from "@ecomstrait/db";
import type { UserRole } from "@ecomstrait/db/types";
import { getUser } from "@ecomstrait/auth/session";
import { RoleSelect } from "@/components/admin/role-select";

export const metadata: Metadata = { title: "Users — Admin" };

export default async function AdminUsersPage() {
  const client = createAdminClient();
  if (!client) return <p className="text-sm text-red-600">Server is not configured.</p>;

  const me = await getUser();

  // Emails live in auth.users → use the admin API, then merge roles from profiles.
  const { data: authList } = await client.auth.admin.listUsers({ perPage: 200 });
  const { data: profiles } = await client.from("profiles").select("user_id, role, full_name");

  const roleById = new Map<string, UserRole>();
  const nameById = new Map<string, string | null>();
  (profiles ?? []).forEach((p) => {
    roleById.set(p.user_id, p.role);
    nameById.set(p.user_id, p.full_name);
  });

  const users = (authList?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? "—",
    name: nameById.get(u.id) ?? (u.user_metadata?.full_name as string) ?? "",
    role: roleById.get(u.id) ?? ("customer" as UserRole),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-950">Users</h1>
      <p className="mt-1 text-sm text-ink-500">{users.length} accounts. Change a role to grant access.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Name</th>
              <th className="px-4 py-3 text-right font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-ink-50 last:border-0">
                <td className="px-4 py-3 font-medium text-ink-900">
                  {u.email}
                  {me?.id === u.id && <span className="ml-2 text-xs text-ink-400">(you)</span>}
                </td>
                <td className="hidden px-4 py-3 text-ink-500 sm:table-cell">{u.name || "—"}</td>
                <td className="px-4 py-3">
                  <RoleSelect userId={u.id} role={u.role} disabled={me?.id === u.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
