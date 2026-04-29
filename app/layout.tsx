import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { UIProvider } from '@/context/UIContext';
import AnimatedBg from '@/components/common/AnimatedBg';
import './globals.css';

export const metadata: Metadata = {
  title: 'Glinqx — share links, find the web',
  description: 'A community for sharing and discovering the best links on the web.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Geist+Mono:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <NotificationProvider>
            <UIProvider>
              <AnimatedBg />
              {children}
            </UIProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
