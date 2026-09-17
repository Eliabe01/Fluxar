import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/lib/auth';
import { AppShell } from '@/components/app-shell';

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Fluxar',
  description: 'Conduza seu dinheiro. Realize seus sonhos.',
  icons: {
    icon: 'https://i.imgur.com/P3aG2q7.ico?v=2',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} font-sans antialiased bg-background text-foreground`}>
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}