"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction } from "@/services/transactions";
import { cn } from "@/lib/utils";
import { ArrowRightLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TransactionListProps {
    transactions: Transaction[];
    loading: boolean;
}

const categoryLabels: { [key: string]: string } = {
  food: 'Alimentação',
  transport: 'Transporte',
  shopping: 'Compras',
  housing: 'Moradia',
  bills: 'Contas e Serviços',
  leisure: 'Lazer',
  health: 'Saúde',
  education: 'Educação',
  salary: 'Salário',
  other: 'Outros'
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
};

const formatDate = (date: Date) => {
    if (!date || !(date instanceof Date)) return '';
    return date.toLocaleDateString('pt-BR');
};

export function TransactionList({ transactions, loading }: TransactionListProps) {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
                <CardDescription>Todas as transações do período selecionado.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                 {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex h-full min-h-[250px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 text-center">
                       <ArrowRightLeft className="h-10 w-10 text-muted-foreground" />
                       <p className="mt-4 text-sm text-muted-foreground">
                         Nenhuma transação encontrada neste período.
                       </p>
                    </div>
                ) : (
                    <ScrollArea className="h-[350px]">
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell>{formatDate(t.date as Date)}</TableCell>
                                        <TableCell className="font-medium">{t.description}</TableCell>
                                        <TableCell>{categoryLabels[t.category] || t.category}</TableCell>
                                        <TableCell className={cn(
                                            "text-right font-medium",
                                            t.type === "income" ? "text-success" : "text-destructive"
                                        )}>
                                            {t.type === "expense" ? '-' : '+'} {formatCurrency(t.amount)}
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
