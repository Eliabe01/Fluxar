
import { UserPlus, PencilLine, Rocket } from "lucide-react";

const steps = [
  {
    icon: <UserPlus className="h-10 w-10 text-primary" />,
    title: "Cadastro e Conexão",
    description: "Crie sua conta em menos de 1 minuto e comece seu teste gratuito. Sem burocracia, direto ao ponto.",
  },
  {
    icon: <PencilLine className="h-10 w-10 text-primary" />,
    title: "Registre e Aprenda",
    description: "Lance suas receitas e despesas de forma simples. Nossa IA vai sugerir metas e orçamentos para você.",
  },
  {
    icon: <Rocket className="h-10 w-10 text-primary" />,
    title: "Viva o Fluxo",
    description: "Receba insights diários, complete missões, veja seus sonhos se aproximarem e sinta o poder de ter o controle.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/20">
      <div className="container mx-auto grid items-center justify-center gap-4 px-4 text-center md:px-6">
        <div className="space-y-3">
          <h2 className="font-headline text-3xl font-bold tracking-tighter md:text-4xl/tight">
            Comece em 3 Passos Simples
          </h2>
          <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Fluxar é intuitivo. Em poucos minutos, você já estará no controle total da sua vida financeira.
          </p>
        </div>
        <div className="mx-auto mt-8 grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-background p-4 shadow-md">
                {step.icon}
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
