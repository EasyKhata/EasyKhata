export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", flag: "US" },
  { code: "EUR", symbol: "EUR", name: "Euro", flag: "EU" },
  { code: "GBP", symbol: "GBP", name: "British Pound", flag: "GB" },
  { code: "INR", symbol: "Rs", name: "Indian Rupee", flag: "IN" },
  { code: "AED", symbol: "AED", name: "UAE Dirham", flag: "AE" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar", flag: "CA" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", flag: "AU" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", flag: "SG" },
  { code: "JPY", symbol: "JPY", name: "Japanese Yen", flag: "JP" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", flag: "CH" },
  { code: "NGN", symbol: "NGN", name: "Nigerian Naira", flag: "NG" },
  { code: "ZAR", symbol: "R", name: "South African Rand", flag: "ZA" }
];

export function fmtMoney(n, sym) {
  return `${sym}${Math.abs(Number(n) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function fmtDate(iso) {
  if (!iso) return "--";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function monthKey(y, m) {
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function invoiceTotal(items) {
  return (items || []).reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0);
}

export function avatarColor(s) {
  const colors = ["#7EE8A2", "#67B2FF", "#F6C94E", "#C084FC", "#FF6E6E", "#FB923C", "#22D3EE"];
  let hash = 0;
  for (let i = 0; i < (s || "").length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return colors[hash % colors.length];
}

export function initials(s) {
  return (s || "?")
    .split(" ")
    .map(word => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
