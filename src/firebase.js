import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA3YbJ0f7haJ3rQj9ZDV4XKHixurJ6VPN4",
  authDomain: "ledger-app-599cc.firebaseapp.com",
  projectId: "ledger-app-599cc",
  storageBucket: "ledger-app-599cc.firebasestorage.app",
  messagingSenderId: "374078093945",
  appId: "1:374078093945:web:5db233b446a9f808a5f2a8"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
