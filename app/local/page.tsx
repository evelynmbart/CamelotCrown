import { LocalGameClient } from "@/components/local-game-client";
import { Navbar } from "@/components/ui/navbar";

export default function LocalPlayPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar username={undefined} elo={undefined} />

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Local Play</h1>
          <p className="text-sm text-muted-foreground">
            Play Courser with someone sitting next to you
          </p>
        </div>
        <LocalGameClient />
      </div>
    </div>
  );
}
