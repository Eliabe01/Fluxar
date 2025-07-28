'use server';
/**
 * @fileOverview Um agente de IA para análise e planejamento financeiro.
 *
 * - analyzeFinances - Uma função que analisa os dados financeiros do usuário e fornece um plano.
 * - FinancialAnalysisInput - O tipo de entrada para a função analyzeFinances.
 * - FinancialAnalysisOutput - O tipo de retorno para a função analyzeFinances.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number(),
  category: z.string(),
  description: z.string(),
  date: z.string(),
});

const BudgetSchema = z.object({
  category: z.string(),
  amount: z.number(),
  month: z.string(),
});

const UserProfileSchema = z.object({
    riskProfile: z.enum(['conservative', 'moderate', 'aggressive']).describe("O perfil de risco do usuário para investimentos."),
    investmentKnowledge: z.enum(['beginner', 'intermediate', 'advanced']).describe("O nível de conhecimento do usuário sobre investimentos."),
});

const FinancialAnalysisInputSchema = z.object({
  transactions: z.array(TransactionSchema).describe("Uma lista de transações do usuário no último mês."),
  budgets: z.array(BudgetSchema).optional().describe("Uma lista de orçamentos que o usuário definiu para o mês."),
  userProfile: UserProfileSchema.describe("O perfil de investimento do usuário."),
});
export type FinancialAnalysisInput = z.infer<typeof FinancialAnalysisInputSchema>;

const SuggestedBudgetSchema = z.object({
    category: z.string().describe("A categoria da despesa, como 'Alimentação' ou 'Moradia'."),
    suggestedAmount: z.number().describe("O valor sugerido para gastar nesta categoria."),
});

const InvestmentSuggestionSchema = z.object({
    title: z.string().describe("Um título para a sugestão de investimento, ex: 'Explore Fundos de Índice (ETFs)'."),
    description: z.string().describe("Uma breve descrição da sugestão, explicando por que ela pode ser adequada para o perfil do usuário."),
});

const FinancialAnalysisOutputSchema = z.object({
  summary: z.string().describe("Um resumo conciso de uma ou duas frases sobre a situação financeira do usuário no mês."),
  positivePoints: z.array(z.string()).describe("Uma lista de 2 a 3 pontos positivos ou bons hábitos identificados. Seja específico."),
  improvementPoints: z.array(z.string()).describe("Uma lista de 2 a 3 sugestões acionáveis para melhoria. As sugestões devem ser práticas e baseadas nos dados."),
  suggestedBudget: z.array(SuggestedBudgetSchema).describe("Uma sugestão de orçamento mensal para as principais categorias de despesas, com base na renda do usuário."),
  investmentSuggestions: z.array(InvestmentSuggestionSchema).describe("Uma lista de 2 a 3 dicas de investimento educacionais e acionáveis, adaptadas ao perfil de risco e conhecimento do usuário."),
});
export type FinancialAnalysisOutput = z.infer<typeof FinancialAnalysisOutputSchema>;

export async function analyzeFinances(input: FinancialAnalysisInput): Promise<FinancialAnalysisOutput> {
  return financialAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialPlannerPrompt',
  input: {schema: FinancialAnalysisInputSchema},
  output: {schema: FinancialAnalysisOutputSchema},
  prompt: `Você é um planejador financeiro de elite, do tipo que atende clientes de alto patrimônio, mas sua missão aqui é democratizar esse conhecimento com uma linguagem acessível e encorajadora. Seu objetivo é fornecer uma análise profunda, um orçamento personalizado e dicas de investimento de alto nível, tudo em português do Brasil.

Analise CUIDADOSAMENTE todo o histórico financeiro fornecido. A moeda é Real Brasileiro (BRL).

Dados de transações do último mês:
{{{json transactions}}}

Orçamentos que o próprio usuário definiu:
{{{json budgets}}}

Perfil de Investimento do Usuário:
- Perfil de Risco: {{{userProfile.riskProfile}}}
- Conhecimento em Investimentos: {{{userProfile.investmentKnowledge}}}

Sua tarefa é agir como um profissional financeiro e entregar o seguinte:

1.  **Resumo do Mês**: Uma análise curta e direta sobre a saúde financeira do usuário no período.

2.  **Pontos Positivos**: Encontre 2-3 hábitos genuinamente positivos. Não seja genérico. Ex: "Você gastou apenas 80% do seu orçamento para 'Alimentação', demonstrando ótimo controle." em vez de "Você controlou bem seus gastos."

3.  **Pontos de Melhoria**: Identifique 2-3 áreas onde o usuário pode melhorar. Seja específico e acionável. Ex: "Seus gastos com 'Transporte' ultrapassaram o orçamento em R$150. Que tal tentar usar mais o transporte público em 2 dias da semana?"

4.  **Orçamento Sugerido (A análise mais importante!)**:
    - **NÃO use a regra 50/30/20 cegamente.** Calcule a renda total real do usuário a partir das transações de 'income'.
    - Analise as despesas, diferenciando custos fixos (como 'Moradia' ou 'Educação') de variáveis ('Lazer', 'Compras').
    - Com base na renda e nos gastos ESSENCIAIS, crie um orçamento MENSAL realista e sustentável. Justifique as suas sugestões. Por exemplo, se o gasto com 'Moradia' já consome 40% da renda, sua sugestão para outras áreas deve refletir essa realidade, e não uma regra padrão.
    - Se o usuário definiu um orçamento para uma categoria e gastou menos, elogie. Se gastou mais, use isso como base para sua sugestão.

5.  **Dicas de Investimento (Personalizadas)**:
    - Com base no perfil de risco e conhecimento, forneça 2-3 sugestões de investimento. As sugestões devem ser EDUCATIVAS.
    - Em vez de dizer "Compre a Ação X", explique o TIPO de investimento e por que ele se alinha ao perfil.
    - Exemplo para um conservador/iniciante: "Para seu perfil, o Tesouro Selic é um excelente ponto de partida. É o investimento mais seguro do país, ideal para sua reserva de emergência, pois tem baixo risco e liquidez diária."
    - Exemplo para um moderado/intermediário: "Você poderia explorar Fundos Imobiliários (FIIs). Eles permitem investir em imóveis de forma acessível e receber aluguéis mensais, oferecendo um bom equilíbrio entre segurança e potencial de valorização."

Seu tom deve ser profissional, mas motivador.
Se a lista de transações estiver vazia, explique que não há dados suficientes para uma análise significativa e não gere um orçamento ou dicas.
NUNCA dê conselhos financeiros diretos ou garantias de retorno. Sempre enquadre as sugestões de investimento como conteúdo educacional para pesquisa do usuário.`,
});

const financialAnalysisFlow = ai.defineFlow(
  {
    name: 'financialAnalysisFlow',
    inputSchema: FinancialAnalysisInputSchema,
    outputSchema: FinancialAnalysisOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("A análise da IA não conseguiu gerar uma resposta.");
    }
    return output;
  }
);
