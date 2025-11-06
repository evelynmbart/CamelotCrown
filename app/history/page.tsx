"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Navbar } from "@/components/ui/navbar";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface RecentGame {
  id: number | string;
  players: { username: string; elo: number }[];
  type: string;
  status: string;
  moves: number;
  winner: string;
  date: string;
}

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  elo_rating: number;
  games_played: number;
  games_won: number;
  games_lost: number;
  games_drawn: number;
}

export default function MatchHistoryPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  // You would fetch this from your DB in the real app. Here is example shape.
  const recentGames: RecentGame[] = [
    {
      id: 1,
      players: [
        { username: "joebeez", elo: 1215 },
        { username: "levelynup", elo: 1184 },
      ],
      type: "Correspondence",
      status: "Completed",
      moves: 6,
      winner: "joebeez",
      date: "11/5/2025",
    },
  ];

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      let { data } = await supabase
        .from("profiles")
        .select(
          "id,username,display_name,elo_rating,games_played,games_won,games_lost,games_drawn"
        )
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }

    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        username={profile?.username || ""}
        elo={
          typeof profile?.elo_rating === "number"
            ? profile.elo_rating
            : undefined
        }
      />

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Match History</h1>
          <p className="text-sm text-muted-foreground">
            Last 100 games played on Canter
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Games</CardTitle>
            <CardDescription>Your game history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentGames.map((game) => (
                <div
                  key={game.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm">
                          {game.players[0].username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-sm">
                          {game.players[0].username}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ({game.players[0].elo})
                        </div>
                      </div>
                    </div>

                    <span className="text-muted-foreground">vs</span>

                    <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm">
                          {game.players[1].username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-sm">
                          {game.players[1].username}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ({game.players[1].elo})
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-muted-foreground text-xs">Type</div>
                      <div className="font-medium">{game.type}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground text-xs">Moves</div>
                      <div className="font-medium">{game.moves}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground text-xs">
                        Result
                      </div>
                      <div
                        className={`font-semibold ${
                          // Show "Won" or "Lost" from profile user's perspective, if possible
                          profile
                            ? game.winner === profile.username
                              ? "text-green-600 dark:text-green-500"
                              : "text-red-600 dark:text-red-500"
                            : ""
                        }`}
                      >
                        {profile
                          ? game.winner === profile.username
                            ? "Won"
                            : "Lost"
                          : game.winner}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground text-xs">Date</div>
                      <div className="font-medium">{game.date}</div>
                    </div>
                  </div>

                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
