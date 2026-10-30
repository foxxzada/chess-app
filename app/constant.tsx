export type Piece = "" | `${"w" | "b"}${"r" | "n" | "b" | "q" | "k" | "p"}`;
export type BoardPosition = Piece[][];
export type Color = "w" | "b";
export type PromotionPiece = "q" | "r" | "b" | "n";
export type DrawReason = "threefold" | "fiftyMove" | "insufficientMaterial" | "agreement";
export type Opponent = "human" | "stockfish";
export type StockfishDifficulty = "easy" | "medium" | "strong";

export interface TimeControl {
  name: string;
  initialTimeSeconds: number;
  incrementSeconds: number;
}

export const timeControls: TimeControl[] = [
  { name: "Bullet · 1 + 0", initialTimeSeconds: 60, incrementSeconds: 0 },
  { name: "Bullet · 1 + 1", initialTimeSeconds: 60, incrementSeconds: 1 },
  { name: "Bullet · 2 + 1", initialTimeSeconds: 120, incrementSeconds: 1 },
  { name: "Blitz · 3 + 0", initialTimeSeconds: 180, incrementSeconds: 0 },
  { name: "Blitz · 3 + 2", initialTimeSeconds: 180, incrementSeconds: 2 },
  { name: "Blitz · 5 + 0", initialTimeSeconds: 300, incrementSeconds: 0 },
  { name: "Blitz · 5 + 3", initialTimeSeconds: 300, incrementSeconds: 3 },
  { name: "Rapid · 10 + 0", initialTimeSeconds: 600, incrementSeconds: 0 },
  { name: "Rapid · 10 + 5", initialTimeSeconds: 600, incrementSeconds: 5 },
  { name: "Rapid · 15 + 10", initialTimeSeconds: 900, incrementSeconds: 10 },
  { name: "Clássico · 30 + 0", initialTimeSeconds: 1800, incrementSeconds: 0 },
  { name: "Clássico · 30 + 20", initialTimeSeconds: 1800, incrementSeconds: 20 },
];

export interface Coordinates {
  rank: number;
  file: number;
}

export interface CastlingRights {
  w: { kingSide: boolean; queenSide: boolean };
  b: { kingSide: boolean; queenSide: boolean };
}

export const initialPosition: BoardPosition = [
  ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
  ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
  ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"],
];

export interface GameState {
  board: BoardPosition;
  turn: Color;
  castling: CastlingRights;
  enPassant: Coordinates | null;
  promotion: Coordinates | null;
  status: "setup" | "playing" | "checkmate" | "stalemate" | "draw" | "timeout" | "resigned";
  winner: Color | null;
  drawReason: DrawReason | null;
  timeControl: TimeControl;
  opponent: Opponent;
  stockfishDifficulty: StockfishDifficulty;
  clocks: Record<Color, number>;
  halfmoveClock: number;
  positionHistory: Record<string, number>;
  moveHistory: string[];
  pendingNotation: string | null;
  drawOfferFrom: Color | null;
}

export function createInitialGameState(
  timeControl = timeControls[6],
  opponent: Opponent = "human",
  stockfishDifficulty: StockfishDifficulty = "easy",
): GameState {
  return {
    board: initialPosition.map((rank) => [...rank]),
    turn: "w",
    castling: {
      w: { kingSide: true, queenSide: true },
      b: { kingSide: true, queenSide: true },
    },
    enPassant: null,
    promotion: null,
    status: "setup",
    winner: null,
    drawReason: null,
    timeControl,
    opponent,
    stockfishDifficulty,
    clocks: { w: timeControl.initialTimeSeconds, b: timeControl.initialTimeSeconds },
    halfmoveClock: 0,
    positionHistory: {},
    moveHistory: [],
    pendingNotation: null,
    drawOfferFrom: null,
  };
}

export const initialGameState = createInitialGameState();
