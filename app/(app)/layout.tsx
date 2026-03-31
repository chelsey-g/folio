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
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">{children}</main>
    </div>
  );
}
