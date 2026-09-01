import "server-only";

import type { ModelRole } from "./types";

/**
 * One env var per role, resolved to a model *alias* — a name defined in the
 * gateway's own config (e.g. `litellm_config.yaml`), never a vendor model id.
 * The vendor mapping lives entirely on the gateway side, so repointing
 * `AI_MODEL_REASONING` from a Claude alias to a self-hosted Llama alias is a
 * one-line config change here, with zero code touched.
 */
const ROLE_ENV: Record<ModelRole, string> = {
  reasoning: "AI_MODEL_REASONING",
  workhorse: "AI_MODEL_WORKHORSE",
  "fast-cheap": "AI_MODEL_FAST_CHEAP",
  embeddings: "AI_MODEL_EMBEDDINGS",
};

/**
 * Resolve a role to its configured model alias.
 *
 * Deliberately no hardcoded fallback. `GROQ_MODEL` in the pre-gateway code
 * taught us this the hard way: a hardcoded fallback to a model that gets
 * quietly retired makes every call 404 while the feature *looks* alive,
 * serving degraded output with nothing in the logs to explain why. A missing
 * role env var throws instead, so the failure is loud and diagnosable.
 */
export function resolveModel(role: ModelRole): string {
  const envVar = ROLE_ENV[role];
  const alias = process.env[envVar]?.trim();
  if (!alias) {
    throw new Error(`[ai] ${envVar} is not set for role "${role}" — no fallback by design.`);
  }
  return alias;
}

/** Cheap presence check for call sites that need to no-op instead of throw. */
export function isRoleConfigured(role: ModelRole): boolean {
  return Boolean(process.env[ROLE_ENV[role]]?.trim());
}
