export function uid() {
  return crypto.randomUUID();
}

export function monthKey(y, m) {
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function fmtMoney(n, sym) {
  return `${sym}${Math.abs(Number(n) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  })}`;
}