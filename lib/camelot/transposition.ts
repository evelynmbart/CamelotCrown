import { Board } from "./board";
import { GameState } from "./types";

/**
 * Transposition table entry
 */
export type TTEntry = {
  zobristKey: bigint;
  depth: number;
  score: number;
  flag: "exact" | "lowerbound" | "upperbound"; // Alpha, beta, or exact
  bestMoveNotation?: string;
};

/**
 * Transposition table with Zobrist hashing
 */
export class TranspositionTable {
  private table: Map<string, TTEntry>;
  private readonly maxSize: number;

  // Zobrist hash tables (using BigInt for 64-bit hashing)
  private pieceKeys: Map<string, bigint>; // key: "square-type-color" -> hash
  private turnKey: bigint = BigInt(0); // XOR when it's black's turn
  private whiteCastleKeys: bigint[]; // For white castle move count
  private blackCastleKeys: bigint[]; // For black castle move count

  constructor(maxSizeMB: number = 128) {
    // Calculate max entries (each entry ~100 bytes)
    this.maxSize = (maxSizeMB * 1024 * 1024) / 100;
    this.table = new Map();
    this.pieceKeys = new Map();
    this.whiteCastleKeys = [];
    this.blackCastleKeys = [];

    // Initialize Zobrist keys
    this.initializeZobristKeys();
  }

  /**
   * Initialize random Zobrist keys for hashing
   */
  private initializeZobristKeys(): void {
    // Generate random 64-bit numbers for each piece on each square
    const pieceTypes = ["man", "knight"];
    const colors = ["white", "black"];

    for (const square of Board.ALL_SQUARES) {
      for (const type of pieceTypes) {
        for (const color of colors) {
          const key = `${square}-${type}-${color}`;
          this.pieceKeys.set(key, this.randomBigInt());
        }
      }
    }

    // Turn key (for black to move)
    this.turnKey = this.randomBigInt();

    // Castle move count keys (0-2 moves used typically)
    for (let i = 0; i < 3; i++) {
      this.whiteCastleKeys.push(this.randomBigInt());
      this.blackCastleKeys.push(this.randomBigInt());
    }
  }

  /**
   * Generate a random 64-bit BigInt
   */
  private randomBigInt(): bigint {
    // Generate two random 32-bit numbers and combine them
    const high = BigInt(Math.floor(Math.random() * 0x100000000));
    const low = BigInt(Math.floor(Math.random() * 0x100000000));
    return (high << BigInt(32)) | low;
  }

  /**
   * Compute Zobrist hash for a game state
   */
  computeHash(gameState: GameState, currentPlayer: string): bigint {
    let hash = BigInt(0);

    // Hash all pieces
    for (const square of Board.ALL_SQUARES) {
      const piece = gameState.board_state[square];
      if (piece) {
        const key = `${square}-${piece.type}-${piece.color}`;
        const pieceHash = this.pieceKeys.get(key);
        if (pieceHash) {
          hash ^= pieceHash;
        }
      }
    }

    // Hash turn
    if (currentPlayer === "black") {
      hash ^= this.turnKey;
    }

    // Hash castle move counts
    if (
      gameState.white_castle_moves > 0 &&
      gameState.white_castle_moves <= this.whiteCastleKeys.length
    ) {
      hash ^= this.whiteCastleKeys[gameState.white_castle_moves - 1];
    }
    if (
      gameState.black_castle_moves > 0 &&
      gameState.black_castle_moves <= this.blackCastleKeys.length
    ) {
      hash ^= this.blackCastleKeys[gameState.black_castle_moves - 1];
    }

    return hash;
  }

  /**
   * Store a position in the transposition table
   */
  store(
    zobristKey: bigint,
    depth: number,
    score: number,
    flag: "exact" | "lowerbound" | "upperbound",
    bestMoveNotation?: string
  ): void {
    const key = zobristKey.toString();

    // Replace-by-depth strategy: only replace if new depth >= old depth
    const existing = this.table.get(key);
    if (existing && existing.depth > depth) {
      return;
    }

    this.table.set(key, {
      zobristKey,
      depth,
      score,
      flag,
      bestMoveNotation,
    });

    // Evict oldest entries if table is too large
    if (this.table.size > this.maxSize) {
      const firstKey = this.table.keys().next().value;
      if (firstKey) {
        this.table.delete(firstKey);
      }
    }
  }

  /**
   * Probe the transposition table
   */
  probe(zobristKey: bigint): TTEntry | undefined {
    return this.table.get(zobristKey.toString());
  }

  /**
   * Clear the transposition table
   */
  clear(): void {
    this.table.clear();
  }

  /**
   * Get table statistics
   */
  getStats(): { size: number; maxSize: number; fillRate: number } {
    return {
      size: this.table.size,
      maxSize: this.maxSize,
      fillRate: this.table.size / this.maxSize,
    };
  }
}
