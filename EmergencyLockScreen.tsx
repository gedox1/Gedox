import React, { useState } from 'react';
import { Lock, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export function EmergencyLockScreen() {
  const {
    isAppLocked,
    unlockApp,
    isEmergencySetupModalOpen,
    setIsEmergencySetupModalOpen,
    quickSetupAndLockApp,
  } = useVault();

  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [setupError, setSetupError] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const ok = await unlockApp(pinInput);
      if (!ok) {
        setError('Incorrect Master PIN. Access remains locked.');
      } else {
        setPinInput('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length < 4) {
      setSetupError('Master PIN must be at least 4 characters.');
      return;
    }
    if (newPin !== confirmPin) {
      setSetupError('PIN confirmation does not match.');
      return;
    }
    setSetupError('');
    await quickSetupAndLockApp(newPin);
    setNewPin('');
    setConfirmPin('');
  };

  if (isAppLocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06080D] px-4 text-[#F1F5F9]">
        <div className="w-full max-w-md rounded-xl border border-[#1B263B] bg-[#0B101B] p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-white">MYVAULT Locked</h1>
              <p className="text-xs text-slate-400">Your Life. Your Rules.</p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate-300">
            Emergency Lock is active. All schedules, journal entries, and encrypted secrets are hidden until you verify your Master App PIN.
          </p>

          <form onSubmit={handleUnlock} className="mt-6 space-y-4">
            <div>
              <label htmlFor="master-unlock-pin" className="block text-xs font-medium text-slate-300 mb-1.5">
                Master App PIN or Password
              </label>
              <input
                id="master-unlock-pin"
                type="password"
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter your Master PIN"
                className="w-full rounded-lg border border-[#1B263B] bg-[#06080D] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-xs font-medium text-rose-400" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !pinInput.trim()}
              className="w-full rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-[#06080D] hover:bg-[#E5C158] disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Verifying...' : 'Unlock MYVAULT'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isEmergencySetupModalOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Set Emergency Lock PIN
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Required once before locking the entire app
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEmergencySetupModalOpen(false)}
              aria-label="Close modal"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#131C31]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleQuickSetup} className="mt-5 space-y-4">
            <div>
              <label htmlFor="quick-pin" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Create Master App PIN (min 4 characters)
              </label>
              <input
                id="quick-pin"
                type="password"
                autoFocus
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Enter PIN or passphrase"
                className="w-full rounded-lg border border-slate-300 dark:border-[#1B263B] bg-white dark:bg-[#06080D] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="quick-pin-confirm" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm Master App PIN
              </label>
              <input
                id="quick-pin-confirm"
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Re-enter PIN"
                className="w-full rounded-lg border border-slate-300 dark:border-[#1B263B] bg-white dark:bg-[#06080D] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            {setupError && (
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{setupError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEmergencySetupModalOpen(false)}
                className="rounded-lg border border-slate-200 dark:border-[#1B263B] px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#131C31]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#06080D] hover:bg-[#E5C158]"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Save & Lock Now</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
