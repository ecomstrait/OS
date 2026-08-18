/**
 * Sync <repo-root>/themes/** to a PRIVATE Supabase Storage bucket ("themes").
 *
 * The themes are the AI-Builder's secret sauce: they must NOT live in git or be
 * publicly browsable. They are served only through the authenticated proxy at
 * /api/theme/[...path], which reads this private bucket with the service role.
 *
 * The sources sit at the repo root, outside every app, so that no Next.js build
 * ever walks 191MB of third-party templates while tracing its bundle. This
 * script is the only thing that reads them, and it runs by hand.
 *
 * It lives in this app because `@supabase/supabase-js` resolves here under
 * pnpm's isolated node_modules — but every path it touches is resolved from
 * the script's own location, so it runs correctly from any directory.
 *
 * Usage (from anywhere):
 *   node apps/website/scripts/upload-themes.mjs              # sync ALL (upsert)
 *   node apps/website/scripts/upload-themes.mjs shoes-shop1  # sync ONE (fast)
 *   node apps/website/scripts/upload-themes.mjs a b c        # sync several
 *   node apps/website/scripts/upload-themes.mjs shoes-shop1 --clean
 *                                                  # wipe that theme's objects in
 *                                                  # the bucket first (true sync —
 *                                                  # handles renames/deletes)
 *
 * Or via pnpm:  pnpm themes:upload [names…] [--clean]
 *
 * Needs (from .env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, extname, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, statSync } from "node:fs";

/* ---- Anchor every path to this file, not to the caller's cwd ------------- */
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));   // apps/website/scripts
const APP_DIR = resolve(SCRIPT_DIR, "..");                    // apps/website
const REPO_ROOT = resolve(APP_DIR, "..", "..");               // <repo root>

/* ---- Load .env.local (no dependency on node --env-file) ---- */
function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}
// The app's own env file wins; the root one is the fallback for a shared setup.
loadEnv(join(REPO_ROOT, ".env.local"));
loadEnv(join(APP_DIR, ".env.local"));

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const BUCKET = "themes";
const ROOT = join(REPO_ROOT, "themes");
const CONCURRENCY = 10;

const MIME = {
  ".html": "text/html", ".htm": "text/html", ".css": "text/css",
  ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".webp": "image/webp", ".avif": "image/avif", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf", ".eot": "application/vnd.ms-fontobject",
  ".mp4": "video/mp4", ".webm": "video/webm", ".mp3": "audio/mpeg", ".txt": "text/plain", ".map": "application/json",
};

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

/* ---- Parse args: positional theme names + flags ---- */
const args = process.argv.slice(2);
const clean = args.includes("--clean");
const themeArgs = args.filter((a) => !a.startsWith("--"));

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (entry.isFile()) yield p;
  }
}

/** Recursively list every object key under a bucket prefix. */
async function listAll(prefix) {
  const keys = [];
  async function recur(p) {
    let offset = 0;
    for (;;) {
      const { data, error } = await supabase.storage.from(BUCKET).list(p, { limit: 100, offset });
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) break;
      for (const item of data) {
        const full = p ? `${p}/${item.name}` : item.name;
        if (item.id === null) await recur(full); // folder → recurse
        else keys.push(full);
      }
      if (data.length < 100) break;
      offset += 100;
    }
  }
  await recur(prefix);
  return keys;
}

async function cleanPrefix(prefix) {
  const keys = await listAll(prefix);
  if (!keys.length) {
    console.log(`  • ${prefix}/ — nothing to clean`);
    return;
  }
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) console.error(`  ✗ remove ${prefix}:`, error.message);
  }
  console.log(`  ✓ cleaned ${prefix}/ (${keys.length} objects removed)`);
}

async function main() {
  if (!existsSync(ROOT)) {
    // Gitignored on purpose, so a fresh clone genuinely won't have it.
    console.error(`✗ Theme sources not found at ${ROOT}`);
    console.error("  They're deliberately not in git — copy them in before syncing.");
    process.exit(1);
  }

  // Resolve which theme folders to sync.
  let themes;
  if (themeArgs.length) {
    for (const t of themeArgs) {
      if (!existsSync(join(ROOT, t)) || !statSync(join(ROOT, t)).isDirectory()) {
        console.error(`✗ Theme "${t}" not found at ${ROOT}/${t}`);
        process.exit(1);
      }
    }
    themes = themeArgs;
  } else {
    themes = (await readdir(ROOT, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  }

  console.log(`Syncing ${themes.length} theme(s): ${themes.join(", ")}${clean ? "  [--clean]" : ""}`);

  // Ensure the bucket exists and is PRIVATE.
  const { error: bErr } = await supabase.storage.createBucket(BUCKET, { public: false });
  if (bErr && !/exists/i.test(bErr.message)) console.warn("bucket:", bErr.message);

  // Optional clean: remove each theme's existing objects before re-uploading.
  if (clean) {
    console.log("Cleaning existing objects…");
    for (const t of themes) await cleanPrefix(t);
  }

  // Gather local files for the selected themes.
  const files = [];
  for (const t of themes) {
    for await (const f of walk(join(ROOT, t))) files.push(f);
  }
  console.log(`Uploading ${files.length} files (concurrency ${CONCURRENCY})…`);

  let done = 0, failed = 0;
  const queue = [...files];

  async function worker() {
    while (queue.length) {
      const file = queue.pop();
      const key = relative(ROOT, file).split("\\").join("/");
      try {
        const body = await readFile(file);
        const contentType = MIME[extname(file).toLowerCase()] || "application/octet-stream";
        const { error } = await supabase.storage.from(BUCKET).upload(key, body, { contentType, upsert: true });
        if (error) throw error;
      } catch (e) {
        failed++;
        console.error("  ✗", key, "—", e.message || e);
      }
      done++;
      if (done % 100 === 0 || done === files.length) console.log(`  ${done}/${files.length} (${failed} failed)`);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`\n✓ Done. ${done - failed}/${files.length} uploaded, ${failed} failed.`);
  if (failed) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
