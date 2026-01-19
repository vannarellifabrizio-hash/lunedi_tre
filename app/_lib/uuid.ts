export function uuid(): string {
  // Good enough for an internal tool preview
  return globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}
