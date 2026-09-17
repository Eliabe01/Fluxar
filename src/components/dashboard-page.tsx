"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { StatCard } from "./dashboard/stat-card";
import { FinancialReportChart } from "./dashboard/financial-report-chart";
import { BudgetProgress } from "./dashboard/budget-progress";
import { RecentTransactions } from "./dashboard/recent-transactions";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { BankAccountsList } from "./dashboard/bank-accounts-list";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, Timestamp } from "firebase/firestore";
import type { Transaction } from "@/services/transactions";
import { getBanks, type Bank } from "@/services/banks";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function DashboardPage() {
  const { user } = useAuth();
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankBalances, setBankBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribeBanks = getBanks(user.uid, (fetchedBanks) => {
      setBanks(fetchedBanks);
    });

    return () => unsubscribeBanks();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, "users", user.uid, "transactions"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        let totalIncome = 0;
        let totalExpenses = 0;
        let currentMonthIncome = 0;
        let currentMonthExpenses = 0;
        
        // Inicializar saldos dos bancos com seus saldos iniciais
        const currentBankBalances: Record<string, number> = {};
        let initialBalancesTotal = 0;
        
        banks.forEach(bank => {
          currentBankBalances[bank.id] = bank.initialBalance || 0;
          initialBalancesTotal += (bank.initialBalance || 0);
        });

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        querySnapshot.forEach((doc) => {
          const transaction = doc.data() as Transaction;
          const transactionDate =
            transaction.date instanceof Timestamp
              ? transaction.date.toDate()
              : new Date(transaction.date);

          if (transaction.type === "income") {
            totalIncome += transaction.amount;
            if (transaction.bankId && currentBankBalances[transaction.bankId] !== undefined) {
              currentBankBalances[transaction.bankId] += transaction.amount;
            }
            if (
              transactionDate.getMonth() === currentMonth &&
              transactionDate.getFullYear() === currentYear
            ) {
              currentMonthIncome += transaction.amount;
            }
          } else {
            // 'expense'
            totalExpenses += transaction.amount;
            if (transaction.bankId && currentBankBalances[transaction.bankId] !== undefined) {
              currentBankBalances[transaction.bankId] -= transaction.amount;
            }
            if (
              transactionDate.getMonth() === currentMonth &&
              transactionDate.getFullYear() === currentYear
            ) {
              currentMonthExpenses += transaction.amount;
            }
          }
        });

        setBankBalances(currentBankBalances);
        // Saldo total = (Soma dos saldos iniciais) + (Receitas - Despesas)
        setTotalBalance(initialBalancesTotal + totalIncome - totalExpenses);
        setMonthlyIncome(currentMonthIncome);
        setMonthlyExpenses(currentMonthExpenses);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching financial data: ", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, banks]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Bem-vindo de volta{user?.displayName ? `, ${user.displayName}` : ''}!
        </h1>
        <AddTransactionDialog>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Transação
          </Button>
        </AddTransactionDialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Saldo Total"
          value={formatCurrency(totalBalance)}
          icon="wallet"
          loading={loading}
          valueClassName={cn(totalBalance < 0 && "text-destructive")}
        />
        <StatCard
          title="Receitas (Mês)"
          value={formatCurrency(monthlyIncome)}
          icon="trending-up"
          loading={loading}
        />
        <StatCard
          title="Despesas (Mês)"
          value={formatCurrency(monthlyExpenses)}
          icon="trending-down"
          loading={loading}
          valueClassName="text-destructive"
        />
      </div>

      <BankAccountsList banks={banks} bankBalances={bankBalances} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 mt-6">
        <div className="lg:col-span-3">
          <FinancialReportChart />
        </div>
        <div className="lg:col-span-2">
          <BudgetProgress />
        </div>
      </div>

      <div>
        <RecentTransactions />
      </div>
    </div>
  );
}
