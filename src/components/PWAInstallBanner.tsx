/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, Smartphone, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If already running inside an installed PWA or dismissed, hide banner
  if (isInstalled || dismissed) {
    return null;
  }

  // Only show banner if on Android/Desktop with install prompt or on iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-b border-emerald-500/20 px-4 py-2.5 text-xs text-slate-200 backdrop-blur-md sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
              <Smartphone className="w-4 h-4" />
            </div>
            <p className="truncate">
              <span className="font-bold text-white">Install NutriTrack App:</span> Fast home screen access & offline tracking for {isIOS ? 'iPhone / iPad' : 'Android'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isInstallable && (
              <button
                onClick={install}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                Install App
              </button>
            )}

            {isIOS && (
              <button
                onClick={() => setShowIOSModal(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                Install on iOS
              </button>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apple requires installation directly through Safari:
            </p>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                  1
                </div>
                <div className="leading-snug">
                  Tap the <span className="font-semibold text-white inline-flex items-center gap-1 mx-1"><Share2 className="w-3.5 h-3.5 text-sky-400 inline" /> Share</span> button at the bottom of your Safari browser.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                  2
                </div>
                <div className="leading-snug">
                  Scroll down the menu and tap <span className="font-semibold text-white inline-flex items-center gap-1 mx-1"><PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" /> Add to Home Screen</span>.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                  3
                </div>
                <div className="leading-snug">
                  Tap <span className="font-semibold text-emerald-400">Add</span> in the top right corner. NutriTrack AI will appear on your home screen like a native app!
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
