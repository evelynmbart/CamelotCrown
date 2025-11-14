"use client";

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
  // Define the Camelot board layout (160 squares)
  const rows = [
    { rank: 16, squares: ["F16", "G16"] },
    {
      rank: 15,
      squares: ["C15", "D15", "E15", "F15", "G15", "H15", "I15", "J15"],
    },
    {
      rank: 14,
      squares: [
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
      ],
    },
    {
      rank: 13,
      squares: [
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
      ],
    },
    {
      rank: 12,
      squares: [
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
      ],
    },
    {
      rank: 11,
      squares: [
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
      ],
    },
    {
      rank: 10,
      squares: [
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
      ],
    },
    {
      rank: 9,
      squares: [
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
      ],
    },
    {
      rank: 8,
      squares: [
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
      ],
    },
    {
      rank: 7,
      squares: [
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
      ],
    },
    {
      rank: 6,
      squares: [
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
      ],
    },
    {
      rank: 5,
      squares: [
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
      ],
    },
    {
      rank: 4,
      squares: [
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
      ],
    },
    {
      rank: 3,
      squares: ["B3", "C3", "D3", "E3", "F3", "G3", "H3", "I3", "J3", "K3"],
    },
    { rank: 2, squares: ["C2", "D2", "E2", "F2", "G2", "H2", "I2", "J2"] },
    { rank: 1, squares: ["F1", "G1"] },
  ];

  // Rotate 180 degrees for black player (black at bottom)
  const displayRows =
    playerColor === "black"
      ? [...rows].reverse().map((row) => ({
          ...row,
          squares: [...row.squares].reverse(),
        }))
      : rows;

  const isCastleSquare = (square: string) => {
    return ["F1", "G1", "F16", "G16"].includes(square);
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

  // All ranks in order (1-16)
  const allRanks = [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

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
