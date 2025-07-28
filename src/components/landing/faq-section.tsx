
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Preciso de cartão de crédito para testar?",
    answer: "Não! O teste de 7 dias é totalmente gratuito e não exige dados de pagamento. Você pode explorar todas as funcionalidades do plano Prata sem compromisso.",
  },
  {
    question: "Posso cancelar depois do teste grátis?",
    answer: "Sim, você pode cancelar a qualquer momento, inclusive durante o período de teste. Se não cancelar, a assinatura será ativada ao final dos 7 dias.",
  },
  {
    question: "Quais formas de pagamento vocês aceitam?",
    answer: "Aceitamos cartão de crédito (principais bandeiras), Pix e boleto bancário. Você pode escolher a melhor opção para você ao final do seu teste.",
  },
  {
    question: "Meus dados financeiros estão seguros?",
    answer: "Sim. A segurança é nossa prioridade. Todos os seus dados são criptografados e armazenados de forma segura, seguindo as melhores práticas do mercado.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Perguntas Frequentes
          </h2>
          <p className="text-muted-foreground md:text-xl/relaxed">
            Tirando suas dúvidas para você começar com tranquilidade.
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
