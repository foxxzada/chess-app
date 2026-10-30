import { createInitialGameState } from "./constant";
import type { BoardPosition, Color, Coordinates, GameState, Opponent, Piece, PromotionPiece, StockfishDifficulty, TimeControl } from "./constant";

export function getColor(piece: Piece): Color | null {
  return piece ? piece[0] as Color : null;
}

function opponent(color: Color): Color {
  return color === "w" ? "b" : "w";
}

function getPositionKey(state: GameState) {
  const board = state.board.map((rank) => rank.join("")).join("/");
  const castling = `${state.castling.w.kingSide ? "K" : ""}${state.castling.w.queenSide ? "Q" : ""}${state.castling.b.kingSide ? "k" : ""}${state.castling.b.queenSide ? "q" : ""}` || "-";
  const enPassant = state.enPassant ? `${state.enPassant.rank}${state.enPassant.file}` : "-";
  return `${board} ${state.turn} ${castling} ${enPassant}`;
}

export function startGame(
  timeControl: TimeControl,
  opponent: Opponent = "human",
  stockfishDifficulty: StockfishDifficulty = "easy",
): GameState {
  const state = { ...createInitialGameState(timeControl, opponent, stockfishDifficulty), status: "playing" as const };
  return { ...state, positionHistory: { [getPositionKey(state)]: 1 } };
}

export function toFen(state: GameState) {
  const board = state.board.map((rank) => {
    let empty = 0;
    let fenRank = "";
    for (const piece of rank) {
      if (!piece) {
        empty += 1;
        continue;
      }
      if (empty) fenRank += empty;
      empty = 0;
      const symbol = piece[1];
      fenRank += getColor(piece) === "w" ? symbol.toUpperCase() : symbol;
    }
    if (empty) fenRank += empty;
    return fenRank;
  }).join("/");
  const castling = `${state.castling.w.kingSide ? "K" : ""}${state.castling.w.queenSide ? "Q" : ""}${state.castling.b.kingSide ? "k" : ""}${state.castling.b.queenSide ? "q" : ""}` || "-";
  const enPassant = state.enPassant
    ? `${"abcdefgh"[state.enPassant.file]}${8 - state.enPassant.rank}`
    : "-";
  return `${board} ${state.turn} ${castling} ${enPassant} ${state.halfmoveClock} 1`;
}

function isInside({ rank, file }: Coordinates) {
  return rank >= 0 && rank < 8 && file >= 0 && file < 8;
}

function isPathClear(board: BoardPosition, from: Coordinates, to: Coordinates) {
  const rankStep = Math.sign(to.rank - from.rank);
  const fileStep = Math.sign(to.file - from.file);
  let rank = from.rank + rankStep;
  let file = from.file + fileStep;

  while (rank !== to.rank || file !== to.file) {
    if (board[rank][file]) return false;
    rank += rankStep;
    file += fileStep;
  }
  return true;
}

export function isSquareAttacked(board: BoardPosition, target: Coordinates, byColor: Color) {
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank][file];
      if (getColor(piece) !== byColor) continue;

      const from = { rank, file };
      const rankDelta = target.rank - rank;
      const fileDelta = target.file - file;
      const absoluteRank = Math.abs(rankDelta);
      const absoluteFile = Math.abs(fileDelta);

      switch (piece[1]) {
        case "p":
          if (rankDelta === (byColor === "w" ? -1 : 1) && absoluteFile === 1) return true;
          break;
        case "n":
          if ((absoluteRank === 2 && absoluteFile === 1) || (absoluteRank === 1 && absoluteFile === 2)) return true;
          break;
        case "b":
          if (absoluteRank === absoluteFile && isPathClear(board, from, target)) return true;
          break;
        case "r":
          if ((rankDelta === 0 || fileDelta === 0) && isPathClear(board, from, target)) return true;
          break;
        case "q":
          if ((absoluteRank === absoluteFile || rankDelta === 0 || fileDelta === 0) && isPathClear(board, from, target)) return true;
          break;
        case "k":
          if (absoluteRank <= 1 && absoluteFile <= 1) return true;
          break;
      }
    }
  }
  return false;
}

export function isInCheck(board: BoardPosition, color: Color) {
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      if (board[rank][file] === `${color}k`) {
        return isSquareAttacked(board, { rank, file }, opponent(color));
      }
    }
  }
  return true;
}

function canCastle(state: GameState, from: Coordinates, to: Coordinates) {
  const color = getColor(state.board[from.rank][from.file]);
  if (!color || from.file !== 4 || from.rank !== (color === "w" ? 7 : 0)) return false;
  const kingSide = to.file === 6;
  const queenSide = to.file === 2;
  if (!kingSide && !queenSide) return false;
  if (!(kingSide ? state.castling[color].kingSide : state.castling[color].queenSide)) return false;
  const rookFile = kingSide ? 7 : 0;
  if (state.board[from.rank][rookFile] !== `${color}r`) return false;
  const between = kingSide ? [5, 6] : [1, 2, 3];
  if (between.some((file) => state.board[from.rank][file])) return false;
  if (isInCheck(state.board, color)) return false;
  const enemy = opponent(color);
  const crossingFile = kingSide ? 5 : 3;
  const boardAfterCrossing = state.board.map((rank) => [...rank]);
  boardAfterCrossing[from.rank][from.file] = "";
  boardAfterCrossing[from.rank][crossingFile] = `${color}k`;
  return !isSquareAttacked(boardAfterCrossing, { rank: from.rank, file: crossingFile }, enemy);
}

function isPseudoLegalMove(state: GameState, from: Coordinates, to: Coordinates) {
  if (!isInside(from) || !isInside(to)) return false;
  const piece = state.board[from.rank][from.file];
  const target = state.board[to.rank][to.file];
  const color = getColor(piece);
  if (!piece || color !== state.turn || getColor(target) === color || target[1] === "k") return false;

  const rankDelta = to.rank - from.rank;
  const fileDelta = to.file - from.file;
  const absoluteRank = Math.abs(rankDelta);
  const absoluteFile = Math.abs(fileDelta);

  switch (piece[1]) {
    case "p": {
      const direction = color === "w" ? -1 : 1;
      const startRank = color === "w" ? 6 : 1;
      if (fileDelta === 0 && rankDelta === direction && !target) return true;
      if (fileDelta === 0 && rankDelta === direction * 2 && from.rank === startRank && !target && !state.board[from.rank + direction][from.file]) return true;
      if (absoluteFile === 1 && rankDelta === direction && getColor(target) === opponent(color)) return true;
      if (absoluteFile === 1 && rankDelta === direction && !target && state.enPassant?.rank === to.rank && state.enPassant.file === to.file) {
        return state.board[from.rank][to.file] === `${opponent(color)}p`;
      }
      return false;
    }
    case "n":
      return (absoluteRank === 2 && absoluteFile === 1) || (absoluteRank === 1 && absoluteFile === 2);
    case "b":
      return absoluteRank === absoluteFile && isPathClear(state.board, from, to);
    case "r":
      return (rankDelta === 0 || fileDelta === 0) && isPathClear(state.board, from, to);
    case "q":
      return (absoluteRank === absoluteFile || rankDelta === 0 || fileDelta === 0) && isPathClear(state.board, from, to);
    case "k":
      return (absoluteRank <= 1 && absoluteFile <= 1) || canCastle(state, from, to);
  }
}

function applyMove(state: GameState, from: Coordinates, to: Coordinates): GameState {
  const board = state.board.map((rank) => [...rank]);
  const piece = board[from.rank][from.file];
  const target = board[to.rank][to.file];
  const color = getColor(piece)!;
  const nextCastling = {
    w: { ...state.castling.w },
    b: { ...state.castling.b },
  };

  board[to.rank][to.file] = piece;
  board[from.rank][from.file] = "";

  const isEnPassantCapture = piece[1] === "p" && state.enPassant?.rank === to.rank && state.enPassant.file === to.file && !target;
  if (isEnPassantCapture) {
    board[from.rank][to.file] = "";
  }
  if (piece[1] === "k") {
    nextCastling[color] = { kingSide: false, queenSide: false };
    if (Math.abs(to.file - from.file) === 2) {
      const rookFromFile = to.file === 6 ? 7 : 0;
      const rookToFile = to.file === 6 ? 5 : 3;
      board[to.rank][rookToFile] = board[to.rank][rookFromFile];
      board[to.rank][rookFromFile] = "";
    }
  }
  if (piece === "wr" && from.rank === 7) {
    if (from.file === 0) nextCastling.w.queenSide = false;
    if (from.file === 7) nextCastling.w.kingSide = false;
  }
  if (piece === "br" && from.rank === 0) {
    if (from.file === 0) nextCastling.b.queenSide = false;
    if (from.file === 7) nextCastling.b.kingSide = false;
  }
  if (target === "wr" && to.rank === 7) {
    if (to.file === 0) nextCastling.w.queenSide = false;
    if (to.file === 7) nextCastling.w.kingSide = false;
  }
  if (target === "br" && to.rank === 0) {
    if (to.file === 0) nextCastling.b.queenSide = false;
    if (to.file === 7) nextCastling.b.kingSide = false;
  }

  return {
    ...state,
    board,
    castling: nextCastling,
    enPassant: piece[1] === "p" && Math.abs(to.rank - from.rank) === 2
      ? { rank: (to.rank + from.rank) / 2, file: from.file }
      : null,
    halfmoveClock: piece[1] === "p" || Boolean(target) || isEnPassantCapture ? 0 : state.halfmoveClock + 1,
  };
}

export function isLegalMove(state: GameState, from: Coordinates, to: Coordinates) {
  if (state.status !== "playing" || state.promotion || !isPseudoLegalMove(state, from, to)) return false;
  const color = state.turn;
  return !isInCheck(applyMove(state, from, to).board, color);
}

function hasLegalMove(state: GameState, color: Color) {
  const stateForColor = { ...state, turn: color };
  for (let fromRank = 0; fromRank < 8; fromRank += 1) {
    for (let fromFile = 0; fromFile < 8; fromFile += 1) {
      for (let toRank = 0; toRank < 8; toRank += 1) {
        for (let toFile = 0; toFile < 8; toFile += 1) {
          if (isLegalMove(stateForColor, { rank: fromRank, file: fromFile }, { rank: toRank, file: toFile })) return true;
        }
      }
    }
  }
  return false;
}

function finishTurn(state: GameState, movingColor: Color, notation: string): GameState {
  const nextTurn = opponent(movingColor);
  const withIncrement = {
    ...state,
    clocks: { ...state.clocks, [movingColor]: state.clocks[movingColor] + state.timeControl.incrementSeconds },
  };
  const positionState = { ...withIncrement, turn: nextTurn };
  const positionKey = getPositionKey(positionState);
  const nextState = {
    ...positionState,
    positionHistory: {
      ...positionState.positionHistory,
      [positionKey]: (positionState.positionHistory[positionKey] ?? 0) + 1,
    },
  };
  const legalMoveExists = hasLegalMove(nextState, nextTurn);

  let result = nextState;
  if (!legalMoveExists) {
    if (isInCheck(nextState.board, nextTurn)) {
      result = { ...nextState, status: "checkmate", winner: movingColor };
    } else {
      result = { ...nextState, status: "stalemate", winner: null };
    }
  } else if (isInsufficientMaterial(nextState.board)) {
    result = { ...nextState, status: "draw", drawReason: "insufficientMaterial" };
  } else if (nextState.halfmoveClock >= 100) {
    result = { ...nextState, status: "draw", drawReason: "fiftyMove" };
  } else if (nextState.positionHistory[positionKey] >= 3) {
    result = { ...nextState, status: "draw", drawReason: "threefold" };
  }

  const suffix = result.status === "checkmate" ? "#" : isInCheck(result.board, nextTurn) ? "+" : "";
  return {
    ...result,
    moveHistory: [...state.moveHistory, `${notation}${suffix}`],
    pendingNotation: null,
    drawOfferFrom: null,
  };
}

function isInsufficientMaterial(board: BoardPosition) {
  const minorPieces: Array<{ piece: Piece; squareColor: number }> = [];
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank][file];
      if (!piece || piece[1] === "k") continue;
      if (piece[1] === "p" || piece[1] === "r" || piece[1] === "q") return false;
      minorPieces.push({ piece, squareColor: (rank + file) % 2 });
    }
  }
  if (minorPieces.length <= 1) return true;
  return minorPieces.every(({ piece }) => piece[1] === "b")
    && minorPieces.every(({ squareColor }) => squareColor === minorPieces[0].squareColor);
}

function squareName({ rank, file }: Coordinates) {
  return `${"abcdefgh"[file]}${8 - rank}`;
}

function sanForMove(state: GameState, from: Coordinates, to: Coordinates) {
  const piece = state.board[from.rank][from.file];
  const target = state.board[to.rank][to.file];
  const isPawn = piece[1] === "p";
  const isCapture = Boolean(target) || (isPawn && state.enPassant?.rank === to.rank && state.enPassant.file === to.file);

  if (piece[1] === "k" && Math.abs(to.file - from.file) === 2) {
    return to.file === 6 ? "O-O" : "O-O-O";
  }

  let disambiguation = "";
  if (!isPawn) {
    const competitors: Coordinates[] = [];
    for (let rank = 0; rank < 8; rank += 1) {
      for (let file = 0; file < 8; file += 1) {
        if (rank === from.rank && file === from.file) continue;
        if (state.board[rank][file] === piece && isLegalMove(state, { rank, file }, to)) {
          competitors.push({ rank, file });
        }
      }
    }
    if (competitors.length) {
      const sameFile = competitors.some((square) => square.file === from.file);
      const sameRank = competitors.some((square) => square.rank === from.rank);
      disambiguation = !sameFile ? "abcdefgh"[from.file]
        : !sameRank ? String(8 - from.rank)
          : squareName(from);
    }
  }

  const prefix = isPawn ? (isCapture ? "abcdefgh"[from.file] : "") : piece[1].toUpperCase();
  return `${prefix}${disambiguation}${isCapture ? "x" : ""}${squareName(to)}`;
}

export function makeMove(state: GameState, from: Coordinates, to: Coordinates): GameState {
  if (!isLegalMove(state, from, to)) return state;
  const notation = sanForMove(state, from, to);
  const movedState = applyMove(state, from, to);
  const movedPiece = movedState.board[to.rank][to.file];
  if (movedPiece[1] === "p" && (to.rank === 0 || to.rank === 7)) {
    return { ...movedState, promotion: to, pendingNotation: notation };
  }
  return finishTurn(movedState, state.turn, notation);
}

export function promotePawn(state: GameState, promotion: PromotionPiece): GameState {
  if (!state.promotion) return state;
  const { rank, file } = state.promotion;
  const pawn = state.board[rank][file];
  const color = getColor(pawn);
  if (!color || pawn[1] !== "p") return state;

  const board = state.board.map((currentRank) => [...currentRank]);
  board[rank][file] = `${color}${promotion}`;
  const notation = `${state.pendingNotation ?? squareName({ rank, file })}=${promotion.toUpperCase()}`;
  return finishTurn({ ...state, board, promotion: null }, color, notation);
}

export function tickClock(state: GameState): GameState {
  if (state.status !== "playing") return state;
  const remaining = state.clocks[state.turn];
  if (remaining > 1) {
    return { ...state, clocks: { ...state.clocks, [state.turn]: remaining - 1 } };
  }
  return {
    ...state,
    clocks: { ...state.clocks, [state.turn]: 0 },
    status: "timeout",
    winner: opponent(state.turn),
  };
}
