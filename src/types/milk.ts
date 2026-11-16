export type DayStatus = 'none' | 'paid' | 'owing' | 'overdue';

export interface MilkLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  litres: number;
  rate: number;
  seller: string;
}

export interface EveningMilkState {
  entries: MilkLogEntry[];
  paidDays: Record<string, boolean>;
  nextDue: string | null;
  lastRate: number;
  lastReminded: string | null;
  sellerName: string;
}

export interface SellerExportEntry {
  date: string;
  litres: number;
  rate: number;
  seller: string;
}

export interface SellerExportPayload {
  app: string;
  exportedAt: string;
  role: string;
  entries: SellerExportEntry[];
}

export interface CompareRow {
  date: string;
  mine: number;
  theirs: number;
  match: boolean;
}
