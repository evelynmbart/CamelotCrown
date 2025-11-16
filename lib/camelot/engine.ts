import { Evaluator } from "./evaluator";
import { CompleteTurn, MoveGenerator } from "./moveGenerator";
import { Search, SearchResult } from "./search";
import { GameState } from "./types";

/**
 * Engine configuration
 */
export type EngineConfig = {
  maxDepth?: number; // Maximum search depth (default: 10)
  timeLimitMs?: number; // Time limit per move in milliseconds (default: 5000)
  ttSizeMB?: number; // Transposition table size in MB (default: 128)
};

/**
 * Engine analysis result
 */
export type EngineAnalysis = {
  bestMove: CompleteTurn | null;
  evaluation: number; // Centipawn score (positive favors white)
  depth: number; // Depth searched
  principalVariation: string[]; // Best line of play
  nodes: number; // Nodes searched
  nps: number; // Nodes per second
  timeMs: number; // Time spent
  isMate?: boolean; // Is this a forced mate?
  mateInMoves?: number; // Mate in N moves
};

/**
 * Classical Camelot Engine
 * Uses alpha-beta pruning, iterative deepening, and transposition tables
 */
export class CamelotEngine {
  private search: Search;
  private config: Required<EngineConfig>;

  constructor(config: EngineConfig = {}) {
    this.config = {
      maxDepth: config.maxDepth ?? 10,
      timeLimitMs: config.timeLimitMs ?? 5000,
      ttSizeMB: config.ttSizeMB ?? 128,
    };

    this.search = new Search(this.config.ttSizeMB);
  }

  /**
   * Get the best move for the current position
   */
  getBestMove(gameState: GameState, currentPlayer: string): EngineAnalysis {
    const result = this.search.searchIterativeDeepening(
      gameState,
      currentPlayer,
      this.config.maxDepth,
      this.config.timeLimitMs
    );

    return this.formatAnalysis(result, currentPlayer);
  }

  /**
   * Analyze a position with custom depth and time
   */
  analyze(
    gameState: GameState,
    currentPlayer: string,
    depth?: number,
    timeLimitMs?: number
  ): EngineAnalysis {
    const searchDepth = depth ?? this.config.maxDepth;
    const timeLimit = timeLimitMs ?? this.config.timeLimitMs;

    const result = this.search.searchIterativeDeepening(
      gameState,
      currentPlayer,
      searchDepth,
      timeLimit
    );

    return this.formatAnalysis(result, currentPlayer);
  }

  /**
   * Evaluate the current position (static evaluation, no search)
   */
  evaluatePosition(gameState: GameState, currentPlayer: string): number {
    const score = Evaluator.evaluate(gameState, currentPlayer);
    return currentPlayer === "white" ? score : -score;
  }

  /**
   * Get all legal moves for the current player
   */
  getLegalMoves(gameState: GameState, currentPlayer: string): CompleteTurn[] {
    return MoveGenerator.generateAllLegalTurns(gameState, currentPlayer);
  }

  /**
   * Check if a player has any legal moves
   */
  hasLegalMoves(gameState: GameState, currentPlayer: string): boolean {
    return MoveGenerator.hasLegalMoves(gameState, currentPlayer);
  }

  /**
   * Configure the engine
   */
  setConfig(config: Partial<EngineConfig>): void {
    if (config.maxDepth !== undefined) {
      this.config.maxDepth = config.maxDepth;
    }
    if (config.timeLimitMs !== undefined) {
      this.config.timeLimitMs = config.timeLimitMs;
    }
    if (config.ttSizeMB !== undefined) {
      this.config.ttSizeMB = config.ttSizeMB;
      // Recreate search with new TT size
      this.search = new Search(this.config.ttSizeMB);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<EngineConfig> {
    return { ...this.config };
  }

  /**
   * Clear the transposition table (useful when starting a new game)
   */
  clearTranspositionTable(): void {
    this.search.clearTranspositionTable();
  }

  /**
   * Get statistics about the transposition table
   */
  getTranspositionTableStats() {
    return this.search.getTranspositionTableStats();
  }

  /**
   * Format search result into engine analysis
   */
  private formatAnalysis(
    result: SearchResult,
    currentPlayer: string
  ): EngineAnalysis {
    const score = currentPlayer === "white" ? result.score : -result.score;

    // Check if this is a mate score
    const isMate = Math.abs(result.score) > Evaluator.CHECKMATE_SCORE / 2;
    let mateInMoves: number | undefined;

    if (isMate) {
      // Calculate mate distance (depth to mate)
      const mateDistance = Evaluator.CHECKMATE_SCORE - Math.abs(result.score);
      mateInMoves = Math.ceil(mateDistance / 2); // Convert plies to moves
    }

    return {
      bestMove: result.bestMove,
      evaluation: score,
      depth: result.depth,
      principalVariation: result.pvLine,
      nodes: result.stats.nodes,
      nps: result.stats.nps,
      timeMs: result.stats.timeMs,
      isMate,
      mateInMoves,
    };
  }

  /**
   * Get a human-readable evaluation string
   */
  getEvaluationString(analysis: EngineAnalysis): string {
    if (analysis.isMate && analysis.mateInMoves !== undefined) {
      const sign = analysis.evaluation > 0 ? "+" : "-";
      return `${sign}M${analysis.mateInMoves}`;
    }

    // Convert centipawn score to pawn units
    const pawns = (analysis.evaluation / 100).toFixed(2);
    return analysis.evaluation > 0 ? `+${pawns}` : pawns;
  }

  /**
   * Get search statistics summary
   */
  getSearchSummary(analysis: EngineAnalysis): string {
    const evalStr = this.getEvaluationString(analysis);
    const timeStr = (analysis.timeMs / 1000).toFixed(2);
    const nodesStr = analysis.nodes.toLocaleString();
    const npsStr = analysis.nps.toLocaleString();

    return `Depth: ${analysis.depth} | Eval: ${evalStr} | Nodes: ${nodesStr} | Time: ${timeStr}s | NPS: ${npsStr}`;
  }

  /**
   * Get suggested difficulty presets
   */
  static getDifficultyPreset(
    difficulty: "easy" | "medium" | "hard" | "expert"
  ): EngineConfig {
    switch (difficulty) {
      case "easy":
        return {
          maxDepth: 3,
          timeLimitMs: 500,
          ttSizeMB: 32,
        };
      case "medium":
        return {
          maxDepth: 5,
          timeLimitMs: 2000,
          ttSizeMB: 64,
        };
      case "hard":
        return {
          maxDepth: 8,
          timeLimitMs: 5000,
          ttSizeMB: 128,
        };
      case "expert":
        return {
          maxDepth: 12,
          timeLimitMs: 10000,
          ttSizeMB: 256,
        };
    }
  }
}
