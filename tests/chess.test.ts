import { describe, expect, it } from "vitest";
import { isInCheck, isLegalMove, makeMove, promotePawn, startGame, tickClock, toFen } from "../app/chess";
import { reducer } from "../app/components/Reducer/Reducer";
import type { BoardPosition, GameState, Piece } from "../app/constant";
import { timeControls } from "../app/constant";

const square = (name: string) => ({ rank: 8 - Number(name[1]), file: "abcdefgh".indexOf(name[0]) });
const move = (state: GameState, from: string, to: string) => makeMove(state, square(from), square(to));
const emptyBoard = (): BoardPosition => Array.from({ length: 8 }, () => Array<Piece>(8).fill(""));
function position(pieces: Record<string, Piece>, turn: "w" | "b" = "w"): GameState {
  const state = startGame(timeControls[6]);
  const board = emptyBoard();
  for (const [name, piece] of Object.entries(pieces)) {
    const { rank, file } = square(name);
    board[rank][file] = piece;
  }
  return { ...state, board, turn, castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } }, positionHistory: {} };
}

describe("chess rules", () => {
  it("starts with the standard FEN and clocks", () => {
    const state = startGame(timeControls[6]);
    expect(toFen(state)).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    expect(state.clocks).toEqual({ w: 300, b: 300 });
  });
  it("allows a pawn opening and switches turns", () => {
    const next = move(startGame(timeControls[6]), "e2", "e4");
    expect(next.board[4][4]).toBe("wp");
    expect(next.turn).toBe("b");
    expect(toFen(next)).toContain(" e3 ");
  });
  it("rejects illegal moves and keeps the original state", () => {
    const state = startGame(timeControls[6]);
    expect(move(state, "c1", "h6")).toBe(state);
    expect(move(state, "e2", "e5")).toBe(state);
    expect(move(state, "e7", "e5")).toBe(state);
  });
  it("does not allow exposing one's king to check", () => {
    const state = position({ e1: "wk", e2: "wr", e8: "br", a8: "bk" });
    expect(isLegalMove(state, square("e2"), square("f2"))).toBe(false);
    expect(move(state, "e2", "f2")).toBe(state);
  });
  it("detects check", () => {
    expect(isInCheck(position({ e1: "wk", e8: "br", a8: "bk" }).board, "w")).toBe(true);
  });
  it("supports en passant", () => {
    const state = { ...position({ e1: "wk", e8: "bk", e5: "wp", d5: "bp" }), enPassant: square("d6") };
    const next = move(state, "e5", "d6");
    expect(next.board[square("d6").rank][square("d6").file]).toBe("wp");
    expect(next.board[square("d5").rank][square("d5").file]).toBe("");
  });
  it("castles with the rook", () => {
    const state = position({ e1: "wk", h1: "wr", e8: "bk" });
    state.castling.w.kingSide = true;
    const next = move(state, "e1", "g1");
    expect(next.board[7][6]).toBe("wk");
    expect(next.board[7][5]).toBe("wr");
  });
  it("blocks castling through an attacked square", () => {
    const state = position({ e1: "wk", h1: "wr", f8: "br", a8: "bk" });
    state.castling.w.kingSide = true;
    expect(move(state, "e1", "g1")).toBe(state);
  });
  it("promotes a pawn and finishes its turn", () => {
    const state = position({ e1: "wk", e8: "bk", a7: "wp" });
    const pending = move(state, "a7", "a8");
    expect(pending.promotion).toEqual(square("a8"));
    expect(pending.turn).toBe("w");
    const next = promotePawn(pending, "q");
    expect(next.board[0][0]).toBe("wq");
    expect(next.turn).toBe("b");
  });
  it("recognizes fool's mate", () => {
    let state = startGame(timeControls[6]);
    for (const [from, to] of [["f2", "f3"], ["e7", "e5"], ["g2", "g4"], ["d8", "h4"]]) state = move(state, from, to);
    expect(state.status).toBe("checkmate");
    expect(state.winner).toBe("b");
  });
  it("recognizes stalemate", () => {
    const state = position({ a8: "bk", c6: "wk", b5: "wq" });
    const next = move(state, "b5", "b6");
    expect(next.status).toBe("stalemate");
  });
  it("recognizes insufficient material", () => {
    const state = position({ e1: "wk", e8: "bk", b1: "wn" });
    expect(move(state, "b1", "c3").drawReason).toBe("insufficientMaterial");
  });
  it("decrements the clock and declares timeout", () => {
    const state = { ...startGame(timeControls[6]), clocks: { w: 1, b: 20 } };
    const next = tickClock(state);
    expect(next.status).toBe("timeout");
    expect(next.winner).toBe("b");
    expect(tickClock(next)).toBe(next);
  });
  it("routes engine moves through the reducer", () => {
    const state = move(startGame(timeControls[6], "stockfish"), "e2", "e4");
    const next = reducer(state, { type: "ENGINE_MOVE", fromRank: 1, fromFile: 4, toRank: 3, toFile: 4, promotion: "q" });
    expect(next.board[3][4]).toBe("bp");
    expect(next.turn).toBe("w");
  });
  it("rejects illegal engine moves", () => {
    const state = move(startGame(timeControls[6], "stockfish"), "e2", "e4");
    expect(reducer(state, { type: "ENGINE_MOVE", fromRank: 0, fromFile: 2, toRank: 3, toFile: 5, promotion: "q" })).toBe(state);
  });
});

describe("move notation and game controls", () => {
  it("records standard notation for both sides and clears it for a new game", () => {
    let state = startGame(timeControls[6]);
    state = move(state, "e2", "e4");
    state = move(state, "e7", "e5");
    state = move(state, "g1", "f3");

    expect(state.moveHistory).toEqual(["e4", "e5", "Nf3"]);
    expect(startGame(timeControls[6]).moveHistory).toEqual([]);
  });

  it("marks checkmate in the recorded notation", () => {
    let state = startGame(timeControls[6]);
    for (const [from, to] of [["f2", "f3"], ["e7", "e5"], ["g2", "g4"], ["d8", "h4"]]) {
      state = move(state, from, to);
    }

    expect(state.moveHistory).toEqual(["f3", "e5", "g4", "Qh4#"]);
  });

  it("records a promotion as one move after the piece is chosen", () => {
    const pending = move(position({ e1: "wk", e8: "bk", a7: "wp" }), "a7", "a8");
    expect(pending.moveHistory).toEqual([]);

    const promoted = promotePawn(pending, "q");
    expect(promoted.moveHistory).toEqual(["a8=Q+"]);
  });

  it("records resignation as a loss for the resigning player", () => {
    const state = startGame(timeControls[6]);
    const resigned = reducer(state, { type: "RESIGN", color: "w" });

    expect(resigned.status).toBe("resigned");
    expect(resigned.winner).toBe("b");
    expect(reducer(resigned, { type: "RESIGN", color: "w" })).toBe(resigned);
  });

  it("allows the human to resign while Stockfish is to move", () => {
    const state = move(startGame(timeControls[6], "stockfish"), "e2", "e4");
    expect(state.turn).toBe("b");

    const resigned = reducer(state, { type: "RESIGN", color: "w" });
    expect(resigned.status).toBe("resigned");
    expect(resigned.winner).toBe("b");
  });

  it("allows the opposing player to accept a draw offer", () => {
    const state = startGame(timeControls[6], "human");
    const offered = reducer(state, { type: "OFFER_DRAW", color: "w" });
    expect(offered.drawOfferFrom).toBe("w");

    const accepted = reducer(offered, { type: "ACCEPT_DRAW" });
    expect(accepted.status).toBe("draw");
    expect(accepted.drawReason).toBe("agreement");
    expect(accepted.winner).toBeNull();
    expect(accepted.drawOfferFrom).toBeNull();
  });

  it("clears a declined or withdrawn draw offer", () => {
    const state = reducer(startGame(timeControls[6], "human"), { type: "OFFER_DRAW", color: "w" });
    expect(reducer(state, { type: "DECLINE_DRAW" }).drawOfferFrom).toBeNull();
    expect(reducer(state, { type: "CANCEL_DRAW_OFFER" }).drawOfferFrom).toBeNull();
  });

  it("does not offer a negotiated draw against Stockfish", () => {
    const state = startGame(timeControls[6], "stockfish");
    expect(reducer(state, { type: "OFFER_DRAW", color: "w" })).toBe(state);
  });
});
