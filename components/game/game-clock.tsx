"use client";

import { useEffect, useState } from "react";

interface GameClockProps {
  timeRemaining: number | null | undefined; // milliseconds
  isActive: boolean;
  lastMoveTime?: string | null;
  onTimeout?: () => void;
}

export function GameClock({
  timeRemaining,
  isActive,
  lastMoveTime,
  onTimeout,
}: GameClockProps) {
  const [displayTime, setDisplayTime] = useState(timeRemaining);

  useEffect(() => {
    // If no time control, don't count down
    if (timeRemaining === null || timeRemaining === undefined) {
      setDisplayTime(null);
      return;
    }

    // If clock is not active (opponent's turn or game not started)
    if (!isActive || !lastMoveTime) {
      setDisplayTime(timeRemaining);
      return;
    }

    // Calculate the REAL current time based on when the last move was made
    const lastMoveDate = new Date(lastMoveTime);
    const now = Date.now();
    const elapsedSinceLastMove = now - lastMoveDate.getTime();
    
    // Calculate what the time should be NOW (not when the DB was last updated)
    const currentTime = Math.max(0, timeRemaining - elapsedSinceLastMove);
    setDisplayTime(currentTime);

    // If already timed out
    if (currentTime <= 0 && onTimeout) {
      onTimeout();
      return;
    }

    // Count down from the CURRENT time, not the DB time
    const startTime = now;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newTime = Math.max(0, currentTime - elapsed);
      
      setDisplayTime(newTime);

      // Check for timeout
      if (newTime <= 0 && onTimeout) {
        clearInterval(interval);
        onTimeout();
      }
    }, 100); // Update every 100ms for smooth countdown

    return () => clearInterval(interval);
  }, [timeRemaining, isActive, lastMoveTime, onTimeout]);

  // No time control
  if (displayTime === null || displayTime === undefined) {
    return <div className="text-xl lg:text-2xl font-mono">--:--</div>;
  }

  // Format time display
  const totalSeconds = Math.ceil(displayTime / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // Determine color based on time remaining
  const isLowTime = displayTime < 20000; // Under 20 seconds
  const isCritical = displayTime < 10000; // Under 10 seconds

  return (
    <div
      className={`text-xl lg:text-2xl font-mono transition-colors ${
        isCritical
          ? "text-red-600 dark:text-red-400"
          : isLowTime
            ? "text-orange-600 dark:text-orange-400"
            : ""
      }`}
    >
      {timeString}
    </div>
  );
}

