"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getBanks, type Bank } from "@/services/banks";
import { getTransactions, deleteTransaction, type Transaction } from "@/services/transactions";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Trash2,
  Building2,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

const categoryLabels: Record<string, string> = {
  food: "Alimentação", transport: "Transporte", shopping: "Compras",
  housing: "Moradia", bills: "Contas e Serviços", leisure: "Lazer",
  health: "Saúde", education: "Educação", salary: "Salário",
  investment: "Investimentos", gift: "Presente", extra: "Renda Extra", other: "Outros",
};

export default function BankDetailPage() {
  const { bankId } = useParams<{ bankId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [bank, setBank] = useState<Bank | null>(null);
  const [allBanks, setAllBanks] = useState<Bank[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = getBanks(user.uid, (banks) => {
      setAllBanks(banks);
      const found = banks.find((b) => b.id === bankId);
      setBank(found || null);
    });
    return () => unsub();
  }, [user, bankId]);

  useEffect(() => {
    if (!user) return;
    const unsub = getTransactions(user.uid, (txns) => {
      const filtered = txns.filter((t) => t.bankId === bankId);
      setTransactions(filtered);
      setLoading(false);
    });
    return () => unsub();
  }, [user, bankId]);

  const bankIndex = allBanks.findIndex((b) => b.id === bankId);
  const colorClass = BANK_COLORS[bankIndex >= 0 ? bankIndex % BANK_COLORS.length : 0];

  // Calcular saldo atual
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const currentBalance = (bank?.initialBalance || 0) + totalIncome - totalExpense;

  // Receitas e despesas do mês atual
  const now = new Date();
  const monthTransactions = transactions.filter((t) => {
    const date = t.date instanceof Timestamp ? t.date.toDate() : new Date(t.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const monthIncome = monthTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const handleDelete = async (txId: string) => {
    if (!user) return;
    if (!confirm("Excluir esta transação?")) return;
    try {
      await deleteTransaction(user.uid, txId);
      toast({ title: "Transação excluída." });
    } catch {
      toast({ variant: "destructive", title: "Erro ao excluir transação." });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Building2 className="w-12 h-12 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">Conta não encontrada.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Painel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb / Voltar */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => router.push("/dashboard")} className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Painel
        </button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{bank.name}</span>
      </div>

      {/* Header da conta */}
      <div className={cn("rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg", colorClass)}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1 opacity-80">
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-medium">Conta Bancária</span>
            </div>
            <h1 className="text-2xl font-bold mb-3">{bank.name}</h1>
            <p className="text-sm opacity-70">Saldo Atual</p>
            <p className="text-4xl font-bold tracking-tight">{formatCurrency(currentBalance)}</p>
            <p className="text-sm opacity-60 mt-1">
              Saldo inicial: {formatCurrency(bank.initialBalance || 0)}
            </p>
          </div>
          <AddTransactionDialog>
            <Button variant="secondary" size="sm" className="shrink-0">
              <PlusCircle className="w-4 h-4 mr-2" />
              Nova Transação
            </Button>
          </AddTransactionDialog>
        </div>
      </div>

      {/* Cards do mês */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receitas (mês)</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(monthIncome)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Despesas (mês)</p>
              <p className="text-xl font-bold text-destructive">{formatCurrency(monthExpense)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de transações */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Transações desta conta</CardTitle>
          <span className="text-sm text-muted-foreground">{transactions.length} transação(ões)</span>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <Building2 className="w-10 h-10 opacity-30" />
              <p className="text-sm">Nenhuma transação vinculada a esta conta.</p>
              <AddTransactionDialog>
                <Button variant="outline" size="sm" className="mt-2">
                  <PlusCircle className="w-4 h-4 mr-2" /> Adicionar transação
                </Button>
              </AddTransactionDialog>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((txn) => {
                const date = txn.date instanceof Timestamp ? txn.date.toDate() : new Date(txn.date);
                return (
                  <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-full", txn.type === "income" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30")}>
                        {txn.type === "income"
                          ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                          : <TrendingDown className="w-3.5 h-3.5 text-destructive" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{txn.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {format(date, "dd 'de' MMM, yyyy", { locale: ptBR })}
                          </span>
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {categoryLabels[txn.category] || txn.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold text-sm", txn.type === "income" ? "text-emerald-600" : "text-destructive")}>
                        {txn.type === "income" ? "+" : "-"}{formatCurrency(txn.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(txn.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
