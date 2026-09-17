"use client";

import { useState } from "react";
import { PlusCircle, Trash2, TrendingUp, TrendingDown, Wallet, ChevronRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AddBankDialog } from "@/components/add-bank-dialog";
import { type Bank, deleteBank } from "@/services/banks";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getBankInitials, getBankConfig } from "@/lib/banks-config";

interface BankAccountsListProps {
  banks: Bank[];
  bankBalances: Record<string, number>;
}

const BANK_COLORS = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700",
  "from-orange-500 to-orange-700",
  "from-rose-500 to-rose-700",
  "from-cyan-500 to-cyan-700",
  "from-amber-500 to-amber-700",
  "from-indigo-500 to-indigo-700",
];

function BankIcon({ bank, className }: { bank: Bank; className?: string }) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = bank.logoUrl || getBankConfig(bank.name)?.logoUrl;

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={bank.name}
        className={cn("rounded-lg object-contain bg-white p-0.5", className)}
        onError={() => setImgError(true)}
      />
    );
  }

  const initials = getBankInitials(bank.name);
  const bgColor = bank.color || getBankConfig(bank.name)?.color || '#6366f1';
  return (
    <div
      className={cn("rounded-lg flex items-center justify-center font-bold text-white text-xs", className)}
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  );
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function BankAccountsList({ banks, bankBalances }: BankAccountsListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const totalAcrossAllBanks = banks.reduce(
    (sum, bank) => sum + (bankBalances[bank.id] || 0),
    0
  );

  const handleDeleteBank = async (e: React.MouseEvent, bankId: string) => {
    e.stopPropagation(); // Evita navegar ao clicar em excluir
    if (!user) return;
    if (!confirm("Tem certeza que deseja excluir este banco? As transações vinculadas não serão apagadas.")) return;
    try {
      await deleteBank(user.uid, bankId);
      toast({ title: "Banco removido com sucesso." });
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao remover banco." });
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Wallet className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold font-headline">Minhas Contas</h2>
          {banks.length > 0 && (
            <span className="text-sm text-muted-foreground">
              · Total:{" "}
              <span className={cn("font-semibold", totalAcrossAllBanks < 0 ? "text-destructive" : "text-foreground")}>
                {formatCurrency(totalAcrossAllBanks)}
              </span>
            </span>
          )}
        </div>
        <AddBankDialog>
          <Button variant="outline" size="sm">
            <PlusCircle className="w-4 h-4 mr-2" />
            Adicionar Conta
          </Button>
        </AddBankDialog>
      </div>

      {/* Estado vazio */}
      {banks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-2">
            <Building2 className="w-10 h-10 opacity-30" />
            <p className="font-medium">Nenhuma conta cadastrada</p>
            <p className="text-sm">Adicione seus bancos ou carteiras para acompanhar o saldo de cada um.</p>
            <AddBankDialog>
              <Button variant="outline" size="sm" className="mt-2">
                <PlusCircle className="w-4 h-4 mr-2" />
                Adicionar primeira conta
              </Button>
            </AddBankDialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {banks.map((bank, index) => {
            const balance = bankBalances[bank.id] || 0;
            const diff = balance - (bank.initialBalance || 0);
            const colorClass = BANK_COLORS[index % BANK_COLORS.length];

            return (
              <Card
                key={bank.id}
                className="relative group overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5"
                onClick={() => router.push(`/banks/${bank.id}`)}
              >
                {/* Faixa colorida no topo com a cor da marca */}
                {(() => {
                  const brandColor = bank.color || getBankConfig(bank.name)?.color;
                  return brandColor ? (
                    <div className="h-1.5 w-full" style={{ backgroundColor: brandColor }} />
                  ) : (
                    <div className={cn("h-1.5 w-full bg-gradient-to-r", colorClass)} />
                  );
                })()}
                <CardContent className="p-5">
                  {/* Nome + botão deletar */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <BankIcon bank={bank} className="w-9 h-9 shrink-0" />
                      <h3 className="font-semibold text-sm truncate max-w-[100px]" title={bank.name}>
                        {bank.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDeleteBank(e, bank.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Saldo atual */}
                  <p className={cn("text-2xl font-bold tracking-tight", balance < 0 ? "text-destructive" : "text-foreground")}>
                    {formatCurrency(balance)}
                  </p>

                  {/* Variação */}
                  {diff !== 0 && (
                    <div className={cn("flex items-center gap-1 mt-1 text-xs", diff > 0 ? "text-emerald-600" : "text-destructive")}>
                      {diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{diff > 0 ? "+" : ""}{formatCurrency(diff)}</span>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-1">
                    Inicial: {formatCurrency(bank.initialBalance || 0)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
