import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { UIProvider } from '@/context/UIContext';
import AnimatedBg from '@/components/common/AnimatedBg';
import { LoadingProvider } from '@/context/LoadingContext';
import { ToastProvider } from '@/context/ToastContext';
import ToastContainer from '@/components/common/ToastContainer';
// @ts-ignore: CSS side-effect import
import './globals.css';

export const metadata: Metadata = {
  title: 'LnkZoo — share links, find the web',
  description: 'A community for sharing and discovering the best links on the web.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              var t = localStorage.getItem('lnkzoo_theme');
              if (t) document.documentElement.setAttribute('data-theme', t);
            } catch(e) {}
          `
        }} />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Geist+Mono:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <NotificationProvider>
            <UIProvider>
              <LoadingProvider>
                <ToastProvider>
                  <AnimatedBg />
                  {children}
                  <ToastContainer />
                </ToastProvider>
              </LoadingProvider>
            </UIProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
