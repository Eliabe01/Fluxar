
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function InvestPage() {

  return (
      <div className="flex justify-center items-center py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Investimentos</CardTitle>
            <CardDescription>Esta área está em desenvolvimento.</CardDescription>
          </CardHeader>
          <CardContent>
              <p className="text-muted-foreground">
                Em breve, você poderá explorar novas formas de investir diretamente pelo Fluxar.
              </p>
              <Button asChild className="mt-6">
                  <Link href="/dashboard">Voltar para o Painel</Link>
              </Button>
          </CardContent>
        </Card>
      </div>
  );
}
