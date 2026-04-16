export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function sanitizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

export function isValidPhone(phone) {
  return sanitizePhone(phone).length >= 10;
}

export function isOptionalPhone(phone) {
  const clean = sanitizePhone(phone);
  return !clean || clean.length >= 10;
}

export function isStrongPassword(password) {
  const value = String(password || "");
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value)
  );
}

export function passwordStrengthMessage(password) {
  const value = String(password || "");
  if (value.length < 8) return "At least 8 characters required.";
  if (!/[A-Z]/.test(value)) return "Add at least one uppercase letter.";
  if (!/[a-z]/.test(value)) return "Add at least one lowercase letter.";
  if (!/[0-9]/.test(value)) return "Add at least one number.";
  return null;
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

export function isFutureDateValue(value) {
  if (!isValidDateValue(value)) return false;
  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return String(value) > todayValue;
}

export function isFutureMonthValue(value) {
  if (!/^\d{4}-\d{2}$/.test(String(value || ""))) return false;
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  return String(value) > currentMonth;
}

export function isOptionalEmail(email) {
  const value = normalizeEmail(email);
  return !value || isValidEmail(value);
}

export function isValidName(value, min = 2) {
  return hasMinLength(value, min);
}

export function isValidTransactionId(value) {
  return /^[a-zA-Z0-9\-_/]{6,}$/.test(String(value || "").trim());
}

export function isValidGstin(value) {
  const gstin = String(value || "").trim().toUpperCase();
  if (!gstin) return true;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
}
