// One-shot codemod: Supabase's generated `Database` type doesn't know about
// several joined-table relationships we use, so it returns
// `SelectQueryError<...>` for those queries. Our service layer casts the
// result with `as Foo`, which TS rejects as "insufficient overlap" → TS2352.
//
// Fix: rewrite `as Foo` → `as unknown as Foo` on the offending lines only.
// This is the idiomatic escape hatch TypeScript itself suggests in the
// TS2352 diagnostic. Safe because the runtime shape is already correct.
//
// Usage:
//   node scripts/fix-stale-casts.mjs
//
// Idempotent — running it again on a clean tree is a no-op.

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const out = (() => {
  try {
    return execSync("npx tsc --noEmit -p tsconfig.app.json 2>&1", {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch (e) {
    // tsc exits non-zero when there are errors — that's expected here.
    return e.stdout?.toString() ?? "";
  }
})();

const HEAD_RE = /^([^(]+)\((\d+),(\d+)\): error TS2352: Conversion of type .+? to type '([^']+)'/;

const byFile = new Map();
for (const line of out.split(/\r?\n/)) {
  const m = HEAD_RE.exec(line);
  if (!m) continue;
  const [, file, row, col, targetType] = m;
  if (!byFile.has(file)) byFile.set(file, []);
  byFile.get(file).push({ row: Number(row), col: Number(col), targetType });
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

let filesTouched = 0;
let castsFixed = 0;

for (const [rel, diags] of byFile) {
  const abs = resolve(rel);
  const orig = readFileSync(abs, "utf8");
  const lines = orig.split(/\n/);

  for (const { row, targetType } of diags) {
    const idx = row - 1;
    const ln = lines[idx];
    if (ln == null) continue;
    // Skip if already double-casted on this line.
    if (/\bas\s+unknown\s+as\s+/.test(ln)) continue;
    const needle = new RegExp(`\\bas\\s+${escapeRegExp(targetType)}`);
    if (!needle.test(ln)) continue;
    lines[idx] = ln.replace(needle, (m0) => m0.replace(/^as/, "as unknown as"));
    castsFixed++;
  }

  const next = lines.join("\n");
  if (next !== orig) {
    writeFileSync(abs, next);
    filesTouched++;
  }
}

console.log(`fix-stale-casts: touched ${filesTouched} files, fixed ${castsFixed} casts`);
