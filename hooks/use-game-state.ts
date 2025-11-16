import { Camelot } from "@/lib/camelot";
import type { BoardState, LegalMove, TurnState } from "@/lib/camelot/types";
import { createClient } from "@/lib/supabase/client";
import type { GameData } from "@/types/game";
import { useEffect, useState } from "react";

export function useGameState(initialGame: GameData, userId: string) {
  const [game, setGame] = useState<GameData>(initialGame);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<LegalMove[]>([]);
  const [turnState, setTurnState] = useState<TurnState | null>(null);
  const [message, setMessage] = useState<string>("");

  // History viewing
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(
    initialGame.move_history.length
  );
  const [viewingBoardState, setViewingBoardState] = useState<BoardState>(
    initialGame.board_state
  );

  const supabase = createClient();

  const isWhitePlayer = initialGame.white_player_id === userId;
  const playerColor = (isWhitePlayer ? "white" : "black") as "white" | "black";
  const isPlayerTurn = game.current_turn === playerColor;
  const isViewingLatest = currentMoveIndex === game.move_history.length;
  const isGameCompleted = game.status === "completed";
  const isWinner = game.winner_id === userId;

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

  return {
    game,
    setGame,
    selectedSquare,
    setSelectedSquare,
    legalMoves,
    setLegalMoves,
    turnState,
    setTurnState,
    message,
    setMessage,
    currentMoveIndex,
    setCurrentMoveIndex,
    viewingBoardState,
    isWhitePlayer,
    playerColor,
    isPlayerTurn,
    isViewingLatest,
    isGameCompleted,
    isWinner,
    supabase,
  };
}
