import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    // Use relative paths so chunks load correctly inside Capacitor WebView
    assetsDir: "assets",
    rollupOptions: {
      output: {
        // Relative asset paths — required for Capacitor Android WebView
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "firebase-vendor": ["firebase/app", "firebase/auth", "firebase/firestore", "firebase/storage", "firebase/functions"]
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
});
