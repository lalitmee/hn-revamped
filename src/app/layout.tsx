import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HN Revamped — Intelligent Hacker News Reader',
  description:
    'A fast, readable, Google Material-inspired Hacker News client with Split-Pane & Zen modes, E-Reader & Code themes, and built-in Article Reader View.',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: ['/icon.svg'],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" />
        <meta name="color-scheme" content="light dark" />
        <link
          rel="preload"
          href="/fonts/icons/MaterialSymbolsRounded.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
