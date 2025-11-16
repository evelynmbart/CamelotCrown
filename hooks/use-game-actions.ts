import { Camelot } from "@/lib/camelot";
import { updateEloRatings } from "@/lib/elo-system";
import type { LegalMove, TurnState } from "@/lib/camelot/types";
import type { GameData } from "@/types/game";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";

interface UseGameActionsProps {
  game: GameData;
  setGame: (game: GameData) => void;
  userId: string;
  playerColor: "white" | "black";
  isPlayerTurn: boolean;
  isViewingLatest: boolean;
  turnState: TurnState | null;
  setTurnState: (state: TurnState | null) => void;
  selectedSquare: string | null;
  setSelectedSquare: (square: string | null) => void;
  legalMoves: LegalMove[];
  setLegalMoves: (moves: LegalMove[]) => void;
  message: string;
  setMessage: (message: string) => void;
  currentMoveIndex: number;
  setCurrentMoveIndex: (index: number) => void;
  supabase: SupabaseClient;
}

export function useGameActions({
  game,
  setGame,
  userId,
  playerColor,
  isPlayerTurn,
  isViewingLatest,
  turnState,
  setTurnState,
  selectedSquare,
  setSelectedSquare,
  legalMoves,
  setLegalMoves,
  message,
  setMessage,
  currentMoveIndex,
  setCurrentMoveIndex,
  supabase,
}: UseGameActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleTimeout = async () => {
    // Double-check game is still active (prevent race conditions)
    if (game.status !== "active") return;

    const winnerId =
      playerColor === "white" ? game.black_player_id : game.white_player_id;

    // Use .eq() with status check to prevent double-timeout
    const { error } = await supabase
      .from("games")
      .update({
        status: "completed",
        winner_id: winnerId,
        win_reason: "timeout",
        completed_at: new Date().toISOString(),
      })
      .eq("id", game.id)
      .eq("status", "active"); // Only update if still active

    // Only update ELO if the update succeeded
    if (!error) {
      await updateEloRatings(
        game.white_player_id,
        game.black_player_id,
        winnerId,
        supabase
      );
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

      // Capture client timestamp IMMEDIATELY when move is submitted
      // This compensates for network lag
      const clientMoveTime = new Date();
      const now = new Date();
      
      const updateData: any = {
        board_state: game.board_state,
        current_turn: winCondition ? game.current_turn : nextTurn,
        move_history: [...game.move_history, notation],
        last_move_at: now.toISOString(),
        last_move_time: clientMoveTime.toISOString(), // Use client timestamp
      };

      // Handle time control if present
      if (game.time_control_minutes !== null && game.time_control_minutes !== undefined) {
        const lastMoveTime = game.last_move_time ? new Date(game.last_move_time) : clientMoveTime;
        
        // Calculate elapsed time using CLIENT timestamps to avoid network lag penalty
        const elapsedMs = clientMoveTime.getTime() - lastMoveTime.getTime();
        
        // Add 100ms buffer for lag compensation (generous but prevents edge cases)
        const lagBufferMs = 100;
        const adjustedElapsedMs = Math.max(0, elapsedMs - lagBufferMs);
        
        const currentPlayerTimeField = playerColor === "white" ? "white_time_remaining" : "black_time_remaining";
        const currentPlayerTime = playerColor === "white" ? game.white_time_remaining : game.black_time_remaining;
        
        // Calculate new time: subtract elapsed time, add increment
        // Don't add increment on first move (move_history.length === 0)
        const isFirstMove = game.move_history.length === 0;
        const incrementMs = isFirstMove ? 0 : (game.time_control_increment || 0) * 1000;
        const newTime = Math.max(0, (currentPlayerTime || 0) - adjustedElapsedMs + incrementMs);
        
        // Check for timeout
        if (newTime <= 0) {
          const winnerId = playerColor === "white" ? game.black_player_id : game.white_player_id;
          updateData.status = "completed";
          updateData.winner_id = winnerId;
          updateData.win_reason = "timeout";
          updateData.completed_at = now.toISOString();
          updateData[currentPlayerTimeField] = 0;
        } else {
          updateData[currentPlayerTimeField] = newTime;
        }
        
        // Also update the opponent's time field (keep it the same)
        const opponentPlayerTimeField = playerColor === "white" ? "black_time_remaining" : "white_time_remaining";
        const opponentPlayerTime = playerColor === "white" ? game.black_time_remaining : game.white_time_remaining;
        updateData[opponentPlayerTimeField] = opponentPlayerTime;
      }

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

    const winnerId =
      playerColor === "white" ? game.black_player_id : game.white_player_id;

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

  return {
    isSubmitting,
    handleSquareClick,
    handleSubmitTurn,
    handleResign,
    handleTimeout,
    goToFirstMove,
    goToPreviousMove,
    goToNextMove,
    goToLastMove,
    goToMove,
  };
}

