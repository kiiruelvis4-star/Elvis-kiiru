import { Capacitor } from '@capacitor/core';
import { AlertTriangle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarCard } from './components/CalendarCard';
import { CompareSellerCard } from './components/CompareSellerCard';
import { DayDetailCard } from './components/DayDetailCard';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SplashSequence } from './components/SplashSequence';
import { TonightCard } from './components/TonightCard';
import { TopBar } from './components/TopBar';
import type { EveningMilkState } from './types/milk';
import {
  addDaysKey,
  dayLitres,
  dayOwed,
  fmtKsh,
  loadMilkState,
  OVERDUE_DAYS,
  persistMilkState,
  REMIND_HOUR,
  statusOf,
  todayKey,
} from './utils/milkHelpers';
import {
  ensureAndroidDailyReminderActive,
  fireUnifiedNotification,
  getUnifiedNotifyPermission,
  requestUnifiedNotifyPermission,
  scheduleDailyFourPmAndroidReminder,
  type UnifiedNotifyStatus,
} from './utils/notifications';
import { loadMilkStateFromIDB, saveMilkStateToIDB } from './utils/offlineStorage';

const THEME_KEY = 'eveningMilk.theme';

function getInitialDarkMode(): boolean {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
  } catch {
    // Ignore storage read errors
  }
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

function getInitialNotifyPermission(): UnifiedNotifyStatus {
  if (Capacitor.isNativePlatform()) return 'default';
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashKey, setSplashKey] = useState(0);

  const [state, setState] = useState<EveningMilkState>(() => loadMilkState());
  const [now, setNow] = useState<Date>(() => new Date());
  const [viewYear, setViewYear] = useState<number>(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(() => todayKey());

  const [isDark, setIsDark] = useState<boolean>(() => getInitialDarkMode());
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [notifyPermission, setNotifyPermission] = useState<UnifiedNotifyStatus>(() =>
    getInitialNotifyPermission()
  );
  const [notifyMessage, setNotifyMessage] = useState('');

  const msgTimerRef = useRef<number | null>(null);
  const hydratedIDBRef = useRef(false);

  const showFeedback = useCallback((text: string) => {
    setFeedbackMsg(text);
    if (msgTimerRef.current) window.clearTimeout(msgTimerRef.current);
    msgTimerRef.current = window.setTimeout(() => {
      setFeedbackMsg('');
    }, 2200);
  }, []);

  // Sync dark mode class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#14181d' : '#faf9f6');
    }
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage write errors
    }
  }, [isDark]);

  // Recover from IndexedDB on boot if localStorage was empty
  useEffect(() => {
    if (hydratedIDBRef.current) return;
    hydratedIDBRef.current = true;
    loadMilkStateFromIDB().then((idbState) => {
      if (idbState && idbState.entries.length > 0) {
        setState((prev) => {
          if (prev.entries.length === 0) {
            return idbState;
          }
          return prev;
        });
      }
    });
  }, []);

  // Sync native Android daily 4:00 PM reminder alarm & permission state on boot and focus
  useEffect(() => {
    let active = true;
    const syncNotify = async () => {
      const perm = await ensureAndroidDailyReminderActive();
      if (!active) return;
      setNotifyPermission(perm);
    };
    void syncNotify();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setNow(new Date());
        void getUnifiedNotifyPermission().then((perm) => {
          if (active) setNotifyPermission(perm);
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Persist state locally to both localStorage and IndexedDB whenever it changes
  useEffect(() => {
    const ok = persistMilkState(state);
    void saveMilkStateToIDB(state);
    if (!ok) {
      showFeedback('Could not save on this device. Free up storage and try again.');
    }
  }, [state, showFeedback]);

  // Request persistent storage on boot so the browser never evicts offline cache/data
  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
  }, []);

  // Check daily 4:00 PM reminder (for web/PWA foreground; native Android uses OS AlarmManager at 16:00 daily)
  const checkReminder = useCallback((currentState: EveningMilkState) => {
    if (Capacitor.isNativePlatform()) return;
    const current = new Date();
    const t = todayKey();
    if (current.getHours() < REMIND_HOUR) return;
    if (currentState.lastReminded === t) return;

    if (dayLitres(currentState.entries, t) > 0) {
      setState((prev) => (prev.lastReminded === t ? prev : { ...prev, lastReminded: t }));
      return;
    }

    setState((prev) => (prev.lastReminded === t ? prev : { ...prev, lastReminded: t }));
    void fireUnifiedNotification('Evening milk', "Log tonight's milk before you forget.");
  }, []);

  // Clock & reminder tick every 30s
  useEffect(() => {
    checkReminder(state);
    const intervalId = window.setInterval(() => {
      setNow(new Date());
      checkReminder(state);
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [state, checkReminder]);

  const handleRequestNotify = useCallback(async () => {
    const currentPerm = await getUnifiedNotifyPermission();
    if (currentPerm === 'granted') {
      if (Capacitor.isNativePlatform()) {
        await scheduleDailyFourPmAndroidReminder();
      }
      await fireUnifiedNotification(
        'Evening milk',
        'Daily 4:00 PM offline reminder is active.'
      );
      setNotifyPermission('granted');
      setNotifyMessage('4:00 PM daily reminder active · Test sent');
      return;
    }

    const permission = await requestUnifiedNotifyPermission();
    setNotifyPermission(permission);
    if (permission === 'granted') {
      setNotifyMessage('4:00 PM daily reminder active');
      await fireUnifiedNotification(
        'Evening milk',
        '4:00 PM daily offline reminder is now active.'
      );
      checkReminder(state);
    } else if (permission === 'denied') {
      setNotifyMessage(
        Capacitor.isNativePlatform()
          ? 'Blocked. Turn on in Android App Settings.'
          : 'Blocked. Turn on in browser settings.'
      );
    } else if (permission === 'unsupported') {
      setNotifyMessage('Notifications not supported on this device.');
    } else {
      setNotifyMessage('');
    }
  }, [checkReminder, state]);

  const handleAddEntry = useCallback(
    ({ litres, rate, seller }: { litres: number; rate: number; seller: string }) => {
      if (!(litres > 0)) {
        showFeedback('Enter the litres.');
        return;
      }
      if (!(rate >= 0)) {
        showFeedback('Enter the price per litre.');
        return;
      }

      const newEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        date: selectedDate,
        litres,
        rate,
        seller,
      };

      setState((prev) => {
        const nextPaidDays = { ...prev.paidDays };
        delete nextPaidDays[selectedDate];
        return {
          ...prev,
          entries: [...prev.entries, newEntry],
          paidDays: nextPaidDays,
          lastRate: rate,
          sellerName: seller || prev.sellerName,
        };
      });

      showFeedback('Added ✓');
    },
    [selectedDate, showFeedback]
  );

  const handleDeleteEntry = useCallback(
    (id: string) => {
      setState((prev) => {
        const nextEntries = prev.entries.filter((e) => e.id !== id);
        const nextPaidDays = { ...prev.paidDays };
        if (dayLitres(nextEntries, selectedDate) === 0) {
          delete nextPaidDays[selectedDate];
        }
        return {
          ...prev,
          entries: nextEntries,
          paidDays: nextPaidDays,
        };
      });
    },
    [selectedDate]
  );

  const handleTogglePaid = useCallback(
    (checked: boolean) => {
      if (dayLitres(state.entries, selectedDate) === 0) return;

      setState((prev) => {
        const nextPaidDays = { ...prev.paidDays };
        let nextDue = prev.nextDue;
        if (checked) {
          nextPaidDays[selectedDate] = true;
          nextDue = addDaysKey(todayKey(), OVERDUE_DAYS);
        } else {
          delete nextPaidDays[selectedDate];
        }
        return {
          ...prev,
          paidDays: nextPaidDays,
          nextDue,
        };
      });
    },
    [selectedDate, state.entries]
  );

  const handleShiftMonth = useCallback((delta: number) => {
    setViewMonth((prevMonth) => {
      const next = prevMonth + delta;
      if (next < 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      if (next > 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return next;
    });
  }, []);

  const handleSelectToday = useCallback(() => {
    const t = new Date();
    setSelectedDate(todayKey());
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
  }, []);

  const handleReplaySplash = useCallback(() => {
    setSplashKey((k) => k + 1);
    setShowSplash(true);
  }, []);

  const handleRestoreBackup = useCallback(
    (restored: EveningMilkState) => {
      setState(restored);
      showFeedback('Backup restored ✓');
    },
    [showFeedback]
  );

  // Overdue banner computation
  const overdueDates = [...new Set(state.entries.map((e) => e.date))].filter(
    (k) => statusOf(state, k) === 'overdue'
  );
  const overdueTotal = overdueDates.reduce((sum, k) => sum + dayOwed(state.entries, k), 0);

  return (
    <>
      {showSplash && (
        <SplashSequence key={splashKey} onComplete={() => setShowSplash(false)} />
      )}

      <OfflineIndicator />

      <div className="min-h-screen bg-[#faf9f6] dark:bg-[#14181d] text-[#1b2a38] dark:text-[#e8edf2] transition-colors">
        <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
          <TopBar
            now={now}
            notifyPermission={notifyPermission}
            notifyMessage={notifyMessage}
            onRequestNotify={handleRequestNotify}
            isDark={isDark}
            onToggleTheme={() => setIsDark((d) => !d)}
            onReplaySplash={handleReplaySplash}
          />

          {overdueDates.length > 0 && (
            <div
              role="alert"
              className="rounded-2xl bg-[#d64545] text-white px-4 py-3 flex items-center gap-3 text-sm font-medium"
            >
              <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>
                Payment overdue: <strong className="tabular-nums">{fmtKsh(overdueTotal)}</strong>. Tick
                paid once settled.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-6 space-y-4">
              <TonightCard
                entries={state.entries}
                selectedDate={selectedDate}
                lastRate={state.lastRate}
                lastSellerName={state.sellerName}
                feedbackMsg={feedbackMsg}
                onAddEntry={handleAddEntry}
                onDeleteEntry={handleDeleteEntry}
                onSelectToday={handleSelectToday}
              />

              <CompareSellerCard state={state} onRestoreBackup={handleRestoreBackup} />
            </div>

            <div className="lg:col-span-6 space-y-4">
              <CalendarCard
                state={state}
                viewYear={viewYear}
                viewMonth={viewMonth}
                selectedDate={selectedDate}
                onShiftMonth={handleShiftMonth}
                onSelectDate={setSelectedDate}
              />

              <DayDetailCard
                state={state}
                selectedDate={selectedDate}
                onDeleteEntry={handleDeleteEntry}
                onTogglePaid={handleTogglePaid}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
