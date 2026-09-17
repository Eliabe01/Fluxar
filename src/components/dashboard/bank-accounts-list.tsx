"use client";

import { Building2, PlusCircle, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddBankDialog } from "@/components/add-bank-dialog";
import { type Bank, deleteBank } from "@/services/banks";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function BankAccountsList({ banks, bankBalances }: BankAccountsListProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const totalAcrossAllBanks = banks.reduce(
    (sum, bank) => sum + (bankBalances[bank.id] || 0),
    0
  );

  const handleDeleteBank = async (bankId: string) => {
    if (!user) return;
    if (!confirm("Tem certeza que deseja excluir este banco? As transações vinculadas a ele não serão apagadas.")) return;
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
        <div className="flex items-center gap-2">
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

      {/* Lista de bancos */}
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
              <Card key={bank.id} className="relative group overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Faixa colorida no topo */}
                <div className={cn("h-1.5 w-full bg-gradient-to-r", colorClass)} />
                <CardContent className="p-5">
                  {/* Nome + botão deletar */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("p-1.5 rounded-md bg-gradient-to-br text-white", colorClass)}>
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="font-semibold text-sm truncate max-w-[110px]" title={bank.name}>
                        {bank.name}
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteBank(bank.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Saldo atual */}
                  <p className={cn("text-2xl font-bold tracking-tight", balance < 0 ? "text-destructive" : "text-foreground")}>
                    {formatCurrency(balance)}
                  </p>

                  {/* Variação em relação ao saldo inicial */}
                  {diff !== 0 && (
                    <div className={cn("flex items-center gap-1 mt-1 text-xs", diff > 0 ? "text-emerald-600" : "text-destructive")}>
                      {diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{diff > 0 ? "+" : ""}{formatCurrency(diff)} desde o início</span>
                    </div>
                  )}

                  {/* Saldo inicial */}
                  <p className="text-xs text-muted-foreground mt-1">
                    Saldo inicial: {formatCurrency(bank.initialBalance || 0)}
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
