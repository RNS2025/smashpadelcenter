import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      base: "/",
      registerType: "autoUpdate",
      injectRegister: "auto",
      srcDir: "src",
      filename: "sw.js",
      strategies: "injectManifest",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
      },
      manifest: {
        name: "SMASH Padelcenter Klubapp",
        short_name: "SMASH Klubapp",
        description: "SMASH Padelcenter Klubapp - Din digitale padelklub",
        theme_color: "#000000",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "icons/ikon_192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/ikon_512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  base: "/",
});
