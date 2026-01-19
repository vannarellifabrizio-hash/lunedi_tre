export function nowISO() {
  return new Date().toISOString();
}

export function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isPastEndDate(endDateYMD: string) {
  const end = parseYMD(endDateYMD);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return end < todayStart;
}

export function daysSince(iso: string): number {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const diff = now - t;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function formatShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}
