import { Board } from "./board";
import { Coordinates } from "./coordinates";
import { BoardState, StepResult, TurnState } from "./types";

export class Logic {
  static createEmptyTurnState(startSquare: string): TurnState {
    return {
      moves: [startSquare],
      capturedSquares: [],
      mustContinue: false,
    };
  }

  static isValidPlainMove({
    from,
    to,
    boardState,
  }: {
    from: string;
    to: string;
    boardState: BoardState;
  }): { valid: boolean } {
    const isToSquareEmpty = !boardState[to];
    return { valid: Coordinates.isOneAdjacent(from, to) && isToSquareEmpty };
  }

  static isValidCanter({
    from,
    to,
    boardState,
    playerColor,
  }: {
    from: string;
    to: string;
    boardState: BoardState;
    playerColor: string;
  }): { valid: true; middleSquare: string } | { valid: false } {
    if (!Coordinates.isTwoAdjacent(from, to)) return { valid: false };

    const direction = Coordinates.getDirection(from, to);
    if (!direction) return { valid: false };

    const middle = Coordinates.getAdjacentSquare(from, direction);
    if (!middle) return { valid: false };

    const middlePiece = boardState[middle];
    if (!middlePiece || middlePiece.color !== playerColor)
      return { valid: false };

    if (boardState[to]) return { valid: false };

    return { valid: true, middleSquare: middle };
  }

  static isValidJump({
    from,
    to,
    boardState,
    playerColor,
  }: {
    from: string;
    to: string;
    boardState: BoardState;
    playerColor: string;
  }): { valid: true; middleSquare: string } | { valid: false } {
    if (!Coordinates.isTwoAdjacent(from, to)) return { valid: false };

    const direction = Coordinates.getDirection(from, to);
    if (!direction) return { valid: false };

    const middle = Coordinates.getAdjacentSquare(from, direction);
    if (!middle) return { valid: false };

    const middlePiece = boardState[middle];
    if (!middlePiece || middlePiece.color === playerColor)
      return { valid: false };

    if (boardState[to]) return { valid: false };

    return { valid: true, middleSquare: middle };
  }

  static checkFirstMovePossibleJumps(
    boardState: BoardState,
    playerColor: string
  ): string[] {
    const jumps: string[] = [];
    for (const square of Board.ALL_SQUARES) {
      const piece = boardState[square];
      if (piece?.color === playerColor) {
        for (const direction of Coordinates.DIRECTIONS) {
          const oneStep = Coordinates.getAdjacentSquare(square, direction);
          if (!oneStep) continue;
          const twoStep = Coordinates.getAdjacentSquare(oneStep, direction);
          if (!twoStep) continue;
          const jumpCheck = Logic.isValidJump({
            from: square,
            to: twoStep,
            boardState,
            playerColor,
          });
          if (jumpCheck.valid) jumps.push(twoStep);
        }
      }
    }
    return jumps;
  }

  static executeStep(
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

    const ownCastle =
      playerColor === "white" ? Board.WHITE_CASTLE : Board.BLACK_CASTLE;
    const oppCastle =
      playerColor === "white" ? Board.BLACK_CASTLE : Board.WHITE_CASTLE;
    const isKnight = piece.type === "knight";
    const startSquare = turnState.moves[0];

    // Determine move type
    const plainCheck = Logic.isValidPlainMove({ from, to, boardState });
    const canterCheck = Logic.isValidCanter({
      from,
      to,
      boardState,
      playerColor,
    });
    const jumpCheck = Logic.isValidJump({ from, to, boardState, playerColor });

    if (!plainCheck.valid && !canterCheck.valid && !jumpCheck.valid) {
      return { success: false, error: "Invalid move" };
    }

    // If this is a plain move, it must be the first move
    const isFirstMove = turnState.moves.length === 1;
    if (plainCheck.valid && !isFirstMove) {
      return {
        success: false,
        error: "Can only make a plain move on the first step",
      };
    }

    // If we've made any jumps this turn, can only continue with jumps
    const hasJumpedThisTurn = turnState.capturedSquares.length > 0;
    if (hasJumpedThisTurn && !jumpCheck.valid) {
      return { success: false, error: "Must continue jumping" };
    }

    // Only knights can jump after cantering (charge)
    const totalCapturedSquares =
      turnState.capturedSquares.length + (jumpCheck.valid ? 1 : 0);
    const isCharge =
      jumpCheck.valid && totalCapturedSquares < turnState.moves.length;
    if (isCharge && !isKnight) {
      return { success: false, error: "Only knights can jump after cantering" };
    }

    // Execute the move
    const newBoardState = { ...boardState };
    newBoardState[to] = piece;
    newBoardState[from] = null;
    const newTurnState: TurnState = {
      ...turnState,
      moves: [...turnState.moves, to],
      mustContinue: false,
    };

    // Handle captures
    if (jumpCheck.valid && jumpCheck.middleSquare) {
      newBoardState[jumpCheck.middleSquare] = null;
      newTurnState.capturedSquares = [
        ...turnState.capturedSquares,
        jumpCheck.middleSquare,
      ];
    }

    // Check if we end in opponent's castle
    if (oppCastle.includes(to)) {
      return {
        success: true,
        newBoardState,
        newTurnState,
        legalNextMoves: [],
        message: "Landing in your opponent's castle ends your turn",
      };
    }

    // End turn if we just made a plain move
    if (plainCheck.valid) {
      return {
        success: true,
        newBoardState,
        newTurnState,
        legalNextMoves: [],
        message: "",
      };
    }

    // Determine legal next moves
    const hasJumpedThisMove = jumpCheck.valid;
    let legalNextMoves: { type: "jump" | "canter"; square: string }[] = [];
    for (const direction of Coordinates.DIRECTIONS) {
      const oneStep = Coordinates.getAdjacentSquare(to, direction);
      if (!oneStep) continue;
      const twoStep = Coordinates.getAdjacentSquare(oneStep, direction);
      if (!twoStep) continue;

      // Check jumps
      const nextJump = Logic.isValidJump({
        from: to,
        to: twoStep,
        boardState: newBoardState,
        playerColor,
      });
      const totalCapturedSquares =
        turnState.capturedSquares.length + (jumpCheck.valid ? 1 : 0);
      const wouldBeCharge = totalCapturedSquares < turnState.moves.length;
      // We can only continue jumping in a charge if we are a knight
      if (nextJump.valid && (!wouldBeCharge || isKnight)) {
        legalNextMoves.push({ type: "jump", square: twoStep });
        continue;
      }

      // If we jumped this turn, only allow jump continuations
      if (hasJumpedThisTurn || hasJumpedThisMove) continue;

      // Check canters (if we haven't jumped)
      const nextCanter = Logic.isValidCanter({
        from: to,
        to: twoStep,
        boardState: newBoardState,
        playerColor,
      });
      if (nextCanter.valid && !ownCastle.includes(twoStep)) {
        legalNextMoves.push({ type: "canter", square: twoStep });
      }
    }

    // If jumps are available, filter out all other moves
    // TODO: This doesn't take into account the fact that you can forgo jumping if you can knight's charge instead
    if (legalNextMoves.some((move) => move.type === "jump")) {
      legalNextMoves = legalNextMoves.filter((move) => move.type === "jump");
    }

    // Determine continuation status
    let message = "";
    const canJump = legalNextMoves.some((move) => move.type === "jump");
    if (to === startSquare) {
      // We landed on starting square - must move off
      newTurnState.mustContinue = true;
      message = "Cannot complete turn on starting square";
    } else if (canJump) {
      // A jump is available - must jump
      // TODO: This doesn't take into account the fact that you can forgo jumping if you can knight's charge instead
      newTurnState.mustContinue = true;
      message = "You are obligated to jump";
    }

    return {
      success: true,
      newBoardState,
      newTurnState,
      legalNextMoves: legalNextMoves.map((move) => move.square),
      message,
    };
  }

  static getInitialMoves(
    square: string,
    boardState: BoardState,
    playerColor: string
  ): string[] {
    const piece = boardState[square];
    if (!piece || piece.color !== playerColor) return [];

    // Check if jump is mandatory
    const possibleJumps = Logic.checkFirstMovePossibleJumps(
      boardState,
      playerColor
    );
    if (possibleJumps.length > 0) {
      // Return all jumps possible from this square
      return possibleJumps.filter(
        (jump) =>
          Logic.isValidJump({
            from: square,
            to: jump,
            boardState,
            playerColor,
          }).valid
      );
    }

    const ownCastle =
      playerColor === "white" ? Board.WHITE_CASTLE : Board.BLACK_CASTLE;
    const moves: string[] = [];

    // No jump required - show all legal moves
    for (const direction of Coordinates.DIRECTIONS) {
      const oneStep = Coordinates.getAdjacentSquare(square, direction);
      if (!oneStep) continue;

      // Plain move
      if (!boardState[oneStep] && !ownCastle.includes(oneStep)) {
        moves.push(oneStep);
      }

      // Canter
      const twoStep = Coordinates.getAdjacentSquare(oneStep, direction);
      if (!twoStep) continue;

      const canterCheck = Logic.isValidCanter({
        from: square,
        to: twoStep,
        boardState,
        playerColor,
      });
      if (canterCheck.valid && !ownCastle.includes(twoStep)) {
        moves.push(twoStep);
      }
    }

    return moves;
  }

  // ============================================================================
  // TURN NOTATION
  // ============================================================================

  static getTurnNotation(turnState: TurnState): string {
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

  static checkWinCondition(
    boardState: BoardState,
    playerColor: string
  ): string | null {
    const opponentColor = playerColor === "white" ? "black" : "white";
    const opponentCastle =
      playerColor === "white" ? Board.BLACK_CASTLE : Board.WHITE_CASTLE;

    // WIN 1: Castle occupation (2 pieces in opponent's castle)
    const piecesInCastle = opponentCastle.filter(
      (square) => boardState[square]?.color === playerColor
    ).length;

    if (piecesInCastle >= 2) {
      return "castle_occupation";
    }

    // Count pieces
    const playerPieces = Board.ALL_SQUARES.filter(
      (square) => boardState[square]?.color === playerColor
    ).length;

    const opponentPieces = Board.ALL_SQUARES.filter(
      (square) => boardState[square]?.color === opponentColor
    ).length;

    // WIN 2: Capture all (need 2+ pieces remaining)
    if (opponentPieces === 0 && playerPieces >= 2) {
      return "capture_all";
    }

    // WIN 3: Stalemate (opponent has no legal moves)
    if (playerPieces >= 2) {
      let opponentHasMoves = false;
      for (const square of Board.ALL_SQUARES) {
        const piece = boardState[square];
        if (piece?.color === opponentColor) {
          const moves = Logic.getInitialMoves(
            square,
            boardState,
            opponentColor
          );
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
}
