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
import { Loader2, Building2, ChevronDown } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { addBank } from '@/services/banks';
import { useAuth } from '@/lib/auth';
import { KNOWN_BANKS, getBankConfig, getBankInitials, type BankConfig } from '@/lib/banks-config';
import { cn } from '@/lib/utils';

const bankFormSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  initialBalance: z.coerce.number({ message: "Por favor, insira um valor numérico válido." }),
});

type BankFormValues = z.infer<typeof bankFormSchema>;

function BankLogo({ bank, size = 'md' }: { bank: BankConfig; size?: 'sm' | 'md' | 'lg' }) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';

  if (!imgError) {
    return (
      <img
        src={bank.logoUrl}
        alt={bank.name}
        className={cn("rounded-lg object-contain bg-white p-0.5", sizeClass)}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={cn("rounded-lg flex items-center justify-center font-bold text-white", sizeClass)}
      style={{ backgroundColor: bank.color }}
    >
      {getBankInitials(bank.name)}
    </div>
  );
}

export function AddBankDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankConfig | null>(null);
  const [showAllBanks, setShowAllBanks] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<BankFormValues>({
    resolver: zodResolver(bankFormSchema),
    defaultValues: { name: "", initialBalance: 0 },
  });

  const visibleBanks = showAllBanks ? KNOWN_BANKS : KNOWN_BANKS.slice(0, 9);

  function handleSelectBank(bank: BankConfig) {
    setSelectedBank(bank);
    form.setValue('name', bank.name);
  }

  function handleNameChange(value: string) {
    // Auto-detectar banco pelo nome digitado
    const detected = getBankConfig(value);
    if (detected) {
      setSelectedBank(detected);
    } else {
      setSelectedBank(null);
    }
  }

  async function onSubmit(data: BankFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Erro de Autenticação", description: "Você precisa estar logado." });
      return;
    }
    setIsSaving(true);
    try {
      const bankConfig = selectedBank || getBankConfig(data.name);
      await addBank(user.uid, {
        name: data.name,
        initialBalance: data.initialBalance,
        color: bankConfig?.color,
        logoUrl: bankConfig?.logoUrl,
      });
      toast({ title: "Sucesso!", description: `${data.name} adicionado com sucesso.` });
      form.reset({ name: "", initialBalance: 0 });
      setSelectedBank(null);
      setOpen(false);
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro ao salvar o banco." });
    } finally {
      setIsSaving(false);
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset({ name: "", initialBalance: 0 });
      setSelectedBank(null);
      setShowAllBanks(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Adicionar Conta</DialogTitle>
          <DialogDescription>Selecione seu banco ou digite o nome da conta.</DialogDescription>
        </DialogHeader>

        {/* Grade de bancos */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Selecione o banco</p>
          <div className="grid grid-cols-3 gap-2">
            {visibleBanks.map((bank) => (
              <button
                key={bank.id}
                type="button"
                onClick={() => handleSelectBank(bank)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all hover:bg-accent/50",
                  selectedBank?.id === bank.id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                <BankLogo bank={bank} size="md" />
                <span className="text-xs font-medium text-center leading-tight truncate w-full">
                  {bank.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
          {!showAllBanks && KNOWN_BANKS.length > 9 && (
            <button
              type="button"
              onClick={() => setShowAllBanks(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center mt-1"
            >
              <ChevronDown className="w-3 h-3" />
              Ver todos os bancos
            </button>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da conta</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        {selectedBank ? (
                          <BankLogo bank={selectedBank} size="sm" />
                        ) : (
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <Input
                        placeholder="Nubank, Bradesco, Conta Pessoal..."
                        className="pl-12"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleNameChange(e.target.value);
                        }}
                      />
                    </div>
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
                  <FormLabel>Saldo Atual (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0,00" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar Conta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
