import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

// Standalone TanStack Start + Nitro config, deployable to Vercel.
// Nitro's `vercel` preset writes Vercel's Build Output API v3 to `.vercel/output`,
// which Vercel picks up with zero extra config — just point the project at `vite build`.
export default defineConfig(({ command }) => ({
  css: { transformer: "lightningcss" },
  resolve: {
    alias: { "@": `${process.cwd()}/src` },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  server: { host: "::", port: 8080 },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
      server: { entry: "server" },
    }),
    // nitro/vite only needs to run for the production build; running it in dev
    // conflicts with Vite's own dev server.
    ...(command === "build" ? [nitro({ preset: "vercel" })] : []),
    viteReact(),
  ],
}));
