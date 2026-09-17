"use client";

import { Building2, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddBankDialog } from "@/components/add-bank-dialog";
import { type Bank, deleteBank } from "@/services/banks";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface BankAccountsListProps {
  banks: Bank[];
  bankBalances: Record<string, number>;
}

export function BankAccountsList({ banks, bankBalances }: BankAccountsListProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleDeleteBank = async (bankId: string) => {
    if (!user) return;
    if (!confirm("Tem certeza que deseja excluir este banco?")) return;
    
    try {
      await deleteBank(user.uid, bankId);
      toast({
        title: "Sucesso!",
        description: "Banco removido com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao remover banco.",
      });
    }
  };

  return (
    <Card className="col-span-full mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold font-headline flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Minhas Contas
        </CardTitle>
        <AddBankDialog>
          <Button variant="outline" size="sm">
            <PlusCircle className="w-4 h-4 mr-2" />
            Adicionar Banco
          </Button>
        </AddBankDialog>
      </CardHeader>
      <CardContent>
        {banks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <p>Você ainda não cadastrou nenhuma conta.</p>
            <p className="text-sm">Cadastre seus bancos para controlar o saldo individualmente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
            {banks.map((bank) => (
              <Card key={bank.id} className="relative group overflow-hidden border-border/50 bg-card hover:bg-accent/5 transition-colors">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg truncate pr-6" title={bank.name}>{bank.name}</h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-3 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteBank(bank.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className={`text-2xl font-bold tracking-tight ${bankBalances[bank.id] < 0 ? 'text-destructive' : ''}`}>
                    {formatCurrency(bankBalances[bank.id] || 0)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
