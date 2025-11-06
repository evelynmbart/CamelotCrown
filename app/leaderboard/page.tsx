import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: leaderboard } = await supabase
    .from("profiles")
    .select(
      "username, display_name, elo_rating, games_played, games_won, games_lost"
    )
    .order("elo_rating", { ascending: false })
    .limit(100);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Courser Leaderboard
          </h1>
          <Button asChild variant="outline">
            <Link href="/lobby">Back to Lobby</Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Top Players</CardTitle>
            <CardDescription>Ranked by ELO rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((player, index) => (
                  <div
                    key={player.username}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 text-center font-bold text-muted-foreground">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {player.display_name || player.username}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {player.games_played} games • {player.games_won}W{" "}
                          {player.games_lost}L
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg font-bold">
                      {player.elo_rating}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No players yet. Be the first to play!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
