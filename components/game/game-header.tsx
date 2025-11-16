import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface GameHeaderProps {
  isGameCompleted: boolean;
  onResign: () => void;
}

export function GameHeader({ isGameCompleted, onResign }: GameHeaderProps) {
  const router = useRouter();

  return (
    <header className="border-b border-border bg-card shrink-0">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/lobby")}>
          ← Lobby
        </Button>
        <h1 className="text-lg font-bold text-foreground">Camelot</h1>
        {!isGameCompleted && (
          <Button variant="destructive" size="sm" onClick={onResign}>
            Resign
          </Button>
        )}
        {isGameCompleted && <div className="w-16" />}
      </div>
    </header>
  );
}

