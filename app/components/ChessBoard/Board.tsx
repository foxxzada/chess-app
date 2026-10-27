"use client";

import { useEffect, useRef, useState } from "react";
import { getColor, isInCheck, isLegalMove, toFen } from "../../chess";
import type { GameState, PromotionPiece } from "../../constant";
import { useAppContext } from "../Contexts/Context";
import Files from "./BoardBits/Files";
import Ranks from "./BoardBits/Ranks";
import Square from "./Square";
import PieceImage from "../ChessPieces/PieceImage";

interface Coordinates {
  rank: number;
  file: number;
}

const stockfishStrength = {
  easy: { elo: 1320, skillLevel: 0 },
  medium: { elo: 1800, skillLevel: 10 },
  strong: { elo: 2400, skillLevel: 20 },
} as const;

function hasSameColor(firstPiece: string, secondPiece: string) {
  return firstPiece && secondPiece && firstPiece[0] === secondPiece[0];
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function ChessBoard() {
  const { appState, dispatch } = useAppContext();
  const [dragging, setDragging] = useState<Coordinates | null>(null);
  const [selected, setSelected] = useState<Coordinates | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [engineError, setEngineError] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const pendingFenRef = useRef<string | null>(null);
  const latestStateRef = useRef(appState);
  latestStateRef.current = appState;

  useEffect(() => {
    if (appState.opponent !== "stockfish") return;
    const worker = new Worker("/stockfish/stockfish-19-lite-single.js");
    workerRef.current = worker;
    setEngineReady(false);
    setEngineError(false);

    worker.onmessage = (event: MessageEvent<string>) => {
      const line = String(event.data).trim();
      if (line === "uciok") {
        worker.postMessage("isready");
      } else if (line === "readyok") {
        setEngineReady(true);
      } else {
        const response = /^bestmove (\S+)/.exec(line);
        if (!response) return;
        const requestedFen = pendingFenRef.current;
        pendingFenRef.current = null;
        const match = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/.exec(response[1]);
        if (!match) return;

        const from = { rank: 8 - Number(match[1][1]), file: match[1].charCodeAt(0) - 97 };
        const to = { rank: 8 - Number(match[2][1]), file: match[2].charCodeAt(0) - 97 };
        const currentState: GameState = latestStateRef.current;
        if (
          requestedFen
          && toFen(currentState) === requestedFen
          && currentState.status === "playing"
          && currentState.opponent === "stockfish"
          && currentState.turn === "b"
          && isLegalMove(currentState, from, to)
        ) {
          dispatch({
            type: "ENGINE_MOVE",
            fromRank: from.rank,
            fromFile: from.file,
            toRank: to.rank,
            toFile: to.file,
            promotion: (match[3] ?? "q") as PromotionPiece,
          });
        }
      }
    };
    worker.onerror = () => setEngineError(true);
    worker.postMessage("uci");

    return () => {
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
      pendingFenRef.current = null;
    };
  }, [appState.opponent, dispatch]);

  const positionFen = toFen(appState);
  useEffect(() => {
    if (
      appState.status !== "playing"
      || appState.opponent !== "stockfish"
      || appState.turn !== "b"
      || appState.promotion
      || !engineReady
      || engineError
      || pendingFenRef.current === positionFen
    ) return;

    const worker = workerRef.current;
    if (!worker) return;
    pendingFenRef.current = positionFen;
    const strength = stockfishStrength[appState.stockfishDifficulty];
    worker.postMessage("setoption name UCI_LimitStrength value true");
    worker.postMessage(`setoption name UCI_Elo value ${strength.elo}`);
    worker.postMessage(`setoption name Skill Level value ${strength.skillLevel}`);
    worker.postMessage(`position fen ${positionFen}`);
    worker.postMessage("go movetime 700");
  }, [appState.status, appState.opponent, appState.turn, appState.promotion, appState.stockfishDifficulty, positionFen, engineReady, engineError]);

  useEffect(() => {
    if (appState.status !== "playing") return;
    const timer = window.setInterval(() => dispatch({ type: "TICK_CLOCK" }), 1000);
    return () => window.clearInterval(timer);
  }, [appState.status, dispatch]);

  function movePiece(from: Coordinates, to: Coordinates) {
    if ((appState.opponent === "stockfish" && appState.turn === "b") || !isLegalMove(appState, from, to)) return;

    dispatch({
      type: "MOVE_PIECE",
      fromRank: from.rank,
      fromFile: from.file,
      toRank: to.rank,
      toFile: to.file,
    });
  }

  function handleDrop(rank: number, file: number) {
    if (dragging) movePiece(dragging, { rank, file });
    setDragging(null);
    setSelected(null);
  }

  function handleSquareClick(rank: number, file: number) {
    if (appState.opponent === "stockfish" && appState.turn === "b") return;
    const clickedPiece = appState.board[rank][file];

    if (!selected) {
      if (getColor(clickedPiece) === appState.turn && appState.status === "playing") {
        setSelected({ rank, file });
      }
      return;
    }

    const selectedPiece = appState.board[selected.rank][selected.file];
    if (clickedPiece && hasSameColor(selectedPiece, clickedPiece)) {
      setSelected({ rank, file });
      return;
    }

    movePiece(selected, { rank, file });
    setSelected(null);
  }

  const checked = isInCheck(appState.board, appState.turn);
  const status = appState.promotion
    ? "Escolha a peça para promoção."
    : appState.status === "checkmate"
    ? `Xeque-mate — ${appState.winner === "w" ? "brancas" : "pretas"} venceram.`
    : appState.status === "stalemate"
      ? "Empate por afogamento."
      : appState.status === "timeout"
        ? `Tempo esgotado — ${appState.winner === "w" ? "brancas" : "pretas"} venceram.`
        : appState.status === "draw"
          ? appState.drawReason === "threefold"
            ? "Empate por repetição tripla."
            : appState.drawReason === "fiftyMove"
              ? "Empate pela regra dos 50 lances."
              : "Empate por material insuficiente."
      : appState.opponent === "stockfish" && appState.turn === "b"
        ? engineError ? "Não foi possível carregar o Stockfish." : "Stockfish está pensando…"
        : `${appState.turn === "w" ? "Vez das brancas" : "Vez das pretas"}${checked ? " — xeque!" : ""}`;

  const isFinished = appState.status !== "playing";

  return (
    <section className="flex max-h-[calc(100dvh-2rem)] flex-col items-center gap-2">
      <div className="flex w-[calc(8.25*var(--square-size))] justify-between gap-2 text-[var(--light-square-color)]">
        {(["b", "w"] as const).map((color) => (
          <div key={color} className={`rounded-md px-2 py-1 text-center shadow-sm ${appState.status === "playing" && appState.turn === color ? "bg-amber-400 text-[#202020]" : "bg-[#2c2c2c]"}`}>
            <span className="mr-1 text-xs font-semibold sm:mr-2 sm:text-sm">{color === "w" ? "Brancas" : "Pretas"}</span>
            <span className="font-mono text-base font-bold sm:text-lg">{formatClock(appState.clocks[color])}</span>
          </div>
        ))}
      </div>
      <div className="flex min-h-8 w-[calc(8.25*var(--square-size))] items-center justify-center gap-2 text-center text-sm font-semibold text-[var(--light-square-color)]" aria-live="polite">
        <span>{status}</span>
        {isFinished && (
          <button type="button" className="shrink-0 rounded bg-amber-400 px-2 py-1 text-xs font-bold text-[#202020] hover:bg-amber-300" onClick={() => dispatch({ type: "OPEN_SETUP" })}>
            Nova partida
          </button>
        )}
      </div>
      <div className="relative">
        <div className="grid grid-cols-[calc(.25*var(--square-size))_calc(8*var(--square-size))] grid-rows-[calc(8*var(--square-size))_calc(.25*var(--square-size))]">
          <Ranks />
          <div className="relative grid grid-cols-[repeat(8,var(--square-size))] grid-rows-[repeat(8,var(--square-size))]">
            {appState.board.map((rank, rankIndex) =>
              rank.map((piece, fileIndex) => (
                <Square
                  key={`${rankIndex}-${fileIndex}`}
                  piece={piece}
                  rank={rankIndex}
                  file={fileIndex}
                  isSelected={selected?.rank === rankIndex && selected.file === fileIndex}
                  isLegalTarget={selected !== null && isLegalMove(appState, selected, { rank: rankIndex, file: fileIndex })}
                  onDrop={handleDrop}
                  onDragStart={(rank, file) => {
                    if (appState.status === "playing" && !(appState.opponent === "stockfish" && appState.turn === "b") && getColor(appState.board[rank][file]) === appState.turn) {
                      setDragging({ rank, file });
                    }
                  }}
                  onClick={handleSquareClick}
                />
              )),
            )}
          </div>
          <div />
          <Files />
        </div>
        {appState.promotion && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 p-3">
            <div className="rounded-md bg-[var(--light-square-color)] p-3 text-center text-[#202020] shadow-xl">
              <p className="mb-2 text-sm font-semibold">Promover peão para:</p>
              <div className="flex gap-1 sm:gap-2">
                {(["q", "r", "b", "n"] as PromotionPiece[]).map((piece) => (
                  <button
                    key={piece}
                    type="button"
                    className="h-10 w-10 rounded bg-white p-1 hover:bg-amber-200 focus:outline-2 focus:outline-offset-2 focus:outline-amber-600 sm:h-12 sm:w-12"
                    onClick={() => dispatch({ type: "PROMOTE_PAWN", piece })}
                    aria-label={`Promover para ${piece === "q" ? "dama" : piece === "r" ? "torre" : piece === "b" ? "bispo" : "cavalo"}`}
                  >
                    <PieceImage piece={`${appState.turn}${piece}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
