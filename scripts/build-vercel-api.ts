import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const viteStub = path.join(projectRoot, "server/vite-stub.ts");

await esbuild.build({
  entryPoints: {
    index: path.join(projectRoot, "server/vercel/handler.ts"),
    health: path.join(projectRoot, "server/vercel/health.ts"),
  },
  outdir: path.join(projectRoot, "api", "_bundles"),
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  alias: {
    "@shared": path.join(projectRoot, "shared"),
  },
  plugins: [
    {
      name: "vite-stub",
      setup(build) {
        build.onResolve({ filter: /^\.\/vite$/ }, (args) => {
          if (args.importer.includes("createApp")) {
            return { path: viteStub };
          }
        });
      },
    },
  ],
  logLevel: "info",
});

console.log("[build-vercel-api] Wrote api/_bundles/index.js and api/_bundles/health.js");
