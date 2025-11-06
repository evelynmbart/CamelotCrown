"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Player {
  id: string;
  username: string;
  display_name: string | null;
  elo_rating: number;
  games_played: number;
  games_won: number;
  games_lost: number;
  games_drawn: number;
  last_active_at: string | null;
}

export function PlayersClient({
  currentUserId,
  players,
}: {
  currentUserId: string;
  players: Player[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlayers = players.filter(
    (player) =>
      player.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastActive = (lastActive: string | null) => {
    if (!lastActive) return "Never";
    const date = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/lobby">
              <h1 className="text-2xl font-bold text-foreground hover:text-primary cursor-pointer">
                Courser
              </h1>
            </Link>
            <Badge variant="secondary">Players</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/lobby">Lobby</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/leaderboard">Leaderboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Players</CardTitle>
            <CardDescription>
              Browse and connect with other Chivalry players
            </CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredPlayers.map((player) => {
                const winRate =
                  player.games_played > 0
                    ? Math.round((player.games_won / player.games_played) * 100)
                    : 0;

                return (
                  <Link key={player.id} href={`/players/${player.id}`}>
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {player.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {player.display_name || player.username}
                            {player.id === currentUserId && (
                              <Badge variant="secondary" className="text-xs">
                                You
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            @{player.username}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            ELO
                          </div>
                          <div className="text-lg font-bold text-foreground">
                            {player.elo_rating}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            Record
                          </div>
                          <div className="text-sm font-medium text-foreground">
                            {player.games_won}W - {player.games_lost}L -{" "}
                            {player.games_drawn}D
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            Win Rate
                          </div>
                          <div className="text-sm font-medium text-foreground">
                            {winRate}%
                          </div>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <div className="text-sm text-muted-foreground">
                            Last Active
                          </div>
                          <div className="text-sm font-medium text-foreground">
                            {formatLastActive(player.last_active_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
