export function formatRelativeTime(dateValue: string) {
  const createdAt = new Date(dateValue).getTime();
  const elapsed = Math.max(0, Date.now() - createdAt);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (elapsed < hour) {
    const value = Math.max(1, Math.round(elapsed / minute));
    return `il y a ${value} min`;
  }

  if (elapsed < day) {
    const value = Math.max(1, Math.round(elapsed / hour));
    return `il y a ${value} h`;
  }

  const value = Math.max(1, Math.round(elapsed / day));
  return `il y a ${value} j`;
}

export function maskEmail(email: string) {
  const normalized = email.trim();
  const [localPart, domain] = normalized.split("@");

  if (!localPart || !domain) {
    return "Coordonnee protegee";
  }

  const visibleLocal = localPart.slice(0, Math.min(3, localPart.length));
  return `${visibleLocal}${"*".repeat(Math.max(2, localPart.length - visibleLocal.length))}@${domain}`;
}

export function maskPhone(phone: string) {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length < 6) {
    return "Telephone protege";
  }

  const prefix = digits.slice(0, Math.min(2, digits.length));
  const suffix = digits.slice(-2);
  return `${prefix} ${"* ".repeat(Math.max(2, Math.floor((digits.length - 4) / 2))).trim()} ${suffix}`.trim();
}

export function maskContact(contact: string) {
  const normalized = contact.trim();

  if (normalized.includes("@")) {
    return maskEmail(normalized);
  }

  const digits = normalized.replace(/\D/g, "");
  if (digits.length >= 8) {
    return maskPhone(normalized);
  }

  return "Coordonnee protegee";
}
