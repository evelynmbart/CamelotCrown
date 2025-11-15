"use client";

import { Camelot } from "@/lib/camelot";
import { LegalMove } from "@/lib/camelot/types";
import { cn } from "@/lib/utils";

interface ChivalryBoardProps {
  boardState: Record<string, { type: string; color: string } | null>;
  selectedSquare: string | null;
  legalMoves: LegalMove[];
  onSquareClick: (square: string) => void;
  playerColor: string;
  disabled?: boolean;
}

export function ChivalryBoard({
  boardState,
  selectedSquare,
  legalMoves,
  onSquareClick,
  playerColor,
  disabled = false,
}: ChivalryBoardProps) {
  // Generate the Camelot board layout from Board.ALL_SQUARES
  const rows = (() => {
    const rankMap = new Map<number, string[]>();

    // Group squares by rank
    for (const square of Camelot.Board.ALL_SQUARES) {
      const file = square.match(/[A-L]/)?.[0] || "";
      const rank = parseInt(square.match(/\d+/)?.[0] || "0");

      if (!rankMap.has(rank)) {
        rankMap.set(rank, []);
      }
      rankMap.get(rank)!.push(square);
    }

    // Sort squares within each rank by file (A-L)
    const allFiles = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
    ];
    for (const squares of rankMap.values()) {
      squares.sort((a, b) => {
        const fileA = a.match(/[A-L]/)?.[0] || "";
        const fileB = b.match(/[A-L]/)?.[0] || "";
        return allFiles.indexOf(fileA) - allFiles.indexOf(fileB);
      });
    }

    // Convert to array and sort by rank (descending: 16 to 1)
    return Array.from(rankMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([rank, squares]) => ({ rank, squares }));
  })();

  // Rotate 180 degrees for black player (black at bottom)
  const displayRows =
    playerColor === "black"
      ? [...rows].reverse().map((row) => ({
          ...row,
          squares: [...row.squares].reverse(),
        }))
      : rows;

  const isCastleSquare = (square: string) => {
    return (
      Camelot.Board.WHITE_CASTLE.includes(square) ||
      Camelot.Board.BLACK_CASTLE.includes(square)
    );
  };

  const getPieceSymbol = (piece: { type: string; color: string }) => {
    if (piece.type === "knight") {
      return piece.color === "white" ? "♘" : "♞";
    } else {
      return piece.color === "white" ? "♙" : "♟";
    }
  };

  // All files in order (A-L for Camelot)
  const allFiles = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  // Extract all unique ranks from the board
  const allRanks = rows.map((row) => row.rank);

  // For black player, reverse the display
  const displayFiles =
    playerColor === "black" ? [...allFiles].reverse() : allFiles;
  const displayRanks =
    playerColor === "black" ? [...allRanks].reverse() : allRanks;

  return (
    <div className="flex items-start">
      {/* Left rank labels - straight vertical line */}
      <div className="flex flex-col">
        {displayRanks.map((rank) => (
          <div
            key={`rank-${rank}`}
            className="w-8 sm:w-10 h-10 sm:h-12 flex items-center justify-end pr-2"
          >
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
              {rank}
            </span>
          </div>
        ))}
      </div>

      {/* Board area */}
      <div className="inline-block">
        {/* Board rows */}
        {displayRows.map((row) => (
          <div key={row.rank} className="flex justify-center">
            {row.squares.map((square) => {
              const piece = boardState[square];
              const isSelected = selectedSquare === square;
              const isLegalMove = legalMoves.some((move) => move.to === square);
              const isCastle = isCastleSquare(square);
              const isLight =
                (square.charCodeAt(0) + Number.parseInt(square.slice(1))) %
                  2 ===
                0;

              return (
                <button
                  key={square}
                  onClick={() => !disabled && onSquareClick(square)}
                  disabled={disabled}
                  className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-2xl sm:text-3xl font-bold border border-border transition-colors relative",
                    isLight ? "bg-muted" : "bg-card",
                    isCastle && "ring-2 ring-primary ring-inset",
                    isSelected && "bg-primary/20 ring-2 ring-primary",
                    isLegalMove &&
                      "bg-accent cursor-pointer hover:bg-accent/80",
                    !isLegalMove &&
                      !disabled &&
                      piece?.color === playerColor &&
                      "cursor-pointer hover:bg-accent/50",
                    disabled && "cursor-not-allowed opacity-60"
                  )}
                >
                  {piece && (
                    <span
                      className={
                        piece.color === "white"
                          ? "text-foreground"
                          : "text-foreground"
                      }
                    >
                      {getPieceSymbol(piece)}
                    </span>
                  )}
                  {isLegalMove && !piece && (
                    <div className="w-3 h-3 rounded-full bg-primary/50" />
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Bottom file labels - straight horizontal line */}
        <div className="flex mt-1">
          {displayFiles.map((file) => (
            <div
              key={`file-${file}`}
              className="w-10 h-5 sm:w-12 sm:h-6 flex items-center justify-center text-xs sm:text-sm text-muted-foreground font-medium"
            >
              {file}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
