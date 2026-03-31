import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Playfair_Display } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import './globals.css';

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Folio — Track Your Reading Life',
  description: 'Discover books, track your reading, and share what you love.',
};

// Injected before hydration to avoid theme flash
const themeScript = `
  try {
    var t = localStorage.getItem('folio-theme');
    if (t) document.documentElement.setAttribute('data-theme', t);
  } catch(e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="parchment" className={`${geist.variable} ${playfair.variable} h-full antialiased`}>
      <head>
        {/* Runs synchronously before paint — prevents theme flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
