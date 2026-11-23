export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (normalized.length < 5 || normalized.length > 160) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized);
}

export function emailToProfileId(email: string): string {
  const normalized = normalizeEmail(email);
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const slug = normalized
    .replace(/@.*/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20);
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `user-${slug || 'learner'}-${hex}`;
}

export function validateAuthInput(params: {
  mode: 'signup' | 'login';
  name?: string;
  email: string;
  password: string;
}): { ok: true } | { ok: false; error: string } {
  const email = normalizeEmail(params.email || '');
  if (!isValidEmail(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (params.mode === 'signup') {
    const trimmedName = (params.name || '').trim();
    if (trimmedName.length < 2) {
      return { ok: false, error: 'Please enter your name (at least 2 characters).' };
    }
    if (trimmedName.length > 80) {
      return { ok: false, error: 'Name must be 80 characters or fewer.' };
    }
  }
  if (!params.password || params.password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters.' };
  }
  return { ok: true };
}

export function validateContactInput(params: {
  name: string;
  email: string;
  mobile: string;
  message: string;
}): { ok: true } | { ok: false; error: string } {
  const name = (params.name || '').trim();
  const email = normalizeEmail(params.email || '');
  const mobile = (params.mobile || '').trim();
  const message = (params.message || '').trim();

  if (name.length < 2) {
    return { ok: false, error: 'Please enter your full name.' };
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  const digitsOnly = mobile.replace(/\D/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return { ok: false, error: 'Please enter a valid mobile number (7–15 digits).' };
  }
  if (message.length < 8) {
    return { ok: false, error: 'Please write a brief message (at least 8 characters).' };
  }
  return { ok: true };
}

export function validateNewsletterEmail(email: string): { ok: true; email: string } | { ok: false; error: string } {
  const normalized = normalizeEmail(email || '');
  if (!isValidEmail(normalized)) {
    return { ok: false, error: 'Please enter a valid email address to subscribe.' };
  }
  return { ok: true, email: normalized };
}
