"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from '@/hooks/use-toast';
import { addTransaction, type NewTransaction } from '@/services/transactions';
import { getBanks, type Bank } from '@/services/banks';
import { useAuth } from '@/lib/auth';

const transactionFormSchema = z.object({
  type: z.enum(["income", "expense"], {
    required_error: "Você precisa selecionar um tipo de transação.",
  }),
  amount: z.coerce.number().positive({ message: "Por favor, insira um valor positivo." }),
  category: z.string({
    required_error: "Por favor, selecione uma categoria.",
  }).min(1, "Por favor, selecione uma categoria."),
  date: z.date({
    required_error: "A data é obrigatória.",
  }),
  description: z.string().min(2, {
    message: "A descrição deve ter pelo menos 2 caracteres.",
  }),
  bankId: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

const expenseCategories = {
    food: "Alimentação",
    transport: "Transporte",
    shopping: "Compras",
    housing: "Moradia",
    bills: "Contas e Serviços",
    leisure: "Lazer",
    health: "Saúde",
    education: "Educação",
    other: "Outros",
};

const incomeCategories = {
    salary: "Salário",
    investment: "Investimentos",
    gift: "Presente",
    extra: "Renda Extra",
    other: "Outros",
};


export function AddTransactionDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      description: "",
      type: "expense",
      date: new Date(),
      category: "",
      amount: undefined,
      bankId: undefined,
    },
  });
  
  const transactionType = form.watch("type");

  useEffect(() => {
    form.resetField('category');
  }, [transactionType, form]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = getBanks(user.uid, (fetchedBanks) => {
      setBanks(fetchedBanks);
    });
    return () => unsubscribe();
  }, [user]);

  const categories = transactionType === 'income' ? incomeCategories : expenseCategories;

  async function onSubmit(data: TransactionFormValues) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Erro de Autenticação",
        description: "Você precisa estar logado para adicionar uma transação.",
      });
      return;
    }
    setIsSaving(true);
    try {
      // Remove bankId se não foi selecionado (Firestore não aceita undefined)
      const transactionData: NewTransaction = {
        type: data.type,
        amount: data.amount,
        category: data.category,
        date: data.date,
        description: data.description,
        ...(data.bankId ? { bankId: data.bankId } : {}),
      };
      await addTransaction(user.uid, transactionData);
      toast({
        title: "Sucesso!",
        description: "Transação adicionada com sucesso.",
      });
      form.reset({
        description: "",
        type: "expense",
        date: new Date(),
        category: "",
        amount: undefined,
        bankId: undefined,
      });
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao salvar a transação.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) {
          form.reset({
            description: "",
            type: "expense",
            date: new Date(),
            category: "",
            amount: undefined,
            bankId: undefined,
          });
      }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Transação</DialogTitle>
          <DialogDescription>
            Insira os detalhes da sua nova transação abaixo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Transação</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="expense" />
                        </FormControl>
                        <FormLabel className="font-normal">Despesa</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="income" />
                        </FormControl>
                        <FormLabel className="font-normal">Receita</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="R$ 0,00" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {banks.length > 0 && (
              <FormField
                control={form.control}
                name="bankId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta / Banco (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um banco" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {banks.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>{bank.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(categories).map(([key, value]) => (
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
              name="description"
              render={({ field }) => {
                // Efeito de Auto-Categorização (Smart Categorization)
                const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const val = e.target.value;
                  field.onChange(e); // Mantém o comportamento original do React Hook Form

                  const lowerVal = val.toLowerCase();
                  
                  // Mapeamento de palavras-chave inteligentes
                  const keywords: Record<string, { type: 'income' | 'expense', category: string }> = {
                    // Alimentação
                    'ifood': { type: 'expense', category: 'food' },
                    'mcdonald': { type: 'expense', category: 'food' },
                    'mac': { type: 'expense', category: 'food' },
                    'bk': { type: 'expense', category: 'food' },
                    'pizza': { type: 'expense', category: 'food' },
                    'padaria': { type: 'expense', category: 'food' },
                    'mercado': { type: 'expense', category: 'food' },
                    'supermercado': { type: 'expense', category: 'food' },
                    'lanche': { type: 'expense', category: 'food' },
                    'restaurante': { type: 'expense', category: 'food' },
                    // Transporte
                    'uber': { type: 'expense', category: 'transport' },
                    '99': { type: 'expense', category: 'transport' },
                    'indrive': { type: 'expense', category: 'transport' },
                    'posto': { type: 'expense', category: 'transport' },
                    'gasolina': { type: 'expense', category: 'transport' },
                    'passagem': { type: 'expense', category: 'transport' },
                    'onibus': { type: 'expense', category: 'transport' },
                    // Contas
                    'luz': { type: 'expense', category: 'bills' },
                    'agua': { type: 'expense', category: 'bills' },
                    'internet': { type: 'expense', category: 'bills' },
                    'aluguel': { type: 'expense', category: 'housing' },
                    'condominio': { type: 'expense', category: 'housing' },
                    'celular': { type: 'expense', category: 'bills' },
                    // Compras
                    'shopee': { type: 'expense', category: 'shopping' },
                    'shein': { type: 'expense', category: 'shopping' },
                    'amazon': { type: 'expense', category: 'shopping' },
                    'mercado livre': { type: 'expense', category: 'shopping' },
                    'roupa': { type: 'expense', category: 'shopping' },
                    // Saúde
                    'farmacia': { type: 'expense', category: 'health' },
                    'remedio': { type: 'expense', category: 'health' },
                    'medico': { type: 'expense', category: 'health' },
                    'consulta': { type: 'expense', category: 'health' },
                    // Receitas
                    'salario': { type: 'income', category: 'salary' },
                    'pagamento': { type: 'income', category: 'salary' },
                    'adiantamento': { type: 'income', category: 'salary' },
                    'rendimento': { type: 'income', category: 'investment' },
                  };

                  // Procura se alguma palavra chave foi digitada inteira ou contida no texto
                  for (const [key, mapping] of Object.entries(keywords)) {
                    if (lowerVal.includes(key)) {
                      const currentType = form.getValues('type');
                      // Se o tipo sugerido for diferente, atualiza o tipo primeiro para não quebrar a lista de categorias
                      if (currentType !== mapping.type) {
                        form.setValue('type', mapping.type);
                      }
                      // Atualiza a categoria logo depois
                      setTimeout(() => form.setValue('category', mapping.category), 0);
                      break; // Aplica só a primeira que encontrar
                    }
                  }
                };

                return (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Corrida de Uber (auto-preenche Categoria)" {...field} onChange={handleChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Transação</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar transação
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

