
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Loader2, Upload } from "lucide-react";
import { format } from "date-fns";
import { useToast } from '@/hooks/use-toast';
import { addDream, updateDream } from '@/actions/dreams';
import type { Dream } from '@/services/dreams';
import { useAuth } from '@/lib/auth';
import { Timestamp } from 'firebase/firestore';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const dreamFormSchema = z.object({
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres." }),
  targetAmount: z.coerce.number().positive({ message: "Por favor, insira uma meta positiva." }),
  dueDate: z.date({ required_error: "A data da meta é obrigatória." }),
  imageFile: z.any()
    .refine((files) => files?.[0], "A imagem é obrigatória.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `O tamanho máximo da imagem é 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Apenas os formatos .jpg, .jpeg, .png e .webp são suportados."
    ),
});

const dreamUpdateFormSchema = dreamFormSchema.extend({
    imageFile: z.any().optional()
});


type DreamFormValues = z.infer<typeof dreamFormSchema>;

interface AddDreamDialogProps {
  children: React.ReactNode;
  dream?: Dream;
}

export function AddDreamDialog({ children, dream }: AddDreamDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);

  const isEditing = !!dream;

  const form = useForm<DreamFormValues>({
    resolver: zodResolver(isEditing ? dreamUpdateFormSchema : dreamFormSchema),
  });

  useEffect(() => {
    if (open) {
      if (isEditing && dream) {
        form.reset({
          title: dream.title,
          targetAmount: dream.targetAmount,
          dueDate: dream.dueDate instanceof Timestamp ? dream.dueDate.toDate() : new Date(dream.dueDate),
        });
        setPreview(dream.imageURL);
      } else {
        form.reset();
        setPreview(null);
      }
    }
  }, [dream, isEditing, open, form]);
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(data: DreamFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Erro", description: "Você precisa estar logado." });
      return;
    }
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('targetAmount', data.targetAmount.toString());
    formData.append('dueDate', data.dueDate.toISOString());
    if (data.imageFile && data.imageFile[0]) {
        formData.append('imageFile', data.imageFile[0]);
    }

    try {
      if (isEditing && dream) {
        formData.append('dreamId', dream.id);
        await updateDream(formData);
        toast({ title: "Sucesso!", description: "Sonho atualizado." });
      } else {
        await addDream(formData);
        toast({ title: "Sucesso!", description: "Sonho adicionado." });
      }
      form.reset();
      setOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar o sonho.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Sonho' : 'Adicionar Sonho'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os detalhes do seu sonho.' : 'Defina uma nova meta financeira para alcançar.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Sonho</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Viagem para o Japão" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta de Valor</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="R$ 15.000,00" {...field} value={field.value ?? ''} />
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
                    <FormLabel>Data Alvo</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "dd/MM/yy") : <span>Data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="imageFile"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Imagem do Sonho</FormLabel>
                    <FormControl>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary">
                                {preview ? (
                                     <img src={preview} alt="Pré-visualização" className="w-full h-full object-cover rounded-lg"/>
                                ) : (
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                                        <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP (MAX. 5MB)</p>
                                    </div>
                                )}
                                <Input id="dropzone-file" type="file" className="hidden" {...field} value={undefined} onChange={(e) => {
                                    field.onChange(e.target.files);
                                    handleImageChange(e);
                                }} accept={ACCEPTED_IMAGE_TYPES.join(',')} />
                            </label>
                        </div> 
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Sonho
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
