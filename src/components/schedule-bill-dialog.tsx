
"use client";

import { useState } from 'react';
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
  DialogClose
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format, startOfToday } from "date-fns";
import { useToast } from '@/hooks/use-toast';
import { updateBill, type Bill } from '@/services/bills';
import { useAuth } from '@/lib/auth';

const scheduleSchema = (dueDate: Date) => z.object({
  paymentDate: z.date({
    required_error: "A data do agendamento é obrigatória.",
  }).min(startOfToday(), { message: "A data não pode ser no passado."})
    .max(dueDate, { message: `O agendamento não pode ser após o vencimento (${format(dueDate, 'dd/MM/yyyy')}).`}),
});

interface ScheduleBillDialogProps {
  children: React.ReactNode;
  bill: Bill;
  disabled?: boolean;
}

export function ScheduleBillDialog({ children, bill, disabled }: ScheduleBillDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<{ paymentDate: Date }>({
    resolver: zodResolver(scheduleSchema(new Date(bill.dueDate))),
    defaultValues: {
        paymentDate: new Date()
    }
  });

  async function onSubmit(data: { paymentDate: Date }) {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateBill(user.uid, bill.id, {
        status: 'scheduled',
        scheduledPaymentDate: data.paymentDate,
      });
      toast({ title: "Sucesso!", description: "Pagamento agendado." });
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível agendar o pagamento.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={disabled}>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar Pagamento</DialogTitle>
          <DialogDescription>
            Selecione a data para pagar o boleto "{bill.description}". O pagamento será processado automaticamente na data escolhida.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Agendamento</FormLabel>
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
                        disabled={(date) => date > new Date(bill.dueDate) || date < new Date() }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="ghost">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Agendar
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

