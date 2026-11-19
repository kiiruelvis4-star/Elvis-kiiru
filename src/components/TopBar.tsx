import { Bell, BellOff, Moon, RotateCcw, Sun } from 'lucide-react';
import { useState } from 'react';
import { pad } from '../utils/milkHelpers';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  now: Date;
  notifyPermission: NotificationPermission | 'unsupported';
  notifyMessage: string;
  onRequestNotify: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onReplaySplash: () => void;
}

export function TopBar({
  now,
  notifyPermission,
  notifyMessage,
  onRequestNotify,
  isDark,
  onToggleTheme,
  onReplaySplash,
}: TopBarProps) {
  const [iconFailed, setIconFailed] = useState(false);

  const timeText = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const dateText = now.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const notifyLabel =
    notifyPermission === 'granted'
      ? 'Notifications on'
      : notifyPermission === 'denied'
        ? 'Blocked in browser'
        : notifyPermission === 'unsupported'
          ? 'Not supported'
          : 'Allow notifications';

  return (
    <header className="bg-white dark:bg-[#1d242c] border border-[#e4e9ef] dark:border-[#2b3640] rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Left: Brand Icon + Live Clock */}
      <div className="flex items-center gap-3.5 min-w-0">
        {!iconFailed ? (
          <img
            src="/assets/aistudio/icon-192_31d74467.png"
            alt="The Roses Family Icon"
            referrerPolicy="no-referrer"
            onError={() => setIconFailed(true)}
            className="w-11 h-11 rounded-xl shrink-0 object-cover border border-[#e4e9ef] dark:border-[#2b3640]"
          />
        ) : (
          <div className="w-11 h-11 rounded-xl shrink-0 bg-[#0a7ec2] text-white font-display font-bold flex items-center justify-center text-sm">
            RM
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="font-display text-lg font-bold tracking-tight text-[#1b2a38] dark:text-[#e8edf2] whitespace-nowrap">
              Evening Milk
            </span>
            <span className="text-xs text-[#687584] dark:text-[#8d99a6] whitespace-nowrap">
              The Roses Family · Nakuru
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#687584] dark:text-[#8d99a6] mt-0.5">
            <span className="font-mono tabular-nums font-semibold text-sm text-[#1b2a38] dark:text-[#e8edf2]">
              {timeText}
            </span>
            <span aria-hidden="true">·</span>
            <span>{dateText}</span>
            <span aria-hidden="true">·</span>
            <span>4:00 PM reminder</span>
          </div>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <PWAInstallButton />

        <div className="flex flex-col items-end">
          <button
            type="button"
            onClick={onRequestNotify}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              notifyPermission === 'granted'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-300'
                : 'bg-[#faf9f6] dark:bg-[#14181d] border-[#e4e9ef] dark:border-[#2b3640] text-[#1b2a38] dark:text-[#e8edf2] hover:border-[#0a7ec2] dark:hover:border-[#4aa8e8]'
            }`}
          >
            {notifyPermission === 'granted' ? (
              <Bell className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <BellOff className="w-4 h-4 shrink-0 text-[#687584] dark:text-[#8d99a6]" aria-hidden="true" />
            )}
            <span>{notifyLabel}</span>
          </button>
          {notifyMessage ? (
            <span className="text-[11px] text-[#687584] dark:text-[#8d99a6] mt-1">
              {notifyMessage}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onReplaySplash}
          title="Replay splash screen"
          aria-label="Replay splash screen"
          className="min-h-[44px] min-w-[44px] px-3 rounded-xl border border-[#e4e9ef] dark:border-[#2b3640] bg-[#faf9f6] dark:bg-[#14181d] text-[#1b2a38] dark:text-[#e8edf2] hover:border-[#0a7ec2] dark:hover:border-[#4aa8e8] inline-flex items-center justify-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Splash</span>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="min-h-[44px] min-w-[44px] rounded-xl border border-[#e4e9ef] dark:border-[#2b3640] bg-[#faf9f6] dark:bg-[#14181d] text-[#1b2a38] dark:text-[#e8edf2] hover:border-[#0a7ec2] dark:hover:border-[#4aa8e8] inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors"
        >
          {isDark ? (
            <Sun className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Moon className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
}
