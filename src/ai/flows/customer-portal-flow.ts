
'use server';
/**
 * @fileOverview Cria uma sessão do Portal do Cliente Stripe para um usuário.
 *
 * - createCustomerPortalSession - Cria e retorna a URL para o portal de faturamento do Stripe.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type Stripe from 'stripe';
import { findOrCreateStripeCustomerId } from '@/services/subscriptions';

const CustomerPortalInputSchema = z.object({
  userId: z.string().describe('O ID do usuário do Firebase.'),
  userEmail: z.string().email().describe('O email do usuário do Firebase.'),
});
export type CustomerPortalInput = z.infer<typeof CustomerPortalInputSchema>;

const CustomerPortalOutputSchema = z.object({
  portalUrl: z.string().url().describe('A URL para o Portal do Cliente Stripe.'),
});
export type CustomerPortalOutput = z.infer<typeof CustomerPortalOutputSchema>;

const getStripeInstance = async () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error('A chave secreta do Stripe não está configurada.');
    const { default: Stripe } = await import('stripe');
    return new Stripe(secretKey);
};

export async function createCustomerPortalSession(input: CustomerPortalInput): Promise<CustomerPortalOutput> {
  return createCustomerPortalFlow(input);
}

const createCustomerPortalFlow = ai.defineFlow(
  {
    name: 'createCustomerPortalFlow',
    inputSchema: CustomerPortalInputSchema,
    outputSchema: CustomerPortalOutputSchema,
  },
  async ({ userId, userEmail }) => {
    
    const stripe = await getStripeInstance();
    const customerId = await findOrCreateStripeCustomerId(userId, userEmail);

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    if (!portalSession.url) {
      throw new Error('Não foi possível criar a sessão do portal do cliente.');
    }

    return { portalUrl: portalSession.url };
  }
);
