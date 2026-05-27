import { defineConfig, loadEnv } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = process.env.VITE_API_URL || env.VITE_API_URL || "http://localhost:8000";

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        devOptions: { enabled: false },
        manifest: {
          name: "Álbum Copa 2026",
          short_name: "Album Copa 2026",
          description: "Acompanhe suas figurinhas da Copa do Mundo 2026",
          start_url: "/",
          display: "standalone",
          background_color: "#09090b",
          theme_color: "#09090b",
          icons: [
            {
              src: "/logos/logo_copa_2026.png",
              sizes: "any",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg}"],
          runtimeCaching: [
            {
              urlPattern: /\/logos\/.*\.png$/,
              handler: "CacheFirst",
              options: {
                cacheName: "logos",
                expiration: { maxEntries: 1100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              urlPattern: /\/api\/(stickers|summary|stats|logs|trocas|progress-timeline)/,
              handler: "NetworkFirst",
              options: {
                cacheName: "api",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      host: !!(process.env.VITE_API_URL || env.VITE_API_URL),
      allowedHosts: true,
      proxy: {
        "/api": backendUrl,
      },
    },
  };
});
