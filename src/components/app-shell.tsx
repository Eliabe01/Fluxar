
"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { MainLayout } from '@/components/main-layout';
import { FullScreenLoader } from './full-screen-loader';
import React, { useEffect } from 'react';
import { SidebarProvider } from './ui/sidebar';

const publicPages = ['/', '/login', '/signup'];
const loggedInRedirectPages = ['/login', '/signup'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    const isPublicPage = publicPages.includes(pathname);
    const isRedirectPageForLoggedInUser = loggedInRedirectPages.includes(pathname);

    if (!user && !isPublicPage) {
      router.push('/login');
    } else if (user && isRedirectPageForLoggedInUser) {
      router.push('/dashboard');
    }
  }, [user, authLoading, pathname, router]);

  if (authLoading) {
    return <FullScreenLoader />;
  }
  
  // A landing page (/) é sempre pública
  if (pathname === '/') {
      return <>{children}</>;
  }

  // Se o usuário não estiver logado, mas está numa página pública (login/signup), renderiza a página.
  if (!user && publicPages.includes(pathname)) {
      return <>{children}</>;
  }

  // Se o usuário estiver logado, renderiza o layout principal.
  if (user) {
      return (
        <SidebarProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </SidebarProvider>
      );
  }

  // Caso padrão, mostra o loader (geralmente durante transições de rota)
  return <FullScreenLoader />;
}
