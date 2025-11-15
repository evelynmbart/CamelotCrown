import { Card } from "@/components/ui/card";

interface GameMetadataProps {
  status: string;
  moveCount: number;
  whiteCastleMoves: number;
  blackCastleMoves: number;
  mobile?: boolean;
}

export function GameMetadata({
  status,
  moveCount,
  whiteCastleMoves,
  blackCastleMoves,
  mobile = false,
}: GameMetadataProps) {
  return (
    <Card className={mobile ? "mx-2 mb-2 p-3" : "p-4 shrink-0"}>
      <h3
        className={`font-semibold text-foreground ${
          mobile ? "mb-2 text-sm" : "mb-3"
        }`}
      >
        Game Info
      </h3>
      <div className={`space-y-${mobile ? "1.5" : "2"} ${mobile ? "text-xs" : "text-sm"}`}>
        {!mobile && (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="text-foreground capitalize">{status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time Control:</span>
              <span className="text-foreground">15+10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rated:</span>
              <span className="text-foreground">Yes</span>
            </div>
          </>
        )}
        {mobile && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time Control:</span>
            <span className="text-foreground">15+10</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Moves:</span>
          <span className="text-foreground">{moveCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Castle (W/B):</span>
          <span className="text-foreground">
            {whiteCastleMoves}/2 · {blackCastleMoves}/2
          </span>
        </div>
      </div>
    </Card>
  );
}

