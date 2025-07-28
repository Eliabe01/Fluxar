
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { deleteUserAccount } from "@/ai/flows/delete-user-flow";

const deleteFormSchema = z.object({
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

type DeleteFormValues = z.infer<typeof deleteFormSchema>;

export function DeleteAccountCard() {
  const { user, reauthenticate, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<DeleteFormValues>({
    resolver: zodResolver(deleteFormSchema),
    defaultValues: {
      password: ""
    }
  });

  const handleDeleteAccount = async (data: DeleteFormValues) => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Reautenticar o usuário no cliente para segurança
      await reauthenticate(data.password);
      
      // 2. Chamar a Server Action (Genkit Flow) para deletar os dados no backend
      await deleteUserAccount({ userId: user.uid });

      toast({
        title: "Conta excluída",
        description: "Sua conta e todos os seus dados foram removidos.",
      });

      // 3. Fazer logout do cliente e redirecionar
      await signOut();
      router.push("/login");

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir conta",
        description: "A senha está incorreta ou ocorreu um erro. Tente novamente.",
      });
    } finally {
      setLoading(false);
      setOpen(false);
      form.reset();
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Apagar Conta</CardTitle>
        <CardDescription>
          Esta ação é irreversível. Ela excluirá permanentemente sua conta e
          todos os dados associados a ela.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-end border-t border-destructive/20 px-6 py-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              Apagar Minha Conta Permanentemente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Você tem certeza absoluta?</DialogTitle>
              <DialogDescription>
                Para confirmar a exclusão, por favor, insira sua senha. Esta
                ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleDeleteAccount)}>
                <div className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="destructive"
                    type="submit"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Apagar conta e todos os dados
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
