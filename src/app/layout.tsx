import type { Metadata, Viewport } from 'next';
import { Heebo } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'RAFIT - ניהול סטודיו לכושר',
    template: '%s | RAFIT',
  },
  description: 'מערכת ניהול מתקדמת לסטודיואים ומכוני כושר - לוח זמנים, חברויות, תשלומים ועוד',
  keywords: ['ניהול סטודיו', 'כושר', 'יוגה', 'פילאטיס', 'לוח זמנים', 'חברויות', 'תשלומים'],
  authors: [{ name: 'RAFIT' }],
  creator: 'RAFIT',
  publisher: 'RAFIT',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    url: 'https://rafit.co.il',
    siteName: 'RAFIT',
    title: 'RAFIT - ניהול סטודיו לכושר',
    description: 'מערכת ניהול מתקדמת לסטודיואים ומכוני כושר',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RAFIT - ניהול סטודיו לכושר',
    description: 'מערכת ניהול מתקדמת לסטודיואים ומכוני כושר',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className={`${heebo.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
