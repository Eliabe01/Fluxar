
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
import { contributeToDream } from '@/actions/dreams';
import type { Dream } from '@/services/dreams';
import { useAuth } from '@/lib/auth';

const contributeSchema = (maxAmount: number) => z.object({
  amount: z.coerce.number()
    .positive({ message: "O valor deve ser positivo." })
    .max(maxAmount, { message: `O valor máximo para este sonho é ${maxAmount}.` }),
});


interface ContributeToDreamDialogProps {
  children: React.ReactNode;
  dream: Dream;
}

export function ContributeToDreamDialog({ children, dream }: ContributeToDreamDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const remainingAmount = dream.targetAmount - dream.currentAmount;

  const form = useForm<{ amount: number }>({
    resolver: zodResolver(contributeSchema(remainingAmount)),
  });

  async function onSubmit(data: { amount: number }) {
    if (!user) {
      toast({ variant: "destructive", title: "Erro", description: "Você precisa estar logado." });
      return;
    }
    setIsSaving(true);
    try {
      await contributeToDream(dream.id, data.amount);
      toast({ title: "Sucesso!", description: "Contribuição realizada!" });
      form.reset();
      setOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao Contribuir",
        description: error.message || "Ocorreu um erro ao salvar a contribuição.",
      });
    } finally {
      setIsSaving(false);
    }
  }
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
    }
  }

  if (remainingAmount <= 0) {
      return <Button className="w-full" disabled>Meta Atingida!</Button>;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contribuir para "{dream.title}"</DialogTitle>
          <DialogDescription>
            Quanto você quer adicionar para este sonho hoje? Uma despesa será criada na categoria "Investimentos".
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da Contribuição</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={`Faltam R$ ${remainingAmount.toFixed(2)}`}
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
                Confirmar Contribuição
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
