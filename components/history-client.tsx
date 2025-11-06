"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Game {
  id: string;
  white_player_id: string;
  black_player_id: string;
  white_player: { id: string; username: string; elo_rating: number };
  black_player: { id: string; username: string; elo_rating: number };
  status: string;
  winner_id?: string;
  created_at: string;
  completed_at?: string;
  move_history: any[];
  game_type: string;
}

export function HistoryClient({
  games,
  userId,
}: {
  games: Game[];
  userId: string;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/lobby")}>
            ← Back to Lobby
          </Button>
          <h1 className="text-xl font-bold text-foreground">Courser</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Recent Games
          </h2>
          <p className="text-muted-foreground">
            Last 100 games played on Courser
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                    Players
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                    Moves
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                    Result
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {games.map((game) => {
                  const isWhitePlayer = game.white_player_id === userId;
                  const isBlackPlayer = game.black_player_id === userId;
                  const isParticipant = isWhitePlayer || isBlackPlayer;
                  const isWinner = game.winner_id === userId;

                  return (
                    <tr key={game.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span
                              className={isWhitePlayer ? "font-medium" : ""}
                            >
                              {game.white_player.username}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              ({game.white_player.elo_rating})
                            </span>
                          </div>
                          <div className="text-sm">
                            <span
                              className={isBlackPlayer ? "font-medium" : ""}
                            >
                              {game.black_player.username}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              ({game.black_player.elo_rating})
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">
                          {game.game_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            game.status === "completed"
                              ? "secondary"
                              : "default"
                          }
                          className="capitalize"
                        >
                          {game.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {game.move_history.length}
                      </td>
                      <td className="px-4 py-3">
                        {game.status === "completed" && game.winner_id && (
                          <span
                            className={`text-sm ${
                              isParticipant
                                ? isWinner
                                  ? "text-green-600 font-medium"
                                  : "text-red-600"
                                : "text-foreground"
                            }`}
                          >
                            {game.winner_id === game.white_player_id
                              ? `${game.white_player.username} won`
                              : `${game.black_player.username} won`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(game.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/game/${game.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
