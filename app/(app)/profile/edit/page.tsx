'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';

export default function EditProfilePage() {
  const router   = useRouter();
  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [fullName,    setFullName]    = useState('');
  const [username,    setUsername]    = useState('');
  const [bio,         setBio]         = useState('');
  const [readingGoal, setReadingGoal] = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [saved,       setSaved]       = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data as Profile);
        setFullName(data.full_name ?? '');
        setUsername(data.username ?? '');
        setBio(data.bio ?? '');
        setReadingGoal(data.reading_goal ? String(data.reading_goal) : '');
      }
    }
    load();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase
      .from('profiles')
      .update({
        full_name:    fullName.trim() || null,
        username:     username.trim().toLowerCase(),
        bio:          bio.trim() || null,
        reading_goal: readingGoal ? parseInt(readingGoal) : null,
      })
      .eq('id', user.id);

    if (err) {
      setError(err.message.includes('unique') ? 'That username is already taken.' : err.message);
      setSaving(false);
      return;
    }

    setSaved(true);
    setTimeout(() => router.push(`/profile/${username.trim().toLowerCase()}`), 800);
  }

  if (!profile) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-subtle border-t-[var(--link)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <Link href={`/profile/${profile.username}`} className="text-sm text-muted hover:text-primary transition-colors">
          ← Back to profile
        </Link>
      </div>

      <h1 className="font-serif text-3xl font-bold text-primary mb-8">Edit profile</h1>

      <form onSubmit={handleSave} className="space-y-5">
        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Preview */}
        <div className="flex items-center gap-4 p-4 bg-surface-hover border border-subtle rounded-2xl">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-xl font-serif font-bold text-white shadow-md shadow-black/20">
            {(fullName || username || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-primary text-sm">{fullName || username || 'Your name'}</p>
            <p className="text-xs text-muted">@{username || 'username'}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="fullName" className="text-sm font-semibold text-primary block">
            Full name
          </label>
          <input
            id="fullName" type="text" value={fullName} maxLength={80}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3.5 py-2.5 bg-input border border-input rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[var(--link)] focus:border-transparent placeholder:text-muted"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="username" className="text-sm font-semibold text-primary block">Username</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm">@</span>
            <input
              id="username" type="text" required minLength={3} maxLength={30}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="yourname"
              className="w-full pl-8 pr-3.5 py-2.5 bg-input border border-input rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[var(--link)] focus:border-transparent placeholder:text-muted"
            />
          </div>
          <p className="text-xs text-muted">Letters, numbers, and underscores only.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="bio" className="text-sm font-semibold text-primary block">
            Bio <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="bio" rows={3} maxLength={200} value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short bio about yourself and your reading tastes…"
            className="w-full px-3.5 py-2.5 bg-input border border-input rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[var(--link)] focus:border-transparent resize-none placeholder:text-muted"
          />
          <p className="text-xs text-muted text-right">{bio.length}/200</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="readingGoal" className="text-sm font-semibold text-primary block">
            {new Date().getFullYear()} reading goal <span className="font-normal text-muted">(optional)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              id="readingGoal" type="number" min={1} max={9999}
              value={readingGoal}
              onChange={(e) => setReadingGoal(e.target.value)}
              placeholder="52"
              className="w-28 px-3.5 py-2.5 bg-input border border-input rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[var(--link)] focus:border-transparent placeholder:text-muted"
            />
            <span className="text-sm text-muted">books this year</span>
          </div>
        </div>

        <button
          type="submit" disabled={saving || !username.trim()}
          className="w-full py-3 bg-btn text-btn-fg rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md shadow-black/10"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
