"use client";

import {
  calculateLegalMoves,
  checkWinCondition,
  makeMove,
} from "@/lib/chivalry-logic";
import { useState } from "react";
import { ChivalryBoard } from "./chivalry-board";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

type BoardState = Record<string, { type: string; color: string } | null>;

// Initial board setup
const INITIAL_BOARD: BoardState = {
  // White pieces (bottom)
  B7: { type: "knight", color: "white" },
  C7: { type: "man", color: "white" },
  D7: { type: "man", color: "white" },
  E7: { type: "man", color: "white" },
  F7: { type: "man", color: "white" },
  G7: { type: "man", color: "white" },
  H7: { type: "man", color: "white" },
  I7: { type: "man", color: "white" },
  J7: { type: "man", color: "white" },
  K7: { type: "man", color: "white" },
  L7: { type: "man", color: "white" },
  M7: { type: "knight", color: "white" },
  B6: { type: "man", color: "white" },
  C6: { type: "man", color: "white" },
  D6: { type: "man", color: "white" },
  E6: { type: "man", color: "white" },
  F6: { type: "man", color: "white" },
  G6: { type: "man", color: "white" },
  H6: { type: "man", color: "white" },
  I6: { type: "man", color: "white" },
  J6: { type: "man", color: "white" },
  K6: { type: "man", color: "white" },
  L6: { type: "man", color: "white" },
  M6: { type: "man", color: "white" },
  // Black pieces (top)
  B11: { type: "knight", color: "black" },
  C11: { type: "man", color: "black" },
  D11: { type: "man", color: "black" },
  E11: { type: "man", color: "black" },
  F11: { type: "man", color: "black" },
  G11: { type: "man", color: "black" },
  H11: { type: "man", color: "black" },
  I11: { type: "man", color: "black" },
  J11: { type: "man", color: "black" },
  K11: { type: "man", color: "black" },
  L11: { type: "man", color: "black" },
  M11: { type: "knight", color: "black" },
  B10: { type: "man", color: "black" },
  C10: { type: "man", color: "black" },
  D10: { type: "man", color: "black" },
  E10: { type: "man", color: "black" },
  F10: { type: "man", color: "black" },
  G10: { type: "man", color: "black" },
  H10: { type: "man", color: "black" },
  I10: { type: "man", color: "black" },
  J10: { type: "man", color: "black" },
  K10: { type: "man", color: "black" },
  L10: { type: "man", color: "black" },
  M10: { type: "knight", color: "black" },
};

export function LocalGameClient() {
  const [boardState, setBoardState] = useState(INITIAL_BOARD);
  const [currentTurn, setCurrentTurn] = useState<"white" | "black">("white");
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [gameData] = useState({
    white_castle_moves: 0,
    black_castle_moves: 0,
    board_state: INITIAL_BOARD,
  });

  const handleSquareClick = (square: string) => {
    if (winner) return;

    // If no square selected, select this square if it has a piece of current player
    if (!selectedSquare) {
      const piece = boardState[square];
      if (piece && piece.color === currentTurn) {
        setSelectedSquare(square);
        const moves = calculateLegalMoves(
          square,
          boardState,
          currentTurn,
          gameData
        );
        setLegalMoves(moves);
      }
      return;
    }

    // If clicking the same square, deselect
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // If clicking another piece of the same color, select that instead
    const piece = boardState[square];
    if (piece && piece.color === currentTurn) {
      setSelectedSquare(square);
      const moves = calculateLegalMoves(
        square,
        boardState,
        currentTurn,
        gameData
      );
      setLegalMoves(moves);
      return;
    }

    // Try to make a move
    if (legalMoves.includes(square)) {
      const result = makeMove(
        selectedSquare,
        square,
        boardState,
        currentTurn,
        gameData
      );

      if (result.success && result.newBoardState) {
        setBoardState(result.newBoardState);
        setMoveHistory([
          ...moveHistory,
          result.moveNotation || `${selectedSquare}-${square}`,
        ]);

        // Check for win condition
        const winCondition = checkWinCondition(
          result.newBoardState,
          gameData,
          currentTurn
        );
        if (winCondition) {
          setWinner(currentTurn);
        } else {
          // Switch turns
          setCurrentTurn(currentTurn === "white" ? "black" : "white");
        }

        setSelectedSquare(null);
        setLegalMoves([]);
      }
    }
  };

  const handleReset = () => {
    setBoardState(INITIAL_BOARD);
    setCurrentTurn("white");
    setSelectedSquare(null);
    setLegalMoves([]);
    setMoveHistory([]);
    setWinner(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex justify-center">
        <ChivalryBoard
          boardState={boardState}
          selectedSquare={selectedSquare}
          legalMoves={legalMoves}
          onSquareClick={handleSquareClick}
          playerColor="white"
          disabled={!!winner}
        />
      </div>

      <div className="w-full lg:w-80 space-y-4">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Game Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Turn:</span>
              <span className="font-medium capitalize">{currentTurn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Moves:</span>
              <span className="font-medium">{moveHistory.length}</span>
            </div>
            {winner && (
              <div className="mt-4 p-3 bg-primary/10 rounded-md text-center">
                <div className="font-bold text-lg capitalize">
                  {winner} Wins!
                </div>
              </div>
            )}
          </div>
          <Button
            onClick={handleReset}
            className="w-full mt-4 bg-transparent"
            variant="outline"
          >
            New Game
          </Button>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Move History</h2>
          <div className="max-h-64 overflow-y-auto space-y-1 text-sm">
            {moveHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No moves yet
              </p>
            ) : (
              moveHistory.map((move, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-muted-foreground w-8">
                    {index + 1}.
                  </span>
                  <span className="font-mono">{move}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
