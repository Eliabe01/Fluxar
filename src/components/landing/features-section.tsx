
import { BarChart3, Target, Activity, AlarmClockCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const features = [
  {
    icon: <BarChart3 className="h-8 w-8 text-primary" />,
    title: "Insights com IA",
    description: "Analisa seus gastos e dá dicas práticas e personalizadas em segundos para você tomar as melhores decisões.",
  },
  {
    icon: <Target className="h-8 w-8 text-primary" />,
    title: "Modo Sonhos",
    description: "Estabeleça metas que motivam, como uma viagem ou curso, e monitore seu progresso de forma visual e emocionante.",
  },
  {
    icon: <Activity className="h-8 w-8 text-primary" />,
    title: "Gamificação Diária",
    description: "Mantenha seu hábito de registro em dia, conquiste medalhas por seus feitos e veja sua sequência de uso (streak) crescer.",
  },
  {
    icon: <AlarmClockCheck className="h-8 w-8 text-primary" />,
    title: "Rituais e Check-ins",
    description: "Com rituais diários, você planeja seu dia e avalia seu humor financeiro, criando uma rotina saudável e consciente.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-4">
            <div className="inline-block rounded-lg bg-secondary/80 px-3 py-1 text-sm text-secondary-foreground">
              Recursos Principais
            </div>
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
              Tudo que você precisa, sem complicação.
            </h2>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              O Fluxar foi desenhado para ser poderoso, mas simples. Conecte-se com seu dinheiro de uma forma que você nunca viu.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">{feature.title}</CardTitle>
                    {feature.icon}
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
