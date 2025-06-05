import { Inter, Poppins } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { MapProvider } from '@/contexts/MapContext';

import '@/styles/globals.css';

// Font configuration
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata = {
  title: {
    default: 'Snowfun Nepal - Freezer & Outlet Tracker',
    template: '%s | Snowfun Nepal',
  },
  description: 'Track freezer inventory, manage PSR visits, and monitor shop-level data for Snowfun Nepal ice cream freezer distribution.',
  keywords: ['Snowfun Nepal', 'Freezer Tracking', 'Ice Cream Distribution', 'PSR Management', 'Nepal'],
  authors: [{ name: 'Snowfun Nepal' }],
  creator: 'Snowfun Nepal',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f0f9ff' }, // Light ice blue
    { media: '(prefers-color-scheme: dark)', color: '#0c4a6e' },  // Dark ice blue
  ],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-800">
        <AuthProvider>
          <ThemeProvider>
            <MapProvider>
              <div className="flex flex-col min-h-screen">
                {/* Main content */}
                <main className="flex-grow">
                  {children}
                </main>
              </div>
              
              {/* Toast notifications */}
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#363636',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#ffffff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#ffffff',
                    },
                  },
                }}
              />
              
              {/* Analytics (only in production) */}
              {process.env.NODE_ENV === 'production' && <Analytics />}
            </MapProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
