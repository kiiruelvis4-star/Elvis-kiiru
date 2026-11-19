import { Check, Download, HardDriveDownload, HardDriveUpload, Upload, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import type {
  CompareRow,
  EveningMilkState,
  SellerExportEntry,
  SellerExportPayload,
} from '../types/milk';
import { fmtDate, fmtL, todayKey } from '../utils/milkHelpers';
import { sanitizeState } from '../utils/offlineStorage';

interface CompareSellerCardProps {
  state: EveningMilkState;
  onRestoreBackup: (restored: EveningMilkState) => void;
}

function sumByDate(list: { date: string; litres: number }[]): Record<string, number> {
  const map: Record<string, number> = {};
  list.forEach((item) => {
    map[item.date] = (map[item.date] || 0) + Number(item.litres || 0);
  });
  return map;
}

export function CompareSellerCard({ state, onRestoreBackup }: CompareSellerCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const [compareRows, setCompareRows] = useState<CompareRow[] | null>(null);
  const [compareError, setCompareError] = useState<string>('');
  const [backupNotice, setBackupNotice] = useState<string>('');

  const handleExport = () => {
    const payload: SellerExportPayload = {
      app: 'evening-milk',
      exportedAt: new Date().toISOString(),
      role: 'buyer',
      entries: state.entries.map((e) => ({
        date: e.date,
        litres: e.litres,
        rate: e.rate,
        seller: e.seller,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evening-milk-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed?.app !== 'evening-milk' || !Array.isArray(parsed?.entries)) {
          throw new Error('Invalid file format');
        }
        const mine = sumByDate(state.entries);
        const theirs = sumByDate(parsed.entries as SellerExportEntry[]);
        const allDates = [...new Set([...Object.keys(mine), ...Object.keys(theirs)])]
          .sort()
          .reverse();

        const rows: CompareRow[] = allDates.map((d) => {
          const a = mine[d] || 0;
          const b = theirs[d] || 0;
          return {
            date: d,
            mine: a,
            theirs: b,
            match: Math.abs(a - b) < 0.01,
          };
        });

        setCompareError('');
        setCompareRows(rows);
      } catch {
        setCompareRows(null);
        setCompareError('That file is not a valid milk log export.');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleExportBackup = () => {
    const payload = {
      app: 'evening-milk-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evening-milk-backup-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setBackupNotice('Full backup saved to your device.');
  };

  const handleRestoreBackupFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const candidate = parsed?.app === 'evening-milk-backup' ? parsed.state : parsed;
        const clean = sanitizeState(candidate);
        if (!clean) {
          throw new Error('Invalid backup');
        }
        onRestoreBackup(clean);
        setBackupNotice(`Restored ${clean.entries.length} entries locally.`);
      } catch {
        setBackupNotice('Could not restore — invalid backup file.');
      }
      if (backupInputRef.current) {
        backupInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <section className="bg-white dark:bg-[#1d242c] border border-[#e4e9ef] dark:border-[#2b3640] rounded-2xl p-4 sm:p-5">
      <h2 className="font-display text-lg font-bold text-[#1b2a38] dark:text-[#e8edf2]">
        Compare with seller
      </h2>
      <p className="text-sm text-[#687584] dark:text-[#8d99a6] mt-1">
        Export your records, send the file to your seller. Import their file to compare day by day.
      </p>

      <div className="flex flex-wrap gap-2.5 mt-3.5">
        <button
          type="button"
          onClick={handleExport}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[#e4e9ef] dark:border-[#2b3640] bg-[#faf9f6] dark:bg-[#14181d] text-[#1b2a38] dark:text-[#e8edf2] hover:border-[#0a7ec2] dark:hover:border-[#4aa8e8] text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
        >
          <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Export my file</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[#e4e9ef] dark:border-[#2b3640] bg-[#faf9f6] dark:bg-[#14181d] text-[#1b2a38] dark:text-[#e8edf2] hover:border-[#0a7ec2] dark:hover:border-[#4aa8e8] text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
        >
          <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Import seller&apos;s file</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {compareError && (
        <p className="mt-3 text-xs font-medium text-[#d64545] dark:text-[#f87171]">{compareError}</p>
      )}

      {compareRows !== null && (
        <div className="mt-4">
          {compareRows.length === 0 ? (
            <p className="text-xs text-[#687584] dark:text-[#8d99a6]">Nothing to compare yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#687584] dark:text-[#8d99a6] border-b border-[#e4e9ef] dark:border-[#2b3640]">
                    <th className="py-2 pr-2 font-medium">Date</th>
                    <th className="py-2 px-2 font-medium">Me</th>
                    <th className="py-2 px-2 font-medium">Seller</th>
                    <th className="py-2 pl-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e9ef] dark:divide-[#2b3640] tabular-nums">
                  {compareRows.map((row) => (
                    <tr key={row.date}>
                      <td className="py-2 pr-2 text-[#1b2a38] dark:text-[#e8edf2]">
                        {fmtDate(row.date)}
                      </td>
                      <td className="py-2 px-2 text-[#1b2a38] dark:text-[#e8edf2]">
                        {fmtL(row.mine)} L
                      </td>
                      <td className="py-2 px-2 text-[#1b2a38] dark:text-[#e8edf2]">
                        {fmtL(row.theirs)} L
                      </td>
                      <td className="py-2 pl-2 text-right">
                        {row.match ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2e9e5b] dark:text-[#4ade80]">
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            Match
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#d64545] dark:text-[#f87171]">
                            <X className="w-3.5 h-3.5" aria-hidden="true" />
                            Differs
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Offline Full Device Backup & Restore */}
      <div className="mt-4 pt-3.5 border-t border-[#e4e9ef] dark:border-[#2b3640]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-[#687584] dark:text-[#8d99a6]">
            Offline backup (all entries &amp; paid days)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#e4e9ef] dark:border-[#2b3640] bg-[#faf9f6] dark:bg-[#14181d] text-[#1b2a38] dark:text-[#e8edf2] hover:border-[#0a7ec2] dark:hover:border-[#4aa8e8] text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
            >
              <HardDriveDownload className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Save backup</span>
            </button>
            <button
              type="button"
              onClick={() => backupInputRef.current?.click()}
              className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#e4e9ef] dark:border-[#2b3640] bg-[#faf9f6] dark:bg-[#14181d] text-[#1b2a38] dark:text-[#e8edf2] hover:border-[#0a7ec2] dark:hover:border-[#4aa8e8] text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
            >
              <HardDriveUpload className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Restore</span>
            </button>
            <input
              ref={backupInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleRestoreBackupFile}
              className="hidden"
            />
          </div>
        </div>
        {backupNotice && (
          <p className="mt-2 text-xs font-medium text-[#0a7ec2] dark:text-[#4aa8e8]">{backupNotice}</p>
        )}
      </div>
    </section>
  );
}
