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
  lastMove?: string;
}

export function ChivalryBoard({
  boardState,
  selectedSquare,
  legalMoves,
  onSquareClick,
  playerColor,
  disabled = false,
  lastMove,
}: ChivalryBoardProps) {
  // Parse last move to show arrows (opponent's last move)
  const lastMoveArrows = (() => {
    if (!lastMove) return [];

    // Parse the notation to extract squares and move types
    const arrows: Array<{ from: string; to: string; isJump: boolean }> = [];

    // Match pattern: square followed by delimiter (x or -)
    const pattern = /([A-L]\d+)([x-])/g;
    const matches = Array.from(lastMove.matchAll(pattern));

    for (let i = 0; i < matches.length; i++) {
      const square = matches[i][1];
      const delimiter = matches[i][2];
      const nextSquare =
        i < matches.length - 1
          ? matches[i + 1][1]
          : lastMove.substring(matches[i].index! + matches[i][0].length);

      arrows.push({
        from: square,
        to: nextSquare,
        isJump: delimiter === "x",
      });
    }

    return arrows;
  })();

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

  // Helper to get square position in the grid
  const getSquarePosition = (square: string) => {
    const file = square.match(/[A-L]/)?.[0] || "";
    const rank = parseInt(square.match(/\d+/)?.[0] || "0");

    const rankIndex = displayRanks.indexOf(rank);
    const fileIndex = displayFiles.indexOf(file);

    return { row: rankIndex, col: fileIndex };
  };

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
      <div className="inline-block relative">
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

        {/* SVG overlay for move arrows - use two versions for responsive sizing */}
        {lastMoveArrows.length > 0 && (
          <>
            {/* Small screens (w-10 h-10) */}
            <svg
              className="absolute inset-0 pointer-events-none sm:hidden"
              style={{ width: "100%", height: "100%" }}
            >
              <defs>
                <marker
                  id="arrowhead-jump-sm"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="2.5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon
                    points="0 0, 8 2.5, 0 5"
                    fill="rgb(248, 113, 113)"
                    opacity="0.7"
                  />
                </marker>
                <marker
                  id="arrowhead-canter-sm"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="2.5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon
                    points="0 0, 8 2.5, 0 5"
                    fill="rgb(96, 165, 250)"
                    opacity="0.7"
                  />
                </marker>
              </defs>
              {lastMoveArrows.map((arrow, index) => {
                const fromPos = getSquarePosition(arrow.from);
                const toPos = getSquarePosition(arrow.to);

                const squareSize = 40; // w-10 = 2.5rem = 40px
                const fromX = fromPos.col * squareSize + squareSize / 2;
                const fromY = fromPos.row * squareSize + squareSize / 2;
                const toX = toPos.col * squareSize + squareSize / 2;
                const toY = toPos.row * squareSize + squareSize / 2;

                const angle = Math.atan2(toY - fromY, toX - fromX);
                const shortenBy = squareSize * 0.3;
                const adjustedFromX = fromX + Math.cos(angle) * shortenBy;
                const adjustedFromY = fromY + Math.sin(angle) * shortenBy;
                const adjustedToX = toX - Math.cos(angle) * shortenBy;
                const adjustedToY = toY - Math.sin(angle) * shortenBy;

                const strokeColor = arrow.isJump
                  ? "rgb(248, 113, 113)" // light red for jumps
                  : "rgb(96, 165, 250)"; // light blue for canters/plain
                const markerId = arrow.isJump
                  ? "arrowhead-jump-sm"
                  : "arrowhead-canter-sm";

                return (
                  <line
                    key={`${arrow.from}-${arrow.to}-${index}-sm`}
                    x1={adjustedFromX}
                    y1={adjustedFromY}
                    x2={adjustedToX}
                    y2={adjustedToY}
                    stroke={strokeColor}
                    strokeWidth="3"
                    strokeOpacity="0.7"
                    markerEnd={`url(#${markerId})`}
                  />
                );
              })}
            </svg>

            {/* Large screens (w-12 h-12) */}
            <svg
              className="absolute inset-0 pointer-events-none hidden sm:block"
              style={{ width: "100%", height: "100%" }}
            >
              <defs>
                <marker
                  id="arrowhead-jump-lg"
                  markerWidth="6"
                  markerHeight="6"
                  refX="5.4"
                  refY="1.8"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon
                    points="0 0, 6 1.8, 0 3.6"
                    fill="rgb(248, 113, 113)"
                    opacity="0.7"
                  />
                </marker>
                <marker
                  id="arrowhead-canter-lg"
                  markerWidth="6"
                  markerHeight="6"
                  refX="5.4"
                  refY="1.8"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon
                    points="0 0, 6 1.8, 0 3.6"
                    fill="rgb(96, 165, 250)"
                    opacity="0.7"
                  />
                </marker>
              </defs>
              {lastMoveArrows.map((arrow, index) => {
                const fromPos = getSquarePosition(arrow.from);
                const toPos = getSquarePosition(arrow.to);

                const squareSize = 48; // w-12 = 3rem = 48px
                const fromX = fromPos.col * squareSize + squareSize / 2;
                const fromY = fromPos.row * squareSize + squareSize / 2;
                const toX = toPos.col * squareSize + squareSize / 2;
                const toY = toPos.row * squareSize + squareSize / 2;

                const angle = Math.atan2(toY - fromY, toX - fromX);
                const shortenBy = squareSize * 0.3;
                const adjustedFromX = fromX + Math.cos(angle) * shortenBy;
                const adjustedFromY = fromY + Math.sin(angle) * shortenBy;
                const adjustedToX = toX - Math.cos(angle) * shortenBy;
                const adjustedToY = toY - Math.sin(angle) * shortenBy;

                const strokeColor = arrow.isJump
                  ? "rgb(248, 113, 113)" // light red for jumps
                  : "rgb(96, 165, 250)"; // light blue for canters/plain
                const markerId = arrow.isJump
                  ? "arrowhead-jump-lg"
                  : "arrowhead-canter-lg";

                return (
                  <line
                    key={`${arrow.from}-${arrow.to}-${index}-lg`}
                    x1={adjustedFromX}
                    y1={adjustedFromY}
                    x2={adjustedToX}
                    y2={adjustedToY}
                    stroke={strokeColor}
                    strokeWidth="4"
                    strokeOpacity="0.7"
                    markerEnd={`url(#${markerId})`}
                  />
                );
              })}
            </svg>
          </>
        )}
      </div>
    </div>
  );
}
