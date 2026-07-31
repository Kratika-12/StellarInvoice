import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  define: {
    global: "globalThis",
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart({
      server: {
        entry: "server",
      },
    }),
    nitro(),
    viteReact(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 8080,
  },
});
