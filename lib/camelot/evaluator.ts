import { Board } from "./board";
import { Coordinates } from "./coordinates";
import { Logic } from "./logic";
import { BoardState, GameState } from "./types";

/**
 * Position evaluation for Camelot engine
 * Positive scores favor white, negative scores favor black
 */
export class Evaluator {
  // Material values
  static readonly MAN_VALUE = 100;
  static readonly KNIGHT_VALUE = 150;

  // Positional bonuses (tuned for aggressive play)
  static readonly CASTLE_CONTROL_BONUS = 80; // Per piece in enemy castle (HUGE bonus)
  static readonly CASTLE_PROXIMITY_BONUS = 40; // Near enemy castle
  static readonly CENTER_CONTROL_BONUS = 3; // Per piece near center (minimal)
  static readonly MOBILITY_BONUS = 3; // Per legal move (reduced - focus on position)
  static readonly FORWARD_PROGRESS_BONUS = 12; // Per rank advanced (AGGRESSIVE)

  // Win/loss scores
  static readonly CHECKMATE_SCORE = 100000;
  static readonly DRAW_SCORE = 0;

  /**
   * Main evaluation function
   * Returns score from white's perspective (positive = white advantage)
   */
  static evaluate(gameState: GameState, currentPlayer: string): number {
    const boardState = gameState.board_state;

    // Check for terminal positions
    const whiteWin = Logic.checkWinCondition(boardState, "white");
    if (whiteWin) {
      return currentPlayer === "white"
        ? this.CHECKMATE_SCORE
        : -this.CHECKMATE_SCORE;
    }

    const blackWin = Logic.checkWinCondition(boardState, "black");
    if (blackWin) {
      return currentPlayer === "black"
        ? this.CHECKMATE_SCORE
        : -this.CHECKMATE_SCORE;
    }

    let score = 0;

    // Material evaluation
    score += this.evaluateMaterial(boardState);

    // Positional evaluation
    score += this.evaluatePosition(boardState);

    // Castle control
    score += this.evaluateCastleControl(boardState);

    // Mobility (reduced importance)
    score += this.evaluateMobility(gameState, "white") * 0.5;
    score -= this.evaluateMobility(gameState, "black") * 0.5;

    // Add small random factor for variety (±10 points)
    score += Math.random() * 20 - 10;

    return score;
  }

  /**
   * Evaluate material balance
   */
  private static evaluateMaterial(boardState: BoardState): number {
    let score = 0;

    for (const square of Board.ALL_SQUARES) {
      const piece = boardState[square];
      if (!piece) continue;

      const value =
        piece.type === "knight" ? this.KNIGHT_VALUE : this.MAN_VALUE;

      if (piece.color === "white") {
        score += value;
      } else {
        score -= value;
      }
    }

    return score;
  }

  /**
   * Evaluate positional factors
   */
  private static evaluatePosition(boardState: BoardState): number {
    let score = 0;

    for (const square of Board.ALL_SQUARES) {
      const piece = boardState[square];
      if (!piece) continue;

      const multiplier = piece.color === "white" ? 1 : -1;

      // Center control (squares E6-H11 are roughly central)
      score += this.getCenterControlBonus(square) * multiplier;

      // Forward progress
      score += this.getForwardProgressBonus(square, piece.color) * multiplier;

      // Castle proximity (bonus for being near enemy castle)
      score += this.getCastleProximityBonus(square, piece.color) * multiplier;
    }

    return score;
  }

  /**
   * Get bonus for center control (file control, not rank)
   */
  private static getCenterControlBonus(square: string): number {
    const { file } = Coordinates.parseSquare(square);

    // Center files are D-I (3-8) - control the middle files
    const centerFiles = [4, 5, 6, 7]; // E, F, G, H (most central)

    const fileDistance = Math.min(
      ...centerFiles.map((cf) => Math.abs(file - cf))
    );

    if (fileDistance === 0) return this.CENTER_CONTROL_BONUS;
    if (fileDistance === 1) return this.CENTER_CONTROL_BONUS / 2;

    return 0;
  }

  /**
   * Get bonus for forward progress
   */
  private static getForwardProgressBonus(
    square: string,
    color: string
  ): number {
    const { rank } = Coordinates.parseSquare(square);

    if (color === "white") {
      // White wants to advance toward rank 16
      return (rank - 6) * this.FORWARD_PROGRESS_BONUS;
    } else {
      // Black wants to advance toward rank 1
      return (11 - rank) * this.FORWARD_PROGRESS_BONUS;
    }
  }

  /**
   * Get bonus for being near enemy castle
   */
  private static getCastleProximityBonus(
    square: string,
    color: string
  ): number {
    const enemyCastle =
      color === "white" ? Board.BLACK_CASTLE : Board.WHITE_CASTLE;
    const { file, rank } = Coordinates.parseSquare(square);

    let minDistance = Infinity;
    for (const castleSquare of enemyCastle) {
      const { file: cf, rank: cr } = Coordinates.parseSquare(castleSquare);
      const distance = Math.abs(file - cf) + Math.abs(rank - cr);
      minDistance = Math.min(minDistance, distance);
    }

    // Gradual bonus based on distance (closer = better)
    if (minDistance <= 2) return this.CASTLE_PROXIMITY_BONUS;
    if (minDistance <= 4) return this.CASTLE_PROXIMITY_BONUS * 0.66;
    if (minDistance <= 6) return this.CASTLE_PROXIMITY_BONUS * 0.33;
    if (minDistance <= 8) return this.CASTLE_PROXIMITY_BONUS * 0.15;

    return 0;
  }

  /**
   * Evaluate castle control
   */
  private static evaluateCastleControl(boardState: BoardState): number {
    let score = 0;

    // White pieces in black castle
    for (const square of Board.BLACK_CASTLE) {
      const piece = boardState[square];
      if (piece?.color === "white") {
        score += this.CASTLE_CONTROL_BONUS;
      }
    }

    // Black pieces in white castle
    for (const square of Board.WHITE_CASTLE) {
      const piece = boardState[square];
      if (piece?.color === "black") {
        score -= this.CASTLE_CONTROL_BONUS;
      }
    }

    return score;
  }

  /**
   * Evaluate mobility (number of legal moves)
   */
  private static evaluateMobility(
    gameState: GameState,
    playerColor: string
  ): number {
    const boardState = gameState.board_state;
    let moveCount = 0;

    for (const square of Board.ALL_SQUARES) {
      const piece = boardState[square];
      if (!piece || piece.color !== playerColor) continue;

      const moves = Logic.getInitialMoves(square, boardState, playerColor);
      moveCount += moves.length;
    }

    return moveCount * this.MOBILITY_BONUS;
  }
}
