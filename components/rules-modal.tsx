"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen } from "lucide-react";

export function RulesModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <BookOpen className="w-4 h-4 mr-2" />
          Rules
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Camelot Rules</DialogTitle>
          <DialogDescription>
            Learn how to play Camelot - a classic strategy board game
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="text-lg font-semibold mb-2">Basic Setup</h3>
              <p className="mb-2">
                <strong>Players:</strong> Two players, White and Black. White moves first.
              </p>
              <p className="mb-2">
                <strong>Pieces:</strong> Each player starts with 14 pieces:
              </p>
              <ul className="list-disc pl-6 mb-2">
                <li>4 Knights</li>
                <li>10 Men</li>
              </ul>
              <p className="mb-2">
                <strong>Starting Positions:</strong>
              </p>
              <ul className="list-disc pl-6 mb-2">
                <li>White Knights: C6, D7, I7, J6</li>
                <li>White Men: D6, E6, E7, F6, F7, G6, G7, H6, H7, I6</li>
                <li>Black Knights: C11, D10, I10, J11</li>
                <li>Black Men: D11, E10, E11, F10, F11, G10, G11, H10, H11, I11</li>
              </ul>
              <p className="mb-2">
                <strong>Castles:</strong>
              </p>
              <ul className="list-disc pl-6">
                <li>White's Castle: F1, G1</li>
                <li>Black's Castle: F16, G16</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Movement Types</h3>
              
              <div className="mb-4">
                <h4 className="font-semibold mb-1">1. Plain Move</h4>
                <p className="mb-1">
                  Move one square in any direction (horizontal, vertical, or diagonal) to an adjacent empty square.
                </p>
                <p className="text-muted-foreground italic">Notation: C8-D9</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-1">2. Canter</h4>
                <p className="mb-2">
                  Leap over a <strong>friendly piece</strong> on an adjacent square, landing on the empty square immediately beyond it in a straight line.
                </p>
                <p className="mb-1"><strong>Key Rules:</strong></p>
                <ul className="list-disc pl-6 mb-1">
                  <li>Pieces cantered over are NOT removed</li>
                  <li>Can canter multiple times in one move</li>
                  <li>Can change direction after each canter</li>
                  <li>Cannot start and end on the same square</li>
                  <li>Never required to canter</li>
                  <li>Never required to canter as far as possible</li>
                </ul>
                <p className="text-muted-foreground italic">Notation: E6-C8-A8 (cantered from E6 to C8 to A8)</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-1">3. Jump</h4>
                <p className="mb-2">
                  Leap over an <strong>enemy piece</strong> on an adjacent square, landing on the empty square immediately beyond it in a straight line.
                </p>
                <p className="mb-1"><strong>Key Rules:</strong></p>
                <ul className="list-disc pl-6 mb-2">
                  <li>Jumped pieces ARE captured and removed immediately</li>
                  <li><strong>REQUIRED:</strong> Must jump if any of your pieces is next to an exposed enemy piece</li>
                  <li>Must continue jumping if you land next to another exposed enemy piece</li>
                  <li><strong>Exception:</strong> Jumping into opponent's Castle ends your turn immediately</li>
                  <li>Can change direction after each jump</li>
                  <li>Can choose which piece to jump with and which enemy to capture (if multiple options exist)</li>
                </ul>
                <p className="mb-1">
                  <strong>Special Exception to Jump Obligation:</strong> The ONLY time you can ignore the jump obligation is when you just jumped into your own Castle on the previous turn and must now move that piece out.
                </p>
                <p className="text-muted-foreground italic">Notation: H4xJ4xL6 (jumped from H4 to J4 to L6, capturing pieces)</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-1">4. Knight's Charge</h4>
                <p className="mb-2">
                  <strong>Knights only</strong> can combine a Canter and a Jump in a single move.
                </p>
                <p className="mb-1"><strong>Key Rules:</strong></p>
                <ul className="list-disc pl-6 mb-2">
                  <li>Must follow order: Canter(s) FIRST, then Jump(s)</li>
                  <li>Never required to make a Knight's Charge</li>
                  <li>If cantering brings the Knight next to an enemy piece, must jump it UNLESS you capture elsewhere in the same move</li>
                  <li>Once jumping begins, must continue jumping if you land next to exposed enemy pieces</li>
                  <li>Can change direction after each canter and after each jump</li>
                  <li>Direction of last canter and first jump need not be the same</li>
                </ul>
                <p className="text-muted-foreground italic">Notation: F6-F8-H8xH10xJ12 (cantered from F6 to F8 to H8, then jumped to H10 to J12)</p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Winning the Game</h3>
              <p className="mb-1">You win if:</p>
              <ol className="list-decimal pl-6">
                <li><strong>Castle Victory:</strong> You move any two of your pieces into your opponent's Castle, OR</li>
                <li><strong>Capture Victory:</strong> You capture all opponent's pieces and have 2+ of your own pieces left, OR</li>
                <li><strong>Stalemate Victory:</strong> You have 2+ pieces and your opponent cannot make a legal move</li>
              </ol>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Draw Conditions</h3>
              <p className="mb-1">The game is drawn if:</p>
              <ol className="list-decimal pl-6">
                <li>Both players agree, OR</li>
                <li>The same position appears for the third time with the same player to move, OR</li>
                <li>50 consecutive moves by each side with no captures and no piece moving onto an opponent's Castle Square, OR</li>
                <li>Both players have only one piece remaining</li>
              </ol>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Your Own Castle Rules</h3>
              <p className="mb-2"><strong>Entry Restrictions:</strong></p>
              <ul className="list-disc pl-6 mb-2">
                <li>Cannot plain-move or canter into your own Castle</li>
                <li>Cannot canter into your own Castle during a Knight's Charge</li>
                <li>Can only enter by jumping over an enemy piece</li>
              </ul>
              <p className="mb-2"><strong>Forced Exit:</strong></p>
              <ul className="list-disc pl-6 mb-2">
                <li>If you jump into your own Castle and could continue jumping out, you MUST continue</li>
                <li>If you jump into your own Castle and cannot continue jumping, you MUST move that piece out on your next turn (no exception)</li>
                <li>This is the ONLY time you can ignore the jump obligation - when moving a piece out of your own Castle after jumping in</li>
              </ul>
              <p className="mb-2"><strong>Jump Out Priority:</strong></p>
              <ul className="list-disc pl-6">
                <li>When moving out, must jump out if possible (instead of plain-moving or cantering)</li>
                <li>Can satisfy this with a Knight's Charge instead if possible</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Opponent's Castle Rules</h3>
              <p className="mb-2"><strong>One-Way Entry:</strong></p>
              <ul className="list-disc pl-6 mb-2">
                <li>Pieces that enter the opponent's Castle cannot come out</li>
                <li>Even if your piece lands next to an exposed enemy after jumping in, your turn ends immediately</li>
              </ul>
              <p className="mb-2"><strong>Castle Moves:</strong></p>
              <ul className="list-disc pl-6">
                <li>A piece in the opponent's Castle can move between the two Castle Squares</li>
                <li>This "Castle Move" is allowed exactly twice per game per piece</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Illegal Moves</h3>
              <p>If an illegal move is made:</p>
              <ul className="list-disc pl-6">
                <li>Must retract and make a legal move</li>
                <li>If discovered later, restart from the position just before the illegal move</li>
              </ul>
            </section>

            <footer className="text-xs text-muted-foreground pt-4 border-t">
              <p>Based on the Official Rules of Camelot © 1999-2012 Michael Wortley Nolan and the World Camelot Federation</p>
            </footer>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

