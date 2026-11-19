import type { EveningMilkState } from '../types/milk';
import { STORAGE_KEY } from './milkHelpers';

const DB_NAME = 'eveningMilkDB';
const DB_VERSION = 1;
const STORE_NAME = 'ledger';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveMilkStateToIDB(state: EveningMilkState): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(state, STORAGE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore IDB errors when storage is restricted
  }
}

export async function loadMilkStateFromIDB(): Promise<EveningMilkState | null> {
  try {
    const db = await openDB();
    const result = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(STORAGE_KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return sanitizeState(result);
  } catch {
    return null;
  }
}

export function sanitizeState(raw: unknown): EveningMilkState | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  if (!Array.isArray(s.entries)) return null;

  const entries = s.entries
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      id:
        typeof item.id === 'string' && item.id
          ? item.id
          : Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: typeof item.date === 'string' ? item.date : '',
      litres: Number(item.litres),
      rate: Number(item.rate),
      seller: typeof item.seller === 'string' ? item.seller : '',
    }))
    .filter(
      (item) =>
        /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
        Number.isFinite(item.litres) &&
        item.litres > 0 &&
        Number.isFinite(item.rate) &&
        item.rate >= 0
    );

  const paidDays: Record<string, boolean> = {};
  if (s.paidDays && typeof s.paidDays === 'object') {
    for (const [k, v] of Object.entries(s.paidDays as Record<string, unknown>)) {
      if (v === true && /^\d{4}-\d{2}-\d{2}$/.test(k)) {
        paidDays[k] = true;
      }
    }
  }

  return {
    entries,
    paidDays,
    nextDue: typeof s.nextDue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.nextDue) ? s.nextDue : null,
    lastRate: typeof s.lastRate === 'number' && Number.isFinite(s.lastRate) && s.lastRate >= 0 ? s.lastRate : 60,
    lastReminded:
      typeof s.lastReminded === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.lastReminded)
        ? s.lastReminded
        : null,
    sellerName: typeof s.sellerName === 'string' ? s.sellerName : '',
  };
}
