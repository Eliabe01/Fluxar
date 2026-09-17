
"use client";

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, Loader2, Sparkles, ThumbsUp, AlertTriangle, Wallet, PieChart, TrendingUp } from 'lucide-react';
import { getTransactionsForPeriod, type Transaction } from '@/services/transactions';
import { getBudgets, type Budget } from '@/services/budgets';
import { analyzeFinances, type FinancialAnalysisOutput } from '@/actions/analyze-finances';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const expenseCategories: { [key: string]: string } = {
  food: 'Alimentação',
  transport: 'Transporte',
  shopping: 'Compras',
  housing: 'Moradia',
  bills: 'Contas e Serviços',
  leisure: 'Lazer',
  health: 'Saúde',
  education: 'Educação',
  other: 'Outros'
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function AnalysisPage() {
  const { user, subscription } = useAuth();
  // Considera ativo se tem assinatura ativa OU se tem um plano nas custom claims
  const isSubscriptionActive =
    subscription?.status === 'active' ||
    subscription?.status === 'trialing' ||
    (user?.plan && user.plan !== 'none');

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<FinancialAnalysisOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [riskProfile, setRiskProfile] = useState('moderate');
  const [investmentKnowledge, setInvestmentKnowledge] = useState('beginner');

  const currentMonth = useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const monthName = useMemo(() => format(new Date(), 'MMMM', { locale: ptBR }), []);

  const handleGenerateAnalysis = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(new Date());

      const transactionsPromise = new Promise<Transaction[]>((resolve) => {
        const unsubscribe = getTransactionsForPeriod(user.uid, startDate, endDate, (data) => {
          unsubscribe();
          resolve(data);
        });
      });

      const budgetsPromise = new Promise<Budget[]>((resolve) => {
        const unsubscribe = getBudgets(user.uid, currentMonth, (data) => {
            unsubscribe();
            resolve(data);
        });
      });

      const [transactions, budgets] = await Promise.all([transactionsPromise, budgetsPromise]);

      if (transactions.length === 0) {
        setError("Não há transações suficientes neste mês para gerar uma análise. Tente novamente após adicionar mais dados.");
        setLoading(false);
        return;
      }

      // Simplificar dados para a IA
      const simplifiedTransactions = transactions.map(t => ({
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description,
        date: (t.date as Date).toISOString().split('T')[0] // Enviar apenas a data
      }));
      
      const userProfile = {
          riskProfile: riskProfile as 'conservative' | 'moderate' | 'aggressive',
          investmentKnowledge: investmentKnowledge as 'beginner' | 'intermediate' | 'advanced'
      }

      const result = await analyzeFinances({ transactions: simplifiedTransactions, budgets, userProfile });
      setAnalysis(result);

    } catch (e) {
      console.error(e);
      setError("Ocorreu um erro ao gerar a análise. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
            <div className="flex flex-col gap-6">
                 <div>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="text-primary" />
                        Análise Financeira com IA
                    </CardTitle>
                    <CardDescription>
                       Receba insights sobre sua saúde financeira, um orçamento sugerido e dicas de investimento para o mês de {monthName}.
                    </CardDescription>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="risk-profile">Seu Perfil de Risco</Label>
                        <Select value={riskProfile} onValueChange={setRiskProfile}>
                            <SelectTrigger id="risk-profile">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="conservative">Conservador</SelectItem>
                                <SelectItem value="moderate">Moderado</SelectItem>
                                <SelectItem value="aggressive">Agressivo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="investment-knowledge">Seu Conhecimento</Label>
                        <Select value={investmentKnowledge} onValueChange={setInvestmentKnowledge}>
                            <SelectTrigger id="investment-knowledge">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="beginner">Iniciante</SelectItem>
                                <SelectItem value="intermediate">Intermediário</SelectItem>
                                <SelectItem value="advanced">Avançado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="self-end">
                         <Button onClick={handleGenerateAnalysis} disabled={loading || !isSubscriptionActive} className="w-full">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analisando...
                                </>
                            ) : (
                            "Gerar Análise Completa"
                            )}
                        </Button>
                    </div>
                 </div>
            </div>
        </CardHeader>
      </Card>

      {loading && (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                </CardContent>
            </Card>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 <Skeleton className="h-48 w-full" />
                 <Skeleton className="h-48 w-full" />
                 <Skeleton className="h-48 w-full" />
            </div>
        </div>
      )}

      {error && (
        <Card className="border-destructive">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <div >
                    <CardTitle className="text-destructive">Não foi possível gerar a análise</CardTitle>
                    <CardDescription className="text-destructive/80">{error}</CardDescription>
                </div>
            </CardHeader>
        </Card>
      )}

      {analysis && (
        <div className="space-y-8">
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                    <CardTitle>Resumo do Mês</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{analysis.summary}</p>
                </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                            <ThumbsUp /> Pontos Positivos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 list-disc pl-5 text-muted-foreground">
                            {analysis.positivePoints.map((point, index) => (
                                <li key={index}>{point}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-600">
                           <Lightbulb /> Sugestões de Melhoria
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ul className="space-y-3 list-disc pl-5 text-muted-foreground">
                            {analysis.improvementPoints.map((point, index) => (
                                <li key={index}>{point}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {analysis.suggestedBudget && analysis.suggestedBudget.length > 0 && (
                <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <PieChart /> Orçamento Sugerido
                        </CardTitle>
                        <CardDescription>Com base na sua renda, sugerimos a seguinte distribuição de gastos.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {analysis.suggestedBudget.map((item, index) => (
                            <div key={index} className="p-4 bg-secondary/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">{expenseCategories[item.category.toLowerCase()] || item.category}</p>
                                <p className="text-lg font-bold">{formatCurrency(item.suggestedAmount)}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

             {analysis.investmentSuggestions && analysis.investmentSuggestions.length > 0 && (
                <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <TrendingUp /> Dicas de Investimento
                        </CardTitle>
                        <CardDescription>Sugestões educacionais com base no seu perfil. Lembre-se: isso não é uma recomendação de compra.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {analysis.investmentSuggestions.map((item, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                                <h4 className="font-semibold">{item.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

        </div>
      )}

       {!loading && !analysis && !error && (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Pronto para sua análise financeira completa?</h3>
                <p className="mt-2 text-sm text-muted-foreground">Ajuste seu perfil e clique no botão "Gerar Análise" para receber insights da nossa IA.</p>
            </div>
       )}
    </div>
  );
}
