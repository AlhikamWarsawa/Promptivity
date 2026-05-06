import type { Metadata } from 'next';
import { DM_Sans, Gaegu } from 'next/font/google';
import { StoreInitializer } from '@/components/pt/StoreInitializer';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const gaegu = Gaegu({
  subsets: ['latin'],
  variable: '--font-gaegu',
  display: 'swap',
  weight: ['300', '400', '700'],
});

export const metadata: Metadata = {
  title: 'Promptivity — Tell Your Story. We Build Your Mission.',
  description:
    'Promptivity mengubah cerita hidupmu menjadi mission plan terstruktur menggunakan 13 productivity framework berbasis AI.',
  keywords: ['productivity', 'AI', 'mission planning', 'GTD', 'Kanban', 'Pomodoro', 'Promptivity'],
  openGraph: {
    title: 'Promptivity — Tell Your Story. We Build Your Mission.',
    description: 'AI-powered productivity mission builder.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${gaegu.variable}`}>
      <body
        className="antialiased"
        style={{
          fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
          backgroundColor: 'var(--pt-white)',
          color: 'var(--pt-black)',
        }}
      >
        <StoreInitializer />
        {children}
      </body>
    </html>
  );
}
