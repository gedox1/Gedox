import React, { useRef, useState } from 'react';
import {
  Download,
  Fingerprint,
  KeyRound,
  Lock,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';

export function SecurityBackupView() {
  const {
    securityConfig,
    isSecretsUnlocked,
    biometricHardwareAvailable,
    updatePrivateModeSettings,
    setAppLockPin,
    removeAppLockPin,
    changeSecretsPin,
    enableBiometricsForSecrets,
    disableBiometricsForSecrets,
    triggerEmergencyLock,
    exportEncryptedBackup,
    importEncryptedBackup,
    clearSampleData,
    setActiveSection,
  } = useVault();

  // Master App PIN state
  const [currentMasterPin, setCurrentMasterPin] = useState('');
  const [newMasterPin, setNewMasterPin] = useState('');
  const [masterPinStatus, setMasterPinStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  // Secrets PIN change state
  const [curSecretPin, setCurSecretPin] = useState('');
  const [newSecretPin, setNewSecretPin] = useState('');
  const [secretPinStatus, setSecretPinStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  // Biometric notice
  const [bioStatus, setBioStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Encrypted Backup state
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [importPassphrase, setImportPassphrase] = useState('');
  const [selectedBackupText, setSelectedBackupText] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [backupStatus, setBackupStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handleSaveMasterPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMasterPin.trim().length < 4) {
      setMasterPinStatus({ type: 'err', text: 'Master PIN must be at least 4 characters.' });
      return;
    }
    const ok = await setAppLockPin(newMasterPin, currentMasterPin || undefined);
    if (!ok) {
      setMasterPinStatus({ type: 'err', text: 'Current Master PIN is incorrect.' });
      return;
    }
    setCurrentMasterPin('');
    setNewMasterPin('');
    setMasterPinStatus({
      type: 'ok',
      text: 'Master App PIN updated. Emergency Lock is armed.',
    });
  };

  const handleRemoveMasterPin = async () => {
    if (!currentMasterPin.trim()) {
      setMasterPinStatus({ type: 'err', text: 'Enter your current Master PIN to remove it.' });
      return;
    }
    const ok = await removeAppLockPin(currentMasterPin);
    if (!ok) {
      setMasterPinStatus({ type: 'err', text: 'Current Master PIN is incorrect.' });
      return;
    }
    setCurrentMasterPin('');
    setMasterPinStatus({ type: 'ok', text: 'Master App PIN removed.' });
  };

  const handleChangeSecretsPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSecretPin.trim().length < 4) {
      setSecretPinStatus({ type: 'err', text: 'New Secrets PIN must be at least 4 characters.' });
      return;
    }
    const ok = await changeSecretsPin(curSecretPin, newSecretPin);
    if (!ok) {
      setSecretPinStatus({ type: 'err', text: 'Current Secrets PIN is incorrect.' });
      return;
    }
    setCurSecretPin('');
    setNewSecretPin('');
    setSecretPinStatus({
      type: 'ok',
      text: 'Secrets PIN updated and all records re-encrypted with AES-256-GCM.',
    });
  };

  const handleToggleBiometrics = async () => {
    setBioStatus(null);
    if (securityConfig.biometricEnabled) {
      disableBiometricsForSecrets();
      setBioStatus({ type: 'ok', text: 'Biometric unlock disabled.' });
      return;
    }
    if (!isSecretsUnlocked) {
      setBioStatus({
        type: 'err',
        text: 'Unlock My Secrets first before linking fingerprint / biometrics.',
      });
      return;
    }
    try {
      await enableBiometricsForSecrets();
      setBioStatus({ type: 'ok', text: 'Fingerprint / biometric unlock linked to My Secrets.' });
    } catch (err) {
      setBioStatus({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : 'Biometric registration unavailable in this browser frame.',
      });
    }
  };

  const handleExportBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (exportPassphrase.trim().length < 6) {
      setBackupStatus({
        type: 'err',
        text: 'Use a backup passphrase of at least 6 characters.',
      });
      return;
    }
    try {
      const fileObj = await exportEncryptedBackup(exportPassphrase);
      const blob = new Blob([JSON.stringify(fileObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `myvault-backup-${stamp}.myvault`;
      a.click();
      URL.revokeObjectURL(url);
      setExportPassphrase('');
      setBackupStatus({
        type: 'ok',
        text: 'Encrypted .myvault backup downloaded successfully.',
      });
    } catch {
      setBackupStatus({ type: 'err', text: 'Failed to create encrypted backup.' });
    }
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedBackupText(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.readAsText(file);
  };

  const handleImportBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBackupText || !importPassphrase.trim()) {
      setBackupStatus({
        type: 'err',
        text: 'Select a .myvault backup file and enter its passphrase.',
      });
      return;
    }
    try {
      await importEncryptedBackup(selectedBackupText, importPassphrase);
      setImportPassphrase('');
      setSelectedBackupText(null);
      setSelectedFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setBackupStatus({
        type: 'ok',
        text: 'Encrypted backup decrypted and restored across your vault.',
      });
    } catch {
      setBackupStatus({
        type: 'err',
        text: 'Decryption failed. Verify your backup file and passphrase.',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Private Mode & Biometrics */}
        <section className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-[#1B263B]">
            <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Private Mode &amp; Biometrics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auto-lock controls for My Secrets
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="private-timeout"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Auto-Lock Secrets After Inactivity
              </label>
              <select
                id="private-timeout"
                value={securityConfig.privateModeTimeoutSeconds}
                onChange={(e) =>
                  updatePrivateModeSettings({ privateModeTimeoutSeconds: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value={60}>1 minute</option>
                <option value={180}>3 minutes (Recommended)</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
                <option value={0}>Manual lock only</option>
              </select>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={securityConfig.lockSecretsOnTabLeave}
                onChange={(e) =>
                  updatePrivateModeSettings({ lockSecretsOnTabLeave: e.target.checked })
                }
                className="mt-0.5 h-4 w-4 accent-[#D4AF37] rounded"
              />
              <span className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Immediately lock My Secrets when navigating to another section
              </span>
            </label>

            <div className="pt-3 border-t border-slate-100 dark:border-[#1B263B] space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Fingerprint / Biometric Unlock
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {biometricHardwareAvailable
                      ? 'Platform authenticator detected on this device'
                      : 'Browser platform biometric check unavailable or restricted'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleBiometrics}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                    securityConfig.biometricEnabled
                      ? 'border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300'
                      : 'border border-slate-200 dark:border-[#1B263B] text-slate-700 dark:text-slate-200 hover:border-[#D4AF37]'
                  }`}
                >
                  <Fingerprint className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span>{securityConfig.biometricEnabled ? 'Disable' : 'Enable'}</span>
                </button>
              </div>
              {bioStatus && (
                <p
                  className={`text-xs ${
                    bioStatus.type === 'ok'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {bioStatus.text}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Master App Lock & Emergency Lock */}
        <section className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6 space-y-5">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1B263B]">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-[#D4AF37]" />
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  Master App Lock
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {securityConfig.appLockPinHash ? 'Armed for Emergency Lock' : 'Not configured yet'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={triggerEmergencyLock}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 whitespace-nowrap"
            >
              Lock Now
            </button>
          </div>

          <form onSubmit={handleSaveMasterPin} className="space-y-3">
            {securityConfig.appLockPinHash && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Current Master PIN
                </label>
                <input
                  type="password"
                  value={currentMasterPin}
                  onChange={(e) => setCurrentMasterPin(e.target.value)}
                  placeholder="Enter current PIN"
                  className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                {securityConfig.appLockPinHash ? 'New Master PIN' : 'Set Master App PIN'}
              </label>
              <input
                type="password"
                value={newMasterPin}
                onChange={(e) => setNewMasterPin(e.target.value)}
                placeholder="Minimum 4 characters"
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            {masterPinStatus && (
              <p
                className={`text-xs ${
                  masterPinStatus.type === 'ok'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {masterPinStatus.text}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="submit"
                className="rounded-lg bg-[#0F172A] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#06080D]"
              >
                {securityConfig.appLockPinHash ? 'Update Master PIN' : 'Enable Master Lock'}
              </button>
              {securityConfig.appLockPinHash && (
                <button
                  type="button"
                  onClick={handleRemoveMasterPin}
                  className="rounded-lg border border-slate-200 dark:border-[#1B263B] px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-rose-500/40"
                >
                  Disable Master Lock
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Secrets Vault PIN Rotation */}
        <section className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-[#1B263B]">
            <KeyRound className="h-5 w-5 text-[#D4AF37]" />
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Secrets Vault Encryption Key
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Separate PIN/Password protecting My Secrets
              </p>
            </div>
          </div>

          {!securityConfig.secretsPinHash ? (
            <div className="py-2 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                You haven&apos;t initialized a Secrets Vault PIN yet.
              </p>
              <button
                type="button"
                onClick={() => setActiveSection('secrets')}
                className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#06080D]"
              >
                Open My Secrets to Set PIN
              </button>
            </div>
          ) : (
            <form onSubmit={handleChangeSecretsPin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Current Secrets PIN
                </label>
                <input
                  type="password"
                  value={curSecretPin}
                  onChange={(e) => setCurSecretPin(e.target.value)}
                  placeholder="Enter current Secrets PIN"
                  className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  New Secrets PIN (re-encrypts all secrets)
                </label>
                <input
                  type="password"
                  value={newSecretPin}
                  onChange={(e) => setNewSecretPin(e.target.value)}
                  placeholder="Minimum 4 characters"
                  className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
              {secretPinStatus && (
                <p
                  className={`text-xs ${
                    secretPinStatus.type === 'ok'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {secretPinStatus.text}
                </p>
              )}
              <button
                type="submit"
                className="rounded-lg bg-[#0F172A] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#06080D]"
              >
                Rotate Secrets Key
              </button>
            </form>
          )}
        </section>

        {/* Encrypted Backup & Restore */}
        <section className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-[#1B263B]">
            <Download className="h-5 w-5 text-[#D4AF37]" />
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Encrypted Backup &amp; Restore
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Export or restore a password-protected .myvault archive
              </p>
            </div>
          </div>

          <form onSubmit={handleExportBackup} className="space-y-2.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Export Encrypted Backup
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={exportPassphrase}
                onChange={(e) => setExportPassphrase(e.target.value)}
                placeholder="Backup encryption passphrase (min 6 chars)"
                className="flex-1 rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#06080D] hover:bg-[#E5C158] whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Backup</span>
              </button>
            </div>
          </form>

          <form
            onSubmit={handleImportBackup}
            className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-[#1B263B]"
          >
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Restore from .myvault File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".myvault,.json"
              onChange={handleFilePick}
              className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:rounded-lg file:border file:border-slate-200 dark:file:border-[#1B263B] file:bg-slate-50 dark:file:bg-[#131C31] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 dark:file:text-slate-200"
            />
            {selectedFileName && (
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Selected: {selectedFileName}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={importPassphrase}
                onChange={(e) => setImportPassphrase(e.target.value)}
                placeholder="Enter backup passphrase"
                className="flex-1 rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#1B263B] px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-[#D4AF37] whitespace-nowrap"
              >
                <Upload className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span>Decrypt &amp; Restore</span>
              </button>
            </div>
          </form>

          {backupStatus && (
            <p
              className={`text-xs ${
                backupStatus.type === 'ok'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {backupStatus.text}
            </p>
          )}
        </section>
      </div>

      {/* Data Reset */}
      <section className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
            Start with a Clean Slate
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Clears schedules, routines, targets, achievements, and journal entries (your encrypted secrets remain untouched).
          </p>
        </div>

        {!confirmClearOpen ? (
          <button
            type="button"
            onClick={() => setConfirmClearOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 whitespace-nowrap"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Planner Data</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmClearOpen(false)}
              className="rounded-lg border border-slate-200 dark:border-[#1B263B] px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                clearSampleData();
                setConfirmClearOpen(false);
              }}
              className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Confirm Clear
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
