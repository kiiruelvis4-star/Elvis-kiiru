import type { DayStatus, EveningMilkState, MilkLogEntry } from '../types/milk';

export const STORAGE_KEY = 'eveningMilk.v3';
export const OVERDUE_DAYS = 14;
export const REMIND_HOUR = 16;

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function keyOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(): string {
  return keyOf(new Date());
}

export function parseKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 86400000);
}

export function addDaysKey(k: string, n: number): string {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return keyOf(d);
}

export function fmtKsh(n: number): string {
  return `KSh ${Math.round(n).toLocaleString()}`;
}

export function fmtL(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return rounded.toFixed(rounded % 1 === 0 ? 1 : 2);
}

export function fmtDate(k: string): string {
  return parseKey(k).toDateString().slice(0, 10);
}

export function dayEntries(entries: MilkLogEntry[], k: string): MilkLogEntry[] {
  return entries.filter((e) => e.date === k);
}

export function dayLitres(entries: MilkLogEntry[], k: string): number {
  return dayEntries(entries, k).reduce((sum, e) => sum + e.litres, 0);
}

export function dayOwed(entries: MilkLogEntry[], k: string): number {
  return dayEntries(entries, k).reduce((sum, e) => sum + e.litres * e.rate, 0);
}

export function isOverdue(state: EveningMilkState, k: string): boolean {
  if (state.paidDays[k]) return false;
  const today = todayKey();
  if (state.nextDue) {
    return today >= state.nextDue && daysBetween(k, today) >= 0;
  }
  return daysBetween(k, today) >= OVERDUE_DAYS;
}

export function statusOf(state: EveningMilkState, k: string): DayStatus {
  if (dayLitres(state.entries, k) === 0) return 'none';
  if (state.paidDays[k]) return 'paid';
  return isOverdue(state, k) ? 'overdue' : 'owing';
}

export function loadMilkState(): EveningMilkState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return {
        entries: Array.isArray(s.entries) ? s.entries : [],
        paidDays: s.paidDays && typeof s.paidDays === 'object' ? s.paidDays : {},
        nextDue: typeof s.nextDue === 'string' ? s.nextDue : null,
        lastRate: typeof s.lastRate === 'number' && s.lastRate >= 0 ? s.lastRate : 60,
        lastReminded: typeof s.lastReminded === 'string' ? s.lastReminded : null,
        sellerName: typeof s.sellerName === 'string' ? s.sellerName : '',
      };
    }
  } catch {
    // Fallback to initial state if storage is unreadable
  }
  return {
    entries: [],
    paidDays: {},
    nextDue: null,
    lastRate: 60,
    lastReminded: null,
    sellerName: '',
  };
}

export function persistMilkState(state: EveningMilkState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
