import { EncryptedBlob } from '../types/vault';

const PBKDF2_ITERATIONS = 200000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function generateRandomBytes(length = 16): Uint8Array {
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  return buf;
}

export function generateRandomToken(length = 32): string {
  return bytesToBase64(generateRandomBytes(length));
}

async function deriveAesKey(passphrase: string, salt: Uint8Array, usage: KeyUsage[]): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    usage
  );
}

export async function hashPinOrPassword(
  secret: string,
  existingSaltBase64?: string
): Promise<{ hash: string; salt: string }> {
  const salt = existingSaltBase64 ? base64ToBytes(existingSaltBase64) : generateRandomBytes(16);
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    256
  );

  return {
    hash: bytesToBase64(new Uint8Array(bits)),
    salt: bytesToBase64(salt),
  };
}

export async function verifyPinOrPassword(
  candidate: string,
  expectedHash: string,
  saltBase64: string
): Promise<boolean> {
  const { hash } = await hashPinOrPassword(candidate, saltBase64);
  if (hash.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) {
    diff |= hash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}

export async function encryptData<T>(data: T, passphrase: string): Promise<EncryptedBlob> {
  const salt = generateRandomBytes(16);
  const iv = generateRandomBytes(12);
  const key = await deriveAesKey(passphrase, salt, ['encrypt']);
  const encoded = new TextEncoder().encode(JSON.stringify(data));

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
    },
    key,
    encoded
  );

  return {
    ciphertext: bytesToBase64(new Uint8Array(encryptedBuffer)),
    iv: bytesToBase64(iv),
    salt: bytesToBase64(salt),
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
  };
}

export async function decryptData<T>(blob: EncryptedBlob, passphrase: string): Promise<T> {
  const salt = base64ToBytes(blob.salt);
  const iv = base64ToBytes(blob.iv);
  const ciphertext = base64ToBytes(blob.ciphertext);

  const key = await deriveAesKey(passphrase, salt, ['decrypt']);
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
    },
    key,
    toArrayBuffer(ciphertext)
  );

  const json = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(json) as T;
}

export async function isPlatformBiometricsSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function registerBiometricCredential(): Promise<string> {
  if (!window.PublicKeyCredential || !navigator.credentials?.create) {
    throw new Error('Biometric WebAuthn is unavailable in this browser.');
  }

  const challenge = generateRandomBytes(32);
  const userId = generateRandomBytes(16);

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: toArrayBuffer(challenge),
      rp: {
        name: 'MYVAULT Personal Vault',
      },
      user: {
        id: toArrayBuffer(userId),
        name: 'myvault-owner',
        displayName: 'MYVAULT Owner',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
      timeout: 45000,
    },
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Biometric enrollment was cancelled.');
  }

  return bytesToBase64(new Uint8Array(credential.rawId));
}

export async function verifyBiometricCredential(credentialIdBase64: string): Promise<boolean> {
  if (!window.PublicKeyCredential || !navigator.credentials?.get) {
    throw new Error('Biometric WebAuthn is unavailable in this browser.');
  }

  const challenge = generateRandomBytes(32);
  const credId = base64ToBytes(credentialIdBase64);

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: toArrayBuffer(challenge),
      allowCredentials: [
        {
          id: toArrayBuffer(credId),
          type: 'public-key',
          transports: ['internal'],
        },
      ],
      userVerification: 'required',
      timeout: 45000,
    },
  });

  return Boolean(assertion);
}
