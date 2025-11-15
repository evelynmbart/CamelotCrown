import { Card } from "@/components/ui/card";

interface GameMoveHistoryProps {
  moves: string[];
  currentMoveIndex: number;
  onMoveClick: (index: number) => void;
}

export function GameMoveHistory({
  moves,
  currentMoveIndex,
  onMoveClick,
}: GameMoveHistoryProps) {
  return (
    <Card className="p-4 flex-1 min-h-0 flex flex-col">
      <h3 className="font-semibold text-foreground mb-3">Moves</h3>
      <div className="flex-1 overflow-y-auto space-y-1">
        {moves.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No moves yet
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-1">
            {moves.map((move, index) => (
              <button
                key={index}
                onClick={() => onMoveClick(index + 1)}
                className={`text-xs text-left px-2 py-1.5 rounded hover:bg-accent transition-colors ${
                  currentMoveIndex === index + 1
                    ? "bg-accent font-semibold"
                    : "text-foreground"
                }`}
              >
                <span className="text-muted-foreground">{index + 1}.</span>{" "}
                {move}
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

