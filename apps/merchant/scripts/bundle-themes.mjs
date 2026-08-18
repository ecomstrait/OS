// Bundle each Liquid theme under themes/<id>/ into a JSON manifest at
// src/themes/generated/<id>.json ({ "layout/theme.liquid": "...", ... }) so the
// theme-zip API route can serve it without runtime filesystem lookups.
import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const themesDir = join(root, "themes");
const outDir = join(root, "src", "themes", "generated");

/**
 * Files the operating system leaves lying about, which are not part of a theme.
 *
 * Whatever this bundler picks up is uploaded verbatim to a merchant's Shopify
 * store, so a stray .DS_Store — created by Finder merely from opening the
 * folder — shipped 6KB of macOS metadata into Aurora on every build from a Mac.
 * They are gitignored, so it only ever showed up as an unexplained diff in the
 * generated JSON on one developer's machine.
 *
 * Dotfiles are excluded wholesale: Shopify has no dot-prefixed theme files, so
 * anything starting with `.` here is somebody's tooling, not ours.
 */
const JUNK = new Set(["Thumbs.db", "desktop.ini"]);
const isJunk = (name) => name.startsWith(".") || JUNK.has(name);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (isJunk(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const themes = await readdir(themesDir);
await mkdir(outDir, { recursive: true });

for (const id of themes) {
  if (isJunk(id)) continue;
  const base = join(themesDir, id);
  if (!(await stat(base)).isDirectory()) continue;
  const files = await walk(base);
  const manifest = {};
  for (const f of files) {
    manifest[relative(base, f).split("\\").join("/")] = await readFile(f, "utf8");
  }
  await writeFile(join(outDir, `${id}.json`), JSON.stringify(manifest, null, 0));
  console.log(`bundled theme "${id}" — ${Object.keys(manifest).length} files`);
}
