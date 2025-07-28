
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="w-full flex-grow flex items-center justify-center py-12 md:py-24 lg:py-32 xl:py-48 pt-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
           <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-4">
              <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Conduza seu dinheiro. Realize seus sonhos.
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                O app que transforma controle financeiro em hábito diário, com IA, gamificação e metas emocionais.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">Comece grátis por 7 dias</Link>
              </Button>
              <Button variant="link" size="lg" onClick={scrollToPricing} className="text-foreground">
                Ver planos
              </Button>
            </div>
          </div>
          <Image
            src="https://i.imgur.com/LC5NLgK.png"
            alt="Hero"
            width={550}
            height={550}
            data-ai-hint="finance app dashboard"
            className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
          />
        </div>
      </div>
    </section>
  );
}
