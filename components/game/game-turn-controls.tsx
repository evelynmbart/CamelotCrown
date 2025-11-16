import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { TurnState } from "@/lib/camelot/types";

interface GameTurnControlsProps {
  turnState: TurnState | null;
  message: string;
  isSubmitting: boolean;
  onSubmit: () => void;
  mobile?: boolean;
}

export function GameTurnControls({
  turnState,
  message,
  isSubmitting,
  onSubmit,
  mobile = false,
}: GameTurnControlsProps) {
  const content = (
    <>
      {turnState && turnState.moves.length > 1 && (
        <div className={`${mobile ? "mb-2" : "mb-3"} p-2 bg-accent rounded-md`}>
          <div className="text-xs text-muted-foreground mb-1">
            Current Turn:
          </div>
          <div className="font-mono text-xs">
            {turnState.moves.join(" → ")}
          </div>
        </div>
      )}

      {message && (
        <div
          className={`${mobile ? "mb-2" : "mb-3"} p-3 bg-amber-500/10 border border-amber-500/20 rounded-md`}
        >
          <div className="text-sm text-amber-900 dark:text-amber-100">
            {message}
          </div>
        </div>
      )}

      {turnState && (
        <Button
          onClick={onSubmit}
          className="w-full"
          size="lg"
          disabled={!turnState || turnState.mustContinue || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Turn"}
        </Button>
      )}
    </>
  );

  if (mobile) {
    return <div className="mx-2 mb-2">{content}</div>;
  }

  return <Card className="p-4 shrink-0">{content}</Card>;
}

