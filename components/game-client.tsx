"use client";

import { ChivalryBoard } from "@/components/chivalry-board";
import {
  GameBoardControls,
  GameHeader,
  GameMetadata,
  GameMoveHistory,
  GamePlayerCard,
  GameTurnControls,
} from "@/components/game";
import { GameChat } from "@/components/game-chat";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGameActions } from "@/hooks/use-game-actions";
import { useGameState } from "@/hooks/use-game-state";
import type { GameData } from "@/types/game";
import { useRouter } from "next/navigation";

export function GameClient({
  game: initialGame,
  userId,
}: {
  game: GameData;
  userId: string;
}) {
  const router = useRouter();

  const {
    game,
    setGame,
    selectedSquare,
    setSelectedSquare,
    legalMoves,
    setLegalMoves,
    turnState,
    setTurnState,
    message,
    setMessage,
    currentMoveIndex,
    setCurrentMoveIndex,
    viewingBoardState,
    isWhitePlayer,
    playerColor,
    isPlayerTurn,
    isViewingLatest,
    isGameCompleted,
    isWinner,
    supabase,
  } = useGameState(initialGame, userId);

  const {
    isSubmitting,
    handleSquareClick,
    handleSubmitTurn,
    handleResign,
    goToFirstMove,
    goToPreviousMove,
    goToNextMove,
    goToLastMove,
    goToMove,
  } = useGameActions({
    game,
    setGame,
    userId,
    playerColor,
    isPlayerTurn,
    isViewingLatest,
    turnState,
    setTurnState,
    selectedSquare,
    setSelectedSquare,
    legalMoves,
    setLegalMoves,
    message,
    setMessage,
    setCurrentMoveIndex,
    supabase,
  });

  const handleResignAndNavigate = async () => {
    await handleResign();
    router.push("/lobby");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GameHeader
        isGameCompleted={isGameCompleted}
        onResign={handleResignAndNavigate}
      />

      {/* Alerts */}
      {!isViewingLatest && (
        <Alert className="mx-4 mt-4 mb-0">
          <AlertDescription>
            Viewing move {currentMoveIndex} / {game.move_history.length}. Piece
            movement is disabled.
          </AlertDescription>
        </Alert>
      )}

      {isGameCompleted && (
        <Alert className="mx-4 mt-4 mb-0">
          <AlertDescription className="text-lg font-semibold">
            {isWinner ? "You Won!" : "You Lost"} -{" "}
            {game.win_reason?.replace(/_/g, " ")}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full lg:grid lg:grid-cols-[320px_1fr_320px] lg:gap-4 lg:container lg:mx-auto lg:px-4 lg:py-4">
          {/* Left Sidebar - Desktop Only */}
          <div className="hidden lg:flex flex-col gap-4 overflow-hidden">
            <GameMetadata
              status={game.status}
              moveCount={game.move_history.length}
              whiteCastleMoves={game.white_castle_moves}
              blackCastleMoves={game.black_castle_moves}
            />

            <div className="flex-1 min-h-0">
              <GameChat
                gameId={game.id}
                userId={userId}
                whitePlayerId={game.white_player_id}
                blackPlayerId={game.black_player_id}
              />
            </div>
          </div>

          {/* Center - Board */}
          <div className="flex flex-col lg:items-center lg:justify-center h-full">
            {/* Mobile: Black Player at Top */}
            <div className="lg:hidden mt-2">
              <GamePlayerCard
                player={game.black_player}
                color="black"
                isActive={!isWhitePlayer && game.current_turn === "black"}
                mobile
              />
            </div>

            <div className="w-full lg:max-w-[600px] px-2 lg:px-0 py-2 lg:py-0">
              <ChivalryBoard
                boardState={viewingBoardState}
                selectedSquare={selectedSquare}
                legalMoves={legalMoves}
                onSquareClick={handleSquareClick}
                playerColor={playerColor}
                disabled={
                  !isPlayerTurn ||
                  isSubmitting ||
                  game.status !== "active" ||
                  !isViewingLatest
                }
              />

              <GameBoardControls
                currentMoveIndex={currentMoveIndex}
                totalMoves={game.move_history.length}
                onFirst={goToFirstMove}
                onPrevious={goToPreviousMove}
                onNext={() => goToNextMove(currentMoveIndex)}
                onLast={goToLastMove}
              />
            </div>

            {/* Mobile: White Player at Bottom */}
            <div className="lg:hidden mb-2">
              <GamePlayerCard
                player={game.white_player}
                color="white"
                isActive={isWhitePlayer && game.current_turn === "white"}
                mobile
              />
            </div>

            {/* Mobile: Turn Status & Submit */}
            {isPlayerTurn && !isGameCompleted && (
              <GameTurnControls
                turnState={turnState}
                message={message}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmitTurn}
                mobile
              />
            )}

            {/* Mobile: Game Metadata at Bottom */}
            <div className="lg:hidden">
              <GameMetadata
                status={game.status}
                moveCount={game.move_history.length}
                whiteCastleMoves={game.white_castle_moves}
                blackCastleMoves={game.black_castle_moves}
                mobile
              />
            </div>
          </div>

          {/* Right Sidebar - Desktop Only */}
          <div className="hidden lg:flex flex-col gap-4 overflow-hidden">
            <GamePlayerCard
              player={game.black_player}
              color="black"
              isActive={!isWhitePlayer && game.current_turn === "black"}
            />

            <GameMoveHistory
              moves={game.move_history}
              currentMoveIndex={currentMoveIndex}
              onMoveClick={goToMove}
            />

            <GamePlayerCard
              player={game.white_player}
              color="white"
              isActive={isWhitePlayer && game.current_turn === "white"}
            />

            {isPlayerTurn && !isGameCompleted && (
              <GameTurnControls
                turnState={turnState}
                message={message}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmitTurn}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
