
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
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from '@/hooks/use-toast';
import { addBill, updateBill, type Bill, type NewBill } from '@/services/bills';
import { useAuth } from '@/lib/auth';
import { Timestamp } from 'firebase/firestore';

const billFormSchema = z.object({
  description: z.string().min(2, {
    message: "A descrição deve ter pelo menos 2 caracteres.",
  }),
  value: z.coerce.number().positive({ message: "Por favor, insira um valor positivo." }),
  dueDate: z.date({
    required_error: "A data de vencimento é obrigatória.",
  }),
  barcode: z.string().optional(),
  recurrent: z.boolean().default(false),
  recurrenceEndDate: z.date().optional(),
});

type BillFormValues = z.infer<typeof billFormSchema>;

interface AddBillDialogProps {
  children: React.ReactNode;
  bill?: Bill;
}

export function AddBillDialog({ children, bill }: AddBillDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const isEditing = !!bill;

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
  });

  const isRecurrent = form.watch('recurrent');
  
  useEffect(() => {
    if (open) {
        if (isEditing && bill) {
            form.reset({
                description: bill.description,
                value: bill.value,
                dueDate: bill.dueDate instanceof Timestamp ? bill.dueDate.toDate() : new Date(bill.dueDate),
                barcode: bill.barcode,
                recurrent: bill.recurrent,
                recurrenceEndDate: bill.recurrenceEndDate instanceof Timestamp ? bill.recurrenceEndDate.toDate() : (bill.recurrenceEndDate ? new Date(bill.recurrenceEndDate) : undefined),
            });
        } else {
            form.reset({
                description: "",
                value: undefined,
                dueDate: new Date(),
                barcode: "",
                recurrent: false,
                recurrenceEndDate: undefined,
            });
        }
    }
  }, [bill, isEditing, open, form]);

  async function onSubmit(data: BillFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Erro", description: "Você precisa estar logado." });
      return;
    }
    setIsSaving(true);
    try {
      if (isEditing && bill) {
        await updateBill(user.uid, bill.id, data);
        toast({ title: "Sucesso!", description: "Boleto atualizado." });
      } else {
        const newBill: NewBill = {
          ...data,
          status: 'pending'
        };
        await addBill(user.uid, newBill);
        toast({ title: "Sucesso!", description: "Boleto adicionado." });
      }
      form.reset();
      setOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar o boleto.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Boleto' : 'Adicionar Boleto'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os detalhes do boleto.' : 'Insira os detalhes do novo boleto.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Conta de Luz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Valor</FormLabel>
                        <FormControl>
                            <Input 
                            type="number"
                            step="0.01"
                            placeholder="R$ 150,00" 
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
                    name="dueDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Vencimento</FormLabel>
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
                                    format(field.value, "dd/MM/yy")
                                ) : (
                                    <span>Data</span>
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
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>
             <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Barras (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="00000.00000 00000.000000..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recurrent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Boleto Recorrente</FormLabel>
                    <FormDescription>
                      Este boleto será gerado mensalmente?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isRecurrent && (
                 <FormField
                    control={form.control}
                    name="recurrenceEndDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Data Final da Recorrência (Opcional)</FormLabel>
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
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            )}
            
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="ghost">Cancelar</Button>
                </DialogClose>
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
