/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Smartphone,
  Apple,
  Download,
  Share2,
  PlusSquare,
  QrCode,
  Terminal,
  CheckCircle2,
  X,
  ExternalLink,
  Sparkles,
  Layers,
  Copy,
  Check,
} from 'lucide-react';

interface MobileAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileAppModal: React.FC<MobileAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'native' | 'qr'>(
    isIOS ? 'ios' : 'android'
  );
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://github.com';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    currentUrl
  )}&bgcolor=020617&color=10b981&margin=2`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950">
              <Smartphone className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                NutriTrack Mobile App
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Android & iOS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Run as a standalone app with offline support, full screen, & camera tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'android'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Android
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ios'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Apple className="w-4 h-4" />
            iOS (iPhone)
          </button>

          <button
            onClick={() => setActiveTab('native')}
            className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'native'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            Capacitor & APK
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'qr'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <QrCode className="w-4 h-4" />
            QR Code
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* TAB 1: ANDROID */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-950 border border-emerald-500/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      1-Tap PWA Install (WebAPK)
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Android automatically compiles this app into a native WebAPK. It installs directly
                      onto your home screen, launches in fullscreen without browser bars, and caches offline.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  {isInstallable ? (
                    <button
                      onClick={install}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      Install NutriTrack AI on Android
                    </button>
                  ) : isInstalled ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      NutriTrack AI is already installed!
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium">
                      <span>Open this page in Chrome or Samsung Internet to install with 1 tap</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Manual Android Installation Steps:
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                      1
                    </span>
                    <p>
                      Open the app URL in <span className="text-white font-semibold">Google Chrome</span> or <span className="text-white font-semibold">Samsung Internet</span> on your Android device.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                      2
                    </span>
                    <p>
                      Tap the <span className="text-white font-semibold">⋮ (three dots)</span> menu in the top right corner of the browser.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                      3
                    </span>
                    <p>
                      Select <span className="text-emerald-400 font-semibold">Install App</span> (or <span className="text-emerald-400 font-semibold">Add to Home screen</span>). NutriTrack AI will appear in your App Drawer and Home Screen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IOS (IPHONE / IPAD) */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 to-slate-950 border border-sky-500/20">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Apple className="w-4 h-4 text-sky-400" />
                  Install on iPhone / iPad (Safari)
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Apple supports Progressive Web Apps directly via Safari. Once added, NutriTrack AI runs
                  with fullscreen standalone display, custom iOS app icon, notch support, and offline caching without needing the App Store.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-sky-500/20">
                    1
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Open in Safari</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ensure you are viewing this app in Apple Safari (Chrome/Firefox on iOS do not support installing PWA icons).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-sky-500/20">
                    2
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                      Tap the Share Button <Share2 className="w-3.5 h-3.5 text-sky-400" />
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tap the Share icon (square with arrow pointing up) at the bottom toolbar of Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-emerald-500/20">
                    3
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                      Select "Add to Home Screen" <PlusSquare className="w-3.5 h-3.5 text-emerald-400" />
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Scroll down the options list and tap <span className="text-emerald-400 font-semibold">Add to Home Screen</span>, then tap <span className="text-white font-semibold">Add</span> in the top-right corner.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CAPACITOR & NATIVE PACKAGES */}
          {activeTab === 'native' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Native Android (.apk/.aab) & iOS Xcode App
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  The repository is equipped with <span className="text-emerald-400 font-semibold">Capacitor</span> configuration (<code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">capacitor.config.ts</code>). You can generate native Android Studio and iOS Xcode projects or build an APK via GitHub Actions.
                </p>
              </div>

              {/* GitHub Actions APK Build Option */}
              <div className="p-4 rounded-2xl bg-violet-950/30 border border-violet-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  <h4 className="text-xs font-bold text-white">Automated APK via GitHub Actions</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We added a workflow in your repository at <code className="text-violet-300 bg-slate-900 px-1 py-0.5 rounded">.github/workflows/build-mobile.yml</code>.
                </p>
                <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside pl-1">
                  <li>Go to your GitHub repository and click the <strong className="text-white">Actions</strong> tab.</li>
                  <li>Click <strong className="text-white">Build Android APK (Capacitor)</strong> on the left.</li>
                  <li>Click <strong className="text-emerald-400">Run workflow</strong>.</li>
                  <li>Download the ready-to-install <strong className="text-white">.apk</strong> directly from Artifacts!</li>
                </ol>
              </div>

              {/* Local Capacitor CLI Commands */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  Local Development Commands:
                </h4>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400"># 1. Install platforms and sync web build:</span>
                    <button
                      onClick={() =>
                        copyToClipboard('npm run build && npx cap add android && npx cap add ios', 'cmd1')
                      }
                      className="text-slate-400 hover:text-white p-1 rounded"
                    >
                      {copiedCmd === 'cmd1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-emerald-400 break-all">npm run build && npx cap add android && npx cap add ios</p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400"># 2. Open in Android Studio to run on Android phone:</span>
                    <button
                      onClick={() => copyToClipboard('npm run cap:android', 'cmd2')}
                      className="text-slate-400 hover:text-white p-1 rounded"
                    >
                      {copiedCmd === 'cmd2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-emerald-400 break-all">npm run cap:android</p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400"># 3. Open in Xcode to run on iPhone / iOS Simulator:</span>
                    <button
                      onClick={() => copyToClipboard('npm run cap:ios', 'cmd3')}
                      className="text-slate-400 hover:text-white p-1 rounded"
                    >
                      {copiedCmd === 'cmd3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-emerald-400 break-all">npm run cap:ios</p>
                </div>
              </div>

              {/* PWABuilder option */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    PWABuilder (No Code Google Play & iOS Packager)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Generate ready-to-publish Google Play and iOS app packages by pasting your GitHub Pages URL into PWABuilder.
                  </p>
                </div>
                <a
                  href="https://www.pwabuilder.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 flex items-center gap-1.5 flex-shrink-0"
                >
                  PWABuilder <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 4: QR CODE SCANNER */}
          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-slate-300">
                Scan this QR code with your iPhone or Android camera to open NutriTrack AI directly on your device:
              </p>

              <div className="inline-block p-4 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl">
                <img
                  src={qrCodeUrl}
                  alt="NutriTrack AI QR Code"
                  className="w-48 h-48 rounded-xl mx-auto"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 max-w-md mx-auto">
                <span className="text-xs text-slate-400 truncate text-left">{currentUrl}</span>
                <button
                  onClick={() => copyToClipboard(currentUrl, 'url')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-emerald-400 font-semibold flex items-center gap-1 flex-shrink-0"
                >
                  {copiedCmd === 'url' ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Powered by PWA & Capacitor • Offline Ready
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
