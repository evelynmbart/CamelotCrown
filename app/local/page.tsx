import { LocalGameClient } from "@/components/local-game-client";
import { Navbar } from "@/components/ui/navbar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LocalPlayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background">
      <Navbar username={profile?.username} elo={profile?.elo_rating} />

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Local Play</h1>
          <p className="text-sm text-muted-foreground">
            Play Courser with someone sitting next to you
          </p>
        </div>
        <LocalGameClient />
      </div>
    </div>
  );
}
