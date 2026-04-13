import { getIdToken } from "firebase/auth";
import { auth } from "../firebase";

const FUNCTIONS_BASE = "https://asia-south1-ledger-app-599cc.cloudfunctions.net";

export async function callAuthedFunction(name, data = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");

  const token = await getIdToken(user);
  const response = await fetch(`${FUNCTIONS_BASE}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ data })
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = json?.error?.message || `Request failed (${response.status})`;
    const error = new Error(message);
    error.code = json?.error?.status || "internal";
    throw error;
  }

  return json;
}