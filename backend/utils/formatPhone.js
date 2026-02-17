export function formatPakistaniPhone(phone) {
  if (!phone) return null;

  let cleaned = phone.replace(/\D/g, ""); // remove spaces, +, -

  if (cleaned.startsWith("0")) {
    cleaned = "92" + cleaned.slice(1);
  }

  if (cleaned.startsWith("3")) {
    cleaned = "92" + cleaned;
  }

  if (!cleaned.startsWith("92") || cleaned.length !== 12) {
    return null;
  }

  return `${cleaned}@c.us`;
}
