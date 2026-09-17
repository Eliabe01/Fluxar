
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
import { UserNav } from "@/components/user-nav";
import { SubscriptionOverlay } from "./subscription-overlay";

function FluxarLogo({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
        </svg>
    );
}


function Logo() {
  return (
    <a
      href="/dashboard"
      className="flex items-center gap-3"
      aria-label="Back to homepage"
    >
      <div className="bg-sidebar-primary flex h-8 w-8 items-center justify-center rounded-lg">
        <FluxarLogo className="h-5 w-5 text-sidebar-primary-foreground" />
      </div>
      <span className="text-xl font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
        Fluxar
      </span>
    </a>
  );
}

const pageTitles: { [key: string]: string } = {
  '/': 'Painel',
  '/dashboard': 'Painel',
  '/transactions': 'Gastos Diários',
  '/fixed-income': 'Ganhos Fixos',
  '/extra-income': 'Ganhos Extras',
  '/fixed-expenses': 'Despesas Fixas',
  '/installments': 'Contas Parceladas',
  '/bills': 'Boletos',
  '/reports': 'Relatórios',
  '/budgets': 'Orçamentos',
  '/dreams': 'Meus Sonhos',
  '/invest': 'Investimentos',
  '/analysis': 'Análise Financeira',
  '/settings': 'Configurações',
  '/admin': 'Administração',
};

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  let pageTitle = pageTitles[pathname] || 'Painel';
  if (pathname.startsWith('/installments/') && pathname !== '/installments') {
    pageTitle = 'Detalhes do Cartão';
  }

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-background/60 px-4 backdrop-blur-md md:px-6 transition-all">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <h1 className="font-headline text-lg md:text-xl font-bold tracking-tight text-foreground/90">{pageTitle}</h1>
          </div>
          <UserNav />
        </header>
        <main className="relative flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <SubscriptionOverlay />
            {children}
        </main>
      </SidebarInset>
    </>
  );
}
