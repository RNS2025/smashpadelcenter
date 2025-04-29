import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";
import path from "path";

// Load environment variables
const isHttpsEnabled = process.env.VITE_HTTPS === "false"; // Toggle HTTPS via env variable
// Determine environment and set API origin
const isDev = process.env.NODE_ENV !== "production";
const apiOrigin = isDev
  ? "http://localhost:3001"
  : "https://smashpadelcenter-api.onrender.com/api/v1";

console.log(
  `Running in ${
    isDev ? "development" : "production"
  } mode with API: ${apiOrigin}`
);
const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false, // Enable service worker in development if needed
      },
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "icons/android-chrome-192x192.png",
        "icons/android-chrome-512x512.png",
      ],
      manifest: {
        name: "SMASH Padel",
        short_name: "SMASH Padel",
        description:
          "A Progressive Web App for managing padel tournaments and player profiles at SMASH Padelcenter",
        theme_color: "#1e3a8a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        // Only cache compiled assets, exclude source files
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        globIgnores: ["**/*.tsx", "**/*.ts", "**/src/**"], // Ignore source files
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-cache",
              expiration: {
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
            },
          },
          {
            urlPattern: ({ request }) =>
              ["style", "script", "worker"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "asset-cache",
              expiration: {
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.origin ===
              (isProduction ? "https://api.rankedin.com" : apiOrigin),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Exclude Socket.IO polling and WebSocket requests from service worker
          {
            urlPattern: ({ url }) => url.pathname.includes("/socket.io"),
            handler: "NetworkOnly", // Bypass service worker for Socket.IO
            options: {
              cacheName: null,
            },
          },
        ],
      },
    }),
  ],
  base: "/",
  build: {
    outDir: "dist",
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    // Conditionally enable HTTPS based on environment variable
    ...(isHttpsEnabled && {
      https: {
        key: fs.readFileSync(
          path.resolve(__dirname, "server/certs/server.key")
        ),
        cert: fs.readFileSync(
          path.resolve(__dirname, "server/certs/server.cert")
        ),
      },
    }),
  },
  resolve: {
    alias: {
      "date-fns/locale/da": "date-fns/locale/da/index.js",
    },
  },
});
