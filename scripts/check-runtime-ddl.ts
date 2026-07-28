/**
 * CI guard: fail if new runtime DDL appears outside the allowlisted ensure* modules.
 * Allowed files may still run DDL only when feature flag `runtime_ddl` is enabled.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = join(process.cwd(), "server");

const ALLOWLIST = new Set([
  "platform-schema.ts",
  "pg-storage.ts",
  "pg-storage-features.ts",
  "ait/store.ts",
  "ait/fraud.ts",
  "ait/referral.ts",
  "ait/referral-milestones.ts",
  "ait/creator-fund.ts",
  "bookmarks.ts",
  "trip-features.ts",
  "notification-storage.ts",
]);

const DDL_PATTERN = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS/i;

function walk(dir: string, files: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (name.endsWith(".ts") && !name.endsWith(".test.ts")) files.push(full);
  }
  return files;
}

const violations: string[] = [];
for (const file of walk(ROOT)) {
  const rel = file.slice(ROOT.length + 1).replace(/\\/g, "/");
  const content = readFileSync(file, "utf8");
  if (!DDL_PATTERN.test(content)) continue;
  if (ALLOWLIST.has(rel)) continue;
  violations.push(rel);
}

if (violations.length > 0) {
  console.error("Runtime DDL found outside allowlist:");
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log("check-runtime-ddl: ok");
