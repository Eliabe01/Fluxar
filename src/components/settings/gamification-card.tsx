
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getUserGamification, type UserGamification } from "@/services/gamification";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Medal } from "lucide-react";

function FluxarLogo({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
        </svg>
    );
}

export function GamificationCard() {
    const { user } = useAuth();
    const [gamificationData, setGamificationData] = useState<UserGamification | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getUserGamification(user.uid);
                setGamificationData(data);
            } catch (error) {
                console.error("Failed to fetch gamification data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Meu Progresso</CardTitle>
                <CardDescription>Sua jornada de consistência e conquistas financeiras.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center justify-center p-6 bg-secondary rounded-lg">
                    {loading ? (
                        <>
                            <Skeleton className="h-10 w-16 mb-2" />
                            <Skeleton className="h-4 w-24" />
                        </>
                    ) : (
                        <>
                            <div className="flex items-center text-primary">
                                <FluxarLogo className="h-10 w-10" />
                                <span className="text-5xl font-bold ml-2">{gamificationData?.streakDays ?? 0}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">dias de streak</p>
                        </>
                    )}
                </div>
                <div className="flex flex-col items-center justify-center p-6 bg-secondary rounded-lg">
                    {loading ? (
                        <>
                           <Skeleton className="h-10 w-10 mb-2 rounded-full" />
                           <Skeleton className="h-4 w-32" />
                        </>
                    ) : (
                         <>
                            <Medal className="h-10 w-10 text-yellow-500" />
                            <p className="text-sm text-muted-foreground mt-2">Nenhuma medalha ainda. Continue usando o app para conquistar!</p>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
