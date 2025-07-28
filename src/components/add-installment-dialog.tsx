
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from '@/hooks/use-toast';
import { addInstallment, updateInstallment, type NewInstallment, type Installment, type InstallmentUpdate } from '@/services/installments';
import { getCreditCards, type CreditCard } from '@/services/credit-cards';
import { useAuth } from '@/lib/auth';
import { Timestamp } from 'firebase/firestore';
import { AddCreditCardDialog } from './add-credit-card-dialog';

const installmentFormSchema = z.object({
  description: z.string().min(2, {
    message: "A descrição deve ter pelo menos 2 caracteres.",
  }),
  totalAmount: z.coerce.number().positive({ message: "Por favor, insira um valor total positivo." }),
  installmentsTotal: z.coerce.number().int().min(1, { message: "Deve haver pelo menos 1 parcela."}),
  installmentsPaid: z.coerce.number().int().min(0, { message: "O valor não pode ser negativo." }).optional(),
  category: z.string({
    required_error: "Por favor, selecione uma categoria.",
  }).min(1, "Por favor, selecione uma categoria."),
  purchaseDate: z.date({
    required_error: "A data da compra é obrigatória.",
  }),
  cardId: z.string({ required_error: "Por favor, selecione um cartão." }).min(1, "Por favor, selecione um cartão."),
}).refine(data => {
    // installmentsPaid deve ser menor ou igual a installmentsTotal
    if (data.installmentsPaid !== undefined && data.installmentsTotal !== undefined) {
        return data.installmentsPaid <= data.installmentsTotal;
    }
    return true;
}, {
    message: "O número de parcelas pagas não pode ser maior que o total de parcelas.",
    path: ["installmentsPaid"],
});


type InstallmentFormValues = z.infer<typeof installmentFormSchema>;

interface AddInstallmentDialogProps {
  children: React.ReactNode;
  installment?: Installment; // For editing
}

export function AddInstallmentDialog({ children, installment }: AddInstallmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);

  const isEditing = !!installment;

  const form = useForm<InstallmentFormValues>({
    resolver: zodResolver(installmentFormSchema),
  });
  
  const resetForm = () => {
    form.reset({
        description: "",
        totalAmount: undefined,
        installmentsTotal: undefined,
        installmentsPaid: 0,
        category: "",
        purchaseDate: new Date(),
        cardId: "",
      });
  }

  useEffect(() => {
    if (!user || !open) return;
    const unsubscribe = getCreditCards(user.uid, setCards);
    return () => unsubscribe();
  }, [user, open]);

  useEffect(() => {
    if (open && installment) {
        form.reset({
            description: installment.description,
            totalAmount: installment.totalAmount,
            installmentsTotal: installment.installmentsTotal,
            installmentsPaid: installment.installmentsPaid,
            category: installment.category,
            purchaseDate: installment.purchaseDate instanceof Timestamp ? installment.purchaseDate.toDate() : new Date(installment.purchaseDate as any),
            cardId: installment.cardId,
        });
    } else if (open) {
        resetForm();
    }
  }, [open, installment, form]);

  const handleCardAdded = (newCardId: string) => {
    // The useEffect for getCreditCards will fetch the new list automatically.
    // We just need to set the value in the form.
    form.setValue('cardId', newCardId);
    setIsAddCardOpen(false);
  }

  async function onSubmit(data: InstallmentFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Erro", description: "Você precisa estar logado." });
      return;
    }
    setIsSaving(true);
    try {
      if (isEditing && installment) {
        const updateData: InstallmentUpdate = {
            description: data.description,
            totalAmount: data.totalAmount,
            installmentsTotal: data.installmentsTotal,
            category: data.category,
            purchaseDate: data.purchaseDate,
            installmentsPaid: data.installmentsPaid ?? installment.installmentsPaid,
            cardId: data.cardId,
        };
        await updateInstallment(user.uid, installment.id, updateData);
        toast({ title: "Sucesso!", description: "Conta atualizada." });

      } else {
        const newInstallment: NewInstallment = {
            description: data.description,
            totalAmount: data.totalAmount,
            installmentsTotal: data.installmentsTotal,
            category: data.category,
            purchaseDate: data.purchaseDate,
            cardId: data.cardId,
        };
        await addInstallment(user.uid, newInstallment);
        toast({ title: "Sucesso!", description: "Conta parcelada adicionada." });
      }
      resetForm();
      setOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar a conta.",
      });
    } finally {
      setIsSaving(false);
    }
  }
  
  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Conta Parcelada' : 'Adicionar Conta Parcelada'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os detalhes da sua conta.' : 'Insira os detalhes da sua compra parcelada.'}
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
                    <Input placeholder="ex: Compra de Notebook" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cardId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cartão de Crédito</FormLabel>
                  <div className="flex items-center gap-2">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cartão" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cards.map((card) => (
                          <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" size="icon" variant="outline" onClick={() => setIsAddCardOpen(true)}>
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">Adicionar novo cartão</span>
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Valor Total</FormLabel>
                        <FormControl>
                            <Input 
                            type="number" 
                            step="0.01"
                            placeholder="R$ 1200,00" 
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
                    name="installmentsTotal"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nº de Parcelas</FormLabel>
                        <FormControl>
                            <Input 
                            type="number" 
                            placeholder="10" 
                            {...field}
                            value={field.value ?? ''}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>
            
            {isEditing && (
                <FormField
                    control={form.control}
                    name="installmentsPaid"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Parcelas Pagas</FormLabel>
                        <FormControl>
                            <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            value={field.value ?? ''}
                            />
                        </FormControl>
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
                  <FormLabel>Categoria da Compra</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="electronics">Eletrônicos</SelectItem>
                      <SelectItem value="clothing">Vestuário</SelectItem>
                      <SelectItem value="home">Casa</SelectItem>
                      <SelectItem value="travel">Viagem</SelectItem>
                      <SelectItem value="education">Educação</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Compra</FormLabel>
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
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <AddCreditCardDialog 
        open={isAddCardOpen}
        onOpenChange={setIsAddCardOpen}
        onCardAdded={handleCardAdded}
    />
    </>
  );
}
