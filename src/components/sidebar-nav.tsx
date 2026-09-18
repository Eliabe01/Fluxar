
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
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
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const essentialItems = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/transactions", label: "Gastos Diários", icon: ArrowRightLeft, requiredPlan: "bronze" },
  { href: "/bills", label: "Boletos", icon: Barcode, requiredPlan: "bronze" },
  { href: "/budgets", label: "Orçamentos", icon: Target, requiredPlan: "bronze" },
  { href: "/reports", label: "Relatórios", icon: BarChart3, requiredPlan: "bronze" },
];

const financeItems = [
  { href: "/fixed-income", label: "Ganhos Fixos", icon: CalendarClock, requiredPlan: "prata" },
  { href: "/extra-income", label: "Ganhos Extras", icon: Gift, requiredPlan: "prata" },
  { href: "/fixed-expenses", label: "Despesas Fixas", icon: Repeat, requiredPlan: "prata" },
  { href: "/installments", label: "Contas Parceladas", icon: CreditCard, requiredPlan: "prata" },
];

const planningItems = [
  { href: "/dreams", label: "Meus Sonhos", icon: Trophy, requiredPlan: "prata" },
  { href: "/analysis", label: "Análise Financeira", icon: Sparkles, requiredPlan: "prata" },
  { href: "/invest", label: "Investimentos", icon: Landmark, requiredPlan: "ouro" },
];

const planLevels: { [key: string]: number } = {
  none: 0, bronze: 1, prata: 2, ouro: 3,
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPlan?: string;
};

function NavItemsList({ items, userPlanLevel, pathname }: { items: NavItem[]; userPlanLevel: number; pathname: string }) {
  return (
    <>
      {items.map((item) => {
        let isDisabled = false;
        let tooltip = item.label;

        if (item.requiredPlan) {
          const requiredLevel = planLevels[item.requiredPlan];
          if (userPlanLevel < requiredLevel) {
            isDisabled = true;
            tooltip = `${item.label} (Plano ${item.requiredPlan} ou superior)`;
          }
        }

        const isActive = item.href === "/dashboard"
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={tooltip}
              disabled={isDisabled}
              aria-disabled={isDisabled}
              className="rounded-full transition-all duration-200 ease-in-out font-medium tracking-tight"
            >
              <Link href={isDisabled ? "#" : item.href} className={isDisabled ? "pointer-events-none" : ""}>
                <item.icon className="w-[18px] h-[18px]" />
                <span className="text-[15px]">{item.label}</span>
              </Link>
            </SidebarMenuButton>

          </SidebarMenuItem>
        );
      })}
    </>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const userPlanLevel = planLevels[user?.plan || "none"] || 0;

  return (
    <div className="flex flex-col gap-2 p-3 flex-1">
      {/* Visão Geral */}
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Visão Geral</SidebarGroupLabel>
        <SidebarMenu>
          <NavItemsList items={essentialItems} userPlanLevel={userPlanLevel} pathname={pathname} />
        </SidebarMenu>
      </SidebarGroup>

      {/* Contas */}
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Contas</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/banks")}
              tooltip="Minhas Contas"
              className="rounded-full transition-all duration-200 ease-in-out font-medium tracking-tight"
            >
              <Link href="/dashboard">
                <Wallet className="w-[18px] h-[18px]" />
                <span className="text-[15px]">Minhas Contas</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      {/* Finanças */}
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Finanças</SidebarGroupLabel>
        <SidebarMenu>
          <NavItemsList items={financeItems} userPlanLevel={userPlanLevel} pathname={pathname} />
        </SidebarMenu>
      </SidebarGroup>

      {/* Planejamento */}
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Planejamento</SidebarGroupLabel>
        <SidebarMenu>
          <NavItemsList items={planningItems} userPlanLevel={userPlanLevel} pathname={pathname} />
        </SidebarMenu>
      </SidebarGroup>

      {/* Sistema */}
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Sistema</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/settings"} tooltip="Configurações" className="rounded-full transition-all duration-200 ease-in-out font-medium tracking-tight">
              <Link href="/settings">
                <Settings className="w-[18px] h-[18px]" />
                <span className="text-[15px]">Configurações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {user?.isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/admin"} tooltip="Admin" className="rounded-full transition-all duration-200 ease-in-out font-medium tracking-tight">
                <Link href="/admin">
                  <Shield className="w-[18px] h-[18px]" />
                  <span className="text-[15px]">Admin</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroup>

    </div>
  );
}
