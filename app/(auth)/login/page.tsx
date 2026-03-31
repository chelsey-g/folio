'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/home');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-3xl font-bold text-primary hover:text-link transition-colors">
            Folio
          </Link>
          <p className="text-muted mt-2 text-sm">Welcome back</p>
        </div>

        <div className="bg-surface border border-subtle rounded-3xl p-8 shadow-sm shadow-black/5">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { id: 'email',    label: 'Email',    type: 'email',    value: email,    set: setEmail,    ph: 'you@example.com' },
              { id: 'password', label: 'Password', type: 'password', value: password, set: setPassword, ph: '••••••••' },
            ].map(({ id, label, type, value, set, ph }) => (
              <div key={id} className="space-y-1.5">
                <label htmlFor={id} className="text-sm font-semibold text-primary block">{label}</label>
                <input
                  id={id} type={type} required value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder={ph}
                  className="w-full px-3.5 py-2.5 bg-input border border-input rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[var(--link)] focus:border-transparent placeholder:text-muted"
                />
              </div>
            ))}
            <button
              type="submit" disabled={loading}
              className="w-full bg-btn text-btn-fg py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md shadow-black/10 mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted mt-5">
          No account?{' '}
          <Link href="/signup" className="text-primary font-semibold hover:text-link transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
