import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names while resolving Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** ₹ formatting with Indian digit grouping (e.g. ₹1,24,500). */
export function formatCurrency(value: number, opts: { decimals?: boolean } = {}) {
  const { decimals = false } = opts;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(Number.isFinite(value) ? value : 0);
}

/** Compact kg display: 12.5 kg / 1,250 kg / 3.2 t */
export function formatWeight(kg: number) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(kg % 1000 === 0 ? 0 : 1)} t`;
  return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(kg)} kg`;
}

/** Relative-ish date used across dashboards. */
export function formatDate(iso: string | Date, withTime = false) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

export function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

/** Haversine distance in km between two coordinates. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

/** Simple id generator (demo mode). */
export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

/** Mask a phone number for public display: 98765 43210 → 98765 4•••• */
export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return phone;
  return `${digits.slice(0, 5)} ${digits.slice(5, 6)}${'•'.repeat(Math.max(0, digits.length - 6))}`;
}

/** Deterministic initials for avatars. */
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Debounce helper for search inputs. */
export function debounce<T extends (...args: never[]) => void>(fn: T, ms = 300) {
  let t: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** Sleep — used to simulate network latency in demo mode. */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function isValidPhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/**
 * Trigger a client-side file download without a server.
 * Returns false instead of throwing when the environment blocks it
 * (older mobile in-app browsers, private-mode Safari, tests).
 */
export function downloadFile(filename: string, contents: string, mime = 'text/plain;charset=utf-8') {
  try {
    const blob = new Blob([contents], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke on the next tick so Safari has time to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
