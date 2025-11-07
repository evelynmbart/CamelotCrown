/**
 * Chivalry Game Logic
 *
 * This file contains the core game rules and logic for Chivalry, a chess-like game
 * played on a diamond-shaped board with 176 squares.
 *
 * Key concepts:
 * - Plain moves: Move one square in any direction
 * - Courser moves: Jump over a friendly piece to land 2 squares away
 * - Jump moves: Capture by jumping over an enemy piece
 * - Castle squares: G1/H1 (white) and G16/H16 (black)
 * - Win conditions: Occupy opponent's castle with 2 pieces OR capture all enemy pieces
 */

// ============================================================================
// TYPES
// ============================================================================

type BoardState = Record<string, { type: string; color: string } | null>;

type GameData = {
  white_castle_moves: number;
  black_castle_moves: number;
  board_state: BoardState;
};

type MoveResult = {
  success: boolean;
  newBoardState?: BoardState;
  moveNotation?: string;
  moveType?: string;
  capturedPieces?: string[];
  isCastleMove?: boolean;
  error?: string;
};

// ============================================================================
// CONSTANTS
// ============================================================================

/** All valid squares on the Chivalry board (176 squares in diamond shape) */
const ALL_SQUARES = [
  "G1",
  "H1",
  "D2",
  "E2",
  "F2",
  "G2",
  "H2",
  "I2",
  "J2",
  "K2",
  "C3",
  "D3",
  "E3",
  "F3",
  "G3",
  "H3",
  "I3",
  "J3",
  "K3",
  "L3",
  "B4",
  "C4",
  "D4",
  "E4",
  "F4",
  "G4",
  "H4",
  "I4",
  "J4",
  "K4",
  "L4",
  "M4",
  "A5",
  "B5",
  "C5",
  "D5",
  "E5",
  "F5",
  "G5",
  "H5",
  "I5",
  "J5",
  "K5",
  "L5",
  "M5",
  "N5",
  "A6",
  "B6",
  "C6",
  "D6",
  "E6",
  "F6",
  "G6",
  "H6",
  "I6",
  "J6",
  "K6",
  "L6",
  "M6",
  "N6",
  "A7",
  "B7",
  "C7",
  "D7",
  "E7",
  "F7",
  "G7",
  "H7",
  "I7",
  "J7",
  "K7",
  "L7",
  "M7",
  "N7",
  "A8",
  "B8",
  "C8",
  "D8",
  "E8",
  "F8",
  "G8",
  "H8",
  "I8",
  "J8",
  "K8",
  "L8",
  "M8",
  "N8",
  "A9",
  "B9",
  "C9",
  "D9",
  "E9",
  "F9",
  "G9",
  "H9",
  "I9",
  "J9",
  "K9",
  "L9",
  "M9",
  "N9",
  "A10",
  "B10",
  "C10",
  "D10",
  "E10",
  "F10",
  "G10",
  "H10",
  "I10",
  "J10",
  "K10",
  "L10",
  "M10",
  "N10",
  "A11",
  "B11",
  "C11",
  "D11",
  "E11",
  "F11",
  "G11",
  "H11",
  "I11",
  "J11",
  "K11",
  "L11",
  "M11",
  "N11",
  "A12",
  "B12",
  "C12",
  "D12",
  "E12",
  "F12",
  "G12",
  "H12",
  "I12",
  "J12",
  "K12",
  "L12",
  "M12",
  "N12",
  "B13",
  "C13",
  "D13",
  "E13",
  "F13",
  "G13",
  "H13",
  "I13",
  "J13",
  "K13",
  "L13",
  "M13",
  "C14",
  "D14",
  "E14",
  "F14",
  "G14",
  "H14",
  "I14",
  "J14",
  "K14",
  "L14",
  "D15",
  "E15",
  "F15",
  "G15",
  "H15",
  "I15",
  "J15",
  "K15",
  "G16",
  "H16",
];

/** White castle squares (bottom of board) */
const WHITE_CASTLE = ["G1", "H1"];

/** Black castle squares (top of board) */
const BLACK_CASTLE = ["G16", "H16"];

/** All 8 directions: horizontal, vertical, and diagonal */
const DIRECTIONS: [number, number][] = [
  [0, 1],
  [0, -1], // vertical
  [1, 0],
  [-1, 0], // horizontal
  [1, 1],
  [-1, -1], // diagonal down-right, up-left
  [1, -1],
  [-1, 1], // diagonal down-left, up-right
];

/** Starting positions for white pieces */
const WHITE_KNIGHTS = ["C6", "D6", "K6", "L6", "C7", "D7", "K7", "L7"];
const WHITE_MEN = [
  "E6",
  "E7",
  "F6",
  "F7",
  "G6",
  "G7",
  "H6",
  "H7",
  "I6",
  "I7",
  "J6",
  "J7",
];

/** Starting positions for black pieces */
const BLACK_KNIGHTS = ["C10", "D10", "K10", "L10", "C11", "D11", "K11", "L11"];
const BLACK_MEN = [
  "E10",
  "E11",
  "F10",
  "F11",
  "G10",
  "G11",
  "H10",
  "H11",
  "I10",
  "I11",
  "J10",
  "J11",
];

// ============================================================================
// COORDINATE UTILITIES
// ============================================================================

/**
 * Parse square notation (e.g., "E6") to coordinates
 * @returns {file, rank} where file is 0-13 (A-N) and rank is 1-16
 */
function parseSquare(square: string): { file: number; rank: number } {
  const file = square.charCodeAt(0) - 65; // A=0, B=1, ..., N=13
  const rank = Number.parseInt(square.slice(1));
  return { file, rank };
}

/**
 * Convert coordinates back to square notation
 */
function toSquare(file: number, rank: number): string {
  return String.fromCharCode(65 + file) + rank;
}

/**
 * Check if a square exists on the board
 */
function isValidSquare(square: string): boolean {
  return ALL_SQUARES.includes(square);
}

/**
 * Get the adjacent square in a given direction
 * @param direction [fileOffset, rankOffset] e.g., [1, 0] for one square right
 * @returns The adjacent square or null if it doesn't exist
 */
function getAdjacentSquare(
  square: string,
  direction: [number, number]
): string | null {
  const { file, rank } = parseSquare(square);
  const newFile = file + direction[0];
  const newRank = rank + direction[1];
  const newSquare = toSquare(newFile, newRank);
  return isValidSquare(newSquare) ? newSquare : null;
}

// ============================================================================
// MOVE CALCULATION
// ============================================================================

/**
 * Calculate all legal moves for a piece at the given square
 *
 * Move types:
 * - Plain: Move one square in any direction (cannot enter own castle)
 * - Courser: Jump over a friendly piece to land 2 squares away
 * - Jump: Capture by jumping over an enemy piece to land 2 squares away
 */
export function calculateLegalMoves(
  square: string,
  boardState: BoardState,
  playerColor: string,
  game: GameData
): string[] {
  const piece = boardState[square];
  if (!piece || piece.color !== playerColor) return [];

  const moves: string[] = [];
  const ownCastle = playerColor === "white" ? WHITE_CASTLE : BLACK_CASTLE;

  // Check all 8 directions
  for (const direction of DIRECTIONS) {
    const adjacent = getAdjacentSquare(square, direction);
    if (!adjacent) continue;

    const adjacentPiece = boardState[adjacent];

    // PLAIN MOVE: One square to an empty square (not own castle)
    if (!adjacentPiece && !ownCastle.includes(adjacent)) {
      moves.push(adjacent);
    }

    // COURSER MOVE: Jump over friendly piece
    if (adjacentPiece?.color === playerColor) {
      const landing = getAdjacentSquare(adjacent, direction);
      if (landing && !boardState[landing]) {
        moves.push(landing);
      }
    }

    // JUMP MOVE: Capture by jumping over enemy piece
    if (adjacentPiece?.color !== playerColor && adjacentPiece) {
      const landing = getAdjacentSquare(adjacent, direction);
      if (landing && !boardState[landing]) {
        moves.push(landing);
      }
    }
  }

  return moves;
}

// ============================================================================
// MOVE EXECUTION
// ============================================================================

/**
 * Execute a move and return the new board state
 *
 * @returns Result object with success status, new board state, and move details
 */
export function makeMove(
  from: string,
  to: string,
  boardState: BoardState,
  playerColor: string,
  game: GameData
): MoveResult {
  const piece = boardState[from];
  if (!piece || piece.color !== playerColor) {
    return { success: false, error: "Invalid piece" };
  }

  // Parse move details
  const { file: fromFile, rank: fromRank } = parseSquare(from);
  const { file: toFile, rank: toRank } = parseSquare(to);
  const distance = Math.max(
    Math.abs(toFile - fromFile),
    Math.abs(toRank - fromRank)
  );

  const direction: [number, number] = [
    toFile > fromFile ? 1 : toFile < fromFile ? -1 : 0,
    toRank > fromRank ? 1 : toRank < fromRank ? -1 : 0,
  ];

  // Determine move type and handle captures
  const newBoardState = { ...boardState };
  const capturedPieces: string[] = [];
  let moveType = "plain";
  let moveNotation = `${from}-${to}`;

  if (distance === 1) {
    // PLAIN MOVE: one square
    if (boardState[to]) {
      return { success: false, error: "Square occupied" };
    }
    moveType = "plain";
  } else if (distance === 2) {
    // COURSER or JUMP: two squares
    const middle = getAdjacentSquare(from, direction);

    if (middle && boardState[middle]) {
      const middlePiece = boardState[middle];

      if (middlePiece.color === playerColor) {
        // COURSER: jumping over friendly piece
        moveType = "Courser";
      } else {
        // JUMP: capturing enemy piece
        moveType = "jump";
        moveNotation = `${from}x${to}`;
        capturedPieces.push(middle);
        newBoardState[middle] = null;
      }
    }
  }

  // Execute the move
  newBoardState[to] = piece;
  newBoardState[from] = null;

  // Check if move is into a castle square
  const ownCastle = playerColor === "white" ? WHITE_CASTLE : BLACK_CASTLE;
  const isCastleMove = ownCastle.includes(to);

  return {
    success: true,
    newBoardState,
    moveNotation,
    moveType,
    capturedPieces,
    isCastleMove,
  };
}

// ============================================================================
// WIN CONDITION CHECKING
// ============================================================================

/**
 * Check if the current player has won the game
 *
 * Win conditions:
 * 1. Castle occupation: 2 or more pieces in opponent's castle
 * 2. Capture all: Opponent has no pieces remaining
 *
 * @returns Win reason string or null if no win
 */
export function checkWinCondition(
  boardState: BoardState,
  game: GameData,
  playerColor: string
): string | null {
  const opponentColor = playerColor === "white" ? "black" : "white";
  const opponentCastle = playerColor === "white" ? BLACK_CASTLE : WHITE_CASTLE;

  // WIN CONDITION 1: Castle Occupation
  const piecesInCastle = opponentCastle.filter(
    (square) => boardState[square]?.color === playerColor
  ).length;

  if (piecesInCastle >= 2) {
    return "castle_occupation";
  }

  // WIN CONDITION 2: Capture All
  const opponentPieces = ALL_SQUARES.filter(
    (square) => boardState[square]?.color === opponentColor
  ).length;

  if (opponentPieces === 0) {
    return "capture_all";
  }

  return null;
}

// ============================================================================
// BOARD STATE RECONSTRUCTION
// ============================================================================

/**
 * Reconstruct board state from move history up to a specific move index
 * This is used for viewing previous moves in the game
 *
 * @param moveHistory Array of move notations (e.g., ["E6-E7", "E10xE8"])
 * @param moveIndex Number of moves to apply (0 = initial state)
 */
export function reconstructBoardState(
  moveHistory: string[],
  moveIndex: number
): BoardState {
  const boardState = getInitialBoardState();

  // Apply each move in sequence
  for (let i = 0; i < moveIndex; i++) {
    const move = moveHistory[i];

    // Parse move notation: "E6-E7" or "E6xE8"
    const isCapture = move.includes("x");
    const parts = move.split(isCapture ? "x" : "-");
    if (parts.length !== 2) continue;

    const [from, to] = parts;

    // Move the piece
    if (boardState[from]) {
      boardState[to] = boardState[from];
      boardState[from] = null;

      // Handle capture (remove the jumped-over piece)
      if (isCapture) {
        const { file: fromFile, rank: fromRank } = parseSquare(from);
        const { file: toFile, rank: toRank } = parseSquare(to);
        const direction: [number, number] = [
          toFile > fromFile ? 1 : toFile < fromFile ? -1 : 0,
          toRank > fromRank ? 1 : toRank < fromRank ? -1 : 0,
        ];
        const middle = getAdjacentSquare(from, direction);
        if (middle) {
          boardState[middle] = null;
        }
      }
    }
  }

  return boardState;
}

// ============================================================================
// INITIAL BOARD SETUP
// ============================================================================

/**
 * Create the initial board state for a new game
 *
 * Board layout:
 * - White pieces: Ranks 6-7
 * - Black pieces: Ranks 10-11
 * - White castle: G1, H1
 * - Black castle: G16, H16
 */
export function getInitialBoardState(): BoardState {
  const board: BoardState = {};

  // Initialize all squares as empty
  ALL_SQUARES.forEach((square) => {
    board[square] = null;
  });

  // Place white pieces
  WHITE_KNIGHTS.forEach((square) => {
    board[square] = { type: "knight", color: "white" };
  });
  WHITE_MEN.forEach((square) => {
    board[square] = { type: "man", color: "white" };
  });

  // Place black pieces
  BLACK_KNIGHTS.forEach((square) => {
    board[square] = { type: "knight", color: "black" };
  });
  BLACK_MEN.forEach((square) => {
    board[square] = { type: "man", color: "black" };
  });

  return board;
}
