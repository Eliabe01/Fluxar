
"use client";

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, Loader2, Sparkles, ThumbsUp, AlertTriangle, Wallet, PieChart, TrendingUp, CheckCircle2 } from 'lucide-react';
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
      const simplifiedTransactions = transactions.map(t => {
        let isoDate = '';
        if (t.date instanceof Date) {
          isoDate = t.date.toISOString().split('T')[0];
        } else if (t.date && typeof (t.date as any).toDate === 'function') {
          isoDate = (t.date as any).toDate().toISOString().split('T')[0];
        } else if (typeof t.date === 'string') {
          isoDate = new Date(t.date).toISOString().split('T')[0];
        }

        return {
          type: t.type,
          amount: t.amount,
          category: t.category,
          description: t.description,
          date: isoDate
        };
      });
      
      const userProfile = {
          riskProfile: riskProfile as 'conservative' | 'moderate' | 'aggressive',
          investmentKnowledge: investmentKnowledge as 'beginner' | 'intermediate' | 'advanced'
      }

      const result = await analyzeFinances({ transactions: simplifiedTransactions, budgets, userProfile });
      
      if (result.success) {
        setAnalysis(result.data);
      } else {
        setError(result.error);
      }

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
        <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Resumo */}
            <Card className="border-border/40 card-shadow bg-gradient-to-br from-primary/10 via-background to-background relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Sparkles className="w-32 h-32" />
                </div>
                <CardHeader>
                    <CardTitle className="text-xl">Resumo do Mês</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground leading-relaxed text-lg">{analysis.summary}</p>
                </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pontos Positivos */}
                <Card className="border-border/40 card-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-success text-lg">
                            <div className="p-2 bg-success/10 rounded-full">
                                <ThumbsUp className="w-4 h-4" />
                            </div>
                            Pontos Positivos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            {analysis.positivePoints.map((point, index) => (
                                <li key={index} className="flex gap-3 text-muted-foreground">
                                    <div className="mt-1 shrink-0 bg-success/10 p-1 rounded-full text-success">
                                        <CheckCircle2 className="w-3 h-3" />
                                    </div>
                                    <span className="leading-relaxed">{point}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Sugestões de Melhoria */}
                 <Card className="border-border/40 card-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-amber-600 text-lg">
                            <div className="p-2 bg-amber-600/10 rounded-full">
                               <Lightbulb className="w-4 h-4" />
                            </div>
                            Sugestões de Melhoria
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ul className="space-y-4">
                            {analysis.improvementPoints.map((point, index) => (
                                <li key={index} className="flex gap-3 text-muted-foreground">
                                    <div className="mt-1 shrink-0 bg-amber-600/10 p-1 rounded-full text-amber-600">
                                        <AlertTriangle className="w-3 h-3" />
                                    </div>
                                    <span className="leading-relaxed">{point}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {analysis.suggestedBudget && analysis.suggestedBudget.length > 0 && (
                <Card className="border-border/40 card-shadow">
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <div className="p-2 bg-primary/10 rounded-full text-primary">
                               <PieChart className="w-4 h-4" />
                           </div>
                           Orçamento Sugerido
                        </CardTitle>
                        <CardDescription>Com base no seu perfil, sugerimos a seguinte distribuição mensal.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {analysis.suggestedBudget.map((item, index) => (
                             <div key={index} className="flex justify-between items-center p-4 border border-border/50 rounded-2xl bg-secondary/30">
                                 <span className="font-medium text-foreground">{item.category}</span>
                                 <span className="font-bold text-primary">{formatCurrency(item.suggestedAmount)}</span>
                             </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {analysis.investmentSuggestions && analysis.investmentSuggestions.length > 0 && (
                <Card className="border-border/40 card-shadow">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-500/10 rounded-full text-indigo-500">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            Dicas de Investimento
                        </CardTitle>
                        <CardDescription>Sugestões educacionais com base no seu perfil. Lembre-se: isso não é uma recomendação de compra.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 lg:grid-cols-2">
                        {analysis.investmentSuggestions.map((item, index) => (
                             <div key={index} className="p-5 border border-border/50 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                                <h4 className="font-bold mb-2 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-500" />
                                    {item.title}
                                </h4>
                                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
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
