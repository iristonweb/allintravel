import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await esbuild.build({
  entryPoints: {
    index: path.join(projectRoot, "server/vercel/handler.ts"),
    health: path.join(projectRoot, "server/vercel/health.ts"),
  },
  outdir: path.join(projectRoot, "api"),
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  alias: {
    "@shared": path.join(projectRoot, "shared"),
  },
  logLevel: "info",
});

console.log("[build-vercel-api] Wrote api/index.js and api/health.js");
