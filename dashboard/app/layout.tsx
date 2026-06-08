import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'SMSGate – SMS Gateway Platform',
  description: 'Turn your Android phone into a programmable SMS gateway',
  icons: { icon: '/logo.png', apple: '/logo.png' },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'SMSGate' },
  other: { 'mobile-web-app-capable': 'yes', 'theme-color': '#22c55e' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="bg-[#080C14] text-white min-h-screen antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
