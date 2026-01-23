import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { ConditionalNavigation } from '@/components/conditional-navigation';

// Force dynamic rendering to avoid static generation issues with Supabase env vars
export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HetheTrack - Mining Tenement Management',
  description: 'Comprehensive tenement management platform for Western Australia',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏢</text></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen">
            <ConditionalNavigation />
            <main>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
