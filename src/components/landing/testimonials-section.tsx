
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    quote: "Nunca imaginei controlar meus gastos tão fácil. Hoje já estou no meu 10º dia de streak!",
    name: "Lucas S.",
    title: "25 anos, Designer",
    avatar: "https://placehold.co/100x100.png",
    aiHint: "man face",
  },
  {
    quote: "O 'Modo Sonhos' me ajudou a visualizar minha meta de comprar um carro. Vê-la mais perto a cada mês é incrível!",
    name: "Mariana C.",
    title: "29 anos, Advogada",
    avatar: "https://placehold.co/101x101.png",
    aiHint: "woman face",
  },
  {
    quote: "A IA do Fluxar me mostrou onde eu estava gastando demais sem perceber. Mudou meu jogo financeiro.",
    name: "Rafael P.",
    title: "32 anos, Desenvolvedor",
    avatar: "https://placehold.co/102x102.png",
    aiHint: "man face professional",
  },
];


export function TestimonialsSection() {
  return (
    <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            O que nossos usuários dizem
          </h2>
          <p className="text-muted-foreground md:text-xl/relaxed">
            Histórias reais de pessoas que estão transformando suas finanças com o Fluxar.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col justify-between p-6">
                <blockquote className="text-lg font-semibold leading-snug">
                  “{testimonial.quote}”
                </blockquote>
                <div className="mt-4 flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.aiHint} />
                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
