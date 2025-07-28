
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldAlert } from 'lucide-react';
import { activatePixPlan } from '@/ai/flows/activate-pix-plan-flow';
import { FullScreenLoader } from '@/components/full-screen-loader';


export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [targetUserId, setTargetUserId] = useState('');
  const [plan, setPlan] = useState<'bronze' | 'prata' | 'ouro'>('prata');
  const [loading, setLoading] = useState(false);

  const handleGrantSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !plan) {
      toast({
        variant: 'destructive',
        title: 'Erro de Validação',
        description: 'Por favor, preencha o ID do usuário e selecione um plano.',
      });
      return;
    }
    setLoading(true);
    try {
      const result = await activatePixPlan({ userId: targetUserId, plan });
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: `Assinatura do plano ${plan} concedida ao usuário ${targetUserId} por 30 dias.`,
        });
        setTargetUserId('');
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Conceder Assinatura',
        description: error.message || 'Ocorreu um erro desconhecido.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Proteção da página
  if (authLoading) {
    return <FullScreenLoader />;
  }
  
  if (!user?.isAdmin) {
    router.push('/dashboard');
    return <FullScreenLoader />;
  }

  return (
    <div className="flex justify-center items-start py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Painel de Administração</CardTitle>
          <CardDescription>
            Conceda assinaturas de teste para usuários específicos. A assinatura será válida por 30 dias.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleGrantSubscription}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="user-id">ID do Usuário (UID)</Label>
              <Input
                id="user-id"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Insira o UID do usuário do Firebase"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Plano a Conceder</Label>
              <Select value={plan} onValueChange={(value) => setPlan(value as any)}>
                <SelectTrigger id="plan">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="prata">Prata</SelectItem>
                  <SelectItem value="ouro">Ouro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Conceder Assinatura de Teste
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
