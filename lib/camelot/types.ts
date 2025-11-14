export type BoardState = Record<string, { type: string; color: string } | null>;

export type GameState = {
  white_castle_moves: number;
  black_castle_moves: number;
  board_state: BoardState;
};

export type TurnState = {
  moves: string[]; // Squares visited this turn [start, intermediate..., current]
  capturedSquares: string[]; // Squares where pieces were captured
  mustContinue: boolean;
};

export type StepResult =
  | {
      success: true;
      newBoardState: BoardState;
      newTurnState: TurnState;
      legalNextMoves: string[]; // Legal moves from current position
      message: string;
    }
  | {
      success: false;
      error: string;
    };
