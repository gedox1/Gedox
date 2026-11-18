import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { DecryptedSecret, SecretCategory } from '../types/vault';

const SECRET_CATEGORIES: SecretCategory[] = [
  'Personal Thoughts',
  'Private Notes',
  'Important Information',
  'Dreams',
  'Private Memories',
];

export function SecretsView() {
  const {
    securityConfig,
    encryptedSecrets,
    isSecretsUnlocked,
    decryptedSecrets,
    secretsIdleRemaining,
    biometricHardwareAvailable,
    setupSecretsPin,
    unlockSecretsWithPin,
    unlockSecretsWithBiometrics,
    lockSecrets,
    createSecret,
    updateSecret,
    deleteSecret,
    enableBiometricsForSecrets,
  } = useVault();

  // Setup / Unlock state
  const [setupPin, setSetupPin] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [unlockPin, setUnlockPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Unlocked vault state
  const [categoryFilter, setCategoryFilter] = useState<'All' | SecretCategory>('All');
  const [showComposer, setShowComposer] = useState(false);
  const [editingSecret, setEditingSecret] = useState<DecryptedSecret | null>(null);
  const [secretCategory, setSecretCategory] = useState<SecretCategory>('Personal Thoughts');
  const [secretTitle, setSecretTitle] = useState('');
  const [secretContent, setSecretContent] = useState('');
  const [secretTags, setSecretTags] = useState('');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [ciphertextInspectId, setCiphertextInspectId] = useState<string | null>(null);
  const [bioNotice, setBioNotice] = useState<string | null>(null);

  const hasConfiguredPin = Boolean(securityConfig.secretsPinHash);

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPin.trim().length < 4) {
      setAuthError('Vault PIN/Password must be at least 4 characters.');
      return;
    }
    if (setupPin !== setupConfirm) {
      setAuthError('PIN confirmation does not match.');
      return;
    }
    setAuthError('');
    setAuthLoading(true);
    try {
      await setupSecretsPin(setupPin);
      setSetupPin('');
      setSetupConfirm('');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUnlockPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockPin.trim()) return;
    setAuthError('');
    setAuthLoading(true);
    try {
      const ok = await unlockSecretsWithPin(unlockPin);
      if (!ok) {
        setAuthError('Incorrect Vault PIN or Password. Decryption denied.');
      } else {
        setUnlockPin('');
      }
    } catch {
      setAuthError('Decryption failed. Verify your Vault PIN.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleBiometricUnlock = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const ok = await unlockSecretsWithBiometrics();
      if (!ok) {
        setAuthError('Biometric verification failed or was cancelled.');
      }
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Biometric prompt was blocked in this browser frame. Please unlock with your PIN.'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEnableBiometrics = async () => {
    setBioNotice(null);
    try {
      await enableBiometricsForSecrets();
      setBioNotice('Fingerprint / platform biometric unlock enabled for My Secrets.');
    } catch (err) {
      setBioNotice(
        err instanceof Error
          ? `${err.message} (Some embedded browser frames restrict WebAuthn; your PIN remains active.)`
          : 'Could not register biometric passkey in this browser context.'
      );
    }
  };

  const openNewSecret = () => {
    setEditingSecret(null);
    setSecretCategory('Personal Thoughts');
    setSecretTitle('');
    setSecretContent('');
    setSecretTags('');
    setShowComposer(true);
  };

  const openEditSecret = (item: DecryptedSecret) => {
    setEditingSecret(item);
    setSecretCategory(item.category);
    setSecretTitle(item.title);
    setSecretContent(item.content);
    setSecretTags(item.tags);
    setShowComposer(true);
  };

  const handleSaveSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretTitle.trim() || !secretContent.trim()) return;
    if (editingSecret) {
      await updateSecret(editingSecret.id, {
        category: secretCategory,
        title: secretTitle.trim(),
        content: secretContent.trim(),
        tags: secretTags.trim(),
      });
    } else {
      await createSecret({
        category: secretCategory,
        title: secretTitle.trim(),
        content: secretContent.trim(),
        tags: secretTags.trim(),
      });
    }
    setShowComposer(false);
    setEditingSecret(null);
  };

  // Locked or Initial Setup Gate
  if (!isSecretsUnlocked) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <div className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-8">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {hasConfiguredPin ? 'My Secrets Vault is Locked' : 'Initialize Your Encrypted Vault'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AES-256-GCM Encryption · PBKDF2-SHA256 Key Derivation
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {hasConfiguredPin
              ? `Enter your separate Vault PIN or Password to decrypt your ${encryptedSecrets.length} stored ${
                  encryptedSecrets.length === 1 ? 'record' : 'records'
                } in memory.`
              : 'Create a separate Vault PIN or Password exclusively for My Secrets. Every thought, note, dream, and memory is encrypted locally with AES-256-GCM before storage.'}
          </p>

          {!hasConfiguredPin ? (
            <form onSubmit={handleSetupPin} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Create Separate Vault PIN or Password
                </label>
                <input
                  type="password"
                  required
                  value={setupPin}
                  onChange={(e) => setSetupPin(e.target.value)}
                  placeholder="Minimum 4 characters (letters, digits, symbols)"
                  className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Vault PIN or Password
                </label>
                <input
                  type="password"
                  required
                  value={setupConfirm}
                  onChange={(e) => setSetupConfirm(e.target.value)}
                  placeholder="Re-enter your Vault PIN or Password"
                  className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              {authError && <p className="text-xs text-rose-500">{authError}</p>}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-[#06080D] hover:bg-[#E5C158] disabled:opacity-50"
              >
                {authLoading ? 'Generating Key...' : 'Create Vault & Unlock'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleUnlockPin} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Vault PIN or Password
                </label>
                <input
                  type="password"
                  autoFocus
                  value={unlockPin}
                  onChange={(e) => setUnlockPin(e.target.value)}
                  placeholder="Enter your Secrets PIN"
                  className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              {authError && <p className="text-xs text-rose-500">{authError}</p>}

              <button
                type="submit"
                disabled={authLoading || !unlockPin.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-[#06080D] hover:bg-[#E5C158] disabled:opacity-50"
              >
                <Unlock className="h-4 w-4" />
                <span>{authLoading ? 'Decrypting...' : 'Decrypt & Open Secrets'}</span>
              </button>

              {securityConfig.biometricEnabled && (
                <button
                  type="button"
                  onClick={handleBiometricUnlock}
                  disabled={authLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#0D1424] px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:border-[#D4AF37]/60"
                >
                  <Fingerprint className="h-4 w-4 text-[#D4AF37]" />
                  <span>Unlock with Fingerprint / Biometrics</span>
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    );
  }

  const visibleSecrets =
    categoryFilter === 'All'
      ? decryptedSecrets
      : decryptedSecrets.filter((s) => s.category === categoryFilter);

  return (
    <div className="space-y-6">
      {/* Private Mode Banner & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#D4AF37]/30 bg-white dark:bg-[#0B101B] px-5 py-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-[#D4AF37] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Vault Decrypted in Session Memory
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Private Mode auto-lock:{' '}
              <span className="font-mono tabular-nums text-[#B8860B] dark:text-[#D4AF37]">
                {secretsIdleRemaining !== null ? `${secretsIdleRemaining}s remaining` : 'Manual'}
              </span>{' '}
              · {securityConfig.lockSecretsOnTabLeave ? 'Locks on section switch' : 'Manual section lock'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!securityConfig.biometricEnabled && biometricHardwareAvailable && (
            <button
              type="button"
              onClick={handleEnableBiometrics}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#1B263B] px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#D4AF37]/50 whitespace-nowrap"
            >
              <Fingerprint className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Enable Fingerprint</span>
            </button>
          )}

          <button
            type="button"
            onClick={lockSecrets}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 whitespace-nowrap"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Lock Vault Now</span>
          </button>

          <button
            type="button"
            onClick={openNewSecret}
            className="flex items-center gap-1.5 rounded-lg bg-[#0F172A] dark:bg-[#D4AF37] px-4 py-1.5 text-xs font-semibold text-white dark:text-[#06080D] hover:bg-slate-800 dark:hover:bg-[#E5C158] whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Secret</span>
          </button>
        </div>
      </div>

      {bioNotice && (
        <div className="flex items-center justify-between rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2.5 text-xs text-slate-800 dark:text-[#F8E7A2]">
          <span>{bioNotice}</span>
          <button type="button" onClick={() => setBioNotice(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div
        role="tablist"
        aria-label="Secret categories"
        className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-1 w-fit"
      >
        {(['All', ...SECRET_CATEGORIES] as Array<'All' | SecretCategory>).map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={categoryFilter === cat}
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              categoryFilter === cat
                ? 'bg-slate-900 text-[#E5C158] dark:bg-[#131C31] dark:text-[#E5C158]'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Secret Composer */}
      {showComposer && (
        <form
          onSubmit={handleSaveSecret}
          className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1B263B]">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              {editingSecret ? 'Edit Encrypted Record' : 'Encrypt New Private Record'}
            </h3>
            <button
              type="button"
              onClick={() => setShowComposer(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={secretCategory}
                onChange={(e) => setSecretCategory(e.target.value as SecretCategory)}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              >
                {SECRET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Private Title
              </label>
              <input
                type="text"
                required
                value={secretTitle}
                onChange={(e) => setSecretTitle(e.target.value)}
                placeholder="Encrypted title..."
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Encrypted Content
              </label>
              <textarea
                rows={5}
                required
                value={secretContent}
                onChange={(e) => setSecretContent(e.target.value)}
                placeholder="Write private thoughts, sensitive information, unshared dreams, or memories..."
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Keywords (optional)
              </label>
              <input
                type="text"
                value={secretTags}
                onChange={(e) => setSecretTags(e.target.value)}
                placeholder="e.g., family, recovery codes, future ambition"
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowComposer(false)}
              className="rounded-lg border border-slate-200 dark:border-[#1B263B] px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#06080D] hover:bg-[#E5C158]"
            >
              Encrypt &amp; Save
            </button>
          </div>
        </form>
      )}

      {/* Secrets List */}
      {visibleSecrets.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-12 text-center">
          <KeyRound className="h-8 w-8 text-[#D4AF37] mx-auto" />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Your encrypted secrets vault is ready.
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Save private thoughts, personal information, dreams, or memories encrypted with AES-256-GCM.
          </p>
          <button
            type="button"
            onClick={openNewSecret}
            className="mt-4 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#06080D]"
          >
            Add First Secret
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleSecrets.map((secret) => {
            const isRevealed = Boolean(revealedIds[secret.id]);
            const showingCipher = ciphertextInspectId === secret.id;
            return (
              <div
                key={secret.id}
                className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#B8860B] dark:text-[#D4AF37]">
                      {secret.category}
                      {secret.tags ? ` · ${secret.tags}` : ''}
                    </p>
                    <h3 className="mt-1 font-display text-base font-semibold text-slate-900 dark:text-white">
                      {secret.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedIds((prev) => ({ ...prev, [secret.id]: !prev[secret.id] }))
                      }
                      aria-label={isRevealed ? 'Hide secret content' : 'Reveal secret content'}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-[#D4AF37]"
                    >
                      {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSecret(secret.id)}
                      aria-label={`Delete ${secret.title}`}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {isRevealed ? (
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-line">
                    {secret.content}
                  </p>
                ) : (
                  <p className="text-xs font-mono text-slate-400 dark:text-slate-500 select-none">
                    Content masked for shoulder-surfing protection. Click the eye icon to reveal.
                  </p>
                )}

                {showingCipher && (
                  <div className="rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] p-3 text-[11px] font-mono text-slate-500 dark:text-slate-400 break-all space-y-1">
                    <p>Algorithm: {secret.rawPayload.algorithm} ({secret.rawPayload.kdf})</p>
                    <p>IV: {secret.rawPayload.iv}</p>
                    <p>Ciphertext: {secret.rawPayload.ciphertext.slice(0, 96)}...</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#1B263B] text-xs">
                  <button
                    type="button"
                    onClick={() => openEditSecret(secret)}
                    className="font-medium text-slate-600 dark:text-slate-300 hover:text-[#D4AF37]"
                  >
                    Edit Record
                  </button>
                  <button
                    type="button"
                    onClick={() => setCiphertextInspectId(showingCipher ? null : secret.id)}
                    className="font-mono text-[11px] text-slate-400 hover:text-[#D4AF37]"
                  >
                    {showingCipher ? 'Hide Ciphertext' : 'Inspect AES Ciphertext'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
