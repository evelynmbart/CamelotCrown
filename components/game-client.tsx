"use client";

import { ChivalryBoard } from "@/components/chivalry-board";
import { GameChat } from "@/components/game-chat";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  calculateLegalMoves,
  checkWinCondition,
  makeMove,
  reconstructBoardState,
} from "@/lib/chivalry-logic";
import { updateEloRatings } from "@/lib/elo-system";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface GameData {
  id: string;
  white_player_id: string;
  black_player_id: string;
  white_player: { id: string; username: string; elo_rating: number };
  black_player: { id: string; username: string; elo_rating: number };
  status: string;
  current_turn: string;
  board_state: Record<string, { type: string; color: string } | null>;
  move_history: any[];
  white_castle_moves: number;
  black_castle_moves: number;
  winner_id?: string;
  win_reason?: string;
  completed_at?: string;
}

export function GameClient({
  game: initialGame,
  userId,
}: {
  game: GameData;
  userId: string;
}) {
  const [game, setGame] = useState<GameData>(initialGame);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(
    initialGame.move_history.length
  );
  const [viewingBoardState, setViewingBoardState] = useState<
    Record<string, { type: string; color: string } | null>
  >(initialGame.board_state);
  const router = useRouter();
  const supabase = createClient();

  const isWhitePlayer = initialGame.white_player_id === userId;
  const playerColor = isWhitePlayer ? "white" : "black";
  const isPlayerTurn = game.current_turn === playerColor;
  const isViewingLatest = currentMoveIndex === game.move_history.length;

  useEffect(() => {
    if (currentMoveIndex === game.move_history.length) {
      setViewingBoardState(game.board_state);
    } else {
      const reconstructed = reconstructBoardState(
        game.move_history,
        currentMoveIndex
      );
      setViewingBoardState(reconstructed);
    }
  }, [currentMoveIndex, game.board_state, game.move_history]);

  useEffect(() => {
    if (isViewingLatest) {
      setCurrentMoveIndex(game.move_history.length);
    }
  }, [game.move_history.length, isViewingLatest]);

  useEffect(() => {
    const gameId = initialGame.id;

    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        async (payload) => {
          const { data, error } = await supabase
            .from("games")
            .select(
              `
              *,
              white_player:profiles!games_white_player_id_fkey(id, username, elo_rating),
              black_player:profiles!games_black_player_id_fkey(id, username, elo_rating)
            `
            )
            .eq("id", gameId)
            .single();

          if (error) {
            console.error("Error fetching updated game data:", error);
            return;
          }

          if (data) {
            setGame(data as GameData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialGame.id, supabase]);

  const handleSquareClick = async (square: string) => {
    if (!isPlayerTurn || game.status !== "active" || !isViewingLatest) return;

    const piece = game.board_state[square];

    if (piece && piece.color === playerColor) {
      setSelectedSquare(square);
      const moves = calculateLegalMoves(
        square,
        game.board_state,
        playerColor,
        game
      );
      setLegalMoves(moves);
      return;
    }

    if (selectedSquare && legalMoves.includes(square)) {
      setIsSubmitting(true);
      try {
        const result = makeMove(
          selectedSquare,
          square,
          game.board_state,
          playerColor,
          game
        );

        if (!result.success) {
          alert(result.error || "Invalid move");
          setIsSubmitting(false);
          return;
        }

        const nextTurn = playerColor === "white" ? "black" : "white";
        const winCondition = checkWinCondition(
          result.newBoardState!,
          game,
          playerColor
        );

        const updateData: any = {
          board_state: result.newBoardState,
          current_turn: winCondition ? game.current_turn : nextTurn,
          move_history: [...game.move_history, result.moveNotation],
          last_move_at: new Date().toISOString(),
        };

        if (result.isCastleMove) {
          if (playerColor === "white") {
            updateData.white_castle_moves = game.white_castle_moves + 1;
          } else {
            updateData.black_castle_moves = game.black_castle_moves + 1;
          }
        }

        if (winCondition) {
          updateData.status = "completed";
          updateData.winner_id = userId;
          updateData.win_reason = winCondition;
          updateData.completed_at = new Date().toISOString();
        }

        console.log("[v0] Submitting move with data:", updateData);

        const { error } = await supabase
          .from("games")
          .update(updateData)
          .eq("id", game.id);

        if (error) {
          console.error("[v0] Error updating game:", error);
          throw error;
        }

        console.log("[v0] Move submitted successfully, database updated");

        await supabase.from("moves").insert({
          game_id: game.id,
          player_id: userId,
          move_number: game.move_history.length + 1,
          move_type: result.moveType!,
          move_notation: result.moveNotation!,
          from_square: selectedSquare,
          to_square: square,
          captured_pieces: result.capturedPieces || [],
          board_state_after: result.newBoardState,
        });

        if (winCondition) {
          await updateEloRatings(
            game.white_player_id,
            game.black_player_id,
            userId,
            supabase
          );
        }

        setSelectedSquare(null);
        setLegalMoves([]);
      } catch (error) {
        console.error("[v0] Move error:", error);
        alert("Failed to make move. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const handleResign = async () => {
    if (!confirm("Are you sure you want to resign?")) return;

    const winnerId = isWhitePlayer
      ? game.black_player_id
      : game.white_player_id;

    await supabase
      .from("games")
      .update({
        status: "completed",
        winner_id: winnerId,
        win_reason: "resignation",
        completed_at: new Date().toISOString(),
      })
      .eq("id", game.id);

    await updateEloRatings(
      game.white_player_id,
      game.black_player_id,
      winnerId,
      supabase
    );

    router.push("/lobby");
  };

  const goToFirstMove = () => {
    setCurrentMoveIndex(0);
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const goToPreviousMove = () => {
    if (currentMoveIndex > 0) {
      setCurrentMoveIndex(currentMoveIndex - 1);
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const goToNextMove = () => {
    if (currentMoveIndex < game.move_history.length) {
      setCurrentMoveIndex(currentMoveIndex + 1);
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const goToLastMove = () => {
    setCurrentMoveIndex(game.move_history.length);
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const goToMove = (index: number) => {
    setCurrentMoveIndex(index);
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const isGameCompleted = game.status === "completed";
  const isWinner = game.winner_id === userId;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/lobby")}>
            ← Back to Lobby
          </Button>
          <h1 className="text-xl font-bold text-foreground">Courser</h1>
          {!isGameCompleted && (
            <Button variant="destructive" onClick={handleResign}>
              Resign
            </Button>
          )}
          {isGameCompleted && <div className="w-20" />}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!isViewingLatest && (
          <Alert className="mb-4">
            <AlertDescription>
              You are viewing move {currentMoveIndex} of{" "}
              {game.move_history.length}. Piece movement is disabled.
            </AlertDescription>
          </Alert>
        )}

        {isGameCompleted && (
          <Alert className="mb-4">
            <AlertDescription className="text-lg font-semibold">
              {isWinner ? "You Won!" : "You Lost"} - Game ended by{" "}
              {game.win_reason?.replace(/_/g, " ")}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_300px_300px]">
          <div>
            <Card className="p-6">
              <ChivalryBoard
                boardState={viewingBoardState}
                selectedSquare={selectedSquare}
                legalMoves={legalMoves}
                onSquareClick={handleSquareClick}
                playerColor={playerColor}
                disabled={
                  !isPlayerTurn ||
                  isSubmitting ||
                  game.status !== "active" ||
                  !isViewingLatest
                }
              />

              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToFirstMove}
                  disabled={currentMoveIndex === 0}
                  title="First move"
                >
                  <ChevronFirst className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousMove}
                  disabled={currentMoveIndex === 0}
                  title="Previous move"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Move {currentMoveIndex} / {game.move_history.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextMove}
                  disabled={currentMoveIndex === game.move_history.length}
                  title="Next move"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToLastMove}
                  disabled={currentMoveIndex === game.move_history.length}
                  title="Latest move"
                >
                  <ChevronLast className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <div className="space-y-4">
                <div
                  className={`p-3 rounded-lg ${
                    !isWhitePlayer && game.current_turn === "black"
                      ? "bg-accent"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">
                        {game.black_player.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ELO: {game.black_player.elo_rating}
                      </div>
                    </div>
                    <Badge variant="secondary">Black</Badge>
                  </div>
                  {!isWhitePlayer &&
                    game.current_turn === "black" &&
                    !isGameCompleted && (
                      <div className="mt-2 text-sm font-medium text-foreground">
                        Your turn
                      </div>
                    )}
                </div>

                <div
                  className={`p-3 rounded-lg ${
                    isWhitePlayer && game.current_turn === "white"
                      ? "bg-accent"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">
                        {game.white_player.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ELO: {game.white_player.elo_rating}
                      </div>
                    </div>
                    <Badge variant="secondary">White</Badge>
                  </div>
                  {isWhitePlayer &&
                    game.current_turn === "white" &&
                    !isGameCompleted && (
                      <div className="mt-2 text-sm font-medium text-foreground">
                        Your turn
                      </div>
                    )}
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium text-foreground mb-2">Game Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-foreground capitalize">
                    {game.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Moves:</span>
                  <span className="text-foreground">
                    {game.move_history.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Castle Moves (W):
                  </span>
                  <span className="text-foreground">
                    {game.white_castle_moves}/2
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Castle Moves (B):
                  </span>
                  <span className="text-foreground">
                    {game.black_castle_moves}/2
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium text-foreground mb-2">Move History</h3>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {game.move_history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No moves yet</p>
                ) : (
                  game.move_history.map((move, index) => (
                    <button
                      key={index}
                      onClick={() => goToMove(index + 1)}
                      className={`text-sm text-left w-full px-2 py-1 rounded hover:bg-accent transition-colors ${
                        currentMoveIndex === index + 1
                          ? "bg-accent font-medium"
                          : "text-foreground"
                      }`}
                    >
                      {index + 1}. {move}
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div>
            <GameChat
              gameId={game.id}
              userId={userId}
              whitePlayerId={game.white_player_id}
              blackPlayerId={game.black_player_id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
