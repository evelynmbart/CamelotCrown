import { Button } from "@/components/ui/button";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface GameBoardControlsProps {
  currentMoveIndex: number;
  totalMoves: number;
  onFirst: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onLast: () => void;
}

export function GameBoardControls({
  currentMoveIndex,
  totalMoves,
  onFirst,
  onPrevious,
  onNext,
  onLast,
}: GameBoardControlsProps) {
  return (
    <div className="mt-2 lg:mt-4 flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onFirst}
        disabled={currentMoveIndex === 0}
        title="First move"
      >
        <ChevronFirst className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onPrevious}
        disabled={currentMoveIndex === 0}
        title="Previous move"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-muted-foreground px-2 lg:px-4">
        {currentMoveIndex} / {totalMoves}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={onNext}
        disabled={currentMoveIndex === totalMoves}
        title="Next move"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onLast}
        disabled={currentMoveIndex === totalMoves}
        title="Latest move"
      >
        <ChevronLast className="h-4 w-4" />
      </Button>
    </div>
  );
}

