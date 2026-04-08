export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function sanitizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

export function isValidPhone(phone) {
  return sanitizePhone(phone).length >= 10;
}

export function isStrongPassword(password) {
  const value = String(password || "");
  return value.length >= 6;
}

export function hasMinLength(value, min = 1) {
  return String(value || "").trim().length >= min;
}

export function isPositiveAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

export function isValidDateValue(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}
