
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  ArrowRightLeft,
  BarChart3,
  Target,
  Settings,
  CalendarClock,
  Gift,
  CreditCard,
  Repeat,
  Sparkles,
  Barcode,
  Trophy,
  Landmark,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/transactions", label: "Gastos Diários", icon: ArrowRightLeft, premium: true },
  { href: "/fixed-income", label: "Ganhos Fixos", icon: CalendarClock, premium: true },
  { href: "/extra-income", label: "Ganhos Extras", icon: Gift, premium: true },
  { href: "/fixed-expenses", label: "Despesas Fixas", icon: Repeat, premium: true },
  { href: "/installments", label: "Contas Parceladas", icon: CreditCard, premium: true },
  { href: "/bills", label: "Boletos", icon: Barcode, premium: true },
  { href: "/budgets", label: "Orçamentos", icon: Target, premium: true },
  { href: "/dreams", label: "Meus Sonhos", icon: Trophy, premium: true },
  { href: "/invest", label: "Investimentos", icon: Landmark, premium: true },
  { href: "/reports", label: "Relatórios", icon: BarChart3, premium: true },
  { href: "/analysis", label: "Análise Financeira", icon: Sparkles, premium: true },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { subscription } = useAuth();
  const isSubscriptionActive = subscription?.status === 'active' || subscription?.status === 'trialing' || subscription?.status === 'past_due';

  return (
    <SidebarMenu className="flex-1 p-2">
      {navItems.map((item) => {
        const isDisabled = item.premium && !isSubscriptionActive;
        const tooltip = isDisabled ? `${item.label} (Requer plano ativo)` : item.label;

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)}
              tooltip={tooltip}
              disabled={isDisabled}
              aria-disabled={isDisabled}
            >
              <Link href={isDisabled ? '#' : item.href} className={isDisabled ? 'pointer-events-none' : ''}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
