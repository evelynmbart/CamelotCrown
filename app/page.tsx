import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect("/lobby");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-6xl font-bold text-foreground mb-4">Courser</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Play Chivalry online with players around the world
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/local">Local Play</Link>
          </Button>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-foreground mb-2">
              Live Games
            </div>
            <div className="text-sm text-muted-foreground">
              Real-time matches
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground mb-2">
              ELO System
            </div>
            <div className="text-sm text-muted-foreground">
              Competitive rankings
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground mb-2">
              Correspondence
            </div>
            <div className="text-sm text-muted-foreground">
              Play at your pace
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
