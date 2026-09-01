import "server-only";

/**
 * Attaches/detaches a merchant's connected domain on the actual Vercel
 * project — the piece the Settings UI has claimed all along ("we provision
 * the SSL certificate automatically") without any code behind it. DNS
 * pointing at Vercel's IP was never enough on its own: Vercel only routes
 * traffic for (and issues SSL for) a domain that's explicitly attached to a
 * project, which nothing in this codebase did before this file existed.
 *
 * Optional by design, like every external integration in this app —
 * `checkStoreDomain` still verifies DNS and persists `domain_verified_at`
 * (which is what actually turns on host-based routing) whether or not
 * Vercel is configured; this only adds the extra step of also registering
 * the domain with Vercel itself when it is.
 */

const API = "https://api.vercel.com";

export function isVercelConfigured(): boolean {
  return Boolean(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID);
}

function projectDomainsUrl(): string {
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  const qs = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
  return `${API}/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains${qs}`;
}

function authHeaders(): HeadersInit {
  return { Authorization: `Bearer ${process.env.VERCEL_TOKEN}`, "Content-Type": "application/json" };
}

/** Attach a domain to this Vercel project. Idempotent — already-attached is success, not an error. */
export async function addProjectDomain(domain: string): Promise<{ ok: boolean; error?: string }> {
  if (!isVercelConfigured()) return { ok: false, error: "Vercel isn't configured." };

  try {
    const res = await fetch(projectDomainsUrl(), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name: domain }),
    });
    if (res.ok) return { ok: true };

    const body = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } };
    // Already attached (to this project, from a previous verification) — not a failure.
    if (body.error?.code === "domain_already_in_use" || res.status === 409) return { ok: true };
    return { ok: false, error: body.error?.message || `Vercel returned ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not reach Vercel." };
  }
}

/** Detach a domain — called when a merchant clears or repoints their domain, so it doesn't sit attached forever. */
export async function removeProjectDomain(domain: string): Promise<{ ok: boolean; error?: string }> {
  if (!isVercelConfigured()) return { ok: false, error: "Vercel isn't configured." };

  try {
    const teamId = process.env.VERCEL_TEAM_ID?.trim();
    const qs = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
    const res = await fetch(`${API}/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${encodeURIComponent(domain)}${qs}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    // Already gone is fine — the end state (not attached) is what we wanted.
    if (res.ok || res.status === 404) return { ok: true };
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    return { ok: false, error: body.error?.message || `Vercel returned ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not reach Vercel." };
  }
}
