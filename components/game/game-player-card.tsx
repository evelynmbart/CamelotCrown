import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Player } from "@/types/game";

interface GamePlayerCardProps {
  player: Player;
  color: "white" | "black";
  isActive: boolean;
  mobile?: boolean;
}

export function GamePlayerCard({
  player,
  color,
  isActive,
  mobile = false,
}: GamePlayerCardProps) {
  return (
    <Card
      className={`${mobile ? "mx-2 p-3" : "p-4"} ${
        isActive ? "ring-2 ring-primary" : ""
      }`}
    >
      <div
        className={`flex items-center justify-between ${mobile ? "" : "mb-2"}`}
      >
        <div className="flex items-center gap-2">
          <Badge variant={color === "black" ? "secondary" : "outline"}>
            {color === "black" ? "●" : "○"}
          </Badge>
          <div>
            <div
              className={`font-semibold text-foreground ${
                mobile ? "text-sm" : ""
              }`}
            >
              {player.username}
            </div>
            <div className="text-xs text-muted-foreground">
              {player.elo_rating}
            </div>
          </div>
        </div>
        <div className={`font-mono ${mobile ? "text-xl" : "text-2xl"}`}>
          15:00
        </div>
      </div>
    </Card>
  );
}
