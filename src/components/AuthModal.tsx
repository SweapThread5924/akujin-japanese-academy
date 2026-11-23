import React, { useEffect, useState } from 'react';
import { X, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { validateAuthInput } from '../utils/authAndForms';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onEmailAuthSuccess: (payload: {
    account: { email: string; name: string; profileId: string };
    profile: Record<string, unknown>;
    leaderboard?: unknown[];
  }) => void;
  onGoogleSignIn: () => Promise<void>;
  guestStateSnapshot: Record<string, unknown>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onEmailAuthSuccess,
  onGoogleSignIn,
  guestStateSnapshot,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setPassword('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const check = validateAuthInput({ mode, name, email, password });
    if (!check.ok) {
      setError(check.error);
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const body =
        mode === 'signup'
          ? { name: name.trim(), email: email.trim(), password, guestState: guestStateSnapshot }
          : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed. Please try again.');
        return;
      }
      onEmailAuthSuccess(data);
      onClose();
    } catch {
      setError('Unable to reach server right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleClick = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await onGoogleSignIn();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-6 sm:p-7 space-y-5 shadow-xl relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-[#141413] dark:hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
            学人クラウド · Cross-Device Progress Sync
          </p>
          <h2 id="auth-modal-title" className="text-xl font-bold text-[#141413] dark:text-white">
            {mode === 'login' ? 'Log In to AkuJin' : 'Create Your Free AkuJin Account'}
          </h2>
          <p className="text-xs text-stone-500 dark:text-zinc-400">
            Log in with the same email on any phone or laptop to restore all XP, streak, Kanji SRS, and mastered lessons.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-stone-100 dark:bg-[#101218] border border-stone-200 dark:border-zinc-800">
          <button
            type="button"
            data-testid="auth-mode-login"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              mode === 'login'
                ? 'bg-white dark:bg-[#1E2029] text-[#141413] dark:text-white shadow-xs'
                : 'text-stone-500 dark:text-zinc-400'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            data-testid="auth-mode-signup"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              mode === 'signup'
                ? 'bg-white dark:bg-[#1E2029] text-[#141413] dark:text-white shadow-xs'
                : 'text-stone-500 dark:text-zinc-400'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label htmlFor="auth-name" className="text-xs font-medium text-stone-700 dark:text-zinc-300 block">
                Full Name
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aarav Sharma"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-sm text-[#141413] dark:text-white"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="auth-email" className="text-xs font-medium text-stone-700 dark:text-zinc-300 block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-sm text-[#141413] dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="auth-password" className="text-xs font-medium text-stone-700 dark:text-zinc-300 block">
              Password (min. 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-sm text-[#141413] dark:text-white"
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 px-3 py-2 text-xs text-[#D92525] dark:text-rose-400"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            data-testid="auth-submit-btn"
            className="w-full py-2.5 rounded-xl bg-[#D92525] hover:bg-[#B91C1C] text-white text-sm font-semibold cursor-pointer disabled:opacity-60 transition-colors"
          >
            {submitting
              ? 'Syncing Profile…'
              : mode === 'login'
              ? 'Log In & Restore Progress'
              : 'Create Account & Sync'}
          </button>
        </form>

        <div className="relative flex items-center justify-center text-[11px] text-stone-400">
          <span className="bg-white dark:bg-[#16181F] px-2 z-10">or</span>
          <span className="absolute inset-x-0 h-px bg-stone-200 dark:bg-zinc-800" />
        </div>

        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={googleLoading}
          className="w-full py-2.5 rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-[#101218] hover:bg-stone-50 dark:hover:bg-zinc-900 text-xs font-semibold text-[#141413] dark:text-white cursor-pointer disabled:opacity-60 transition-colors"
        >
          {googleLoading ? 'Connecting Google Account…' : 'Continue with Google (Cloud Sync)'}
        </button>
      </div>
    </div>
  );
};
