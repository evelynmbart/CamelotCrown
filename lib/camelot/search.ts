import { Evaluator } from "./evaluator";
import { CompleteTurn, MoveGenerator } from "./moveGenerator";
import { TranspositionTable } from "./transposition";
import { GameState } from "./types";

/**
 * Search statistics
 */
export type SearchStats = {
  nodes: number; // Total nodes searched
  qnodes: number; // Quiescence nodes
  ttHits: number; // Transposition table hits
  ttStores: number; // Transposition table stores
  cutoffs: number; // Beta cutoffs
  depth: number; // Depth reached
  timeMs: number; // Time elapsed
  nps: number; // Nodes per second
};

/**
 * Search result
 */
export type SearchResult = {
  bestMove: CompleteTurn | null;
  score: number;
  depth: number;
  pvLine: string[]; // Principal variation (sequence of best moves)
  stats: SearchStats;
};

/**
 * Alpha-beta search with iterative deepening
 */
export class Search {
  private transpositionTable: TranspositionTable;
  private stats: SearchStats;
  private startTime: number;
  private timeLimit: number; // milliseconds
  private aborted: boolean;

  constructor(ttSizeMB: number = 128) {
    this.transpositionTable = new TranspositionTable(ttSizeMB);
    this.stats = this.createEmptyStats();
    this.startTime = 0;
    this.timeLimit = Infinity;
    this.aborted = false;
  }

  /**
   * Main search entry point with iterative deepening
   */
  searchIterativeDeepening(
    gameState: GameState,
    currentPlayer: string,
    maxDepth: number = 10,
    timeLimitMs: number = 5000
  ): SearchResult {
    this.startTime = Date.now();
    this.timeLimit = timeLimitMs;
    this.aborted = false;
    this.stats = this.createEmptyStats();

    let bestResult: SearchResult | null = null;

    // Iterative deepening: search depth 1, 2, 3, ... up to maxDepth
    for (let depth = 1; depth <= maxDepth; depth++) {
      if (this.shouldAbort()) break;

      const result = this.searchRoot(gameState, currentPlayer, depth);

      // If search completed (not aborted), update best result
      if (!this.aborted) {
        bestResult = result;
        bestResult.stats = this.finalizeStats(this.stats, depth);
      }

      // Break if we found a forced mate
      if (
        bestResult &&
        Math.abs(bestResult.score) > Evaluator.CHECKMATE_SCORE / 2
      ) {
        break;
      }
    }

    // If no result (e.g., immediate abort), return a default
    if (!bestResult) {
      const allMoves = MoveGenerator.generateAllLegalTurns(
        gameState,
        currentPlayer
      );
      return {
        bestMove: allMoves[0] || null,
        score: 0,
        depth: 0,
        pvLine: [],
        stats: this.finalizeStats(this.stats, 0),
      };
    }

    return bestResult;
  }

  /**
   * Search from root position at given depth
   */
  private searchRoot(
    gameState: GameState,
    currentPlayer: string,
    depth: number
  ): SearchResult {
    const allMoves = MoveGenerator.generateAllLegalTurns(
      gameState,
      currentPlayer
    );

    if (allMoves.length === 0) {
      // No legal moves - opponent wins
      return {
        bestMove: null,
        score: -Evaluator.CHECKMATE_SCORE,
        depth,
        pvLine: [],
        stats: this.stats,
      };
    }

    // Order moves for better pruning
    const orderedMoves = MoveGenerator.orderMoves(allMoves, currentPlayer);

    let alpha = -Infinity;
    const beta = Infinity;
    let bestMove = orderedMoves[0];
    let bestScore = -Infinity;
    const pvLine: string[] = [];

    // Track top moves for randomness
    const topMoves: Array<{ move: CompleteTurn; score: number }> = [];

    for (const move of orderedMoves) {
      if (this.shouldAbort()) break;

      // Apply move
      const newGameState: GameState = {
        ...gameState,
        board_state: move.finalBoardState,
      };
      const nextPlayer = currentPlayer === "white" ? "black" : "white";

      // Search
      const score = -this.alphaBeta(
        newGameState,
        nextPlayer,
        depth - 1,
        -beta,
        -alpha,
        false
      );

      // Track top moves (within 20 points of best)
      topMoves.push({ move, score });

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
        alpha = Math.max(alpha, score);
      }
    }

    // Add randomness: 20% chance to pick from top 3 moves instead of best
    if (Math.random() < 0.2 && topMoves.length > 1) {
      topMoves.sort((a, b) => b.score - a.score);
      const topThree = topMoves.slice(0, Math.min(3, topMoves.length));
      const randomPick = topThree[Math.floor(Math.random() * topThree.length)];
      bestMove = randomPick.move;
      bestScore = randomPick.score;
    }

    // Store in transposition table
    const zobristKey = this.transpositionTable.computeHash(
      gameState,
      currentPlayer
    );
    this.transpositionTable.store(
      zobristKey,
      depth,
      bestScore,
      "exact",
      bestMove.notation
    );
    this.stats.ttStores++;

    pvLine.unshift(bestMove.notation);

    return {
      bestMove,
      score: bestScore,
      depth,
      pvLine,
      stats: this.stats,
    };
  }

  /**
   * Alpha-beta search (negamax formulation)
   */
  private alphaBeta(
    gameState: GameState,
    currentPlayer: string,
    depth: number,
    alpha: number,
    beta: number,
    isQuiescence: boolean
  ): number {
    if (this.shouldAbort()) return 0;

    this.stats.nodes++;
    if (isQuiescence) this.stats.qnodes++;

    // Check transposition table
    const zobristKey = this.transpositionTable.computeHash(
      gameState,
      currentPlayer
    );
    const ttEntry = this.transpositionTable.probe(zobristKey);

    if (ttEntry && ttEntry.depth >= depth) {
      this.stats.ttHits++;

      if (ttEntry.flag === "exact") {
        return ttEntry.score;
      } else if (ttEntry.flag === "lowerbound") {
        alpha = Math.max(alpha, ttEntry.score);
      } else if (ttEntry.flag === "upperbound") {
        beta = Math.min(beta, ttEntry.score);
      }

      if (alpha >= beta) {
        this.stats.cutoffs++;
        return ttEntry.score;
      }
    }

    // Terminal depth or quiescence search
    if (depth <= 0) {
      // Enter quiescence search to avoid horizon effect
      if (!isQuiescence) {
        return this.quiescence(gameState, currentPlayer, alpha, beta);
      } else {
        // Leaf node evaluation
        const score = Evaluator.evaluate(gameState, currentPlayer);
        return currentPlayer === "white" ? score : -score;
      }
    }

    // Generate all legal moves
    const allMoves = MoveGenerator.generateAllLegalTurns(
      gameState,
      currentPlayer
    );

    // Terminal position (no moves)
    if (allMoves.length === 0) {
      return -Evaluator.CHECKMATE_SCORE + depth; // Prefer longer mates
    }

    // Order moves
    const orderedMoves = MoveGenerator.orderMoves(allMoves, currentPlayer);

    let bestScore = -Infinity;
    let bestMoveNotation: string | undefined;
    let flag: "exact" | "lowerbound" | "upperbound" = "upperbound";

    for (const move of orderedMoves) {
      if (this.shouldAbort()) break;

      // Apply move
      const newGameState: GameState = {
        ...gameState,
        board_state: move.finalBoardState,
      };
      const nextPlayer = currentPlayer === "white" ? "black" : "white";

      // Recursive search
      const score = -this.alphaBeta(
        newGameState,
        nextPlayer,
        depth - 1,
        -beta,
        -alpha,
        false
      );

      if (score > bestScore) {
        bestScore = score;
        bestMoveNotation = move.notation;
      }

      alpha = Math.max(alpha, score);

      if (alpha >= beta) {
        // Beta cutoff
        this.stats.cutoffs++;
        flag = "lowerbound";
        break;
      }

      flag = "exact";
    }

    // Store in transposition table
    this.transpositionTable.store(
      zobristKey,
      depth,
      bestScore,
      flag,
      bestMoveNotation
    );
    this.stats.ttStores++;

    return bestScore;
  }

  /**
   * Quiescence search to resolve tactical sequences
   * Only considers captures to avoid horizon effect
   */
  private quiescence(
    gameState: GameState,
    currentPlayer: string,
    alpha: number,
    beta: number
  ): number {
    if (this.shouldAbort()) return 0;

    this.stats.qnodes++;

    // Stand-pat score (evaluation without further moves)
    const standPat = Evaluator.evaluate(gameState, currentPlayer);
    const score = currentPlayer === "white" ? standPat : -standPat;

    if (score >= beta) {
      return score;
    }

    alpha = Math.max(alpha, score);

    // Generate only capture moves
    const allMoves = MoveGenerator.generateAllLegalTurns(
      gameState,
      currentPlayer
    );
    const captureMoves = allMoves.filter((m) => m.capturedSquares.length > 0);

    if (captureMoves.length === 0) {
      return score; // No captures available
    }

    // Order captures by number of pieces captured
    const orderedCaptures = captureMoves.sort(
      (a, b) => b.capturedSquares.length - a.capturedSquares.length
    );

    for (const move of orderedCaptures) {
      if (this.shouldAbort()) break;

      // Apply move
      const newGameState: GameState = {
        ...gameState,
        board_state: move.finalBoardState,
      };
      const nextPlayer = currentPlayer === "white" ? "black" : "white";

      // Recursive quiescence search
      const moveScore = -this.quiescence(newGameState, nextPlayer, -beta, -alpha);

      alpha = Math.max(alpha, moveScore);

      if (alpha >= beta) {
        this.stats.cutoffs++;
        return alpha; // Beta cutoff
      }
    }

    return alpha;
  }

  /**
   * Check if search should be aborted (time limit)
   */
  private shouldAbort(): boolean {
    if (this.aborted) return true;

    const elapsed = Date.now() - this.startTime;
    if (elapsed >= this.timeLimit) {
      this.aborted = true;
      return true;
    }

    return false;
  }

  /**
   * Clear transposition table
   */
  clearTranspositionTable(): void {
    this.transpositionTable.clear();
  }

  /**
   * Get transposition table statistics
   */
  getTranspositionTableStats() {
    return this.transpositionTable.getStats();
  }

  /**
   * Create empty stats object
   */
  private createEmptyStats(): SearchStats {
    return {
      nodes: 0,
      qnodes: 0,
      ttHits: 0,
      ttStores: 0,
      cutoffs: 0,
      depth: 0,
      timeMs: 0,
      nps: 0,
    };
  }

  /**
   * Finalize stats (calculate derived values)
   */
  private finalizeStats(stats: SearchStats, depth: number): SearchStats {
    const timeMs = Date.now() - this.startTime;
    const nps = timeMs > 0 ? Math.floor((stats.nodes * 1000) / timeMs) : 0;

    return {
      ...stats,
      depth,
      timeMs,
      nps,
    };
  }
}

