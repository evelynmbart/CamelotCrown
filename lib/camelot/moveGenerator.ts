import { Board } from "./board";
import { Logic } from "./logic";
import { BoardState, GameState, LegalMove, TurnState } from "./types";

/**
 * Represents a complete turn (which may consist of multiple steps)
 */
export type CompleteTurn = {
  notation: string; // e.g., "F6-G7" or "F6xH8xJ10"
  startSquare: string;
  endSquare: string;
  moves: string[]; // All squares visited
  capturedSquares: string[]; // All squares where pieces were captured
  finalBoardState: BoardState;
  isForced: boolean; // Was this a forced continuation?
};

export class MoveGenerator {
  /**
   * Generate all possible complete legal turns for a player from the current position
   */
  static generateAllLegalTurns(
    gameState: GameState,
    playerColor: string
  ): CompleteTurn[] {
    const turns: CompleteTurn[] = [];
    const boardState = gameState.board_state;

    // Check if there are forced jumps
    const hasForceJump =
      Logic.checkFirstMovePossibleJumps(boardState, playerColor).length > 0;

    // For each piece of the player's color
    for (const square of Board.ALL_SQUARES) {
      const piece = boardState[square];
      if (!piece || piece.color !== playerColor) continue;

      // Get initial legal moves from this square
      const initialMoves = Logic.getInitialMoves(
        square,
        boardState,
        playerColor
      );

      // For each initial move, explore all possible turn continuations
      for (const move of initialMoves) {
        const turnState = Logic.createEmptyTurnState(square);
        this.exploreTurnRecursive(
          move.to,
          boardState,
          turnState,
          playerColor,
          initialMoves,
          turns,
          hasForceJump,
          0
        );
      }
    }

    // Deduplicate turns by notation (same moves sequence)
    const seenNotations = new Set<string>();
    const uniqueTurns: CompleteTurn[] = [];
    for (const turn of turns) {
      if (!seenNotations.has(turn.notation)) {
        seenNotations.add(turn.notation);
        uniqueTurns.push(turn);
      }
    }

    return uniqueTurns;
  }

  /**
   * Recursively explore a turn, handling multi-move sequences
   */
  private static exploreTurnRecursive(
    to: string,
    boardState: BoardState,
    turnState: TurnState,
    playerColor: string,
    otherLegalMoves: LegalMove[],
    completeTurns: CompleteTurn[],
    isForced: boolean,
    depth: number = 0
  ): void {
    // Safety check: prevent excessive recursion depth (max 15 moves in a turn)
    // In practice, most turns are 1-3 moves, so 15 is very generous
    if (depth > 15) {
      // Add this as a complete turn if we've made progress
      if (turnState.moves.length > 0) {
        completeTurns.push(
          this.createCompleteTurn(boardState, turnState, isForced)
        );
      }
      return;
    }

    const result = Logic.executeStep(
      to,
      boardState,
      turnState,
      playerColor,
      otherLegalMoves
    );

    if (!result.success) {
      return;
    }

    const { newBoardState, newTurnState, legalNextMoves } = result;

    // Filter out moves that would revisit squares we've already visited in this turn
    // (except for the starting square, which is allowed for ending the turn)
    const startSquare = newTurnState.moves[0];
    const filteredNextMoves = legalNextMoves.filter((move) => {
      // Allow revisiting start square only if it's a continuation
      if (move.to === startSquare) {
        return true;
      }
      // Don't revisit any other square we've been to
      return !newTurnState.moves.includes(move.to);
    });

    // If we must continue (forced continuation), keep exploring
    if (newTurnState.mustContinue && filteredNextMoves.length > 0) {
      // Must continue - recursively explore next moves
      for (const nextMove of filteredNextMoves) {
        this.exploreTurnRecursive(
          nextMove.to,
          newBoardState,
          newTurnState,
          playerColor,
          legalNextMoves,
          completeTurns,
          isForced,
          depth + 1
        );
      }
    } else if (filteredNextMoves.length > 0) {
      // Can continue or end turn
      // ALWAYS add the "end turn now" option
      completeTurns.push(
        this.createCompleteTurn(newBoardState, newTurnState, isForced)
      );

      // Only explore jump continuations (captures are important)
      // Skip canter continuations to avoid explosion
      const jumpMoves = filteredNextMoves.filter((m) => m.type === "jump");
      for (const nextMove of jumpMoves) {
        this.exploreTurnRecursive(
          nextMove.to,
          newBoardState,
          newTurnState,
          playerColor,
          legalNextMoves,
          completeTurns,
          isForced,
          depth + 1
        );
      }
    } else {
      // No legal next moves - turn is complete
      completeTurns.push(
        this.createCompleteTurn(newBoardState, newTurnState, isForced)
      );
    }
  }

  /**
   * Create a CompleteTurn object from the final state
   */
  private static createCompleteTurn(
    finalBoardState: BoardState,
    turnState: TurnState,
    isForced: boolean
  ): CompleteTurn {
    const notation = Logic.getTurnNotation(turnState);
    const startSquare = turnState.moves[0];
    const endSquare = turnState.moves[turnState.moves.length - 1];

    return {
      notation: notation || `${startSquare}-${endSquare}`,
      startSquare,
      endSquare,
      moves: turnState.moves,
      capturedSquares: turnState.capturedSquares,
      finalBoardState,
      isForced,
    };
  }

  /**
   * Helper to check if a player has any legal moves
   */
  static hasLegalMoves(gameState: GameState, playerColor: string): boolean {
    const boardState = gameState.board_state;

    for (const square of Board.ALL_SQUARES) {
      const piece = boardState[square];
      if (!piece || piece.color !== playerColor) continue;

      const moves = Logic.getInitialMoves(square, boardState, playerColor);
      if (moves.length > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Order moves for better alpha-beta pruning
   * Priority: captures > castle entries > forward moves > other
   */
  static orderMoves(
    turns: CompleteTurn[],
    playerColor: string
  ): CompleteTurn[] {
    const oppCastle =
      playerColor === "white" ? Board.BLACK_CASTLE : Board.WHITE_CASTLE;

    return turns.sort((a, b) => {
      // 1. Captures first (HEAVILY prioritized)
      const aCaps = a.capturedSquares.length;
      const bCaps = b.capturedSquares.length;
      if (aCaps !== bCaps) return (bCaps - aCaps) * 1000; // Huge weight

      // 2. Castle entries (very important)
      const aInCastle = oppCastle.includes(a.endSquare) ? 100 : 0;
      const bInCastle = oppCastle.includes(b.endSquare) ? 100 : 0;
      if (aInCastle !== bInCastle) return bInCastle - aInCastle;

      // 3. Forward progress (for white: higher rank, for black: lower rank)
      const aEndRank = parseInt(a.endSquare.slice(1));
      const bEndRank = parseInt(b.endSquare.slice(1));
      const aStartRank = parseInt(a.startSquare.slice(1));
      const bStartRank = parseInt(b.startSquare.slice(1));

      const aProgress =
        playerColor === "white" ? aEndRank - aStartRank : aStartRank - aEndRank;
      const bProgress =
        playerColor === "white" ? bEndRank - bStartRank : bStartRank - bEndRank;

      return bProgress - aProgress; // More forward movement = better
    });
  }
}
