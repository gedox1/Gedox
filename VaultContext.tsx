import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Achievement,
  DecryptedSecret,
  EncryptedBackupFile,
  EncryptedSecretRecord,
  JournalEntry,
  NavSection,
  Routine,
  ScheduleItem,
  SecretCategory,
  TargetGoal,
  VaultDataSnapshot,
  VaultSecurityConfig,
} from '../types/vault';
import {
  decryptData,
  encryptData,
  generateRandomToken,
  hashPinOrPassword,
  isPlatformBiometricsSupported,
  registerBiometricCredential,
  verifyBiometricCredential,
  verifyPinOrPassword,
} from '../utils/crypto';
import { ensureInitialVaultData, getTodayISO, vaultStorage } from '../utils/storage';

interface SecretPayloadPlaintext {
  title: string;
  content: string;
  tags: string;
}

interface VaultContextValue {
  activeSection: NavSection;
  setActiveSection: (section: NavSection) => void;

  // Data collections
  schedules: ScheduleItem[];
  routines: Routine[];
  targets: TargetGoal[];
  achievements: Achievement[];
  journal: JournalEntry[];
  encryptedSecrets: EncryptedSecretRecord[];
  securityConfig: VaultSecurityConfig;

  // Schedule actions
  addSchedule: (item: Omit<ScheduleItem, 'id' | 'createdAt' | 'completedDates'>) => void;
  updateSchedule: (id: string, updates: Partial<ScheduleItem>) => void;
  deleteSchedule: (id: string) => void;
  toggleScheduleCompletion: (id: string, dateISO?: string) => void;

  // Routine actions
  addRoutine: (routine: Omit<Routine, 'id' | 'createdAt' | 'completedStepIdsByDate'>) => void;
  deleteRoutine: (id: string) => void;
  toggleRoutineStep: (routineId: string, stepId: string, dateISO?: string) => void;

  // Target & Achievement actions
  addTarget: (target: Omit<TargetGoal, 'id' | 'createdAt' | 'completedAt'>) => void;
  updateTargetProgress: (id: string, progress: number) => void;
  updateTarget: (id: string, updates: Partial<TargetGoal>) => void;
  deleteTarget: (id: string) => void;
  addAchievement: (achievement: Omit<Achievement, 'id' | 'createdAt'>) => void;
  deleteAchievement: (id: string) => void;

  // Journal actions
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;

  // Secrets & Encryption
  isSecretsUnlocked: boolean;
  decryptedSecrets: DecryptedSecret[];
  secretsIdleRemaining: number | null;
  setupSecretsPin: (pinOrPassword: string) => Promise<void>;
  unlockSecretsWithPin: (pinOrPassword: string) => Promise<boolean>;
  unlockSecretsWithBiometrics: () => Promise<boolean>;
  lockSecrets: () => void;
  createSecret: (data: { category: SecretCategory; title: string; content: string; tags: string }) => Promise<void>;
  updateSecret: (
    id: string,
    data: { category: SecretCategory; title: string; content: string; tags: string }
  ) => Promise<void>;
  deleteSecret: (id: string) => void;
  changeSecretsPin: (currentPin: string, newPin: string) => Promise<boolean>;

  // Biometrics & Private Mode
  biometricHardwareAvailable: boolean;
  enableBiometricsForSecrets: () => Promise<void>;
  disableBiometricsForSecrets: () => void;
  updatePrivateModeSettings: (settings: {
    privateModeTimeoutSeconds?: number;
    lockSecretsOnTabLeave?: boolean;
  }) => void;

  // App Master PIN & Emergency Lock
  isAppLocked: boolean;
  isEmergencySetupModalOpen: boolean;
  setIsEmergencySetupModalOpen: (open: boolean) => void;
  triggerEmergencyLock: () => void;
  setAppLockPin: (pin: string, currentPin?: string) => Promise<boolean>;
  removeAppLockPin: (currentPin: string) => Promise<boolean>;
  unlockApp: (pin: string) => Promise<boolean>;
  quickSetupAndLockApp: (newPin: string) => Promise<void>;

  // Theme
  toggleTheme: () => void;

  // Encrypted Backup Export / Import
  exportEncryptedBackup: (backupPassphrase: string) => Promise<EncryptedBackupFile>;
  importEncryptedBackup: (fileContent: string, backupPassphrase: string) => Promise<void>;
  clearSampleData: () => void;
}

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  ensureInitialVaultData();

  const [activeSection, setActiveSectionState] = useState<NavSection>('dashboard');
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => vaultStorage.getSchedules());
  const [routines, setRoutines] = useState<Routine[]>(() => vaultStorage.getRoutines());
  const [targets, setTargets] = useState<TargetGoal[]>(() => vaultStorage.getTargets());
  const [achievements, setAchievements] = useState<Achievement[]>(() => vaultStorage.getAchievements());
  const [journal, setJournal] = useState<JournalEntry[]>(() => vaultStorage.getJournal());
  const [encryptedSecrets, setEncryptedSecrets] = useState<EncryptedSecretRecord[]>(() =>
    vaultStorage.getEncryptedSecrets()
  );
  const [securityConfig, setSecurityConfig] = useState<VaultSecurityConfig>(() =>
    vaultStorage.getSecurityConfig()
  );

  // Secrets runtime memory state (cleared on lock)
  const [activeSecretsPassphrase, setActiveSecretsPassphrase] = useState<string | null>(null);
  const [decryptedSecrets, setDecryptedSecrets] = useState<DecryptedSecret[]>([]);
  const [secretsIdleRemaining, setSecretsIdleRemaining] = useState<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // App Emergency Lock state
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    const cfg = vaultStorage.getSecurityConfig();
    return Boolean(cfg.appLockPinHash);
  });
  const [isEmergencySetupModalOpen, setIsEmergencySetupModalOpen] = useState(false);

  const [biometricHardwareAvailable, setBiometricHardwareAvailable] = useState(false);

  const isSecretsUnlocked = activeSecretsPassphrase !== null;

  // Sync Tailwind dark class with securityConfig.theme
  useEffect(() => {
    const root = document.documentElement;
    if (securityConfig.theme === 'dark') {
      root.classList.add('dark');
      document.body.className =
        'bg-[#06080D] text-[#F1F5F9] antialiased selection:bg-[#D4AF37]/30 selection:text-[#F8E7A2]';
    } else {
      root.classList.remove('dark');
      document.body.className =
        'bg-[#F4F6FA] text-[#0F172A] antialiased selection:bg-[#D4AF37]/25 selection:text-[#0F172A]';
    }
  }, [securityConfig.theme]);

  useEffect(() => {
    isPlatformBiometricsSupported().then(setBiometricHardwareAvailable);
  }, []);

  const persistSecurity = useCallback((next: VaultSecurityConfig) => {
    setSecurityConfig(next);
    vaultStorage.saveSecurityConfig(next);
  }, []);

  const lockSecrets = useCallback(() => {
    setActiveSecretsPassphrase(null);
    setDecryptedSecrets([]);
    setSecretsIdleRemaining(null);
  }, []);

  const setActiveSection = useCallback(
    (section: NavSection) => {
      if (section !== 'secrets' && isSecretsUnlocked && securityConfig.lockSecretsOnTabLeave) {
        lockSecrets();
      }
      setActiveSectionState(section);
    },
    [isSecretsUnlocked, securityConfig.lockSecretsOnTabLeave, lockSecrets]
  );

  // Private Mode: Inactivity auto-lock for Secrets
  useEffect(() => {
    if (!isSecretsUnlocked || securityConfig.privateModeTimeoutSeconds <= 0) {
      setSecretsIdleRemaining(null);
      return;
    }

    lastActivityRef.current = Date.now();
    setSecretsIdleRemaining(securityConfig.privateModeTimeoutSeconds);

    const recordActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, recordActivity, { passive: true }));

    const interval = window.setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = securityConfig.privateModeTimeoutSeconds - elapsedSec;
      if (remaining <= 0) {
        lockSecrets();
      } else {
        setSecretsIdleRemaining(remaining);
      }
    }, 1000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, recordActivity));
      window.clearInterval(interval);
    };
  }, [isSecretsUnlocked, securityConfig.privateModeTimeoutSeconds, lockSecrets]);

  // Global keyboard shortcut: Ctrl+Shift+L or Cmd+Shift+L for Emergency Lock
  const triggerEmergencyLock = useCallback(() => {
    lockSecrets();
    if (securityConfig.appLockPinHash) {
      setIsAppLocked(true);
    } else {
      setIsEmergencySetupModalOpen(true);
    }
  }, [lockSecrets, securityConfig.appLockPinHash]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        triggerEmergencyLock();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [triggerEmergencyLock]);

  // Schedule CRUD
  const addSchedule = useCallback(
    (item: Omit<ScheduleItem, 'id' | 'createdAt' | 'completedDates'>) => {
      const nextItem: ScheduleItem = {
        ...item,
        id: `sch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        completedDates: [],
        createdAt: new Date().toISOString(),
      };
      const next = [nextItem, ...schedules];
      setSchedules(next);
      vaultStorage.saveSchedules(next);
    },
    [schedules]
  );

  const updateSchedule = useCallback(
    (id: string, updates: Partial<ScheduleItem>) => {
      const next = schedules.map((s) => (s.id === id ? { ...s, ...updates } : s));
      setSchedules(next);
      vaultStorage.saveSchedules(next);
    },
    [schedules]
  );

  const deleteSchedule = useCallback(
    (id: string) => {
      const next = schedules.filter((s) => s.id !== id);
      setSchedules(next);
      vaultStorage.saveSchedules(next);
    },
    [schedules]
  );

  const toggleScheduleCompletion = useCallback(
    (id: string, dateISO = getTodayISO()) => {
      const next = schedules.map((s) => {
        if (s.id !== id) return s;
        const exists = s.completedDates.includes(dateISO);
        return {
          ...s,
          completedDates: exists
            ? s.completedDates.filter((d) => d !== dateISO)
            : [...s.completedDates, dateISO],
        };
      });
      setSchedules(next);
      vaultStorage.saveSchedules(next);
    },
    [schedules]
  );

  // Routine CRUD
  const addRoutine = useCallback(
    (routine: Omit<Routine, 'id' | 'createdAt' | 'completedStepIdsByDate'>) => {
      const nextRoutine: Routine = {
        ...routine,
        id: `rtn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        completedStepIdsByDate: {},
        createdAt: new Date().toISOString(),
      };
      const next = [...routines, nextRoutine];
      setRoutines(next);
      vaultStorage.saveRoutines(next);
    },
    [routines]
  );

  const deleteRoutine = useCallback(
    (id: string) => {
      const next = routines.filter((r) => r.id !== id);
      setRoutines(next);
      vaultStorage.saveRoutines(next);
    },
    [routines]
  );

  const toggleRoutineStep = useCallback(
    (routineId: string, stepId: string, dateISO = getTodayISO()) => {
      const next = routines.map((r) => {
        if (r.id !== routineId) return r;
        const current = r.completedStepIdsByDate[dateISO] || [];
        const updated = current.includes(stepId)
          ? current.filter((id) => id !== stepId)
          : [...current, stepId];
        return {
          ...r,
          completedStepIdsByDate: {
            ...r.completedStepIdsByDate,
            [dateISO]: updated,
          },
        };
      });
      setRoutines(next);
      vaultStorage.saveRoutines(next);
    },
    [routines]
  );

  // Target & Achievement CRUD
  const addTarget = useCallback(
    (target: Omit<TargetGoal, 'id' | 'createdAt' | 'completedAt'>) => {
      const clamped = Math.max(0, Math.min(100, target.progress));
      const newTarget: TargetGoal = {
        ...target,
        progress: clamped,
        id: `tgt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        completedAt: clamped >= 100 ? getTodayISO() : null,
        createdAt: new Date().toISOString(),
      };
      const next = [newTarget, ...targets];
      setTargets(next);
      vaultStorage.saveTargets(next);
    },
    [targets]
  );

  const updateTargetProgress = useCallback(
    (id: string, progress: number) => {
      const clamped = Math.max(0, Math.min(100, progress));
      let newlyCompletedTarget: TargetGoal | null = null;
      const next = targets.map((t) => {
        if (t.id !== id) return t;
        const wasComplete = t.progress >= 100;
        const isNowComplete = clamped >= 100;
        const updated: TargetGoal = {
          ...t,
          progress: clamped,
          completedAt: isNowComplete ? t.completedAt || getTodayISO() : null,
        };
        if (!wasComplete && isNowComplete) {
          newlyCompletedTarget = updated;
        }
        return updated;
      });
      setTargets(next);
      vaultStorage.saveTargets(next);

      if (newlyCompletedTarget) {
        const tgt = newlyCompletedTarget as TargetGoal;
        const alreadyLogged = achievements.some((a) => a.linkedTargetId === tgt.id);
        if (!alreadyLogged) {
          const ach: Achievement = {
            id: `ach-${Date.now()}`,
            title: `Completed Target: ${tgt.title}`,
            category: tgt.category,
            achievedDate: getTodayISO(),
            notes: tgt.description || 'Target reached 100% completion.',
            linkedTargetId: tgt.id,
            createdAt: new Date().toISOString(),
          };
          const nextAch = [ach, ...achievements];
          setAchievements(nextAch);
          vaultStorage.saveAchievements(nextAch);
        }
      }
    },
    [targets, achievements]
  );

  const updateTarget = useCallback(
    (id: string, updates: Partial<TargetGoal>) => {
      const next = targets.map((t) => (t.id === id ? { ...t, ...updates } : t));
      setTargets(next);
      vaultStorage.saveTargets(next);
    },
    [targets]
  );

  const deleteTarget = useCallback(
    (id: string) => {
      const next = targets.filter((t) => t.id !== id);
      setTargets(next);
      vaultStorage.saveTargets(next);
    },
    [targets]
  );

  const addAchievement = useCallback(
    (achievement: Omit<Achievement, 'id' | 'createdAt'>) => {
      const nextItem: Achievement = {
        ...achievement,
        id: `ach-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      const next = [nextItem, ...achievements];
      setAchievements(next);
      vaultStorage.saveAchievements(next);
    },
    [achievements]
  );

  const deleteAchievement = useCallback(
    (id: string) => {
      const next = achievements.filter((a) => a.id !== id);
      setAchievements(next);
      vaultStorage.saveAchievements(next);
    },
    [achievements]
  );

  // Journal CRUD
  const addJournalEntry = useCallback(
    (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const nextItem: JournalEntry = {
        ...entry,
        id: `jrn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: now,
        updatedAt: now,
      };
      const next = [nextItem, ...journal].sort((a, b) => b.date.localeCompare(a.date));
      setJournal(next);
      vaultStorage.saveJournal(next);
    },
    [journal]
  );

  const updateJournalEntry = useCallback(
    (id: string, updates: Partial<JournalEntry>) => {
      const next = journal
        .map((j) => (j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j))
        .sort((a, b) => b.date.localeCompare(a.date));
      setJournal(next);
      vaultStorage.saveJournal(next);
    },
    [journal]
  );

  const deleteJournalEntry = useCallback(
    (id: string) => {
      const next = journal.filter((j) => j.id !== id);
      setJournal(next);
      vaultStorage.saveJournal(next);
    },
    [journal]
  );

  // Secrets Encryption & Unlocking
  const decryptAllRecords = useCallback(
    async (records: EncryptedSecretRecord[], passphrase: string): Promise<DecryptedSecret[]> => {
      const results: DecryptedSecret[] = [];
      for (const rec of records) {
        const plain = await decryptData<SecretPayloadPlaintext>(rec.payload, passphrase);
        results.push({
          id: rec.id,
          category: rec.category,
          title: plain.title,
          content: plain.content,
          tags: plain.tags,
          createdAt: rec.createdAt,
          updatedAt: rec.updatedAt,
          rawPayload: rec.payload,
        });
      }
      return results;
    },
    []
  );

  const setupSecretsPin = useCallback(
    async (pinOrPassword: string) => {
      const { hash, salt } = await hashPinOrPassword(pinOrPassword);
      const nextConfig: VaultSecurityConfig = {
        ...securityConfig,
        secretsPinHash: hash,
        secretsPinSalt: salt,
      };
      persistSecurity(nextConfig);
      setActiveSecretsPassphrase(pinOrPassword);
      setDecryptedSecrets([]);
    },
    [securityConfig, persistSecurity]
  );

  const unlockSecretsWithPin = useCallback(
    async (pinOrPassword: string): Promise<boolean> => {
      if (!securityConfig.secretsPinHash || !securityConfig.secretsPinSalt) return false;
      const valid = await verifyPinOrPassword(
        pinOrPassword,
        securityConfig.secretsPinHash,
        securityConfig.secretsPinSalt
      );
      if (!valid) return false;

      const decoded = await decryptAllRecords(encryptedSecrets, pinOrPassword);
      setActiveSecretsPassphrase(pinOrPassword);
      setDecryptedSecrets(decoded);
      return true;
    },
    [securityConfig, encryptedSecrets, decryptAllRecords]
  );

  const enableBiometricsForSecrets = useCallback(async () => {
    if (!activeSecretsPassphrase) {
      throw new Error('Unlock your Secrets Vault first to link biometrics.');
    }
    const credentialId = await registerBiometricCredential();
    const deviceSecret = generateRandomToken(32);
    const wrapped = await encryptData({ passphrase: activeSecretsPassphrase }, deviceSecret);
    persistSecurity({
      ...securityConfig,
      biometricEnabled: true,
      biometricCredentialId: credentialId,
      biometricDeviceSecret: deviceSecret,
      wrappedSecretsKey: wrapped,
    });
  }, [activeSecretsPassphrase, securityConfig, persistSecurity]);

  const disableBiometricsForSecrets = useCallback(() => {
    persistSecurity({
      ...securityConfig,
      biometricEnabled: false,
      biometricCredentialId: null,
      biometricDeviceSecret: null,
      wrappedSecretsKey: null,
    });
  }, [securityConfig, persistSecurity]);

  const unlockSecretsWithBiometrics = useCallback(async (): Promise<boolean> => {
    if (
      !securityConfig.biometricEnabled ||
      !securityConfig.biometricCredentialId ||
      !securityConfig.wrappedSecretsKey ||
      !securityConfig.biometricDeviceSecret
    ) {
      return false;
    }
    const verified = await verifyBiometricCredential(securityConfig.biometricCredentialId);
    if (!verified) return false;

    const unwrapped = await decryptData<{ passphrase: string }>(
      securityConfig.wrappedSecretsKey,
      securityConfig.biometricDeviceSecret
    );
    const decoded = await decryptAllRecords(encryptedSecrets, unwrapped.passphrase);
    setActiveSecretsPassphrase(unwrapped.passphrase);
    setDecryptedSecrets(decoded);
    return true;
  }, [securityConfig, encryptedSecrets, decryptAllRecords]);

  const createSecret = useCallback(
    async (data: { category: SecretCategory; title: string; content: string; tags: string }) => {
      if (!activeSecretsPassphrase) throw new Error('Vault is locked');
      const now = new Date().toISOString();
      const id = `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const payload = await encryptData<SecretPayloadPlaintext>(
        { title: data.title, content: data.content, tags: data.tags },
        activeSecretsPassphrase
      );

      const newRecord: EncryptedSecretRecord = {
        id,
        category: data.category,
        createdAt: now,
        updatedAt: now,
        payload,
      };
      const nextRecords = [newRecord, ...encryptedSecrets];
      setEncryptedSecrets(nextRecords);
      vaultStorage.saveEncryptedSecrets(nextRecords);

      const newDecrypted: DecryptedSecret = {
        id,
        category: data.category,
        title: data.title,
        content: data.content,
        tags: data.tags,
        createdAt: now,
        updatedAt: now,
        rawPayload: payload,
      };
      setDecryptedSecrets((prev) => [newDecrypted, ...prev]);
    },
    [activeSecretsPassphrase, encryptedSecrets]
  );

  const updateSecret = useCallback(
    async (
      id: string,
      data: { category: SecretCategory; title: string; content: string; tags: string }
    ) => {
      if (!activeSecretsPassphrase) throw new Error('Vault is locked');
      const now = new Date().toISOString();
      const payload = await encryptData<SecretPayloadPlaintext>(
        { title: data.title, content: data.content, tags: data.tags },
        activeSecretsPassphrase
      );

      const nextRecords = encryptedSecrets.map((r) =>
        r.id === id ? { ...r, category: data.category, updatedAt: now, payload } : r
      );
      setEncryptedSecrets(nextRecords);
      vaultStorage.saveEncryptedSecrets(nextRecords);

      setDecryptedSecrets((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                category: data.category,
                title: data.title,
                content: data.content,
                tags: data.tags,
                updatedAt: now,
                rawPayload: payload,
              }
            : s
        )
      );
    },
    [activeSecretsPassphrase, encryptedSecrets]
  );

  const deleteSecret = useCallback(
    (id: string) => {
      const nextRecords = encryptedSecrets.filter((r) => r.id !== id);
      setEncryptedSecrets(nextRecords);
      vaultStorage.saveEncryptedSecrets(nextRecords);
      setDecryptedSecrets((prev) => prev.filter((s) => s.id !== id));
    },
    [encryptedSecrets]
  );

  const changeSecretsPin = useCallback(
    async (currentPin: string, newPin: string): Promise<boolean> => {
      if (!securityConfig.secretsPinHash || !securityConfig.secretsPinSalt) return false;
      const valid = await verifyPinOrPassword(
        currentPin,
        securityConfig.secretsPinHash,
        securityConfig.secretsPinSalt
      );
      if (!valid) return false;

      // Re-encrypt all existing secrets with the new passphrase
      const decoded = await decryptAllRecords(encryptedSecrets, currentPin);
      const reEncrypted: EncryptedSecretRecord[] = [];
      const updatedDecrypted: DecryptedSecret[] = [];
      for (const item of decoded) {
        const payload = await encryptData<SecretPayloadPlaintext>(
          { title: item.title, content: item.content, tags: item.tags },
          newPin
        );
        reEncrypted.push({
          id: item.id,
          category: item.category,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          payload,
        });
        updatedDecrypted.push({ ...item, rawPayload: payload });
      }

      const { hash, salt } = await hashPinOrPassword(newPin);
      let wrappedSecretsKey = securityConfig.wrappedSecretsKey;
      if (securityConfig.biometricEnabled && securityConfig.biometricDeviceSecret) {
        wrappedSecretsKey = await encryptData(
          { passphrase: newPin },
          securityConfig.biometricDeviceSecret
        );
      }

      setEncryptedSecrets(reEncrypted);
      vaultStorage.saveEncryptedSecrets(reEncrypted);
      setDecryptedSecrets(updatedDecrypted);
      setActiveSecretsPassphrase(newPin);

      persistSecurity({
        ...securityConfig,
        secretsPinHash: hash,
        secretsPinSalt: salt,
        wrappedSecretsKey,
      });
      return true;
    },
    [securityConfig, encryptedSecrets, decryptAllRecords, persistSecurity]
  );

  const updatePrivateModeSettings = useCallback(
    (settings: { privateModeTimeoutSeconds?: number; lockSecretsOnTabLeave?: boolean }) => {
      persistSecurity({
        ...securityConfig,
        ...settings,
      });
    },
    [securityConfig, persistSecurity]
  );

  // App Master PIN & Emergency Lock
  const setAppLockPin = useCallback(
    async (newPin: string, currentPin?: string): Promise<boolean> => {
      if (securityConfig.appLockPinHash && securityConfig.appLockPinSalt) {
        if (!currentPin) return false;
        const ok = await verifyPinOrPassword(
          currentPin,
          securityConfig.appLockPinHash,
          securityConfig.appLockPinSalt
        );
        if (!ok) return false;
      }
      const { hash, salt } = await hashPinOrPassword(newPin);
      persistSecurity({
        ...securityConfig,
        appLockPinHash: hash,
        appLockPinSalt: salt,
      });
      return true;
    },
    [securityConfig, persistSecurity]
  );

  const removeAppLockPin = useCallback(
    async (currentPin: string): Promise<boolean> => {
      if (!securityConfig.appLockPinHash || !securityConfig.appLockPinSalt) return true;
      const ok = await verifyPinOrPassword(
        currentPin,
        securityConfig.appLockPinHash,
        securityConfig.appLockPinSalt
      );
      if (!ok) return false;
      persistSecurity({
        ...securityConfig,
        appLockPinHash: null,
        appLockPinSalt: null,
      });
      return true;
    },
    [securityConfig, persistSecurity]
  );

  const unlockApp = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!securityConfig.appLockPinHash || !securityConfig.appLockPinSalt) {
        setIsAppLocked(false);
        return true;
      }
      const ok = await verifyPinOrPassword(
        pin,
        securityConfig.appLockPinHash,
        securityConfig.appLockPinSalt
      );
      if (ok) {
        setIsAppLocked(false);
      }
      return ok;
    },
    [securityConfig]
  );

  const quickSetupAndLockApp = useCallback(
    async (newPin: string) => {
      const { hash, salt } = await hashPinOrPassword(newPin);
      persistSecurity({
        ...securityConfig,
        appLockPinHash: hash,
        appLockPinSalt: salt,
      });
      setIsEmergencySetupModalOpen(false);
      lockSecrets();
      setIsAppLocked(true);
    },
    [securityConfig, persistSecurity, lockSecrets]
  );

  const toggleTheme = useCallback(() => {
    persistSecurity({
      ...securityConfig,
      theme: securityConfig.theme === 'dark' ? 'light' : 'dark',
    });
  }, [securityConfig, persistSecurity]);

  // Encrypted Backup Export / Import
  const exportEncryptedBackup = useCallback(
    async (backupPassphrase: string): Promise<EncryptedBackupFile> => {
      const snapshot: VaultDataSnapshot = {
        version: 1,
        exportedAt: new Date().toISOString(),
        appName: 'MYVAULT',
        schedules,
        routines,
        targets,
        achievements,
        journal,
        encryptedSecrets,
        securityMeta: {
          secretsPinHash: securityConfig.secretsPinHash,
          secretsPinSalt: securityConfig.secretsPinSalt,
          privateModeTimeoutSeconds: securityConfig.privateModeTimeoutSeconds,
          lockSecretsOnTabLeave: securityConfig.lockSecretsOnTabLeave,
        },
      };

      const envelope = await encryptData(snapshot, backupPassphrase);
      return {
        format: 'MYVAULT_ENCRYPTED_BACKUP',
        version: 1,
        exportedAt: snapshot.exportedAt,
        envelope,
      };
    },
    [schedules, routines, targets, achievements, journal, encryptedSecrets, securityConfig]
  );

  const importEncryptedBackup = useCallback(
    async (fileContent: string, backupPassphrase: string): Promise<void> => {
      const parsed = JSON.parse(fileContent) as EncryptedBackupFile;
      if (parsed.format !== 'MYVAULT_ENCRYPTED_BACKUP' || !parsed.envelope) {
        throw new Error('Invalid MYVAULT backup file format.');
      }
      const snapshot = await decryptData<VaultDataSnapshot>(parsed.envelope, backupPassphrase);
      if (snapshot.appName !== 'MYVAULT') {
        throw new Error('Backup payload verification failed.');
      }

      lockSecrets();
      setSchedules(snapshot.schedules || []);
      setRoutines(snapshot.routines || []);
      setTargets(snapshot.targets || []);
      setAchievements(snapshot.achievements || []);
      setJournal(snapshot.journal || []);
      setEncryptedSecrets(snapshot.encryptedSecrets || []);

      vaultStorage.saveSchedules(snapshot.schedules || []);
      vaultStorage.saveRoutines(snapshot.routines || []);
      vaultStorage.saveTargets(snapshot.targets || []);
      vaultStorage.saveAchievements(snapshot.achievements || []);
      vaultStorage.saveJournal(snapshot.journal || []);
      vaultStorage.saveEncryptedSecrets(snapshot.encryptedSecrets || []);

      persistSecurity({
        ...securityConfig,
        secretsPinHash: snapshot.securityMeta?.secretsPinHash ?? securityConfig.secretsPinHash,
        secretsPinSalt: snapshot.securityMeta?.secretsPinSalt ?? securityConfig.secretsPinSalt,
        privateModeTimeoutSeconds:
          snapshot.securityMeta?.privateModeTimeoutSeconds ?? securityConfig.privateModeTimeoutSeconds,
        lockSecretsOnTabLeave:
          snapshot.securityMeta?.lockSecretsOnTabLeave ?? securityConfig.lockSecretsOnTabLeave,
        biometricEnabled: false,
        biometricCredentialId: null,
        biometricDeviceSecret: null,
        wrappedSecretsKey: null,
      });
    },
    [lockSecrets, persistSecurity, securityConfig]
  );

  const clearSampleData = useCallback(() => {
    setSchedules([]);
    setRoutines([]);
    setTargets([]);
    setAchievements([]);
    setJournal([]);
    vaultStorage.saveSchedules([]);
    vaultStorage.saveRoutines([]);
    vaultStorage.saveTargets([]);
    vaultStorage.saveAchievements([]);
    vaultStorage.saveJournal([]);
  }, []);

  const value = useMemo<VaultContextValue>(
    () => ({
      activeSection,
      setActiveSection,
      schedules,
      routines,
      targets,
      achievements,
      journal,
      encryptedSecrets,
      securityConfig,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      toggleScheduleCompletion,
      addRoutine,
      deleteRoutine,
      toggleRoutineStep,
      addTarget,
      updateTargetProgress,
      updateTarget,
      deleteTarget,
      addAchievement,
      deleteAchievement,
      addJournalEntry,
      updateJournalEntry,
      deleteJournalEntry,
      isSecretsUnlocked,
      decryptedSecrets,
      secretsIdleRemaining,
      setupSecretsPin,
      unlockSecretsWithPin,
      unlockSecretsWithBiometrics,
      lockSecrets,
      createSecret,
      updateSecret,
      deleteSecret,
      changeSecretsPin,
      biometricHardwareAvailable,
      enableBiometricsForSecrets,
      disableBiometricsForSecrets,
      updatePrivateModeSettings,
      isAppLocked,
      isEmergencySetupModalOpen,
      setIsEmergencySetupModalOpen,
      triggerEmergencyLock,
      setAppLockPin,
      removeAppLockPin,
      unlockApp,
      quickSetupAndLockApp,
      toggleTheme,
      exportEncryptedBackup,
      importEncryptedBackup,
      clearSampleData,
    }),
    [
      activeSection,
      setActiveSection,
      schedules,
      routines,
      targets,
      achievements,
      journal,
      encryptedSecrets,
      securityConfig,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      toggleScheduleCompletion,
      addRoutine,
      deleteRoutine,
      toggleRoutineStep,
      addTarget,
      updateTargetProgress,
      updateTarget,
      deleteTarget,
      addAchievement,
      deleteAchievement,
      addJournalEntry,
      updateJournalEntry,
      deleteJournalEntry,
      isSecretsUnlocked,
      decryptedSecrets,
      secretsIdleRemaining,
      setupSecretsPin,
      unlockSecretsWithPin,
      unlockSecretsWithBiometrics,
      lockSecrets,
      createSecret,
      updateSecret,
      deleteSecret,
      changeSecretsPin,
      biometricHardwareAvailable,
      enableBiometricsForSecrets,
      disableBiometricsForSecrets,
      updatePrivateModeSettings,
      isAppLocked,
      isEmergencySetupModalOpen,
      triggerEmergencyLock,
      setAppLockPin,
      removeAppLockPin,
      unlockApp,
      quickSetupAndLockApp,
      toggleTheme,
      exportEncryptedBackup,
      importEncryptedBackup,
      clearSampleData,
    ]
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault(): VaultContextValue {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within VaultProvider');
  return ctx;
}
