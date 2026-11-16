import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { EveningMilkState } from '../types/milk';
import {
  dayLitres,
  dayOwed,
  fmtDate,
  fmtKsh,
  fmtL,
  MONTHS,
  pad,
  statusOf,
  todayKey,
  WEEKDAYS,
} from '../utils/milkHelpers';

interface CalendarCardProps {
  state: EveningMilkState;
  viewYear: number;
  viewMonth: number;
  selectedDate: string;
  onShiftMonth: (delta: number) => void;
  onSelectDate: (dateKey: string) => void;
}

export function CalendarCard({
  state,
  viewYear,
  viewMonth,
  selectedDate,
  onShiftMonth,
  onSelectDate,
}: CalendarCardProps) {
  const firstDay = new Date(viewYear, viewMonth, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = todayKey();

  // Compute totals across all logged dates
  const uniqueDates = [...new Set(state.entries.map((e) => e.date))];
  let totalOwed = 0;
  let totalOverdue = 0;
  uniqueDates.forEach((k) => {
    const st = statusOf(state, k);
    if (st === 'owing' || st === 'overdue') totalOwed += dayOwed(state.entries, k);
    if (st === 'overdue') totalOverdue += dayOwed(state.entries, k);
  });

  const dayCells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) dayCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) dayCells.push(d);

  return (
    <section className="bg-white dark:bg-[#1d242c] border border-[#e4e9ef] dark:border-[#2b3640] rounded-2xl p-4 sm:p-5">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => onShiftMonth(-1)}
          aria-label="Previous month"
          className="min-h-[44px] min-w-[44px] rounded-xl bg-[#faf9f6] dark:bg-[#14181d] border border-[#e4e9ef] dark:border-[#2b3640] text-[#1b2a38] dark:text-[#e8edf2] hover:border-[#0a7ec2] inline-flex items-center justify-center cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        <h2 className="font-display text-base sm:text-lg font-bold text-[#1b2a38] dark:text-[#e8edf2]">
          {MONTHS[viewMonth]} {viewYear}
        </h2>

        <button
          type="button"
          onClick={() => onShiftMonth(1)}
          aria-label="Next month"
          className="min-h-[44px] min-w-[44px] rounded-xl bg-[#faf9f6] dark:bg-[#14181d] border border-[#e4e9ef] dark:border-[#2b3640] text-[#1b2a38] dark:text-[#e8edf2] hover:border-[#0a7ec2] inline-flex items-center justify-center cursor-pointer transition-colors"
        >
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAYS.map((wd, idx) => (
          <div key={idx} className="text-xs font-medium text-[#687584] dark:text-[#8d99a6] py-1">
            {wd}
          </div>
        ))}

        {dayCells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const k = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const st = statusOf(state, k);
          const isToday = k === today;
          const isSelected = k === selectedDate;
          const litres = dayLitres(state.entries, k);

          const statusStyles =
            st === 'paid'
              ? 'bg-[#2e9e5b] text-white'
              : st === 'overdue'
                ? 'bg-[#d64545] text-white'
                : st === 'owing'
                  ? 'bg-[#e8a317] text-white'
                  : 'bg-[#eef1f4] dark:bg-[#2a333c] text-[#1b2a38] dark:text-[#e8edf2]';

          const statusWord =
            st === 'paid'
              ? 'Paid'
              : st === 'overdue'
                ? 'Overdue'
                : st === 'owing'
                  ? 'Owing'
                  : 'No milk';

          return (
            <button
              key={k}
              type="button"
              onClick={() => onSelectDate(k)}
              aria-label={`${fmtDate(k)}: ${statusWord}${litres > 0 ? `, ${fmtL(litres)} litres` : ''}`}
              aria-pressed={isSelected}
              className={`aspect-square min-h-[38px] rounded-xl flex flex-col items-center justify-center text-sm font-medium tabular-nums cursor-pointer transition-transform active:scale-95 ${statusStyles} ${
                isToday ? 'ring-2 ring-[#0a7ec2] dark:ring-[#4aa8e8]' : ''
              } ${
                isSelected
                  ? 'outline-2 outline-offset-2 outline-[#1b2a38] dark:outline-white font-bold'
                  : ''
              }`}
            >
              <span>{day}</span>
            </button>
          );
        })}
      </div>

      {/* Legend (Color + Text Labels) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3.5 text-xs text-[#687584] dark:text-[#8d99a6]">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[3px] bg-[#2e9e5b]" aria-hidden="true" />
          Paid
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[3px] bg-[#e8a317]" aria-hidden="true" />
          Owing
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[3px] bg-[#d64545]" aria-hidden="true" />
          Overdue (14+ days)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[3px] bg-[#eef1f4] dark:bg-[#2a333c] border border-[#d6dce3] dark:border-[#3c4854]" aria-hidden="true" />
          No milk
        </span>
      </div>

      {/* Totals Summary */}
      <div className="mt-4 pt-3.5 border-t border-[#e4e9ef] dark:border-[#2b3640] space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#687584] dark:text-[#8d99a6]">
            Total owed:{' '}
            <strong className="text-[#1b2a38] dark:text-[#e8edf2] tabular-nums">
              {fmtKsh(totalOwed)}
            </strong>
          </span>
          <span className="text-[#687584] dark:text-[#8d99a6]">
            Overdue:{' '}
            <strong className="text-[#d64545] dark:text-[#f87171] tabular-nums">
              {fmtKsh(totalOverdue)}
            </strong>
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-[#687584] dark:text-[#8d99a6]">Next payment due</span>
          <strong className="text-[#1b2a38] dark:text-[#e8edf2] tabular-nums">
            {state.nextDue ? fmtDate(state.nextDue) : '–'}
          </strong>
        </div>
      </div>
    </section>
  );
}
