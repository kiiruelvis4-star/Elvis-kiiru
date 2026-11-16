import { AlertCircle, CheckCircle2, Clock, MinusCircle, Trash2 } from 'lucide-react';
import type { EveningMilkState } from '../types/milk';
import {
  dayEntries,
  dayLitres,
  dayOwed,
  fmtDate,
  fmtKsh,
  fmtL,
  statusOf,
} from '../utils/milkHelpers';

interface DayDetailCardProps {
  state: EveningMilkState;
  selectedDate: string;
  onDeleteEntry: (id: string) => void;
  onTogglePaid: (checked: boolean) => void;
}

export function DayDetailCard({
  state,
  selectedDate,
  onDeleteEntry,
  onTogglePaid,
}: DayDetailCardProps) {
  const st = statusOf(state, selectedDate);
  const items = dayEntries(state.entries, selectedDate);
  const totalL = dayLitres(state.entries, selectedDate);
  const totalKsh = dayOwed(state.entries, selectedDate);
  const isPaid = !!state.paidDays[selectedDate];

  const statusMeta = {
    none: {
      label: 'No milk',
      className: 'text-[#687584] dark:text-[#8d99a6]',
      Icon: MinusCircle,
    },
    paid: {
      label: 'Paid',
      className: 'text-[#2e9e5b] dark:text-[#4ade80] font-semibold',
      Icon: CheckCircle2,
    },
    owing: {
      label: 'Owing',
      className: 'text-[#c98407] dark:text-[#fbbf24] font-semibold',
      Icon: Clock,
    },
    overdue: {
      label: 'Overdue',
      className: 'text-[#d64545] dark:text-[#f87171] font-semibold',
      Icon: AlertCircle,
    },
  }[st];

  const StatusIcon = statusMeta.Icon;

  return (
    <section className="bg-white dark:bg-[#1d242c] border border-[#e4e9ef] dark:border-[#2b3640] rounded-2xl p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-[#1b2a38] dark:text-[#e8edf2] tabular-nums">
          {fmtDate(selectedDate)}
        </h2>
        <span className={`inline-flex items-center gap-1.5 text-sm ${statusMeta.className}`}>
          <StatusIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{statusMeta.label}</span>
        </span>
      </div>

      <div className="mt-3">
        {items.length === 0 ? (
          <p className="text-sm text-[#687584] dark:text-[#8d99a6] py-2">
            No milk on this day. Pick a day with milk or add some above.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-[#e4e9ef] dark:divide-[#2b3640] border-t border-[#e4e9ef] dark:border-[#2b3640]">
              {items.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-medium text-[#1b2a38] dark:text-[#e8edf2] tabular-nums">
                      {fmtL(entry.litres)} L · {fmtKsh(entry.litres * entry.rate)}
                    </div>
                    <div className="text-xs text-[#687584] dark:text-[#8d99a6] truncate">
                      {entry.seller || 'No seller'} · KSh {entry.rate}/L
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteEntry(entry.id)}
                    aria-label={`Delete ${fmtL(entry.litres)} L entry`}
                    className="min-h-[44px] min-w-[44px] -mr-2 rounded-xl text-[#687584] dark:text-[#8d99a6] hover:text-[#d64545] hover:bg-red-50 dark:hover:bg-red-950/30 inline-flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between pt-3 mt-1 border-t border-[#e4e9ef] dark:border-[#2b3640] text-sm font-semibold tabular-nums">
              <span className="text-[#687584] dark:text-[#8d99a6]">{fmtL(totalL)} L</span>
              <span className="text-[#1b2a38] dark:text-[#e8edf2]">{fmtKsh(totalKsh)}</span>
            </div>
          </>
        )}
      </div>

      {/* Paid Toggle Row */}
      <label
        className={`mt-3.5 min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#faf9f6] dark:bg-[#14181d] border border-[#e4e9ef] dark:border-[#2b3640] flex items-center gap-3 text-sm sm:text-[15px] ${
          items.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#2e9e5b]'
        }`}
      >
        <input
          type="checkbox"
          checked={isPaid}
          disabled={items.length === 0}
          onChange={(e) => onTogglePaid(e.target.checked)}
          className="w-5 h-5 accent-[#2e9e5b] rounded cursor-pointer disabled:cursor-not-allowed"
        />
        <span className="text-[#1b2a38] dark:text-[#e8edf2]">
          Tick when paid (next 14 days start now)
        </span>
      </label>
    </section>
  );
}
