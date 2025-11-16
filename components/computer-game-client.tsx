"use client";

import { Camelot, CamelotEngine } from "@/lib/camelot";
import {
  BoardState,
  GameState,
  LegalMove,
  TurnState,
} from "@/lib/camelot/types";
import { useEffect, useState } from "react";
import { ChivalryBoard } from "./chivalry-board";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type Difficulty = "easy" | "medium" | "hard" | "expert";
type PlayerColor = "white" | "black";

export function ComputerGameClient() {
  // Game configuration
  const [humanColor, setHumanColor] = useState<PlayerColor>("white");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gameStarted, setGameStarted] = useState(false);

  // Engine
  const [engine, setEngine] = useState<CamelotEngine | null>(null);

  // Game state
  const [boardState, setBoardState] = useState<BoardState>(
    Camelot.Board.getInitialBoardState()
  );
  const [currentTurn, setCurrentTurn] = useState<"white" | "black">("white");
  const [winner, setWinner] = useState<string | null>(null);

  // Turn state
  const [turnState, setTurnState] = useState<TurnState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<LegalMove[]>([]);

  // History
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  // UI messages
  const [message, setMessage] = useState<string>("");
  const [isEngineThinking, setIsEngineThinking] = useState(false);
  const [engineStats, setEngineStats] = useState<string>("");

  // Initialize engine when game starts
  useEffect(() => {
    if (gameStarted && !engine) {
      const newEngine = new CamelotEngine(
        CamelotEngine.getDifficultyPreset(difficulty)
      );
      setEngine(newEngine);
    }
  }, [gameStarted, difficulty, engine]);

  // Computer move logic
  useEffect(() => {
    if (
      !gameStarted ||
      !engine ||
      winner ||
      turnState ||
      currentTurn === humanColor ||
      isEngineThinking
    ) {
      return;
    }

    // It's the computer's turn
    setIsEngineThinking(true);
    setMessage("Computer is thinking...");

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const gameState: GameState = {
          white_castle_moves: 0,
          black_castle_moves: 0,
          board_state: boardState,
        };

        const analysis = engine.getBestMove(gameState, currentTurn);

        if (analysis.bestMove) {
          // Apply the move
          setBoardState(analysis.bestMove.finalBoardState);

          // Record the move
          setMoveHistory([...moveHistory, analysis.bestMove.notation]);

          // Update stats
          const evalStr = engine.getEvaluationString(analysis);
          setEngineStats(
            `Depth: ${
              analysis.depth
            } | Eval: ${evalStr} | Nodes: ${analysis.nodes.toLocaleString()} | Time: ${
              analysis.timeMs
            }ms`
          );

          // Check for win
          const winCondition = Camelot.Logic.checkWinCondition(
            analysis.bestMove.finalBoardState,
            currentTurn
          );

          if (winCondition) {
            setWinner(currentTurn);
            setMessage(`Computer wins by ${winCondition}!`);
          } else {
            // Switch turns to human
            setCurrentTurn(humanColor);
            setMessage("");
          }
        } else {
          // No legal moves for computer - human wins
          setWinner(humanColor);
          setMessage(`You win! Computer has no legal moves.`);
        }
      } catch (error) {
        console.error("Engine error:", error);
        setMessage("Engine error occurred");
      } finally {
        setIsEngineThinking(false);
      }
    }, 100);
  }, [
    gameStarted,
    engine,
    boardState,
    currentTurn,
    humanColor,
    winner,
    turnState,
    isEngineThinking,
    moveHistory,
  ]);

  // Check for mandatory jumps at turn start (human only)
  useEffect(() => {
    if (!gameStarted || winner || turnState || currentTurn !== humanColor)
      return;

    const hasJump =
      Camelot.Logic.checkFirstMovePossibleJumps(boardState, currentTurn)
        .length > 0;
    if (hasJump) {
      setMessage("You must capture! Select a piece to see available captures.");
    } else {
      setMessage("");
    }
  }, [gameStarted, currentTurn, boardState, winner, turnState, humanColor]);

  const handleSquareClick = (square: string) => {
    if (winner || !gameStarted || currentTurn !== humanColor) return;

    // If turn in progress
    if (turnState) {
      const currentSquare = turnState.moves[turnState.moves.length - 1];

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
      if (legalMoves.some((move) => move.to === square)) {
        const result = Camelot.Logic.executeStep(
          square,
          boardState,
          turnState,
          currentTurn,
          legalMoves
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
      setMessage(`You win by ${winCondition}!`);
    } else {
      // Switch turns to computer
      const computerColor = humanColor === "white" ? "black" : "white";
      setCurrentTurn(computerColor);
    }

    // Reset turn state
    setTurnState(null);
    setSelectedSquare(null);
    setLegalMoves([]);
    setMessage("");
  };

  const handleStartGame = () => {
    setGameStarted(true);
    setBoardState(Camelot.Board.getInitialBoardState());
    setCurrentTurn("white");
    setTurnState(null);
    setSelectedSquare(null);
    setLegalMoves([]);
    setMoveHistory([]);
    setWinner(null);
    setMessage("");
    setEngineStats("");
  };

  const handleNewGame = () => {
    setGameStarted(false);
    setEngine(null);
    setBoardState(Camelot.Board.getInitialBoardState());
    setCurrentTurn("white");
    setTurnState(null);
    setSelectedSquare(null);
    setLegalMoves([]);
    setMoveHistory([]);
    setWinner(null);
    setMessage("");
    setEngineStats("");
    setIsEngineThinking(false);
  };

  // Setup screen
  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
        <Card className="p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Play vs Computer
          </h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Play as</label>
              <Select
                value={humanColor}
                onValueChange={(value) => setHumanColor(value as PlayerColor)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="black">Black</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <Select
                value={difficulty}
                onValueChange={(value) => setDifficulty(value as Difficulty)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Easy</span>
                      <span className="text-xs text-muted-foreground">
                        Depth 3, 500ms
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Medium</span>
                      <span className="text-xs text-muted-foreground">
                        Depth 5, 2s
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="hard">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Hard</span>
                      <span className="text-xs text-muted-foreground">
                        Depth 8, 5s
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="expert">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Expert</span>
                      <span className="text-xs text-muted-foreground">
                        Depth 12, 10s
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleStartGame} className="w-full" size="lg">
              Start Game
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Game screen
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex justify-center">
        <ChivalryBoard
          boardState={boardState}
          selectedSquare={selectedSquare}
          legalMoves={legalMoves}
          onSquareClick={handleSquareClick}
          playerColor={humanColor}
          disabled={!!winner || currentTurn !== humanColor || isEngineThinking}
        />
      </div>

      <div className="w-full lg:w-80 space-y-4">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Game Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Turn:</span>
              <span className="font-medium capitalize">
                {currentTurn === humanColor ? "You" : "Computer"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Color:</span>
              <span className="font-medium capitalize">{humanColor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Difficulty:</span>
              <span className="font-medium capitalize">{difficulty}</span>
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

            {isEngineThinking && (
              <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                <div className="text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                  Computer is thinking...
                </div>
              </div>
            )}

            {message && !isEngineThinking && (
              <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
                <div className="text-sm text-amber-900 dark:text-amber-100">
                  {message}
                </div>
              </div>
            )}

            {engineStats && !isEngineThinking && (
              <div className="mt-2 p-2 bg-muted rounded-md">
                <div className="text-xs text-muted-foreground mb-1">
                  Last Engine Analysis:
                </div>
                <div className="text-xs font-mono">{engineStats}</div>
              </div>
            )}

            {winner && (
              <div className="mt-4 p-3 bg-primary/10 rounded-md text-center">
                <div className="font-bold text-lg">
                  {winner === humanColor ? "You Win!" : "Computer Wins!"}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            {currentTurn === humanColor && (
              <Button
                onClick={handleSubmitTurn}
                className="flex-1"
                disabled={!turnState || turnState.mustContinue || !!winner}
              >
                Submit Turn
              </Button>
            )}
            <Button
              onClick={handleNewGame}
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
              moveHistory.map((move, index) => {
                const moveNum = Math.floor(index / 2) + 1;
                const isWhiteMove = index % 2 === 0;
                return (
                  <div key={index} className="flex gap-2">
                    {isWhiteMove && (
                      <span className="text-muted-foreground w-8">
                        {moveNum}.
                      </span>
                    )}
                    {!isWhiteMove && <span className="w-8" />}
                    <span className="font-mono">{move}</span>
                    {humanColor === (isWhiteMove ? "white" : "black") && (
                      <span className="text-muted-foreground text-xs">
                        (you)
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
