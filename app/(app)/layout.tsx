import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username = '';
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();
    username = data?.username ?? '';
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar username={username} />
      {/* Ambient top glow */}
      <div
        className="fixed inset-x-0 top-14 h-48 pointer-events-none z-10"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% -10%, var(--accent-bg), transparent)' }}
      />
      <main className="relative z-20 flex-1 max-w-5xl mx-auto w-full px-4 pt-8 pb-28 sm:py-10">{children}</main>
    </div>
  );
}
