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
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { addBank, type NewBank } from '@/services/banks';
import { useAuth } from '@/lib/auth';

const bankFormSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  initialBalance: z.coerce.number({ message: "Por favor, insira um valor numérico válido." }),
});

type BankFormValues = z.infer<typeof bankFormSchema>;

export function AddBankDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<BankFormValues>({
    resolver: zodResolver(bankFormSchema),
    defaultValues: {
      name: "",
      initialBalance: 0,
    },
  });

  async function onSubmit(data: BankFormValues) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Erro de Autenticação",
        description: "Você precisa estar logado para adicionar um banco.",
      });
      return;
    }
    setIsSaving(true);
    try {
      await addBank(user.uid, data as NewBank);
      toast({
        title: "Sucesso!",
        description: "Banco adicionado com sucesso.",
      });
      form.reset({
        name: "",
        initialBalance: 0,
      });
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao salvar o banco.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) {
          form.reset({
            name: "",
            initialBalance: 0,
          });
      }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Banco / Carteira</DialogTitle>
          <DialogDescription>
            Insira os detalhes da sua nova conta bancária ou carteira digital.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Banco (ex: PicPay, Bradesco)</FormLabel>
                  <FormControl>
                    <Input placeholder="PicPay" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="initialBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Atual</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="R$ 0,00" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Banco
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
