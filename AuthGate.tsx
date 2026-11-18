import React, { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, Fingerprint, KeyRound, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { hashPinOrPassword, verifyPinOrPassword } from '../utils/crypto';

type AccountRecord = { username: string; passkeyHash: string; passkeySalt: string };
const ACCOUNT_KEY = 'myvault.account.v1';

function readAccount(): AccountRecord | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AccountRecord;
    return parsed.username && parsed.passkeyHash && parsed.passkeySalt ? parsed : null;
  } catch {
    return null;
  }
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<AccountRecord | null>(() => readAccount());
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [passkey, setPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setAccount(readAccount()); }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const cleanUsername = username.trim();
    if (!cleanUsername || !passkey) {
      setError('Enter your username and passkey to continue.');
      return;
    }
    if (passkey.length < 8) {
      setError('Use a passkey with at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      if (!account) {
        if (passkey !== confirmPasskey) {
          setError('The passkeys do not match.');
          return;
        }
        const { hash, salt } = await hashPinOrPassword(passkey);
        const nextAccount = { username: cleanUsername, passkeyHash: hash, passkeySalt: salt };
        localStorage.setItem(ACCOUNT_KEY, JSON.stringify(nextAccount));
        setAccount(nextAccount);
        setAuthenticated(true);
      } else {
        const sameUser = cleanUsername.toLowerCase() === account.username.toLowerCase();
        const validPasskey = await verifyPinOrPassword(passkey, account.passkeyHash, account.passkeySalt);
        if (!sameUser || !validPasskey) {
          setError('Username or passkey is incorrect.');
          return;
        }
        setAuthenticated(true);
      }
      setPasskey('');
      setConfirmPasskey('');
    } catch {
      setError('Could not verify your details. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (authenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#050914] text-white flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0A1222] shadow-2xl shadow-black/40 grid lg:grid-cols-2">
        <div className="relative min-h-[250px] lg:min-h-[650px] overflow-hidden bg-[#07152B]">
          <img src="/myvault-login.png" alt="MYVAULT golden shield and personal security illustration" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050914] via-transparent to-[#061126]/10" />
          <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-2 backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-[#F2C75C]" />
            <span className="text-xs font-semibold tracking-[0.18em] text-white">PRIVATE SPACE</span>
          </div>
          <div className="absolute bottom-7 left-7 right-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F2C75C]">Your personal headquarters</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">MYVAULT</h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-200">Your plans, ambitions and private thoughts — organized in one place.</p>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F2C75C]">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">{account ? 'Welcome back' : 'Create your private account'}</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">{account ? 'Unlock your vault' : 'Set up your vault'}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{account ? 'Sign in with your username and passkey to continue.' : 'Choose a username and a strong passkey to protect access on this device.'}</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="vault-username" className="mb-2 block text-xs font-semibold text-slate-300">Username</label>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#060C18] px-4 focus-within:border-[#D4AF37]/70">
                  <UserRound className="h-4 w-4 text-slate-500" />
                  <input id="vault-username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your username" className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600" />
                </div>
              </div>
              <div>
                <label htmlFor="vault-passkey" className="mb-2 block text-xs font-semibold text-slate-300">Passkey / password</label>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#060C18] px-4 focus-within:border-[#D4AF37]/70">
                  <KeyRound className="h-4 w-4 text-slate-500" />
                  <input id="vault-passkey" type={showPasskey ? 'text' : 'password'} autoComplete={account ? 'current-password' : 'new-password'} value={passkey} onChange={e => setPasskey(e.target.value)} placeholder="At least 8 characters" className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600" />
                  <button type="button" onClick={() => setShowPasskey(v => !v)} aria-label={showPasskey ? 'Hide passkey' : 'Show passkey'} className="text-slate-500 hover:text-white">{showPasskey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              {!account && <div>
                <label htmlFor="vault-confirm-passkey" className="mb-2 block text-xs font-semibold text-slate-300">Confirm passkey</label>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#060C18] px-4 focus-within:border-[#D4AF37]/70">
                  <Fingerprint className="h-4 w-4 text-slate-500" />
                  <input id="vault-confirm-passkey" type={showPasskey ? 'text' : 'password'} autoComplete="new-password" value={confirmPasskey} onChange={e => setConfirmPasskey(e.target.value)} placeholder="Enter it again" className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600" />
                </div>
              </div>}
              {error && <p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-300">{error}</p>}
              <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3D47B] px-4 py-3.5 text-sm font-bold text-[#111827] shadow-lg shadow-[#D4AF37]/10 transition hover:brightness-110 disabled:opacity-60">
                {busy ? 'Please wait…' : account ? 'Unlock MYVAULT' : 'Create account & continue'}
                {!busy && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <p className="text-[11px] leading-5 text-slate-400">Your passkey is stored as a salted hash on this device. This sign-in screen is a local access gate, not a substitute for server-side account security or full-device data encryption.</p>
            </div>
            <p className="mt-6 text-center text-[10px] font-medium tracking-[0.2em] text-slate-600">MYVAULT · YOUR LIFE. YOUR RULES.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
