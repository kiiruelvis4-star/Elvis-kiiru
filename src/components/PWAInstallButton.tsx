import { Download, Share, X } from 'lucide-react';
import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Already running as an installed offline app
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="Download app for offline use"
        aria-label="Install app for offline use"
        className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-all active:scale-[0.98] ${
          isInstallable
            ? 'bg-[#0a7ec2] hover:bg-[#096da8] text-white border border-[#0a7ec2]'
            : 'bg-[#eef6fd] dark:bg-[#1a2c3a] border border-[#bfe0f6] dark:border-[#2c5270] text-[#0b5a8a] dark:text-[#8fcaf2] hover:border-[#0a7ec2] dark:hover:border-[#4aa8e8]'
        }`}
      >
        <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
      </button>

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1d242c] border border-[#e4e9ef] dark:border-[#2b3640] p-5 shadow-2xl text-[#1b2a38] dark:text-[#e8edf2]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 id="pwa-install-title" className="font-display text-lg font-bold">
                {isIOS ? 'Install on iPhone / iPad' : 'Download & Use Offline'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install instructions"
                className="min-h-[36px] min-w-[36px] -mr-1 -mt-1 rounded-xl text-[#687584] dark:text-[#8d99a6] hover:bg-[#faf9f6] dark:hover:bg-[#14181d] inline-flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-3 space-y-2 text-sm text-[#43515f] dark:text-[#b4c0cc]">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-[#0a7ec2] dark:text-[#4aa8e8]">1.</span>
                  <span>
                    Tap the{' '}
                    <strong className="inline-flex items-center gap-1 text-[#1b2a38] dark:text-[#e8edf2]">
                      <Share className="w-3.5 h-3.5" aria-hidden="true" /> Share
                    </strong>{' '}
                    button in Safari&apos;s toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-[#0a7ec2] dark:text-[#4aa8e8]">2.</span>
                  <span>
                    Scroll down and tap{' '}
                    <strong className="text-[#1b2a38] dark:text-[#e8edf2]">Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-[#0a7ec2] dark:text-[#4aa8e8]">3.</span>
                  <span>Open Evening Milk from your home screen — it works with no data or Wi-Fi.</span>
                </li>
              </ol>
            ) : (
              <div className="mt-3 space-y-2.5 text-sm text-[#43515f] dark:text-[#b4c0cc]">
                <p>
                  This app is already cached on your device for 100% offline use. To install it as a
                  standalone app on your phone or computer:
                </p>
                <ol className="space-y-1.5">
                  <li>
                    <strong className="text-[#1b2a38] dark:text-[#e8edf2]">1.</strong> Open the
                    published app link directly in Chrome, Edge, or Android browser.
                  </li>
                  <li>
                    <strong className="text-[#1b2a38] dark:text-[#e8edf2]">2.</strong> Tap the{' '}
                    <strong>Install</strong> icon in the address bar or choose{' '}
                    <strong>Add to Home screen</strong> in the browser menu.
                  </li>
                </ol>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-[#0a7ec2] hover:bg-[#096da8] text-white text-sm font-semibold cursor-pointer transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
