/**
 * Camelot Game Logic - Clean Implementation
 *
 * Key Concepts:
 * - Turns consist of one or more steps (plain move, canter chain, jump chain, knight's charge)
 * - Canters are optional and can chain, but cannot return to starting square
 * - Jumps are mandatory and must continue if possible
 * - Knight's Charge: canter(s) then jump(s) in one turn
 */

// ============================================================================
// TYPES
// ============================================================================

export type BoardState = Record<string, { type: string; color: string } | null>;

export type GameData = {
  white_castle_moves: number;
  black_castle_moves: number;
  board_state: BoardState;
};

export type TurnState = {
  moves: string[]; // Squares visited this turn [start, intermediate..., current]
  capturedSquares: string[]; // Squares where pieces were captured
  mustContinue: boolean; // Must continue moving (mandatory jump continuation)
  canContinue: boolean; // Can optionally continue (canter continuation)
  isComplete: boolean; // Turn is complete, can submit
};

export type StepResult = {
  success: boolean;
  newBoardState?: BoardState;
  newTurnState?: TurnState;
  legalNextMoves?: string[]; // Legal moves from current position
  error?: string;
};

// ============================================================================
// CONSTANTS
// ============================================================================

const ALL_SQUARES = [
  "F1",
  "G1",
  "C2",
  "D2",
  "E2",
  "F2",
  "G2",
  "H2",
  "I2",
  "J2",
  "B3",
  "C3",
  "D3",
  "E3",
  "F3",
  "G3",
  "H3",
  "I3",
  "J3",
  "K3",
  "A4",
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
  "A13",
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
  "B14",
  "C14",
  "D14",
  "E14",
  "F14",
  "G14",
  "H14",
  "I14",
  "J14",
  "K14",
  "C15",
  "D15",
  "E15",
  "F15",
  "G15",
  "H15",
  "I15",
  "J15",
  "F16",
  "G16",
];

const WHITE_CASTLE = ["F1", "G1"];
const BLACK_CASTLE = ["F16", "G16"];

const WHITE_KNIGHTS = ["C6", "D7", "I7", "J6"];
const WHITE_MEN = ["D6", "E6", "E7", "F6", "F7", "G6", "G7", "H6", "H7", "I6"];

const BLACK_KNIGHTS = ["C11", "D10", "I10", "J11"];
const BLACK_MEN = [
  "D11",
  "E10",
  "E11",
  "F10",
  "F11",
  "G10",
  "G11",
  "H10",
  "H11",
  "I11",
];

const DIRECTIONS: [number, number][] = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
  [1, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
];

// ============================================================================
// COORDINATE UTILITIES
// ============================================================================

function parseSquare(square: string): { file: number; rank: number } {
  const file = square.charCodeAt(0) - 65; // A=0, B=1, ..., L=11
  const rank = Number.parseInt(square.slice(1));
  return { file, rank };
}

function toSquare(file: number, rank: number): string {
  return String.fromCharCode(65 + file) + rank;
}

function isValidSquare(square: string): boolean {
  return ALL_SQUARES.includes(square);
}

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

function getDirection(from: string, to: string): [number, number] | null {
  const { file: fromFile, rank: fromRank } = parseSquare(from);
  const { file: toFile, rank: toRank } = parseSquare(to);

  const dFile = toFile - fromFile;
  const dRank = toRank - fromRank;

  // Normalize to -1, 0, or 1
  const dirFile = dFile === 0 ? 0 : dFile / Math.abs(dFile);
  const dirRank = dRank === 0 ? 0 : dRank / Math.abs(dRank);

  return [dirFile, dirRank];
}

// ============================================================================
// BOARD STATE
// ============================================================================

export function getInitialBoardState(): BoardState {
  const board: BoardState = {};

  ALL_SQUARES.forEach((square) => {
    board[square] = null;
  });

  WHITE_KNIGHTS.forEach((square) => {
    board[square] = { type: "knight", color: "white" };
  });
  WHITE_MEN.forEach((square) => {
    board[square] = { type: "man", color: "white" };
  });

  BLACK_KNIGHTS.forEach((square) => {
    board[square] = { type: "knight", color: "black" };
  });
  BLACK_MEN.forEach((square) => {
    board[square] = { type: "man", color: "black" };
  });

  return board;
}

export function createEmptyTurnState(startSquare: string): TurnState {
  return {
    moves: [startSquare],
    capturedSquares: [],
    mustContinue: false,
    canContinue: false,
    isComplete: false,
  };
}

// ============================================================================
// MOVE TYPE DETECTION
// ============================================================================

function isPlainMove(
  from: string,
  to: string,
  boardState: BoardState
): boolean {
  const { file: fromFile, rank: fromRank } = parseSquare(from);
  const { file: toFile, rank: toRank } = parseSquare(to);

  const distance = Math.max(
    Math.abs(toFile - fromFile),
    Math.abs(toRank - fromRank)
  );
  return distance === 1 && !boardState[to];
}

function isCanter(
  from: string,
  to: string,
  boardState: BoardState,
  playerColor: string
): { valid: boolean; middleSquare?: string } {
  const direction = getDirection(from, to);
  if (!direction) return { valid: false };

  const { file: fromFile, rank: fromRank } = parseSquare(from);
  const { file: toFile, rank: toRank } = parseSquare(to);

  const distance = Math.max(
    Math.abs(toFile - fromFile),
    Math.abs(toRank - fromRank)
  );
  if (distance !== 2) return { valid: false };

  const middle = getAdjacentSquare(from, direction);
  if (!middle) return { valid: false };

  const middlePiece = boardState[middle];
  if (!middlePiece || middlePiece.color !== playerColor)
    return { valid: false };

  if (boardState[to]) return { valid: false };

  return { valid: true, middleSquare: middle };
}

function isJump(
  from: string,
  to: string,
  boardState: BoardState,
  playerColor: string
): { valid: boolean; capturedSquare?: string } {
  const direction = getDirection(from, to);
  if (!direction) return { valid: false };

  const { file: fromFile, rank: fromRank } = parseSquare(from);
  const { file: toFile, rank: toRank } = parseSquare(to);

  const distance = Math.max(
    Math.abs(toFile - fromFile),
    Math.abs(toRank - fromRank)
  );
  if (distance !== 2) return { valid: false };

  const middle = getAdjacentSquare(from, direction);
  if (!middle) return { valid: false };

  const middlePiece = boardState[middle];
  if (!middlePiece || middlePiece.color === playerColor)
    return { valid: false };

  if (boardState[to]) return { valid: false };

  return { valid: true, capturedSquare: middle };
}

// ============================================================================
// JUMP OBLIGATION DETECTION
// ============================================================================

export function hasJumpAvailable(
  boardState: BoardState,
  playerColor: string
): boolean {
  for (const square of ALL_SQUARES) {
    const piece = boardState[square];
    if (piece?.color === playerColor) {
      for (const direction of DIRECTIONS) {
        const adjacent = getAdjacentSquare(square, direction);
        if (!adjacent) continue;

        const target = getAdjacentSquare(adjacent, direction);
        if (!target) continue;

        const jumpCheck = isJump(square, target, boardState, playerColor);
        if (jumpCheck.valid) return true;
      }
    }
  }
  return false;
}

// ============================================================================
// MOVE STEP EXECUTION
// ============================================================================

export function executeStep(
  to: string,
  boardState: BoardState,
  turnState: TurnState,
  playerColor: string
): StepResult {
  const from = turnState.moves[turnState.moves.length - 1];
  const piece = boardState[from];

  if (!piece || piece.color !== playerColor) {
    return { success: false, error: "No piece at current position" };
  }

  const ownCastle = playerColor === "white" ? WHITE_CASTLE : BLACK_CASTLE;
  const oppCastle = playerColor === "white" ? BLACK_CASTLE : WHITE_CASTLE;
  const isKnight = piece.type === "knight";
  const startSquare = turnState.moves[0];

  // Cannot return to starting square
  if (to === startSquare) {
    return { success: false, error: "Cannot return to starting square" };
  }

  // Determine move type
  const plainCheck = isPlainMove(from, to, boardState);
  const canterCheck = isCanter(from, to, boardState, playerColor);
  const jumpCheck = isJump(from, to, boardState, playerColor);

  // If we've made any jumps this turn, can only continue with jumps
  const hasJumpedThisTurn = turnState.capturedSquares.length > 0;

  if (hasJumpedThisTurn) {
    // Must be a jump continuation
    if (!jumpCheck.valid) {
      return { success: false, error: "Must continue jumping" };
    }
  } else if (turnState.moves.length > 1) {
    // We've made moves but no jumps yet
    // If this is a canter continuation, only allow canters
    if (!jumpCheck.valid && !canterCheck.valid && !plainCheck) {
      return { success: false, error: "Invalid move" };
    }

    // If we've been cantering, don't allow plain moves
    if (plainCheck && !jumpCheck.valid && !canterCheck.valid) {
      return { success: false, error: "Cannot mix plain moves with canters" };
    }
  }

  // Execute the move
  const newBoardState = { ...boardState };
  const newTurnState: TurnState = {
    ...turnState,
    moves: [...turnState.moves, to],
  };

  // Move the piece
  newBoardState[to] = piece;
  newBoardState[from] = null;

  // Handle captures
  if (jumpCheck.valid && jumpCheck.capturedSquare) {
    newBoardState[jumpCheck.capturedSquare] = null;
    newTurnState.capturedSquares = [
      ...turnState.capturedSquares,
      jumpCheck.capturedSquare,
    ];
  }

  // Check if we end in opponent's castle
  if (oppCastle.includes(to)) {
    newTurnState.mustContinue = false;
    newTurnState.canContinue = false;
    newTurnState.isComplete = true;
    return {
      success: true,
      newBoardState,
      newTurnState,
      legalNextMoves: [],
    };
  }

  // Check if we can/must continue
  const legalNextMoves: string[] = [];

  for (const direction of DIRECTIONS) {
    const adjacent = getAdjacentSquare(to, direction);
    if (!adjacent) continue;

    const target = getAdjacentSquare(adjacent, direction);
    if (!target) continue;

    // Check jumps
    const nextJump = isJump(to, target, newBoardState, playerColor);
    if (nextJump.valid && target !== startSquare) {
      legalNextMoves.push(target);
      continue;
    }

    // If we jumped this turn, only allow jump continuations
    if (hasJumpedThisTurn || jumpCheck.valid) continue;

    // Check canters (only if we haven't jumped)
    const nextCanter = isCanter(to, target, newBoardState, playerColor);
    if (
      nextCanter.valid &&
      target !== startSquare &&
      !ownCastle.includes(target)
    ) {
      legalNextMoves.push(target);
    }
  }

  // For plain moves (first move of turn), also check plain moves
  if (turnState.moves.length === 1 && !jumpCheck.valid && !canterCheck.valid) {
    for (const direction of DIRECTIONS) {
      const adjacent = getAdjacentSquare(to, direction);
      if (!adjacent || boardState[adjacent] || ownCastle.includes(adjacent))
        continue;
      legalNextMoves.push(adjacent);
    }
  }

  // Determine continuation status
  if (jumpCheck.valid || hasJumpedThisTurn) {
    // We jumped - must continue if possible
    const canJump = legalNextMoves.length > 0;
    newTurnState.mustContinue = canJump;
    newTurnState.canContinue = false;
    newTurnState.isComplete = !canJump;
  } else if (canterCheck.valid) {
    // We cantered - can optionally continue
    newTurnState.mustContinue = false;
    newTurnState.canContinue = legalNextMoves.length > 0;
    newTurnState.isComplete = true; // Can always submit after canter
  } else {
    // Plain move - turn is complete
    newTurnState.mustContinue = false;
    newTurnState.canContinue = false;
    newTurnState.isComplete = true;
  }

  return {
    success: true,
    newBoardState,
    newTurnState,
    legalNextMoves,
  };
}

// ============================================================================
// TURN START
// ============================================================================

export function getInitialMoves(
  square: string,
  boardState: BoardState,
  playerColor: string
): string[] {
  const piece = boardState[square];
  if (!piece || piece.color !== playerColor) return [];

  const ownCastle = playerColor === "white" ? WHITE_CASTLE : BLACK_CASTLE;
  const moves: string[] = [];

  // Check if jump is mandatory
  if (hasJumpAvailable(boardState, playerColor)) {
    // Only show jumps
    for (const direction of DIRECTIONS) {
      const adjacent = getAdjacentSquare(square, direction);
      if (!adjacent) continue;

      const target = getAdjacentSquare(adjacent, direction);
      if (!target) continue;

      const jumpCheck = isJump(square, target, boardState, playerColor);
      if (jumpCheck.valid) {
        moves.push(target);
      }
    }
    return moves;
  }

  // No jump required - show all legal moves
  for (const direction of DIRECTIONS) {
    const adjacent = getAdjacentSquare(square, direction);
    if (!adjacent) continue;

    // Plain move
    if (!boardState[adjacent] && !ownCastle.includes(adjacent)) {
      moves.push(adjacent);
    }

    // Canter or jump
    const target = getAdjacentSquare(adjacent, direction);
    if (!target) continue;

    const canterCheck = isCanter(square, target, boardState, playerColor);
    if (canterCheck.valid && !ownCastle.includes(target)) {
      moves.push(target);
    }

    const jumpCheck = isJump(square, target, boardState, playerColor);
    if (jumpCheck.valid) {
      moves.push(target);
    }
  }

  return moves;
}

// ============================================================================
// TURN NOTATION
// ============================================================================

export function getTurnNotation(turnState: TurnState): string {
  if (turnState.moves.length < 2) return "";

  if (turnState.capturedSquares.length > 0) {
    return turnState.moves.join("x");
  } else {
    return turnState.moves.join("-");
  }
}

// ============================================================================
// WIN CONDITIONS
// ============================================================================

export function checkWinCondition(
  boardState: BoardState,
  playerColor: string
): string | null {
  const opponentColor = playerColor === "white" ? "black" : "white";
  const opponentCastle = playerColor === "white" ? BLACK_CASTLE : WHITE_CASTLE;

  // WIN 1: Castle occupation (2 pieces in opponent's castle)
  const piecesInCastle = opponentCastle.filter(
    (square) => boardState[square]?.color === playerColor
  ).length;

  if (piecesInCastle >= 2) {
    return "castle_occupation";
  }

  // Count pieces
  const playerPieces = ALL_SQUARES.filter(
    (square) => boardState[square]?.color === playerColor
  ).length;

  const opponentPieces = ALL_SQUARES.filter(
    (square) => boardState[square]?.color === opponentColor
  ).length;

  // WIN 2: Capture all (need 2+ pieces remaining)
  if (opponentPieces === 0 && playerPieces >= 2) {
    return "capture_all";
  }

  // WIN 3: Stalemate (opponent has no legal moves)
  if (playerPieces >= 2) {
    let opponentHasMoves = false;
    for (const square of ALL_SQUARES) {
      const piece = boardState[square];
      if (piece?.color === opponentColor) {
        const moves = getInitialMoves(square, boardState, opponentColor);
        if (moves.length > 0) {
          opponentHasMoves = true;
          break;
        }
      }
    }

    if (!opponentHasMoves) {
      return "stalemate";
    }
  }

  return null;
}
