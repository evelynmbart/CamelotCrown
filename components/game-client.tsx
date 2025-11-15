"use client";

import { ChivalryBoard } from "@/components/chivalry-board";
import { GameChat } from "@/components/game-chat";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camelot } from "@/lib/camelot";
import {
  LegalMove,
  type BoardState,
  type TurnState,
} from "@/lib/camelot/types";
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
  board_state: BoardState;
  move_history: string[];
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
  const [legalMoves, setLegalMoves] = useState<LegalMove[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Turn state for current player's turn
  const [turnState, setTurnState] = useState<TurnState | null>(null);
  const [message, setMessage] = useState<string>("");

  // History viewing
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(
    initialGame.move_history.length
  );
  const [viewingBoardState, setViewingBoardState] = useState<BoardState>(
    initialGame.board_state
  );

  const router = useRouter();
  const supabase = createClient();

  const isWhitePlayer = initialGame.white_player_id === userId;
  const playerColor = isWhitePlayer ? "white" : "black";
  const isPlayerTurn = game.current_turn === playerColor;
  const isViewingLatest = currentMoveIndex === game.move_history.length;

  // Reconstruct board state for history viewing
  useEffect(() => {
    if (currentMoveIndex === game.move_history.length) {
      setViewingBoardState(game.board_state);
    } else {
      // Simple reconstruction: start from initial and apply moves sequentially
      // For now, just show latest - full reconstruction needs more logic
      setViewingBoardState(game.board_state);
    }
  }, [currentMoveIndex, game.board_state, game.move_history]);

  useEffect(() => {
    if (isViewingLatest) {
      setCurrentMoveIndex(game.move_history.length);
    }
  }, [game.move_history.length, isViewingLatest]);

  // Realtime subscription
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
          console.log("[Game Realtime] Game update detected:", payload);
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
            console.log("[Game Realtime] Game state updated");
            setGame(data as GameData);
            setCurrentMoveIndex(data.move_history.length);

            // Reset turn state when game updates
            setTurnState(null);
            setSelectedSquare(null);
            setLegalMoves([]);
            setMessage("");
          }
        }
      )
      .subscribe((status) => {
        console.log("[Game Realtime] Subscription status:", status);
      });

    return () => {
      console.log("[Game Realtime] Unsubscribing");
      supabase.removeChannel(channel);
    };
  }, [initialGame.id, supabase]);

  // Check for mandatory jumps at turn start
  useEffect(() => {
    if (!isPlayerTurn || game.status !== "active" || turnState) return;

    const hasJump =
      Camelot.Logic.checkFirstMovePossibleJumps(game.board_state, playerColor)
        .length > 0;
    if (hasJump) {
      setMessage("You must capture! Select a piece to see available captures.");
    } else {
      setMessage("");
    }
  }, [isPlayerTurn, game.status, game.board_state, playerColor, turnState]);

  const handleSquareClick = async (square: string) => {
    if (!isPlayerTurn || game.status !== "active" || !isViewingLatest) return;

    // If turn in progress
    if (turnState) {
      const currentSquare = turnState.moves[turnState.moves.length - 1];

      // Clicking current position - deselect
      if (square === currentSquare) {
        // Can't deselect if moves have been made
        if (turnState.moves.length > 1) {
          return;
        }
        setTurnState(null);
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // Clicking a legal move - continue turn
      if (legalMoves.some((move) => move.to === square)) {
        const result = Camelot.Logic.executeStep(
          square,
          game.board_state,
          turnState,
          playerColor,
          legalMoves
        );

        if (result.success && result.newBoardState && result.newTurnState) {
          // Update local board state (not DB yet)
          setMessage(result.message);
          setGame({
            ...game,
            board_state: result.newBoardState,
          });
          setTurnState(result.newTurnState);
          setSelectedSquare(
            result.newTurnState.moves[result.newTurnState.moves.length - 1]
          );
          setLegalMoves(result.legalNextMoves);
          if (result.legalNextMoves.length === 0) {
            setMessage(
              "No more legal moves. Click Submit Turn to end your turn."
            );
          }
        }
        if (!result.success) {
          console.error("Error executing step", result.error);
        }
        return;
      }

      // Clicking elsewhere during mandatory continuation - not allowed
      if (turnState.mustContinue) {
        return;
      }

      // Clicking elsewhere if no legal moves - not allowed
      if (legalMoves.length === 0) {
        return;
      }

      // Clicking elsewhere during optional continuation - allow it (implicitly ends turn)
      // Fall through to piece selection
    }

    // Starting a new turn or selecting a piece
    const piece = game.board_state[square];
    if (piece && piece.color === playerColor) {
      const moves = Camelot.Logic.getInitialMoves(
        square,
        game.board_state,
        playerColor
      );

      if (moves.length === 0) {
        setMessage("This piece has no legal moves.");
        return;
      }

      setSelectedSquare(square);
      setLegalMoves(moves);

      // Start a new turn state
      setTurnState(Camelot.Logic.createEmptyTurnState(square));
      setMessage("Select where to move.");
    }
  };

  const handleSubmitTurn = async () => {
    if (!turnState || turnState.mustContinue || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Get turn notation
      const notation = Camelot.Logic.getTurnNotation(turnState);
      if (!notation) {
        throw new Error("Invalid turn notation");
      }

      // Check for win
      const nextTurn = playerColor === "white" ? "black" : "white";
      const winCondition = Camelot.Logic.checkWinCondition(
        game.board_state,
        playerColor
      );

      const updateData: any = {
        board_state: game.board_state,
        current_turn: winCondition ? game.current_turn : nextTurn,
        move_history: [...game.move_history, notation],
        last_move_at: new Date().toISOString(),
      };

      // Check if turn ended in opponent's castle
      const lastSquare = turnState.moves[turnState.moves.length - 1];
      const oppCastle = playerColor === "white" ? ["F16", "G16"] : ["F1", "G1"];
      if (oppCastle.includes(lastSquare)) {
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

      console.log("[Game] Submitting turn with data:", updateData);

      const { error } = await supabase
        .from("games")
        .update(updateData)
        .eq("id", game.id);

      if (error) {
        console.error("[Game] Error updating game:", error);
        throw error;
      }

      console.log("[Game] Turn submitted successfully");

      // Record move in moves table
      await supabase.from("moves").insert({
        game_id: game.id,
        player_id: userId,
        move_number: game.move_history.length + 1,
        move_type: turnState.capturedSquares.length > 0 ? "jump" : "canter",
        move_notation: notation,
        from_square: turnState.moves[0],
        to_square: turnState.moves[turnState.moves.length - 1],
        captured_pieces: turnState.capturedSquares,
        board_state_after: game.board_state,
      });

      if (winCondition) {
        await updateEloRatings(
          game.white_player_id,
          game.black_player_id,
          userId,
          supabase
        );
      }

      // Reset turn state
      setTurnState(null);
      setSelectedSquare(null);
      setLegalMoves([]);
      setMessage("");
    } catch (error) {
      console.error("[Game] Submit turn error:", error);
      alert("Failed to submit turn. Please try again.");
    } finally {
      setIsSubmitting(false);
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
    setTurnState(null);
  };

  const goToPreviousMove = () => {
    if (currentMoveIndex > 0) {
      setCurrentMoveIndex(currentMoveIndex - 1);
      setSelectedSquare(null);
      setLegalMoves([]);
      setTurnState(null);
    }
  };

  const goToNextMove = () => {
    if (currentMoveIndex < game.move_history.length) {
      setCurrentMoveIndex(currentMoveIndex + 1);
      setSelectedSquare(null);
      setLegalMoves([]);
      setTurnState(null);
    }
  };

  const goToLastMove = () => {
    setCurrentMoveIndex(game.move_history.length);
    setSelectedSquare(null);
    setLegalMoves([]);
    setTurnState(null);
  };

  const goToMove = (index: number) => {
    setCurrentMoveIndex(index);
    setSelectedSquare(null);
    setLegalMoves([]);
    setTurnState(null);
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
          <h1 className="text-xl font-bold text-foreground">Camelot</h1>
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

                {turnState && turnState.moves.length > 1 && (
                  <div className="mt-2 p-2 bg-accent rounded-md">
                    <div className="text-xs text-muted-foreground mb-1">
                      Current Turn:
                    </div>
                    <div className="font-mono text-xs">
                      {turnState.moves.join(" → ")}
                    </div>
                  </div>
                )}

                {message && (
                  <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
                    <div className="text-sm text-amber-900 dark:text-amber-100">
                      {message}
                    </div>
                  </div>
                )}
              </div>

              {isPlayerTurn && !isGameCompleted && turnState && (
                <Button
                  onClick={handleSubmitTurn}
                  className="w-full mt-4"
                  disabled={
                    !turnState || turnState.mustContinue || isSubmitting
                  }
                >
                  {isSubmitting ? "Submitting..." : "Submit Turn"}
                </Button>
              )}
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
