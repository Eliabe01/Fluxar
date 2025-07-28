
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProfileSettingsForm } from "@/components/settings/profile-form";
import { PasswordSettingsForm } from "@/components/settings/password-form";
import { ResetDataCard } from "@/components/settings/reset-data-card";
import { DeleteAccountCard } from "@/components/settings/delete-account-card";
import { GamificationCard } from "@/components/settings/gamification-card";
import { SubscriptionCard } from "@/components/settings/subscription-card";
import { useAuth } from "@/lib/auth";
import { Lock } from "lucide-react";

export default function SettingsPage() {
  const { subscription } = useAuth();
  const isPremium = subscription?.status === 'active' || subscription?.status === 'trialing' || subscription?.status === 'past_due';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as configurações da sua conta e preferências.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="subscription">Assinatura</TabsTrigger>
          <TabsTrigger value="password" disabled={!isPremium}>
            <div className="flex items-center gap-2">
              { !isPremium && <Lock className="h-4 w-4" /> }
              Senha
            </div>
          </TabsTrigger>
          <TabsTrigger value="account" disabled={!isPremium}>
             <div className="flex items-center gap-2">
              { !isPremium && <Lock className="h-4 w-4" /> }
              Conta
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="space-y-6">
            <GamificationCard />
            <Card>
              <CardHeader>
                <CardTitle>Perfil</CardTitle>
                <CardDescription>
                  Atualize as informações do seu perfil.
                </CardDescription>
              </CardHeader>
              <ProfileSettingsForm />
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="subscription">
           <SubscriptionCard />
        </TabsContent>
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Senha</CardTitle>
              <CardDescription>
                Altere sua senha. Certifique-se de usar uma senha forte.
              </CardDescription>
            </CardHeader>
            <PasswordSettingsForm />
          </Card>
        </TabsContent>
        <TabsContent value="account">
          <div className="space-y-6">
            <ResetDataCard />
            <DeleteAccountCard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
