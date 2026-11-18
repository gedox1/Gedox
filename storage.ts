import {
  Achievement,
  EncryptedSecretRecord,
  JournalEntry,
  Routine,
  ScheduleItem,
  TargetGoal,
  VaultSecurityConfig,
} from '../types/vault';

const STORAGE_KEYS = {
  SCHEDULES: 'myvault_schedules_v1',
  ROUTINES: 'myvault_routines_v1',
  TARGETS: 'myvault_targets_v1',
  ACHIEVEMENTS: 'myvault_achievements_v1',
  JOURNAL: 'myvault_journal_v1',
  SECRETS: 'myvault_encrypted_secrets_v1',
  SECURITY: 'myvault_security_config_v1',
  SEEDED: 'myvault_seeded_v1',
};

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(baseIso: string, deltaDays: number): string {
  const [y, m, d] = baseIso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + deltaDays);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

const DEFAULT_SECURITY: VaultSecurityConfig = {
  secretsPinHash: null,
  secretsPinSalt: null,
  appLockPinHash: null,
  appLockPinSalt: null,
  privateModeTimeoutSeconds: 180,
  lockSecretsOnTabLeave: true,
  biometricEnabled: false,
  biometricCredentialId: null,
  wrappedSecretsKey: null,
  biometricDeviceSecret: null,
  theme: 'dark',
};

function createInitialData() {
  const today = getTodayISO();
  const yesterday = addDaysISO(today, -1);
  const twoDaysAgo = addDaysISO(today, -2);
  const tomorrow = addDaysISO(today, 1);
  const plus3 = addDaysISO(today, 3);
  const plus6 = addDaysISO(today, 6);
  const plus14 = addDaysISO(today, 14);
  const plus45 = addDaysISO(today, 45);
  const plus90 = addDaysISO(today, 90);

  const schedules: ScheduleItem[] = [
    {
      id: 'sch-1',
      title: 'Deep Focus Block: Architecture & Research',
      notes: 'Complete core thesis outline and system benchmarks before midday.',
      date: today,
      time: '09:00',
      recurrence: 'daily',
      isDeadline: false,
      reminderMinutes: 15,
      completedDates: [yesterday, twoDaysAgo],
      category: 'Study',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sch-2',
      title: 'Quarterly Portfolio Rebalance Review',
      notes: 'Audit emergency fund allocation and automated index contributions.',
      date: today,
      time: '14:30',
      recurrence: 'monthly',
      isDeadline: true,
      reminderMinutes: 60,
      completedDates: [],
      category: 'Finance',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sch-3',
      title: 'Strength & Mobility Session',
      notes: '45 minutes compound lifting + 15 minutes zone-2 cardio.',
      date: today,
      time: '18:00',
      recurrence: 'daily',
      isDeadline: false,
      reminderMinutes: 30,
      completedDates: [yesterday],
      category: 'Health',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sch-4',
      title: 'Submit Final Capstone Proposal',
      notes: 'Upload signed PDF and methodology appendix before 5 PM.',
      date: plus3,
      time: '17:00',
      recurrence: 'once',
      isDeadline: true,
      reminderMinutes: 1440,
      completedDates: [],
      category: 'Study',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sch-5',
      title: 'Weekly Executive Reset & Planning',
      notes: 'Clear inbox, review targets, and lock next week calendar blocks.',
      date: plus6,
      time: '10:00',
      recurrence: 'weekly',
      isDeadline: false,
      reminderMinutes: 30,
      completedDates: [],
      category: 'Work',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sch-6',
      title: 'Mentor Sync & Career Roadmap Check-in',
      notes: 'Bring updated portfolio case studies and Q4 milestone metrics.',
      date: tomorrow,
      time: '11:30',
      recurrence: 'once',
      isDeadline: true,
      reminderMinutes: 60,
      completedDates: [],
      category: 'Work',
      createdAt: new Date().toISOString(),
    },
  ];

  const routines: Routine[] = [
    {
      id: 'rtn-1',
      name: 'Morning Protocol',
      cadence: 'daily',
      preferredTime: '06:30',
      steps: [
        { id: 'st-1', label: 'Hydrate 500ml water & sunlight exposure' },
        { id: 'st-2', label: 'Review top 3 priorities for today' },
        { id: 'st-3', label: '20 minutes focused reading' },
      ],
      completedStepIdsByDate: {
        [today]: ['st-1', 'st-2'],
        [yesterday]: ['st-1', 'st-2', 'st-3'],
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rtn-2',
      name: 'Evening Shutdown',
      cadence: 'daily',
      preferredTime: '21:30',
      steps: [
        { id: 'st-4', label: 'Log daily journal reflection & lessons' },
        { id: 'st-5', label: 'Prepare tomorrow schedule & workspace' },
        { id: 'st-6', label: 'Devices on Do Not Disturb' },
      ],
      completedStepIdsByDate: {
        [yesterday]: ['st-4', 'st-5', 'st-6'],
      },
      createdAt: new Date().toISOString(),
    },
  ];

  const targets: TargetGoal[] = [
    {
      id: 'tgt-1',
      title: 'Complete Distributed Systems Certification',
      description: 'Finish all 8 lab modules and pass the final practical exam with 90%+.',
      category: 'academic',
      horizon: 'short-term',
      targetDate: plus14,
      progress: 75,
      completedAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tgt-2',
      title: 'Build 6-Month Liquid Reserve',
      description: 'Reach full six-month operating cushion in high-yield treasury reserve.',
      category: 'financial',
      horizon: 'long-term',
      targetDate: plus90,
      progress: 68,
      completedAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tgt-3',
      title: 'Ship Senior Systems Case Study',
      description: 'Document end-to-end architecture, latency benchmarks, and lessons learned.',
      category: 'career',
      horizon: 'short-term',
      targetDate: plus45,
      progress: 45,
      completedAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tgt-4',
      title: 'Run Sub-45 Minute 10K',
      description: 'Maintain 4 weekly training runs with tempo intervals and progressive mileage.',
      category: 'personal',
      horizon: 'short-term',
      targetDate: plus45,
      progress: 100,
      completedAt: yesterday,
      createdAt: new Date().toISOString(),
    },
  ];

  const achievements: Achievement[] = [
    {
      id: 'ach-1',
      title: 'Completed 10K Time Trial Under 45 Minutes',
      category: 'personal',
      achievedDate: yesterday,
      notes: 'Finished in 44:18 on steady negative splits after 10 weeks of structured training.',
      linkedTargetId: 'tgt-4',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ach-2',
      title: 'Zero-Debt Baseline Achieved',
      category: 'financial',
      achievedDate: addDaysISO(today, -18),
      notes: 'Cleared remaining educational balance ahead of schedule.',
      createdAt: new Date().toISOString(),
    },
  ];

  const journal: JournalEntry[] = [
    {
      id: 'jrn-1',
      date: today,
      title: 'Clarity Through Elimination',
      mood: 'Focused',
      reflection:
        'Cut three low-leverage commitments from my week so my morning blocks stay completely protected. Energy remained steady through midday.',
      experiences:
        'Had a focused 2-hour whiteboarding session without checking messages once. Finished the core outline ahead of schedule.',
      lessonsLearned:
        'Protecting the first 90 minutes of the morning determines the quality of the entire day.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'jrn-2',
      date: yesterday,
      title: '10K Benchmark & Quiet Momentum',
      mood: 'Driven',
      reflection:
        'Hit my 10K target pace early in the morning, then spent the evening reviewing quarterly savings targets.',
      experiences:
        'Pushed through kilometer 7 when legs felt heavy by locking into breathing cadence.',
      lessonsLearned:
        'Consistency during unremarkable days builds the reserve you rely on during test days.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return { schedules, routines, targets, achievements, journal };
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function ensureInitialVaultData(): void {
  if (localStorage.getItem(STORAGE_KEYS.SEEDED)) {
    return;
  }
  const initial = createInitialData();
  writeJson(STORAGE_KEYS.SCHEDULES, initial.schedules);
  writeJson(STORAGE_KEYS.ROUTINES, initial.routines);
  writeJson(STORAGE_KEYS.TARGETS, initial.targets);
  writeJson(STORAGE_KEYS.ACHIEVEMENTS, initial.achievements);
  writeJson(STORAGE_KEYS.JOURNAL, initial.journal);
  writeJson(STORAGE_KEYS.SECRETS, []);
  writeJson(STORAGE_KEYS.SECURITY, DEFAULT_SECURITY);
  localStorage.setItem(STORAGE_KEYS.SEEDED, '1');
}

export const vaultStorage = {
  getSchedules: (): ScheduleItem[] => readJson(STORAGE_KEYS.SCHEDULES, []),
  saveSchedules: (data: ScheduleItem[]) => writeJson(STORAGE_KEYS.SCHEDULES, data),

  getRoutines: (): Routine[] => readJson(STORAGE_KEYS.ROUTINES, []),
  saveRoutines: (data: Routine[]) => writeJson(STORAGE_KEYS.ROUTINES, data),

  getTargets: (): TargetGoal[] => readJson(STORAGE_KEYS.TARGETS, []),
  saveTargets: (data: TargetGoal[]) => writeJson(STORAGE_KEYS.TARGETS, data),

  getAchievements: (): Achievement[] => readJson(STORAGE_KEYS.ACHIEVEMENTS, []),
  saveAchievements: (data: Achievement[]) => writeJson(STORAGE_KEYS.ACHIEVEMENTS, data),

  getJournal: (): JournalEntry[] => readJson(STORAGE_KEYS.JOURNAL, []),
  saveJournal: (data: JournalEntry[]) => writeJson(STORAGE_KEYS.JOURNAL, data),

  getEncryptedSecrets: (): EncryptedSecretRecord[] => readJson(STORAGE_KEYS.SECRETS, []),
  saveEncryptedSecrets: (data: EncryptedSecretRecord[]) => writeJson(STORAGE_KEYS.SECRETS, data),

  getSecurityConfig: (): VaultSecurityConfig => ({
    ...DEFAULT_SECURITY,
    ...readJson<Partial<VaultSecurityConfig>>(STORAGE_KEYS.SECURITY, DEFAULT_SECURITY),
  }),
  saveSecurityConfig: (config: VaultSecurityConfig) => writeJson(STORAGE_KEYS.SECURITY, config),
};
