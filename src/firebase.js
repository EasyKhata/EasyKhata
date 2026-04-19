import { initializeApp } from "firebase/app";
import { getAuth, browserSessionPersistence, indexedDBLocalPersistence, initializeAuth, setPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { Capacitor } from "@capacitor/core";

const firebaseConfig = {
  apiKey: "AIzaSyA3YbJ0f7haJ3rQj9ZDV4XKHixurJ6VPN4",
  authDomain: "ledger-app-599cc.firebaseapp.com",
  projectId: "ledger-app-599cc",
  storageBucket: "ledger-app-599cc.firebasestorage.app",
  messagingSenderId: "374078093945",
  appId: "1:374078093945:web:5db233b446a9f808a5f2a8"
};

const app = initializeApp(firebaseConfig);

// On Android, use indexedDB persistence so auth survives the redirect round-trip.
// On web, use session persistence (signing out when browser tab closes).
export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
  : getAuth(app);

if (!Capacitor.isNativePlatform()) {
  setPersistence(auth, browserSessionPersistence).catch(() => {});
}

export const storage = getStorage(app);
export const functions = getFunctions(app, "asia-south1");
