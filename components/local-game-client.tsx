"use client";

import { Camelot } from "@/lib/camelot";
import { BoardState, TurnState } from "@/lib/camelot/types";
import { useEffect, useState } from "react";
import { ChivalryBoard } from "./chivalry-board";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function LocalGameClient() {
  // Game state
  const [boardState, setBoardState] = useState<BoardState>(
    Camelot.Board.getInitialBoardState()
  );
  const [currentTurn, setCurrentTurn] = useState<"white" | "black">("white");
  const [winner, setWinner] = useState<string | null>(null);

  // Turn state
  const [turnState, setTurnState] = useState<TurnState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);

  // History
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  // UI messages
  const [message, setMessage] = useState<string>("");

  // Check for mandatory jumps at turn start
  useEffect(() => {
    if (winner || turnState) return;

    const hasJump =
      Camelot.Logic.checkFirstMovePossibleJumps(boardState, currentTurn)
        .length > 0;
    if (hasJump) {
      setMessage("You must capture! Select a piece to see available captures.");
    } else {
      setMessage("");
    }
  }, [currentTurn, boardState, winner, turnState]);

  const handleSquareClick = (square: string) => {
    if (winner) return;

    // If turn in progress
    if (turnState) {
      const currentSquare = turnState.moves[turnState.moves.length - 1];
      console.log(
        currentSquare,
        "turnState",
        turnState,
        "legalMoves",
        legalMoves
      );

      // Clicking current position - deselect
      if (square === currentSquare) {
        // Can't deselect if moves have been made
        if (turnState.moves.length > 1) {
          return;
        }
        setTurnState(null);
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // Clicking a legal move - continue turn
      if (legalMoves.includes(square)) {
        const result = Camelot.Logic.executeStep(
          square,
          boardState,
          turnState,
          currentTurn
        );

        if (result.success && result.newBoardState && result.newTurnState) {
          setMessage(result.message);
          setBoardState(result.newBoardState);
          setTurnState(result.newTurnState);
          setSelectedSquare(
            result.newTurnState.moves[result.newTurnState.moves.length - 1]
          );
          setLegalMoves(result.legalNextMoves);
          if (result.legalNextMoves.length === 0) {
            setMessage(
              "No more legal moves. Click Submit Turn to end your turn."
            );
          }
        }
        if (!result.success) {
          console.error("Error executing step", result.error);
        }
        return;
      }

      // Clicking elsewhere during mandatory continuation - not allowed
      if (turnState.mustContinue) {
        return;
      }

      // Clicking elsewhere if no legal moves - not allowed
      if (legalMoves.length === 0) {
        return;
      }

      // Clicking elsewhere during optional continuation - allow it (implicitly ends turn)
      // Fall through to piece selection
    }

    // Starting a new turn or selecting a piece
    const piece = boardState[square];
    if (piece && piece.color === currentTurn) {
      const moves = Camelot.Logic.getInitialMoves(
        square,
        boardState,
        currentTurn
      );

      if (moves.length === 0) {
        setMessage("This piece has no legal moves.");
        return;
      }

      setSelectedSquare(square);
      setLegalMoves(moves);

      // Start a new turn state
      setTurnState(Camelot.Logic.createEmptyTurnState(square));
      setMessage("Select where to move.");
    }
  };

  const handleSubmitTurn = () => {
    if (!turnState || turnState.mustContinue) return;

    // Record the move
    const notation = Camelot.Logic.getTurnNotation(turnState);
    if (notation) {
      setMoveHistory([...moveHistory, notation]);
    }

    // Check for win
    const winCondition = Camelot.Logic.checkWinCondition(
      boardState,
      currentTurn
    );
    if (winCondition) {
      setWinner(currentTurn);
      setMessage(`${currentTurn} wins by ${winCondition}!`);
    } else {
      // Switch turns
      setCurrentTurn(currentTurn === "white" ? "black" : "white");
    }

    // Reset turn state
    setTurnState(null);
    setSelectedSquare(null);
    setLegalMoves([]);
    setMessage("");
  };

  const handleReset = () => {
    setBoardState(Camelot.Board.getInitialBoardState());
    setCurrentTurn("white");
    setTurnState(null);
    setSelectedSquare(null);
    setLegalMoves([]);
    setMoveHistory([]);
    setWinner(null);
    setMessage("");
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
              <span className="text-muted-foreground">Completed Moves:</span>
              <span className="font-medium">{moveHistory.length}</span>
            </div>

            {turnState && turnState.moves.length > 1 && (
              <div className="mt-2 p-2 bg-accent rounded-md">
                <div className="text-xs text-muted-foreground mb-1">
                  Current Turn:
                </div>
                <div className="font-mono text-xs">
                  {turnState.moves.join(" → ")}
                </div>
              </div>
            )}

            {message && (
              <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
                <div className="text-sm text-amber-900 dark:text-amber-100">
                  {message}
                </div>
              </div>
            )}

            {winner && (
              <div className="mt-4 p-3 bg-primary/10 rounded-md text-center">
                <div className="font-bold text-lg capitalize">
                  {winner} Wins!
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleSubmitTurn}
              className="flex-1"
              disabled={!turnState || turnState.mustContinue || !!winner}
            >
              Submit Turn
            </Button>
            <Button
              onClick={handleReset}
              className="bg-transparent"
              variant="outline"
            >
              New Game
            </Button>
          </div>
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
