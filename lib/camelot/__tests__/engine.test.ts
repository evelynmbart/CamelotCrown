import { beforeEach, describe, expect, it } from "vitest";
import { Board } from "../board";
import { CamelotEngine } from "../engine";
import { Evaluator } from "../evaluator";
import { MoveGenerator } from "../moveGenerator";
import { TranspositionTable } from "../transposition";
import { GameState } from "../types";

describe("MoveGenerator", () => {
  let initialGameState: GameState;

  beforeEach(() => {
    initialGameState = {
      white_castle_moves: 0,
      black_castle_moves: 0,
      board_state: Board.getInitialBoardState(),
    };
  });

  it("should generate legal moves from starting position", () => {
    const whiteMoves = MoveGenerator.generateAllLegalTurns(
      initialGameState,
      "white"
    );
    const blackMoves = MoveGenerator.generateAllLegalTurns(
      initialGameState,
      "black"
    );

    expect(whiteMoves.length).toBeGreaterThan(0);
    expect(blackMoves.length).toBeGreaterThan(0);
  });

  it("should not generate duplicate moves", () => {
    const moves = MoveGenerator.generateAllLegalTurns(
      initialGameState,
      "white"
    );

    const notations = moves.map((m) => m.notation);
    const uniqueNotations = new Set(notations);

    expect(notations.length).toBe(uniqueNotations.size);
  });

  it("should generate moves quickly (< 100ms)", () => {
    const start = Date.now();
    MoveGenerator.generateAllLegalTurns(initialGameState, "white");
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100);
  });

  it("should properly identify when a player has moves", () => {
    expect(MoveGenerator.hasLegalMoves(initialGameState, "white")).toBe(true);
    expect(MoveGenerator.hasLegalMoves(initialGameState, "black")).toBe(true);
  });

  it("should order moves with captures first", () => {
    const moves = MoveGenerator.generateAllLegalTurns(
      initialGameState,
      "white"
    );
    const ordered = MoveGenerator.orderMoves(moves, "white");

    // If there are captures, they should be first
    const firstCapture = ordered.findIndex((m) => m.capturedSquares.length > 0);
    const firstNonCapture = ordered.findIndex(
      (m) => m.capturedSquares.length === 0
    );

    if (firstCapture >= 0 && firstNonCapture >= 0) {
      expect(firstCapture).toBeLessThan(firstNonCapture);
    }
  });
});

describe("Evaluator", () => {
  let initialGameState: GameState;

  beforeEach(() => {
    initialGameState = {
      white_castle_moves: 0,
      black_castle_moves: 0,
      board_state: Board.getInitialBoardState(),
    };
  });

  it("should evaluate starting position as roughly equal", () => {
    const score = Evaluator.evaluate(initialGameState, "white");

    // Starting position should be close to 0 (within ±50 due to randomness)
    expect(Math.abs(score)).toBeLessThan(50);
  });

  it("should value white pieces positively and black negatively", () => {
    // Create a position with only white pieces
    const whiteOnlyState: GameState = {
      white_castle_moves: 0,
      black_castle_moves: 0,
      board_state: {
        ...Board.getInitialBoardState(),
      },
    };

    // Remove all black pieces
    for (const square of Board.ALL_SQUARES) {
      if (whiteOnlyState.board_state[square]?.color === "black") {
        whiteOnlyState.board_state[square] = null;
      }
    }

    const score = Evaluator.evaluate(whiteOnlyState, "white");
    expect(score).toBeGreaterThan(1000); // Should be heavily positive
  });

  it("should detect checkmate", () => {
    // Create a won position (two pieces in enemy castle)
    const wonState: GameState = {
      white_castle_moves: 0,
      black_castle_moves: 0,
      board_state: {},
    };

    // Initialize empty board
    for (const square of Board.ALL_SQUARES) {
      wonState.board_state[square] = null;
    }

    // Put two white pieces in black castle
    wonState.board_state["F16"] = { type: "knight", color: "white" };
    wonState.board_state["G16"] = { type: "knight", color: "white" };

    const score = Evaluator.evaluate(wonState, "white");
    expect(score).toBe(Evaluator.CHECKMATE_SCORE);
  });
});

describe("TranspositionTable", () => {
  it("should store and retrieve entries", () => {
    const tt = new TranspositionTable(1); // 1MB

    const gameState: GameState = {
      white_castle_moves: 0,
      black_castle_moves: 0,
      board_state: Board.getInitialBoardState(),
    };

    const hash = tt.computeHash(gameState, "white");

    tt.store(hash, 5, 100, "exact", "E6-E7");

    const entry = tt.probe(hash);
    expect(entry).toBeDefined();
    expect(entry?.depth).toBe(5);
    expect(entry?.score).toBe(100);
    expect(entry?.flag).toBe("exact");
  });

  it("should compute different hashes for different positions", () => {
    const tt = new TranspositionTable(1);

    const state1: GameState = {
      white_castle_moves: 0,
      black_castle_moves: 0,
      board_state: Board.getInitialBoardState(),
    };

    const state2: GameState = {
      white_castle_moves: 0,
      black_castle_moves: 0,
      board_state: { ...Board.getInitialBoardState() },
    };

    // Modify state2
    state2.board_state["E6"] = null;

    const hash1 = tt.computeHash(state1, "white");
    const hash2 = tt.computeHash(state2, "white");

    expect(hash1).not.toBe(hash2);
  });

  it("should compute different hashes for different players to move", () => {
    const tt = new TranspositionTable(1);

    const gameState: GameState = {
      white_castle_moves: 0,
      black_castle_moves: 0,
      board_state: Board.getInitialBoardState(),
    };

    const hashWhite = tt.computeHash(gameState, "white");
    const hashBlack = tt.computeHash(gameState, "black");

    expect(hashWhite).not.toBe(hashBlack);
  });
});

describe("CamelotEngine", () => {
  let engine: CamelotEngine;
  let initialGameState: GameState;

  beforeEach(() => {
    engine = new CamelotEngine({
      maxDepth: 3,
      timeLimitMs: 500,
      ttSizeMB: 16,
    });

    initialGameState = {
      white_castle_moves: 0,
      black_castle_moves: 0,
      board_state: Board.getInitialBoardState(),
    };
  });

  it("should return a valid move from starting position", () => {
    const analysis = engine.getBestMove(initialGameState, "white");

    expect(analysis.bestMove).toBeDefined();
    expect(analysis.bestMove?.notation).toBeTruthy();
    expect(analysis.depth).toBeGreaterThan(0);
  });

  it("should respect time limits", () => {
    const start = Date.now();
    engine.getBestMove(initialGameState, "white");
    const elapsed = Date.now() - start;

    // Should complete within time limit + some buffer
    expect(elapsed).toBeLessThan(1000);
  });

  it("should search deeper with more time", () => {
    const quickEngine = new CamelotEngine({
      maxDepth: 2,
      timeLimitMs: 100,
    });

    const deepEngine = new CamelotEngine({
      maxDepth: 5,
      timeLimitMs: 2000,
    });

    const quickResult = quickEngine.getBestMove(initialGameState, "white");
    const deepResult = deepEngine.getBestMove(initialGameState, "white");

    expect(deepResult.depth).toBeGreaterThanOrEqual(quickResult.depth);
  });

  it("should return consistent results for same position", () => {
    // Disable randomness temporarily by setting Math.random to 0.5
    const originalRandom = Math.random;
    Math.random = () => 0.5;

    const result1 = engine.getBestMove(initialGameState, "white");
    const result2 = engine.getBestMove(initialGameState, "white");

    // Scores should be similar (within ±50 due to any remaining randomness)
    expect(Math.abs(result1.evaluation - result2.evaluation)).toBeLessThan(50);

    Math.random = originalRandom;
  });

  it("should prefer captures when available", () => {
    // Create a position where a capture is available
    const captureState: GameState = {
      white_castle_moves: 0,
      black_castle_moves: 0,
      board_state: {},
    };

    // Initialize empty board
    for (const square of Board.ALL_SQUARES) {
      captureState.board_state[square] = null;
    }

    // White knight can capture black man
    captureState.board_state["E6"] = { type: "knight", color: "white" };
    captureState.board_state["F7"] = { type: "man", color: "black" };
    captureState.board_state["G8"] = null; // Can jump to G8

    // Also add pieces elsewhere so game isn't over
    captureState.board_state["A4"] = { type: "man", color: "white" };
    captureState.board_state["L13"] = { type: "man", color: "black" };

    const analysis = engine.getBestMove(captureState, "white");

    // The best move should involve a capture
    expect(analysis.bestMove?.capturedSquares.length).toBeGreaterThan(0);
  });

  it("should have non-zero evaluation", () => {
    const analysis = engine.getBestMove(initialGameState, "white");

    // Evaluation should be computed (not 0)
    expect(analysis.evaluation).not.toBe(0);
  });

  it("should expose configuration", () => {
    const config = engine.getConfig();

    expect(config.maxDepth).toBe(3);
    expect(config.timeLimitMs).toBe(500);
    expect(config.ttSizeMB).toBe(16);
  });

  it("should provide difficulty presets", () => {
    const easy = CamelotEngine.getDifficultyPreset("easy");
    const expert = CamelotEngine.getDifficultyPreset("expert");

    expect(easy.maxDepth).toBeLessThan(expert.maxDepth!);
    expect(easy.timeLimitMs).toBeLessThan(expert.timeLimitMs!);
  });
});
