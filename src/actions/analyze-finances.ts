'use server';
/**
 * Analisa as finanças do usuário usando Gemini API diretamente (sem Genkit).
 */

export interface TransactionInput {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface BudgetInput {
  category: string;
  amount: number;
  month: string;
}

export interface UserProfileInput {
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  investmentKnowledge: 'beginner' | 'intermediate' | 'advanced';
}

export interface FinancialAnalysisInput {
  transactions: TransactionInput[];
  budgets?: BudgetInput[];
  userProfile: UserProfileInput;
}

export interface SuggestedBudget {
  category: string;
  suggestedAmount: number;
}

export interface InvestmentSuggestion {
  title: string;
  description: string;
}

export interface FinancialAnalysisOutput {
  summary: string;
  positivePoints: string[];
  improvementPoints: string[];
  suggestedBudget: SuggestedBudget[];
  investmentSuggestions: InvestmentSuggestion[];
}

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent';

function buildPrompt(input: FinancialAnalysisInput): string {
  const riskLabels = { conservative: 'Conservador', moderate: 'Moderado', aggressive: 'Agressivo' };
  const knowledgeLabels = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' };

  return `Você é um planejador financeiro de elite. Analise os dados abaixo e retorne APENAS um JSON válido (sem markdown, sem blocos de código).

Transações do último mês:
${JSON.stringify(input.transactions, null, 2)}

Orçamentos definidos pelo usuário:
${JSON.stringify(input.budgets || [], null, 2)}

Perfil do usuário:
- Perfil de Risco: ${riskLabels[input.userProfile.riskProfile]}
- Conhecimento em Investimentos: ${knowledgeLabels[input.userProfile.investmentKnowledge]}

Retorne um JSON com exatamente esta estrutura:
{
  "summary": "Resumo de 1-2 frases sobre a saúde financeira do mês.",
  "positivePoints": ["Ponto positivo 1", "Ponto positivo 2"],
  "improvementPoints": ["Sugestão de melhoria 1", "Sugestão de melhoria 2"],
  "suggestedBudget": [
    { "category": "Alimentação", "suggestedAmount": 500 },
    { "category": "Transporte", "suggestedAmount": 200 }
  ],
  "investmentSuggestions": [
    { "title": "Título da sugestão", "description": "Descrição da sugestão educacional." }
  ]
}

Regras:
- Use português do Brasil.
- Seja específico e use os dados reais fornecidos.
- Nunca prometa retornos financeiros.
- Se não houver transações, explique isso no summary e retorne arrays vazios.
- RETORNE APENAS O JSON, sem texto adicional.`;
}

export type AnalyzeFinancesResponse = 
  | { success: true; data: FinancialAnalysisOutput }
  | { success: false; error: string };

export async function analyzeFinances(input: FinancialAnalysisInput): Promise<AnalyzeFinancesResponse> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'A chave da API Gemini não está configurada no servidor (GEMINI_API_KEY).' };
    }

    const prompt = buildPrompt(input);

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      
      let parsedError = errorText;
      try {
        const jsonError = JSON.parse(errorText);
        if (jsonError.error && jsonError.error.message) {
          parsedError = jsonError.error.message;
        }
      } catch (e) {
        // ignora e usa o texto bruto
      }
      
      return { success: false, error: `Falha na API Gemini (${response.status}): ${parsedError}` };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return { success: false, error: 'A Inteligência Artificial não retornou uma resposta válida.' };
    }

    const parsed = JSON.parse(text) as FinancialAnalysisOutput;
    return { success: true, data: parsed };
  } catch (error: any) {
    console.error('Analyze finances catch error:', error);
    return { success: false, error: error.message || 'Ocorreu um erro interno ao processar a análise.' };
  }
}
