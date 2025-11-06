// Chivalry game logic

type BoardState = Record<string, { type: string; color: string } | null>
type GameData = {
  white_castle_moves: number
  black_castle_moves: number
  board_state: BoardState
}

// Get all valid squares on the board
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
]

const WHITE_CASTLE = ["G1", "H1"]
const BLACK_CASTLE = ["G16", "H16"]

// Parse square notation to coordinates
function parseSquare(square: string): { file: number; rank: number } {
  const file = square.charCodeAt(0) - 65 // A=0, B=1, etc.
  const rank = Number.parseInt(square.slice(1))
  return { file, rank }
}

// Convert coordinates back to square notation
function toSquare(file: number, rank: number): string {
  return String.fromCharCode(65 + file) + rank
}

// Check if a square is valid on the board
function isValidSquare(square: string): boolean {
  return ALL_SQUARES.includes(square)
}

// Get adjacent square in a direction
function getAdjacentSquare(square: string, direction: [number, number]): string | null {
  const { file, rank } = parseSquare(square)
  const newFile = file + direction[0]
  const newRank = rank + direction[1]
  const newSquare = toSquare(newFile, newRank)
  return isValidSquare(newSquare) ? newSquare : null
}

// All 8 directions (horizontal, vertical, diagonal)
const DIRECTIONS: [number, number][] = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0], // vertical and horizontal
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1], // diagonals
]

// Calculate legal moves for a piece
export function calculateLegalMoves(
  square: string,
  boardState: BoardState,
  playerColor: string,
  game: GameData,
): string[] {
  const piece = boardState[square]
  if (!piece || piece.color !== playerColor) return []

  const moves: string[] = []

  // Plain moves (one square in any direction)
  for (const direction of DIRECTIONS) {
    const adjacent = getAdjacentSquare(square, direction)
    if (adjacent && !boardState[adjacent]) {
      // Check castle restrictions
      const ownCastle = playerColor === "white" ? WHITE_CASTLE : BLACK_CASTLE
      if (!ownCastle.includes(adjacent)) {
        moves.push(adjacent)
      }
    }
  }

  // Courser moves (jump over friendly pieces)
  for (const direction of DIRECTIONS) {
    const adjacent = getAdjacentSquare(square, direction)
    if (adjacent && boardState[adjacent]?.color === playerColor) {
      const landing = getAdjacentSquare(adjacent, direction)
      if (landing && !boardState[landing]) {
        moves.push(landing)
      }
    }
  }

  // Jump moves (capture enemy pieces) - simplified for now
  for (const direction of DIRECTIONS) {
    const adjacent = getAdjacentSquare(square, direction)
    if (adjacent && boardState[adjacent]?.color !== playerColor && boardState[adjacent]) {
      const landing = getAdjacentSquare(adjacent, direction)
      if (landing && !boardState[landing]) {
        moves.push(landing)
      }
    }
  }

  return moves
}

// Make a move and return the new board state
export function makeMove(
  from: string,
  to: string,
  boardState: BoardState,
  playerColor: string,
  game: GameData,
): {
  success: boolean
  newBoardState?: BoardState
  moveNotation?: string
  moveType?: string
  capturedPieces?: string[]
  isCastleMove?: boolean
  error?: string
} {
  const piece = boardState[from]
  if (!piece || piece.color !== playerColor) {
    return { success: false, error: "Invalid piece" }
  }

  const newBoardState = { ...boardState }
  const capturedPieces: string[] = []

  // Determine move type
  const { file: fromFile, rank: fromRank } = parseSquare(from)
  const { file: toFile, rank: toRank } = parseSquare(to)
  const fileDiff = Math.abs(toFile - fromFile)
  const rankDiff = Math.abs(toRank - fromRank)
  const distance = Math.max(fileDiff, rankDiff)

  let moveType = "plain"
  let moveNotation = `${from}-${to}`

  // Check if it's a castle move
  const ownCastle = playerColor === "white" ? WHITE_CASTLE : BLACK_CASTLE
  const isCastleMove = ownCastle.includes(to)

  if (distance === 1) {
    // Plain move or capture
    if (boardState[to]) {
      return { success: false, error: "Square occupied" }
    }
    moveType = "plain"
    moveNotation = `${from}-${to}`
  } else if (distance === 2) {
    // Courser or jump
    const direction: [number, number] = [
      toFile > fromFile ? 1 : toFile < fromFile ? -1 : 0,
      toRank > fromRank ? 1 : toRank < fromRank ? -1 : 0,
    ]
    const middle = getAdjacentSquare(from, direction)

    if (middle && boardState[middle]) {
      if (boardState[middle].color === playerColor) {
        moveType = "Courser"
        moveNotation = `${from}-${to}`
      } else {
        moveType = "jump"
        moveNotation = `${from}x${to}`
        capturedPieces.push(middle)
        newBoardState[middle] = null
      }
    }
  }

  // Execute move
  newBoardState[to] = piece
  newBoardState[from] = null

  return {
    success: true,
    newBoardState,
    moveNotation,
    moveType,
    capturedPieces,
    isCastleMove,
  }
}

// Check win conditions
export function checkWinCondition(boardState: BoardState, game: GameData, playerColor: string): string | null {
  const opponentCastle = playerColor === "white" ? BLACK_CASTLE : WHITE_CASTLE

  // Check if player has 2 pieces in opponent's castle
  let piecesInCastle = 0
  for (const square of opponentCastle) {
    if (boardState[square]?.color === playerColor) {
      piecesInCastle++
    }
  }

  if (piecesInCastle >= 2) {
    return "castle_occupation"
  }

  // Check if opponent has no pieces left
  const opponentColor = playerColor === "white" ? "black" : "white"
  let opponentPieces = 0
  for (const square of ALL_SQUARES) {
    if (boardState[square]?.color === opponentColor) {
      opponentPieces++
    }
  }

  if (opponentPieces === 0) {
    return "capture_all"
  }

  return null
}

// Reconstruct board state from move history
export function reconstructBoardState(
  moveHistory: string[],
  moveIndex: number,
): Record<string, { type: string; color: string } | null> {
  // Start with initial board state
  const boardState = getInitialBoardState()

  // Apply moves up to moveIndex
  for (let i = 0; i < moveIndex; i++) {
    const move = moveHistory[i]
    // Parse move notation (e.g., "E6-E7" or "E6xE8")
    const isCapture = move.includes("x")
    const parts = move.split(isCapture ? "x" : "-")
    if (parts.length !== 2) continue

    const from = parts[0]
    const to = parts[1]

    // Move the piece
    if (boardState[from]) {
      boardState[to] = boardState[from]
      boardState[from] = null

      // Handle captures
      if (isCapture) {
        // Find the captured piece (middle square)
        const { file: fromFile, rank: fromRank } = parseSquare(from)
        const { file: toFile, rank: toRank } = parseSquare(to)
        const direction: [number, number] = [
          toFile > fromFile ? 1 : toFile < fromFile ? -1 : 0,
          toRank > fromRank ? 1 : toRank < fromRank ? -1 : 0,
        ]
        const middle = getAdjacentSquare(from, direction)
        if (middle) {
          boardState[middle] = null
        }
      }
    }
  }

  return boardState
}

// Helper function to get initial board state
export function getInitialBoardState(): Record<string, { type: string; color: string } | null> {
  const board: Record<string, { type: string; color: string } | null> = {}

  // Initialize all 176 squares as null
  const allSquares = [
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
  ]

  allSquares.forEach((square) => {
    board[square] = null
  })

  // White pieces (rows 6-7)
  const whiteKnights = ["C6", "D6", "K6", "L6", "C7", "D7", "K7", "L7"]
  const whiteMen = ["E6", "E7", "F6", "F7", "G6", "G7", "H6", "H7", "I6", "I7", "J6", "J7"]

  whiteKnights.forEach((square) => {
    board[square] = { type: "knight", color: "white" }
  })

  whiteMen.forEach((square) => {
    board[square] = { type: "man", color: "white" }
  })

  // Black pieces (rows 10-11)
  const blackKnights = ["C10", "D10", "K10", "L10", "C11", "D11", "K11", "L11"]
  const blackMen = ["E10", "E11", "F10", "F11", "G10", "G11", "H10", "H11", "I10", "I11", "J10", "J11"]

  blackKnights.forEach((square) => {
    board[square] = { type: "knight", color: "black" }
  })

  blackMen.forEach((square) => {
    board[square] = { type: "man", color: "black" }
  })

  return board
}
