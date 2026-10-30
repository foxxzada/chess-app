import type { GameState, Opponent, PromotionPiece, StockfishDifficulty, TimeControl } from "../../constant";
import { makeMove, promotePawn, startGame, tickClock } from "../../chess";

export type GameAction =
  | {
      type: "MOVE_PIECE";
      fromRank: number;
      fromFile: number;
      toRank: number;
      toFile: number;
    }
  | { type: "PROMOTE_PAWN"; piece: PromotionPiece }
  | { type: "START_GAME"; timeControl: TimeControl; opponent: Opponent; stockfishDifficulty: StockfishDifficulty }
  | { type: "ENGINE_MOVE"; fromRank: number; fromFile: number; toRank: number; toFile: number; promotion: PromotionPiece }
  | { type: "OPEN_SETUP" }
  | { type: "TICK_CLOCK" }
  | { type: "RESIGN"; color: "w" | "b" }
  | { type: "OFFER_DRAW"; color: "w" | "b" }
  | { type: "ACCEPT_DRAW" }
  | { type: "DECLINE_DRAW" }
  | { type: "CANCEL_DRAW_OFFER" };

function opposite(color: "w" | "b") {
  return color === "w" ? "b" : "w";
}

export function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "MOVE_PIECE": {
      return makeMove(
        state,
        { rank: action.fromRank, file: action.fromFile },
        { rank: action.toRank, file: action.toFile },
      );
    }
    case "ENGINE_MOVE": {
      const movedState = makeMove(
        state,
        { rank: action.fromRank, file: action.fromFile },
        { rank: action.toRank, file: action.toFile },
      );
      return movedState.promotion ? promotePawn(movedState, action.promotion) : movedState;
    }
    case "PROMOTE_PAWN":
      return promotePawn(state, action.piece);
    case "START_GAME":
      return startGame(action.timeControl, action.opponent, action.stockfishDifficulty);
    case "OPEN_SETUP":
      return { ...state, status: "setup", drawOfferFrom: null };
    case "TICK_CLOCK":
      return tickClock(state);
    case "RESIGN":
      if (state.status !== "playing") return state;
      if (state.opponent === "stockfish" ? action.color !== "w" : action.color !== state.turn) return state;
      return { ...state, status: "resigned", winner: opposite(action.color), drawOfferFrom: null };
    case "OFFER_DRAW":
      if (state.status !== "playing" || state.opponent !== "human" || state.drawOfferFrom || action.color !== state.turn) return state;
      return { ...state, drawOfferFrom: action.color };
    case "ACCEPT_DRAW":
      if (state.status !== "playing" || state.opponent !== "human" || !state.drawOfferFrom) return state;
      return { ...state, status: "draw", drawReason: "agreement", winner: null, drawOfferFrom: null };
    case "DECLINE_DRAW":
    case "CANCEL_DRAW_OFFER":
      if (state.status !== "playing" || !state.drawOfferFrom) return state;
      return { ...state, drawOfferFrom: null };
  }
}
