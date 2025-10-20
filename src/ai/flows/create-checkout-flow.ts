
'use server';
/**
 * @fileOverview Cria uma sessão de checkout do Stripe para uma assinatura ou pagamento único.
 *
 * - createSubscriptionCheckout - Cria e retorna a URL para uma sessão de checkout do Stripe.
 */
import 'dotenv/config';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type Stripe from 'stripe';
import { findOrCreateStripeCustomerId } from '@/services/subscriptions';

const SubscriptionCheckoutInputSchema = z.object({
  plan: z.enum(['bronze', 'prata', 'ouro']).describe('O plano selecionado pelo usuário.'),
  userId: z.string().describe('O ID do usuário do Firebase.'),
  userEmail: z.string().email().describe('O email do usuário do Firebase.'),
  collectionMethod: z.enum(['charge_automatically', 'send_invoice']).describe("O método de cobrança da assinatura."),
});
export type SubscriptionCheckoutInput = z.infer<typeof SubscriptionCheckoutInputSchema>;

const SubscriptionCheckoutOutputSchema = z.object({
  checkoutUrl: z.string().url().describe('A URL para a página de checkout do Stripe.'),
});
export type SubscriptionCheckoutOutput = z.infer<typeof SubscriptionCheckoutOutputSchema>;


const getStripeInstance = async () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      console.error("[Stripe] Chave secreta do Stripe (STRIPE_SECRET_KEY) não encontrada nas variáveis de ambiente.");
      throw new Error('A chave secreta do Stripe não está configurada. O pagamento não pode ser processado.');
    }
    const { default: Stripe } = await import('stripe');
    return new Stripe(secretKey, {
        apiVersion: '2024-04-10',
        typescript: true,
    });
}

export async function createSubscriptionCheckout(input: SubscriptionCheckoutInput): Promise<SubscriptionCheckoutOutput> {
  return createSubscriptionCheckoutFlow(input);
}


const createSubscriptionCheckoutFlow = ai.defineFlow(
  {
    name: 'createSubscriptionCheckoutFlow',
    inputSchema: SubscriptionCheckoutInputSchema,
    outputSchema: SubscriptionCheckoutOutputSchema,
  },
  async ({ plan, userId, userEmail, collectionMethod }) => {
    console.log(`[Flow:Subscription] Iniciando checkout para plano: ${plan}, userId: ${userId}, método de cobrança: ${collectionMethod}`);
    
    const priceEnvKey = `STRIPE_PRICE_ID_${plan.toUpperCase()}`;
    const priceId = process.env[priceEnvKey];

    if (!priceId) {
        console.error(`[Flow:Subscription] Price ID para o plano "${plan}" não encontrado. Verifique a variável de ambiente ${priceEnvKey}`);
        throw new Error(`Configuração de preço para o plano "${plan}" não encontrada.`);
    }
    
    const stripe = await getStripeInstance();
    const customerId = await findOrCreateStripeCustomerId(userId, userEmail);
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings?checkout_success=true`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings`;
    
    const checkoutOptions: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
            firebaseUserId: userId,
            plan: plan,
        }
    };
    
    if (collectionMethod === 'send_invoice') {
        // Configuração para faturas manuais (PIX/Boleto)
        checkoutOptions.payment_method_types = ['card', 'pix', 'boleto'];
        checkoutOptions.subscription_data = {
            collection_method: 'send_invoice',
            days_until_due: 3,
            metadata: {
                firebaseUserId: userId,
                plan: plan,
            }
        };
    } else {
        // Configuração para cobrança automática (Cartão)
        checkoutOptions.payment_method_collection = 'always';
        checkoutOptions.payment_method_types = ['card'];
        checkoutOptions.subscription_data = {
            trial_period_days: 7,
            metadata: {
                firebaseUserId: userId,
                plan: plan,
            }
        };
    }
    
    console.log(`[Flow:Subscription] Criando sessão Stripe com customerId: ${customerId}`);
    const session = await stripe.checkout.sessions.create(checkoutOptions);

    if (!session.url) {
      console.error("[Flow:Subscription] Falha ao criar a URL da sessão de checkout do Stripe.");
      throw new Error('Não foi possível criar a sessão de checkout do Stripe.');
    }
    
    console.log("[Flow:Subscription] Sessão de checkout criada com sucesso.");
    return { checkoutUrl: session.url };
  }
);
