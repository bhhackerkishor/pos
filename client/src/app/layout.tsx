import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import ThemeProvider from '@/components/ThemeProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'OHM SAKTHI POS | Smart Billing & Inventory System',
    template: '%s | OHM SAKTHI POS',
  },
  description:
    'OHM SAKTHI POS is a fast, reliable Point of Sale system for billing, inventory management, GST reports, and analytics. Designed for retail and grocery stores.',
  keywords: [
    'POS system',
    'billing software',
    'inventory management',
    'grocery POS',
    'retail billing',
    'GST billing software',
    'OHM SAKTHI POS',
    'India POS system',
  ],
  authors: [{ name: 'OHM SAKTHI STORE' }],
  creator: 'OHM SAKTHI STORE',
  publisher: 'OHM SAKTHI STORE',

  metadataBase: new URL('https://ohmsakthipos.in'), // change if needed

  openGraph: {
    title: 'OHM SAKTHI POS | Smart Billing & Inventory System',
    description:
      'Modern POS billing software with inventory, GST, analytics, and fast checkout for retail and grocery stores.',
    url: 'https://ohmsakthipos.in',
    siteName: 'OHM SAKTHI POS',
    images: [
      {
        url: '/og-image.png', // create this image
        width: 1200,
        height: 630,
        alt: 'OHM SAKTHI POS Billing Software',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'OHM SAKTHI POS | Smart Billing System',
    description:
      'Fast billing, inventory control, GST reports, and analytics for modern retail stores.',
    images: ['/og-image.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },

};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased selection:bg-primary/30`}
      >
        <ThemeProvider>
          <Toaster position="top-right" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
