import { Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { MilkLogEntry } from '../types/milk';
import {
  addDaysKey,
  dayEntries,
  dayLitres,
  dayOwed,
  fmtDate,
  fmtKsh,
  fmtL,
  parseKey,
  todayKey,
} from '../utils/milkHelpers';

interface TonightCardProps {
  entries: MilkLogEntry[];
  selectedDate: string;
  lastRate: number;
  lastSellerName: string;
  feedbackMsg: string;
  onAddEntry: (payload: { litres: number; rate: number; seller: string }) => void;
  onDeleteEntry: (id: string) => void;
  onSelectToday: () => void;
}

const QUICK_LITRES = [0.5, 1, 1.5, 2, 3, 5];

export function TonightCard({
  entries,
  selectedDate,
  lastRate,
  lastSellerName,
  feedbackMsg,
  onAddEntry,
  onDeleteEntry,
  onSelectToday,
}: TonightCardProps) {
  const [seller, setSeller] = useState('');
  const [litres, setLitres] = useState('');
  const [rate, setRate] = useState(String(lastRate));

  const today = todayKey();
  const tonightItems = dayEntries(entries, today);
  const tonightTotalL = dayLitres(entries, today);
  const tonightTotalKsh = dayOwed(entries, today);

  // Build last 7 evenings chart data
  const last7Days: { key: string; litres: number; label: string; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const k = addDaysKey(today, -i);
    last7Days.push({
      key: k,
      litres: dayLitres(entries, k),
      label: parseKey(k).toLocaleDateString(undefined, { weekday: 'narrow' }),
      isToday: k === today,
    });
  }
  const maxChartLitres = Math.max(1, ...last7Days.map((d) => d.litres));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedLitres = parseFloat(litres);
    const parsedRate = parseFloat(rate);
    onAddEntry({
      litres: parsedLitres,
      rate: parsedRate,
      seller: seller.trim(),
    });
    if (parsedLitres > 0 && parsedRate >= 0) {
      setLitres('');
      setSeller('');
    }
  };

  return (
    <section className="bg-white dark:bg-[#1d242c] border border-[#e4e9ef] dark:border-[#2b3640] rounded-2xl p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h1 className="font-display text-xl font-bold text-[#1b2a38] dark:text-[#e8edf2]">
          Evening milk
        </h1>
        <span className="text-xs sm:text-sm text-[#687584] dark:text-[#8d99a6] tabular-nums">
          {fmtDate(today)}
        </span>
      </div>

      {/* Hero Highlight Panel */}
      <div className="mt-3.5 rounded-2xl bg-[#eef6fd] dark:bg-[#1a2c3a] px-4 py-3.5 flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#0b5a8a] dark:text-[#8fcaf2]">
            Tonight
          </div>
          <div className="font-display text-4xl font-bold leading-tight text-[#0b5a8a] dark:text-[#8fcaf2] tabular-nums mt-0.5">
            {fmtL(tonightTotalL)} <span className="text-lg font-medium">L</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#0b5a8a] dark:text-[#8fcaf2]">
            Owed tonight
          </div>
          <div className="font-display text-2xl font-bold text-[#0b5a8a] dark:text-[#8fcaf2] tabular-nums mt-0.5">
            {fmtKsh(tonightTotalKsh)}
          </div>
        </div>
      </div>

      {/* Selected date context indicator if user picked another day on calendar */}
      {selectedDate !== today && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-[#faf9f6] dark:bg-[#14181d] border border-[#e4e9ef] dark:border-[#2b3640] px-3 py-2 text-xs">
          <span className="text-[#687584] dark:text-[#8d99a6]">
            Logging for selected date:{' '}
            <strong className="text-[#1b2a38] dark:text-[#e8edf2]">{fmtDate(selectedDate)}</strong>
          </span>
          <button
            type="button"
            onClick={onSelectToday}
            className="text-[#0a7ec2] dark:text-[#4aa8e8] font-semibold hover:underline whitespace-nowrap cursor-pointer"
          >
            Switch to today
          </button>
        </div>
      )}

      {/* Quick-tap Litre Presets */}
      <div className="mt-3.5 flex items-center gap-1.5 flex-wrap" aria-label="Quick litre presets">
        <span className="text-xs text-[#687584] dark:text-[#8d99a6] mr-1">Quick:</span>
        {QUICK_LITRES.map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => setLitres(String(val))}
            className={`min-h-[36px] px-2.5 rounded-lg text-xs font-medium tabular-nums border transition-colors cursor-pointer ${
              litres === String(val)
                ? 'bg-[#0a7ec2] border-[#0a7ec2] text-white'
                : 'bg-[#faf9f6] dark:bg-[#14181d] border-[#e4e9ef] dark:border-[#2b3640] text-[#1b2a38] dark:text-[#e8edf2] hover:border-[#0a7ec2] dark:hover:border-[#4aa8e8]'
            }`}
          >
            {val} L
          </button>
        ))}
      </div>

      {/* Add Entry Form */}
      <form onSubmit={handleSubmit} className="mt-3 grid grid-cols-3 gap-2.5">
        <div className="col-span-3">
          <label
            htmlFor="seller-input"
            className="block text-[11px] font-medium text-[#687584] dark:text-[#8d99a6] mb-1 ml-0.5"
          >
            Seller (optional)
          </label>
          <input
            id="seller-input"
            type="text"
            autoComplete="off"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            placeholder={lastSellerName ? `e.g. ${lastSellerName}` : 'Seller (optional)'}
            className="w-full min-h-[46px] px-3.5 py-2.5 text-base rounded-xl border border-[#e4e9ef] dark:border-[#2b3640] bg-[#faf9f6] dark:bg-[#14181d] text-[#1b2a38] dark:text-[#e8edf2] placeholder:text-[#8a96a3] focus:outline-none focus:border-[#0a7ec2] dark:focus:border-[#4aa8e8]"
          />
        </div>

        <div>
          <label
            htmlFor="litres-input"
            className="block text-[11px] font-medium text-[#687584] dark:text-[#8d99a6] mb-1 ml-0.5"
          >
            Litres
          </label>
          <input
            id="litres-input"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.25"
            value={litres}
            onChange={(e) => setLitres(e.target.value)}
            placeholder="Litres"
            className="w-full min-h-[46px] px-3 py-2.5 text-base rounded-xl border border-[#e4e9ef] dark:border-[#2b3640] bg-[#faf9f6] dark:bg-[#14181d] text-[#1b2a38] dark:text-[#e8edf2] placeholder:text-[#8a96a3] tabular-nums focus:outline-none focus:border-[#0a7ec2] dark:focus:border-[#4aa8e8]"
          />
        </div>

        <div>
          <label
            htmlFor="rate-input"
            className="block text-[11px] font-medium text-[#687584] dark:text-[#8d99a6] mb-1 ml-0.5"
          >
            KSh / L
          </label>
          <input
            id="rate-input"
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-full min-h-[46px] px-3 py-2.5 text-base rounded-xl border border-[#e4e9ef] dark:border-[#2b3640] bg-[#faf9f6] dark:bg-[#14181d] text-[#1b2a38] dark:text-[#e8edf2] tabular-nums focus:outline-none focus:border-[#0a7ec2] dark:focus:border-[#4aa8e8]"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#0a7ec2] hover:bg-[#096da8] active:scale-[0.98] text-white font-semibold text-base transition-all cursor-pointer whitespace-nowrap"
          >
            Add
          </button>
        </div>
      </form>

      {/* Inline Status Feedback */}
      <div className="min-h-[20px] mt-1.5 text-xs font-medium text-[#0a7ec2] dark:text-[#4aa8e8]" role="status">
        {feedbackMsg}
      </div>

      {/* Tonight's Logged Entries */}
      <div className="mt-2">
        {tonightItems.length === 0 ? (
          <div className="text-center text-sm text-[#687584] dark:text-[#8d99a6] py-3 border-t border-[#e4e9ef] dark:border-[#2b3640]">
            Nothing logged tonight yet.
          </div>
        ) : (
          <ul className="divide-y divide-[#e4e9ef] dark:divide-[#2b3640] border-t border-[#e4e9ef] dark:border-[#2b3640]">
            {tonightItems.map((entry) => (
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
        )}
      </div>

      {/* Last 7 Evenings Chart */}
      <div className="mt-4 pt-3 border-t border-[#e4e9ef] dark:border-[#2b3640]">
        <div className="flex items-center justify-between text-xs text-[#687584] dark:text-[#8d99a6] mb-2">
          <span>Last 7 evenings</span>
          <span className="tabular-nums">
            Total: {fmtL(last7Days.reduce((s, d) => s + d.litres, 0))} L
          </span>
        </div>
        <div className="flex items-end gap-2 h-24 pt-2" aria-label="Last 7 evenings milk volume chart">
          {last7Days.map((day) => {
            const pct = Math.max(4, Math.round((day.litres / maxChartLitres) * 100));
            return (
              <div
                key={day.key}
                className="flex-1 flex flex-col items-center justify-end h-full group"
                title={`${fmtDate(day.key)}: ${fmtL(day.litres)} L`}
              >
                <span className="text-[10px] font-mono tabular-nums text-[#687584] dark:text-[#8d99a6] mb-1">
                  {day.litres > 0 ? fmtL(day.litres) : ''}
                </span>
                <div className="w-full flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t-md rounded-b-[2px] transition-all duration-300 ${
                      day.isToday
                        ? 'bg-[#0a7ec2] dark:bg-[#4aa8e8]'
                        : day.litres > 0
                          ? 'bg-[#bfe0f6] dark:bg-[#2c5270]'
                          : 'bg-[#eef1f4] dark:bg-[#2a333c]'
                    }`}
                    style={{ height: `${day.litres > 0 ? pct : 6}%` }}
                  />
                </div>
                <span
                  className={`text-[11px] mt-1.5 ${
                    day.isToday
                      ? 'font-bold text-[#0a7ec2] dark:text-[#4aa8e8]'
                      : 'text-[#687584] dark:text-[#8d99a6]'
                  }`}
                >
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
