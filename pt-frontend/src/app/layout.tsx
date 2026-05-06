import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PT — Tell Your Story. We Build Your Mission.',
  description:
    'PT (Promptivity) is an AI-powered productivity app that transforms your story into a structured mission plan using 13 proven frameworks.',
  keywords: ['productivity', 'AI', 'mission planning', 'GTD', 'Kanban', 'Pomodoro'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gaegu:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F3F3F1] text-[#2B2B2B] antialiased">
        {children}
      </body>
    </html>
  );
}
