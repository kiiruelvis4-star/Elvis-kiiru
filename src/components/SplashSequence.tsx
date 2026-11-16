import { useEffect, useState } from 'react';

interface SplashSequenceProps {
  onComplete: () => void;
}

type SplashStage = 'splash1' | 'splash2' | 'exiting';

export function SplashSequence({ onComplete }: SplashSequenceProps) {
  const [stage, setStage] = useState<SplashStage>('splash1');
  const [progress, setProgress] = useState<number>(0);
  const [iconError, setIconError] = useState(false);
  const [cowError, setCowError] = useState(false);

  // Stage 1 (Icon Splash) -> Stage 2 (Cow Splash)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStage('splash2');
    }, 1350);

    return () => window.clearTimeout(timer);
  }, []);

  // Stage 2: Smooth 0 -> 100 progress bar animation
  useEffect(() => {
    if (stage !== 'splash2') return;

    let rafId = 0;
    let completeTimeout = 0;
    const durationMs = 2200;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      // Smooth ease-out-quad so 0 -> 100 feels responsive and finishes cleanly
      const eased = 1 - (1 - t) * (1 - t);
      const value = Math.min(100, Math.round(eased * 100));
      setProgress(value);

      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        completeTimeout = window.setTimeout(() => {
          setStage('exiting');
          window.setTimeout(onComplete, 320);
        }, 280);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(completeTimeout);
    };
  }, [stage, onComplete]);

  return (
    <div
      role="dialog"
      aria-label="Evening Milk Splash Screen"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-6 py-8 transition-opacity duration-300 select-none ${
        stage === 'exiting' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background:
          stage === 'splash1'
            ? 'radial-gradient(circle at 50% 38%, #4d88ff 0%, #2452c7 48%, #102563 100%)'
            : 'radial-gradient(circle at 50% 35%, #5b37c9 0%, #2b1874 52%, #130b3a 100%)',
      }}
    >
      {/* Skip button in top-right */}
      <button
        type="button"
        onClick={onComplete}
        className="absolute top-4 right-4 min-h-[44px] px-4 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 active:scale-[0.98] transition-colors focus-visible:outline-2 focus-visible:outline-white"
      >
        Skip
      </button>

      {stage === 'splash1' ? (
        /* SPLASH 1: Rose App Icon */
        <div className="flex flex-col items-center text-center animate-splash-pop max-w-sm">
          <div className="relative mb-6">
            <div className="absolute -inset-4 rounded-[40px] bg-sky-300/25 blur-xl" aria-hidden="true" />
            {!iconError ? (
              <img
                src="/assets/aistudio/icon-192_31d74467.png"
                alt="The Roses Family Evening Milk Icon"
                referrerPolicy="no-referrer"
                onError={() => setIconError(true)}
                className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-[32px] shadow-2xl shadow-black/40 border-2 border-white/40 object-cover"
              />
            ) : (
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-[32px] bg-sky-500 flex items-center justify-center text-white font-display font-bold text-3xl shadow-2xl border-2 border-white/40">
                RM
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm font-medium tracking-[0.22em] text-sky-100/85 uppercase mb-1.5">
            The Roses Family
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Evening Milk
          </h1>
          <p className="mt-2 text-sm text-sky-100/75">Nakuru · Kenya</p>
        </div>
      ) : (
        /* SPLASH 2: Cow Splash + 0 to 100 Moving Bar */
        <div className="w-full max-w-md flex flex-col items-center animate-splash-fade">
          <div className="w-full max-w-[360px] sm:max-w-[400px] rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/20 bg-[#241363]">
            {!cowError ? (
              <img
                src="/assets/aistudio/evening-milk-splash_69a5455f.webp"
                alt="The Roses Family Milk Log — Evening milk settled every 2 weeks, Nakuru Kenya"
                referrerPolicy="no-referrer"
                onError={() => setCowError(true)}
                className="w-full aspect-square object-cover block"
              />
            ) : (
              <div className="w-full aspect-square flex flex-col items-center justify-center p-8 text-center text-white bg-gradient-to-b from-violet-600 to-indigo-900">
                <span className="font-display text-2xl font-bold">The Roses Family</span>
                <span className="text-lg text-amber-300 font-semibold mt-1">Milk Log</span>
                <span className="text-sm text-white/80 mt-4">Evening milk - settled every 2 weeks</span>
                <span className="text-xs text-white/60 mt-1">NAKURU - KENYA</span>
              </div>
            )}
          </div>

          {/* 0 to 100 Progress Bar */}
          <div className="w-full max-w-[360px] sm:max-w-[400px] mt-6">
            <div className="flex items-center justify-between text-xs sm:text-sm text-white/90 mb-2 font-medium">
              <span>{progress < 100 ? 'Loading milk log…' : 'Ready'}</span>
              <span className="font-mono tabular-nums font-semibold text-amber-200">{progress}%</span>
            </div>

            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-label="Loading Evening Milk"
              className="w-full h-3.5 rounded-full bg-white/15 border border-white/20 overflow-hidden backdrop-blur-sm p-0.5"
            >
              <div
                className="h-full w-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300 origin-left transition-transform duration-75 ease-out"
                style={{ transform: `scaleX(${progress / 100})` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-white/55 mt-1.5">
              <span>0</span>
              <span>100</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
