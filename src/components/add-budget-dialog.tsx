"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { addBudget, updateBudget, type NewBudget, type Budget } from '@/services/budgets';
import { useAuth } from '@/lib/auth';

const budgetFormSchema = z.object({
  category: z.string().min(1, { message: "Por favor, selecione uma categoria." }),
  amount: z.coerce.number().positive({ message: "Por favor, insira um valor positivo." }),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

const expenseCategories = {
  food: 'Alimentação',
  transport: 'Transporte',
  shopping: 'Compras',
  housing: 'Moradia',
  bills: 'Contas e Serviços',
  leisure: 'Lazer',
  health: 'Saúde',
  education: 'Educação',
  other: 'Outros'
};

interface AddBudgetDialogProps {
  children: React.ReactNode;
  budget?: Budget; // For editing
  month: string; // YYYY-MM
}

export function AddBudgetDialog({ children, budget, month }: AddBudgetDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const isEditing = !!budget;

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
  });
  
  useEffect(() => {
    if (budget) {
        form.reset({
            category: budget.category,
            amount: budget.amount,
        });
    } else {
        form.reset({
            category: '',
            amount: undefined,
        });
    }
  }, [budget, form]);

  async function onSubmit(data: BudgetFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Erro", description: "Você precisa estar logado." });
      return;
    }
    setIsSaving(true);
    try {
      if (isEditing && budget) {
        await updateBudget(user.uid, budget.id, { amount: data.amount, category: data.category });
        toast({ title: "Sucesso!", description: "Orçamento atualizado." });
      } else {
        const newBudget: NewBudget = {
          ...data,
          month: month
        };
        await addBudget(user.uid, newBudget);
        toast({ title: "Sucesso!", description: "Orçamento adicionado." });
      }
      form.reset({ category: '', amount: undefined });
      setOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar o orçamento.",
      });
    } finally {
      setIsSaving(false);
    }
  }
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset({ category: '', amount: undefined });
    } else if(budget) {
       form.reset({
            category: budget.category,
            amount: budget.amount,
        });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Orçamento' : 'Adicionar Orçamento'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize o valor do seu orçamento.' : 'Defina um novo limite de gastos para uma categoria.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(expenseCategories).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Orçamento</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="R$ 500,00"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
