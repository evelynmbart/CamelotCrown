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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Eye, Lock, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar } from "./ui/navbar";

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

interface LobbyGame {
  id: string;
  game_type: string;
  status: string;
  time_limit: number | null;
  elo_min: number | null;
  elo_max: number | null;
  password: string | null;
  color_preference: string | null;
  creator_id: string;
  is_open: boolean;
  white_player_id: string | null;
  black_player_id: string | null;
  created_at: string;
  creator: { username: string; elo_rating: number } | null;
  white_player: { username: string } | null;
  black_player: { username: string } | null;
}

export function LobbyClient({
  user,
  profile,
}: {
  user: User;
  profile: Profile | null;
}) {
  const [games, setGames] = useState<LobbyGame[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<LobbyGame | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [userOpenGame, setUserOpenGame] = useState<LobbyGame | null>(null);

  // Create game form state
  const [gameType, setGameType] = useState<"live" | "correspondence">(
    "correspondence"
  );
  const [timeLimit, setTimeLimit] = useState<string>("unlimited");
  const [eloRange, setEloRange] = useState<string>("unlimited");
  const [password, setPassword] = useState("");
  const [colorPreference, setColorPreference] = useState<
    "white" | "black" | "random"
  >("random");

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchGames();
    checkUserOpenGame();

    // Subscribe to game updates
    const channel = supabase
      .channel("lobby-games")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
        },
        () => {
          fetchGames();
          checkUserOpenGame();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGames = async () => {
    const { data } = await supabase
      .from("games")
      .select(
        `
        *,
        creator:profiles!games_creator_id_fkey(username, elo_rating),
        white_player:profiles!games_white_player_id_fkey(username),
        black_player:profiles!games_black_player_id_fkey(username)
      `
      )
      .or("is_open.eq.true,status.eq.active")
      .order("created_at", { ascending: false });

    if (data) {
      setGames(data);
    }
  };

  const checkUserOpenGame = async () => {
    const { data } = await supabase
      .from("games")
      .select("*")
      .eq("creator_id", user.id)
      .eq("is_open", true)
      .single();

    setUserOpenGame(data || null);
  };

  const handleCreateGame = async () => {
    if (userOpenGame) {
      alert("You already have an open game. Please cancel it first.");
      return;
    }

    try {
      const timeLimitValue =
        timeLimit === "unlimited" ? null : Number.parseInt(timeLimit);
      let eloMin = null;
      let eloMax = null;

      if (eloRange !== "unlimited") {
        const currentElo = profile?.elo_rating || 1200;
        const range = Number.parseInt(eloRange);
        eloMin = currentElo - range;
        eloMax = currentElo + range;
      }

      const { data: newGame, error } = await supabase
        .from("games")
        .insert({
          creator_id: user.id,
          game_type: gameType,
          status: "waiting",
          is_open: true,
          time_limit: timeLimitValue,
          elo_min: eloMin,
          elo_max: eloMax,
          password: password || null,
          color_preference: colorPreference,
          board_state: getInitialBoardState(),
        })
        .select()
        .single();

      if (error) throw error;

      setIsCreateDialogOpen(false);
      // Reset form
      setTimeLimit("unlimited");
      setEloRange("unlimited");
      setPassword("");
      setColorPreference("random");

      alert("Game created! Waiting for an opponent to join.");
      fetchGames();
      checkUserOpenGame();
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Failed to create game. Please try again.");
    }
  };

  const handleCancelGame = async () => {
    if (!userOpenGame) return;

    try {
      const { error } = await supabase
        .from("games")
        .delete()
        .eq("id", userOpenGame.id);

      if (error) throw error;

      alert("Game cancelled.");
      checkUserOpenGame();
      fetchGames();
    } catch (error) {
      console.error("Error cancelling game:", error);
      alert("Failed to cancel game.");
    }
  };

  const handleJoinGame = async (game: LobbyGame) => {
    // Check if password protected
    if (game.password) {
      setSelectedGame(game);
      setIsJoinDialogOpen(true);
      return;
    }

    await joinGame(game);
  };

  const handleJoinWithPassword = async () => {
    if (!selectedGame) return;

    if (passwordInput !== selectedGame.password) {
      alert("Incorrect password!");
      return;
    }

    setIsJoinDialogOpen(false);
    setPasswordInput("");
    await joinGame(selectedGame);
  };

  const joinGame = async (game: LobbyGame) => {
    // Check ELO range
    const userElo = profile?.elo_rating || 1200;
    if (game.elo_min && userElo < game.elo_min) {
      alert(
        `Your ELO (${userElo}) is below the minimum required (${game.elo_min})`
      );
      return;
    }
    if (game.elo_max && userElo > game.elo_max) {
      alert(
        `Your ELO (${userElo}) is above the maximum allowed (${game.elo_max})`
      );
      return;
    }

    try {
      // Determine colors
      let whitePlayerId = game.creator_id;
      let blackPlayerId = user.id;

      if (game.color_preference === "black") {
        whitePlayerId = user.id;
        blackPlayerId = game.creator_id;
      } else if (game.color_preference === "random") {
        if (Math.random() < 0.5) {
          whitePlayerId = user.id;
          blackPlayerId = game.creator_id;
        }
      }

      const { error } = await supabase
        .from("games")
        .update({
          white_player_id: whitePlayerId,
          black_player_id: blackPlayerId,
          status: "active",
          is_open: false,
        })
        .eq("id", game.id);

      if (error) throw error;

      router.push(`/game/${game.id}`);
    } catch (error) {
      console.error("Error joining game:", error);
      alert("Failed to join game. Please try again.");
    }
  };

  const handleSpectate = async (gameId: string) => {
    try {
      // Add user as spectator
      await supabase.from("spectators").insert({
        game_id: gameId,
        user_id: user.id,
      });

      router.push(`/game/${gameId}`);
    } catch (error) {
      // Ignore duplicate errors (already spectating)
      router.push(`/game/${gameId}`);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const formatTimeLimit = (minutes: number | null) => {
    if (!minutes) return "Unlimited";
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h`;
  };

  const formatEloRange = (min: number | null, max: number | null) => {
    if (!min && !max) return "Any";
    return `${min || "0"}-${max || "∞"}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Navbar username={profile?.username} elo={profile?.elo_rating} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Game Lobby</h1>
          <p className="text-sm text-muted-foreground">
            Join an open game or create your own
          </p>
        </div>
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {userOpenGame ? (
                  <Button variant="destructive" onClick={handleCancelGame}>
                    Cancel Your Open Game
                  </Button>
                ) : (
                  <Dialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="lg">Create Game</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Game</DialogTitle>
                        <DialogDescription>
                          Configure your game settings
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Game Type</Label>
                          <Select
                            value={gameType}
                            onValueChange={(v) =>
                              setGameType(v as "live" | "correspondence")
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="live">Live</SelectItem>
                              <SelectItem value="correspondence">
                                Correspondence
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Time Limit</Label>
                          <Select
                            value={timeLimit}
                            onValueChange={setTimeLimit}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unlimited">
                                Unlimited
                              </SelectItem>
                              <SelectItem value="5">5 minutes</SelectItem>
                              <SelectItem value="10">10 minutes</SelectItem>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="60">1 hour</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>ELO Range</Label>
                          <Select value={eloRange} onValueChange={setEloRange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unlimited">
                                Unlimited
                              </SelectItem>
                              <SelectItem value="100">±100</SelectItem>
                              <SelectItem value="200">±200</SelectItem>
                              <SelectItem value="300">±300</SelectItem>
                              <SelectItem value="500">±500</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Color Preference</Label>
                          <Select
                            value={colorPreference}
                            onValueChange={(v) =>
                              setColorPreference(
                                v as "white" | "black" | "random"
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="random">Random</SelectItem>
                              <SelectItem value="white">White</SelectItem>
                              <SelectItem value="black">Black</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Password (Optional)</Label>
                          <Input
                            type="password"
                            placeholder="Leave empty for public game"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button onClick={handleCreateGame} className="w-full">
                        Create Game
                      </Button>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  Games Played
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {profile?.games_played || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
                <div className="text-2xl font-bold text-foreground">
                  {profile?.games_played
                    ? Math.round(
                        ((profile.games_won || 0) / profile.games_played) * 100
                      )
                    : 0}
                  %
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Wins</div>
                <div className="text-2xl font-bold text-green-600">
                  {profile?.games_won || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Losses</div>
                <div className="text-2xl font-bold text-red-600">
                  {profile?.games_lost || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Games Table */}
        <Card>
          <CardHeader>
            <CardTitle>Available Games</CardTitle>
            <CardDescription>
              {games.filter((g) => g.is_open).length} open games •{" "}
              {games.filter((g) => g.status === "active").length} in progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>ELO Range</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      No games available. Create one to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  games.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell>
                        {game.is_open ? (
                          <Badge variant="default">Open</Badge>
                        ) : (
                          <Badge variant="secondary">In Progress</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {game.creator?.username || "Unknown"}
                          {game.password && (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {game.game_type === "live"
                            ? "Live"
                            : "Correspondence"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatTimeLimit(game.time_limit)}</TableCell>
                      <TableCell>
                        {formatEloRange(game.elo_min, game.elo_max)}
                      </TableCell>
                      <TableCell>
                        {game.is_open ? (
                          <span className="text-muted-foreground">1/2</span>
                        ) : (
                          <span>
                            {game.white_player?.username} vs{" "}
                            {game.black_player?.username}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {game.is_open ? (
                          game.creator_id === user.id ? (
                            <Badge variant="secondary">Your Game</Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleJoinGame(game)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Join
                            </Button>
                          )
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSpectate(game.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Spectate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Password Dialog */}
      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Required</DialogTitle>
            <DialogDescription>
              This game is password protected
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Enter Password</Label>
              <Input
                type="password"
                placeholder="Game password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinWithPassword()}
              />
            </div>
          </div>
          <Button onClick={handleJoinWithPassword} className="w-full">
            Join Game
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to create initial board state
function getInitialBoardState() {
  const board: Record<string, { type: string; color: string } | null> = {};

  // Initialize all 176 squares as null
  const allSquares = [
    "G1",
    "H1",
    "D2",
    "E2",
    "F2",
    "G2",
    "H2",
    "I2",
    "J2",
    "K2",
    "C3",
    "D3",
    "E3",
    "F3",
    "G3",
    "H3",
    "I3",
    "J3",
    "K3",
    "L3",
    "B4",
    "C4",
    "D4",
    "E4",
    "F4",
    "G4",
    "H4",
    "I4",
    "J4",
    "K4",
    "L4",
    "M4",
    "A5",
    "B5",
    "C5",
    "D5",
    "E5",
    "F5",
    "G5",
    "H5",
    "I5",
    "J5",
    "K5",
    "L5",
    "M5",
    "N5",
    "A6",
    "B6",
    "C6",
    "D6",
    "E6",
    "F6",
    "G6",
    "H6",
    "I6",
    "J6",
    "K6",
    "L6",
    "M6",
    "N6",
    "A7",
    "B7",
    "C7",
    "D7",
    "E7",
    "F7",
    "G7",
    "H7",
    "I7",
    "J7",
    "K7",
    "L7",
    "M7",
    "N7",
    "A8",
    "B8",
    "C8",
    "D8",
    "E8",
    "F8",
    "G8",
    "H8",
    "I8",
    "J8",
    "K8",
    "L8",
    "M8",
    "N8",
    "A9",
    "B9",
    "C9",
    "D9",
    "E9",
    "F9",
    "G9",
    "H9",
    "I9",
    "J9",
    "K9",
    "L9",
    "M9",
    "N9",
    "A10",
    "B10",
    "C10",
    "D10",
    "E10",
    "F10",
    "G10",
    "H10",
    "I10",
    "J10",
    "K10",
    "L10",
    "M10",
    "N10",
    "A11",
    "B11",
    "C11",
    "D11",
    "E11",
    "F11",
    "G11",
    "H11",
    "I11",
    "J11",
    "K11",
    "L11",
    "M11",
    "N11",
    "A12",
    "B12",
    "C12",
    "D12",
    "E12",
    "F12",
    "G12",
    "H12",
    "I12",
    "J12",
    "K12",
    "L12",
    "M12",
    "N12",
    "B13",
    "C13",
    "D13",
    "E13",
    "F13",
    "G13",
    "H13",
    "I13",
    "J13",
    "K13",
    "L13",
    "M13",
    "C14",
    "D14",
    "E14",
    "F14",
    "G14",
    "H14",
    "I14",
    "J14",
    "K14",
    "L14",
    "D15",
    "E15",
    "F15",
    "G15",
    "H15",
    "I15",
    "J15",
    "K15",
    "G16",
    "H16",
  ];

  allSquares.forEach((square) => {
    board[square] = null;
  });

  // White pieces (rows 6-7)
  const whiteKnights = ["C6", "D6", "K6", "L6", "C7", "D7", "K7", "L7"];
  const whiteMen = [
    "E6",
    "E7",
    "F6",
    "F7",
    "G6",
    "G7",
    "H6",
    "H7",
    "I6",
    "I7",
    "J6",
    "J7",
  ];

  whiteKnights.forEach((square) => {
    board[square] = { type: "knight", color: "white" };
  });

  whiteMen.forEach((square) => {
    board[square] = { type: "man", color: "white" };
  });

  // Black pieces (rows 10-11)
  const blackKnights = ["C10", "D10", "K10", "L10", "C11", "D11", "K11", "L11"];
  const blackMen = [
    "E10",
    "E11",
    "F10",
    "F11",
    "G10",
    "G11",
    "H10",
    "H11",
    "I10",
    "I11",
    "J10",
    "J11",
  ];

  blackKnights.forEach((square) => {
    board[square] = { type: "knight", color: "black" };
  });

  blackMen.forEach((square) => {
    board[square] = { type: "man", color: "black" };
  });

  return board;
}
