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
