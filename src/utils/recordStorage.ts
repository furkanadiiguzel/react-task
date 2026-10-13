import type { SalesRecord } from '../types/sales';

export const STORAGE_KEY = 'mini-sales-dashboard:records';

const isSalesRecord = (value: unknown): value is SalesRecord => {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'number' &&
    typeof record.product === 'string' &&
    typeof record.category === 'string' &&
    typeof record.price === 'number' &&
    typeof record.quantity === 'number'
  );
};

// Returns null when nothing usable is stored, so the caller can fall back to seed data.
export const loadRecords = (): SalesRecord[] | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every(isSalesRecord) ? parsed : null;
  } catch {
    // Storage blocked (private mode) or corrupted JSON.
    return null;
  }
};

export const saveRecords = (records: SalesRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Quota exceeded or storage blocked: the app keeps working in memory.
  }
};
