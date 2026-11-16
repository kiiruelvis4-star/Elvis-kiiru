import type { Timestamp } from 'firebase/firestore';

export type MilkSession = 'morning' | 'evening' | 'other';
export type MilkUnit = 'L' | 'gal';
export type EntryStatus = 'recorded' | 'extra' | 'skipped';
export type SourceCategory = 'farm' | 'vendor' | 'household';
export type TrackingMode = 'delivery' | 'production' | 'intake';

export interface MilkEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  session: MilkSession;
  quantity: number;
  unit: MilkUnit;
  status: EntryStatus;
  sourceName: string;
  unitPrice: number;
  totalCost: number;
  fatPercent?: number;
  notes?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface MilkSource {
  id: string;
  userId: string;
  name: string;
  category: SourceCategory;
  defaultUnit: MilkUnit;
  defaultRate: number;
  dailyTarget: number;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface UserSettings {
  userId: string;
  preferredUnit: MilkUnit;
  currencySymbol: string;
  defaultRate: number;
  dailyGoal: number;
  trackingMode: TrackingMode;
  updatedAt?: Timestamp | null;
}

export interface MilkEntryDraft {
  date: string;
  session: MilkSession;
  quantity: number;
  unit: MilkUnit;
  status: EntryStatus;
  sourceName: string;
  unitPrice: number;
  fatPercent?: number;
  notes?: string;
}

export type WorkspaceTab = 'ledger' | 'calendar' | 'trends' | 'sources';
