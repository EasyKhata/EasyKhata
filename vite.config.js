import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
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
