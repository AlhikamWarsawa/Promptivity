import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import localFont from 'next/font/local';
import { StoreInitializer } from '@/components/pt/StoreInitializer';
import { AuthGuard } from '@/components/pt/AuthGuard';
import { StorageFullModal } from '@/components/pt/StorageFullModal';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const gaegu = localFont({
  src: [
    {
      path: '../../public/fonts/gaegu/Gaegu-300.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/gaegu/Gaegu-400.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/gaegu/Gaegu-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-gaegu',
  display: 'swap',
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
        <StorageFullModal />
        <AuthGuard>
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}
