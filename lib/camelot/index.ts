import { Board } from "./board";
import { Coordinates } from "./coordinates";
import { CamelotEngine } from "./engine";
import { Evaluator } from "./evaluator";
import { Logic } from "./logic";
import { MoveGenerator } from "./moveGenerator";

export class Camelot {
  static readonly Board = Board;
  static readonly Coordinates = Coordinates;
  static readonly Logic = Logic;
  static readonly Engine = CamelotEngine;
  static readonly Evaluator = Evaluator;
  static readonly MoveGenerator = MoveGenerator;
}

// Export types
export type { EngineAnalysis, EngineConfig } from "./engine";
export type { CompleteTurn } from "./moveGenerator";
export type { SearchResult, SearchStats } from "./search";
export type { TTEntry } from "./transposition";

// Export classes for direct use
export { CamelotEngine } from "./engine";
export { Evaluator } from "./evaluator";
export { MoveGenerator } from "./moveGenerator";
export { Search } from "./search";
export { TranspositionTable } from "./transposition";
