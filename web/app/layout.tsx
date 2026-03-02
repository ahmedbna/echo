import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/provider/theme-provider';
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server';
import ConvexClientProvider from '@/provider/ConvexClientProvider';
import { Toaster } from '@/components/ui/sonner';

// @ts-ignore
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'echo',
    template: 'echo | %s',
  },
  description: 'The fun way to learn a new language',
  metadataBase: new URL('https://echo.ahmedbna.com'),
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAD40B' },
    { media: '(prefers-color-scheme: dark)', color: '#FAD40B' },
  ],
  openGraph: {
    title: 'echo',
    description: 'echo',
    url: 'https://echo.ahmedbna.com',
    siteName: 'echo',
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 800,
        height: 800,
        alt: 'echo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'echo',
    description: 'echo',
    images: ['/android-chrome-512x512.png'],
  },
  icons: {
    icon: '/apple-touch-mic.png',
    shortcut: '/apple-touch-mic.png',
    apple: '/apple-touch-mic.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-mic.png',
    },
  },
  appLinks: {
    web: {
      url: 'https://echo.ahmedbna.com/',
      should_fallback: true,
    },
  },
  verification: {
    google: 'google-site-verification=id',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang='en' suppressHydrationWarning>
        <head />

        <body className={`${inter.variable} antialiased`}>
          <ThemeProvider
            enableSystem
            attribute='class'
            defaultTheme='dark'
            storageKey='bna-ai-cad-theme'
            disableTransitionOnChange
          >
            <ConvexClientProvider>{children}</ConvexClientProvider>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
