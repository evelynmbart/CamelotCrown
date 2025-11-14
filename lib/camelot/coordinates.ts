import { Board } from "./board";

export class Coordinates {
  static readonly DIRECTIONS: [number, number][] = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
    [1, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
  ];

  static parseSquare(square: string): { file: number; rank: number } {
    const file = square.charCodeAt(0) - 65; // A=0, B=1, ..., L=11
    const rank = Number.parseInt(square.slice(1));
    return { file, rank };
  }

  static toSquare(file: number, rank: number): string {
    return String.fromCharCode(65 + file) + rank;
  }

  static isValidSquare(square: string): boolean {
    return Board.ALL_SQUARES.includes(square);
  }

  static isOneAdjacent(from: string, to: string): boolean {
    const { file: f1, rank: r1 } = Coordinates.parseSquare(from);
    const { file: f2, rank: r2 } = Coordinates.parseSquare(to);
    const df = Math.abs(f1 - f2);
    const dr = Math.abs(r1 - r2);
    return (
      (df === 1 && dr === 0) || (df === 0 && dr === 1) || (df === 1 && dr === 1)
    );
  }

  static isTwoAdjacent(from: string, to: string): boolean {
    const { file: f1, rank: r1 } = Coordinates.parseSquare(from);
    const { file: f2, rank: r2 } = Coordinates.parseSquare(to);
    const df = Math.abs(f1 - f2);
    const dr = Math.abs(r1 - r2);
    return (
      (df === 2 && dr === 0) || (df === 0 && dr === 2) || (df === 2 && dr === 2)
    );
  }

  static getAdjacentSquare(
    square: string,
    direction: [number, number]
  ): string | null {
    const { file, rank } = Coordinates.parseSquare(square);
    const newFile = file + direction[0];
    const newRank = rank + direction[1];
    const newSquare = Coordinates.toSquare(newFile, newRank);
    return Coordinates.isValidSquare(newSquare) ? newSquare : null;
  }

  static getDirection(from: string, to: string): [number, number] | null {
    const { file: fromFile, rank: fromRank } = Coordinates.parseSquare(from);
    const { file: toFile, rank: toRank } = Coordinates.parseSquare(to);

    const dFile = toFile - fromFile;
    const dRank = toRank - fromRank;

    // Normalize to -1, 0, or 1
    const dirFile = dFile === 0 ? 0 : dFile / Math.abs(dFile);
    const dirRank = dRank === 0 ? 0 : dRank / Math.abs(dRank);

    return [dirFile, dirRank];
  }
}
