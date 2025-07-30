
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
  Shield,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/transactions", label: "Gastos Diários", icon: ArrowRightLeft, requiredPlan: "bronze" },
  { href: "/fixed-income", label: "Ganhos Fixos", icon: CalendarClock, requiredPlan: "bronze" },
  { href: "/extra-income", label: "Ganhos Extras", icon: Gift, requiredPlan: "bronze" },
  { href: "/fixed-expenses", label: "Despesas Fixas", icon: Repeat, requiredPlan: "bronze" },
  { href: "/installments", label: "Contas Parceladas", icon: CreditCard, requiredPlan: "bronze" },
  { href: "/bills", label: "Boletos", icon: Barcode, requiredPlan: "bronze" },
  { href: "/budgets", label: "Orçamentos", icon: Target, requiredPlan: "bronze" },
  { href: "/dreams", label: "Meus Sonhos", icon: Trophy, requiredPlan: "bronze" },
  { href: "/reports", label: "Relatórios", icon: BarChart3, requiredPlan: "bronze" },
  { href: "/invest", label: "Investimentos", icon: Landmark, requiredPlan: "prata" },
  { href: "/analysis", label: "Análise Financeira", icon: Sparkles, requiredPlan: "prata" },
  { href: "/settings", label: "Configurações", icon: Settings },
];

const adminNavItem = { href: "/admin", label: "Admin", icon: Shield, admin: true };

const planLevels: { [key: string]: number } = {
  none: 0,
  bronze: 1,
  prata: 2,
  ouro: 3,
};

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const allNavItems = [...navItems, adminNavItem];

  const userPlanLevel = planLevels[user?.plan || 'none'] || 0;

  return (
    <SidebarMenu className="flex-1 p-2">
      {allNavItems.map((item) => {
        
        // Verifica se o item é administrativo e se o usuário não é admin. Se for o caso, não renderiza.
        if (item.admin && !user?.isAdmin) {
          return null;
        }
        
        let isDisabled = false;
        let tooltip = item.label;

        // Se não for um item de admin, verifica as permissões de plano
        if (!item.admin && 'requiredPlan' in item && item.requiredPlan) {
            const requiredPlanLevel = planLevels[item.requiredPlan];

            if (userPlanLevel < requiredPlanLevel) {
                isDisabled = true;
                tooltip = `${item.label} (Plano ${item.requiredPlan} ou superior)`;
            }
        }
        
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
