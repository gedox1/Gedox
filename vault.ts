export type NavSection =
  | 'dashboard'
  | 'schedule'
  | 'calendar'
  | 'targets'
  | 'journal'
  | 'secrets'
  | 'security';

export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly';

export interface ScheduleItem {
  id: string;
  title: string;
  notes: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  recurrence: RecurrenceType;
  isDeadline: boolean;
  reminderMinutes: number | null; // e.g. 15, 60, 1440, or null
  completedDates: string[]; // array of YYYY-MM-DD strings when completed (supports recurring + single)
  category: 'Work' | 'Study' | 'Health' | 'Personal' | 'Finance';
  createdAt: string;
}

export interface RoutineStep {
  id: string;
  label: string;
}

export interface Routine {
  id: string;
  name: string;
  cadence: 'daily' | 'weekly';
  preferredTime: string; // HH:mm
  steps: RoutineStep[];
  completedStepIdsByDate: Record<string, string[]>; // date -> step ids completed
  createdAt: string;
}

export type TargetCategory = 'academic' | 'financial' | 'personal' | 'career';
export type TargetHorizon = 'short-term' | 'long-term';

export interface TargetGoal {
  id: string;
  title: string;
  description: string;
  category: TargetCategory;
  horizon: TargetHorizon;
  targetDate: string; // YYYY-MM-DD
  progress: number; // 0 - 100
  completedAt: string | null; // ISO timestamp when 100%
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  category: TargetCategory;
  achievedDate: string; // YYYY-MM-DD
  notes: string;
  linkedTargetId?: string;
  createdAt: string;
}

export type JournalMood = 'Focused' | 'Grateful' | 'Calm' | 'Driven' | 'Reflective' | 'Challenged';

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  mood: JournalMood;
  reflection: string;
  experiences: string;
  lessonsLearned: string;
  createdAt: string;
  updatedAt: string;
}

export type SecretCategory =
  | 'Personal Thoughts'
  | 'Private Notes'
  | 'Important Information'
  | 'Dreams'
  | 'Private Memories';

export interface EncryptedBlob {
  ciphertext: string; // base64
  iv: string; // base64
  salt: string; // base64
  algorithm: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
}

export interface EncryptedSecretRecord {
  id: string;
  category: SecretCategory;
  createdAt: string;
  updatedAt: string;
  payload: EncryptedBlob;
}

export interface DecryptedSecret {
  id: string;
  category: SecretCategory;
  title: string;
  content: string;
  tags: string;
  createdAt: string;
  updatedAt: string;
  rawPayload: EncryptedBlob;
}

export interface VaultSecurityConfig {
  secretsPinHash: string | null;
  secretsPinSalt: string | null;
  appLockPinHash: string | null;
  appLockPinSalt: string | null;
  privateModeTimeoutSeconds: number; // e.g., 60, 180, 300, 0 (off)
  lockSecretsOnTabLeave: boolean;
  biometricEnabled: boolean;
  biometricCredentialId: string | null;
  wrappedSecretsKey?: EncryptedBlob | null; // encrypted with device biometric token when enabled
  biometricDeviceSecret?: string | null; // random token stored locally, gated by WebAuthn assertion
  theme: 'dark' | 'light';
}

export interface VaultDataSnapshot {
  version: 1;
  exportedAt: string;
  appName: 'MYVAULT';
  schedules: ScheduleItem[];
  routines: Routine[];
  targets: TargetGoal[];
  achievements: Achievement[];
  journal: JournalEntry[];
  encryptedSecrets: EncryptedSecretRecord[];
  securityMeta: Pick<
    VaultSecurityConfig,
    'secretsPinHash' | 'secretsPinSalt' | 'privateModeTimeoutSeconds' | 'lockSecretsOnTabLeave'
  >;
}

export interface EncryptedBackupFile {
  format: 'MYVAULT_ENCRYPTED_BACKUP';
  version: 1;
  exportedAt: string;
  envelope: EncryptedBlob;
}
