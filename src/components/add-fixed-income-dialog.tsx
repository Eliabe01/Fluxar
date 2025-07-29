
"use client";

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { addFixedIncome, type NewFixedIncome } from '@/services/fixed-income';
import { useAuth } from '@/lib/auth';

const fixedIncomeFormSchema = z.object({
  description: z.string().min(2, {
    message: "A descrição deve ter pelo menos 2 caracteres.",
  }),
  amount: z.coerce.number().positive({ message: "Por favor, insira um valor positivo." }),
  frequency: z.enum(['monthly', 'fortnightly'], {
    required_error: "A frequência é obrigatória.",
  }),
});

type FixedIncomeFormValues = z.infer<typeof fixedIncomeFormSchema>;

export function AddFixedIncomeDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FixedIncomeFormValues>({
    resolver: zodResolver(fixedIncomeFormSchema),
    defaultValues: {
      description: "",
      amount: undefined,
      frequency: "monthly",
    },
  });

  async function onSubmit(data: FixedIncomeFormValues) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Erro de Autenticação",
        description: "Você precisa estar logado para adicionar um ganho.",
      });
      return;
    }
    setIsSaving(true);
    try {
      await addFixedIncome(user.uid, data as NewFixedIncome);
      toast({
        title: "Sucesso!",
        description: "Ganho fixo adicionado com sucesso.",
      });
      form.reset({ description: "", amount: undefined, frequency: 'monthly' });
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao salvar o ganho fixo.",
      });
    } finally {
      setIsSaving(false);
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
            form.reset({ description: "", amount: undefined, frequency: 'monthly' });
        }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Ganho Fixo</DialogTitle>
          <DialogDescription>
            Insira os detalhes do seu ganho recorrente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Salário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="R$ 0,00" 
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Mensalmente</SelectItem>
                        <SelectItem value="fortnightly">Quinzenalmente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Ganho
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
