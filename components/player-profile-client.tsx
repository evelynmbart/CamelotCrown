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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, Swords } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  created_at: string;
}

interface Game {
  id: string;
  status: string;
  winner_id: string | null;
  win_reason: string | null;
  white_player: { username: string; elo_rating: number } | null;
  black_player: { username: string; elo_rating: number } | null;
  white_player_id: string | null;
  black_player_id: string | null;
  completed_at: string | null;
}

export function PlayerProfileClient({
  currentUserId,
  currentUserProfile,
  player,
  recentGames,
}: {
  currentUserId: string;
  currentUserProfile: Player | null;
  player: Player;
  recentGames: Game[];
}) {
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isOwnProfile = currentUserId === player.id;
  const winRate =
    player.games_played > 0
      ? Math.round((player.games_won / player.games_played) * 100)
      : 0;

  const handleSendMessage = async () => {
    if (!messageContent.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUserId,
        recipient_id: player.id,
        content: messageContent.trim(),
      });

      if (error) throw error;

      alert("Message sent successfully!");
      setMessageContent("");
      setMessageDialogOpen(false);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleChallengePlayer = async () => {
    try {
      const { data: newRequest, error } = await supabase
        .from("game_requests")
        .insert({
          challenger_id: currentUserId,
          challenged_id: player.id,
          game_type: "correspondence",
          is_open: false,
        })
        .select()
        .single();

      if (error) throw error;

      alert(`Challenge sent to ${player.username}! They will be notified.`);
    } catch (error) {
      console.error("Error sending challenge:", error);
      alert("Failed to send challenge. Please try again.");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
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
            <Badge variant="secondary">Player Profile</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/players">All Players</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/lobby">Lobby</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Player Info */}
          <Card className="md:col-span-1">
            <CardHeader>
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl font-bold text-primary">
                  {player.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <CardTitle className="text-center">
                {player.display_name || player.username}
              </CardTitle>
              <CardDescription className="text-center">
                @{player.username}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">ELO Rating</div>
                <div className="text-3xl font-bold text-foreground">
                  {player.elo_rating}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Games</div>
                  <div className="text-xl font-bold text-foreground">
                    {player.games_played}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                  <div className="text-xl font-bold text-foreground">
                    {winRate}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Wins</div>
                  <div className="text-lg font-bold text-green-600">
                    {player.games_won}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Losses</div>
                  <div className="text-lg font-bold text-red-600">
                    {player.games_lost}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Draws</div>
                  <div className="text-lg font-bold text-muted-foreground">
                    {player.games_drawn}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="text-foreground">
                    {formatDate(player.created_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Active</span>
                  <span className="text-foreground">
                    {formatDate(player.last_active_at)}
                  </span>
                </div>
              </div>

              {!isOwnProfile && (
                <div className="pt-4 space-y-2">
                  <Button className="w-full" onClick={handleChallengePlayer}>
                    <Swords className="mr-2 h-4 w-4" />
                    Challenge to Game
                  </Button>
                  <Button
                    className="w-full bg-transparent"
                    variant="outline"
                    onClick={() => setMessageDialogOpen(true)}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Games */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Games</CardTitle>
              <CardDescription>Last 10 completed games</CardDescription>
            </CardHeader>
            <CardContent>
              {recentGames.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No completed games yet
                </p>
              ) : (
                <div className="space-y-3">
                  {recentGames.map((game) => {
                    const isWhite = game.white_player_id === player.id;
                    const opponent = isWhite
                      ? game.black_player
                      : game.white_player;
                    const won = game.winner_id === player.id;
                    const draw = game.win_reason === "draw";

                    return (
                      <Link key={game.id} href={`/game/${game.id}`}>
                        <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-2 h-12 rounded ${
                                won
                                  ? "bg-green-600"
                                  : draw
                                  ? "bg-muted"
                                  : "bg-red-600"
                              }`}
                            />
                            <div>
                              <div className="font-medium text-foreground">
                                vs {opponent?.username || "Unknown"}
                                <Badge variant="secondary" className="ml-2">
                                  {isWhite ? "White" : "Black"}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {won ? "Victory" : draw ? "Draw" : "Defeat"} •{" "}
                                {formatDate(game.completed_at)}
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            View Game
                          </Button>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to {player.username}</DialogTitle>
            <DialogDescription>
              Send a private message to this player
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your message here..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={5}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setMessageDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={isSending || !messageContent.trim()}
              >
                {isSending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
