import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { ThemeProvider } from '@/lib/theme';
import { AuthProvider } from '@/lib/auth';
import { ViewModeProvider } from '@/lib/viewMode';
import AppShell from '@/components/AppShell';
import { ToastProvider } from '@/lib/toast';

import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Lansub Stream | Zero-Code Industrial IoT',
  description: 'Enterprise IoT Telemetry, Digital Twins & Automation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-theme="dark" suppressHydrationWarning>
      <head>
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body 
        className={`${inter.className} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen antialiased transition-colors duration-200`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <ViewModeProvider>
              <ToastProvider>
                <AppShell>{children}</AppShell>
              </ToastProvider>
            </ViewModeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
