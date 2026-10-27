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
  | { type: "TICK_CLOCK" };

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
      return { ...state, status: "setup" };
    case "TICK_CLOCK":
      return tickClock(state);
  }
}
