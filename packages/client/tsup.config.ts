import { defineConfig, Options } from "tsup";

const common: Options = {

  outDir: "dist",

  format: ["esm", "cjs"],

  target: "node22",

  platform: "neutral",

  bundle: true,

  splitting: false,

  sourcemap: false,

  minify: true,

  clean: false,

  dts: false,

  treeshake: true,

  skipNodeModulesBundle: true,
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  },
  external: [
    "axios",
      "react",
      "react-dom",
      "@tanstack/react-query",
      "@tanstack/react-query-devtools",
  ],
} ;

export default defineConfig([
  // Core: framework-agnostic client + resources. Safe to import in server
  // components, server actions, route handlers, or plain Node scripts.
  {
    entry: {
      index: "src/index.ts",
    },

    ...common
  },
  // React hooks layer. A post-build step (see scripts/add-use-client-directive.mjs)
  // prepends "use client" so Next.js App Router treats every export as
  // client-only without consumers needing to know that. (tsup's `banner`
  // option is not used here - esbuild strips a banner that looks like a
  // module-level directive because it collides with its own "use strict"
  // insertion for CJS output.)
  {
    entry: { react: "src/react/index.ts" },
    ...common
  },
  // Server prefetch helpers. Deliberately NOT marked "use client" so server
  // components/server actions can import them for the SSR hydration pattern.
  {
    entry: { server: "src/server/index.ts" },
    ...common
  },
]);
