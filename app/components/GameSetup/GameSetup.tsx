"use client";

import { useState } from "react";
import type { Opponent, StockfishDifficulty, TimeControl } from "../../constant";
import { timeControls } from "../../constant";
import { useAppContext } from "../Contexts/Context";

const timeControlGroups = [
  { title: "Bullet", controls: timeControls.slice(0, 3) },
  { title: "Blitz", controls: timeControls.slice(3, 7) },
  { title: "Rapid", controls: timeControls.slice(7, 10) },
  { title: "Clássico", controls: timeControls.slice(10) },
];

export default function GameSetup() {
  const { dispatch } = useAppContext();
  const [minutes, setMinutes] = useState(5);
  const [increment, setIncrement] = useState(3);
  const [opponent, setOpponent] = useState<Opponent>("stockfish");
  const [stockfishDifficulty, setStockfishDifficulty] = useState<StockfishDifficulty>("easy");

  function selectPreset(timeControl: TimeControl) {
    setMinutes(timeControl.initialTimeSeconds / 60);
    setIncrement(timeControl.incrementSeconds);
  }

  function start() {
    const timeControl: TimeControl = {
      name: `${minutes} + ${increment}`,
      initialTimeSeconds: minutes * 60,
      incrementSeconds: increment,
    };
    dispatch({ type: "START_GAME", timeControl, opponent, stockfishDifficulty });
  }

  return (
    <section className="w-full max-w-md rounded-xl bg-[#2c2c2c] p-6 text-[var(--light-square-color)] shadow-xl">
      <h1 className="text-2xl font-bold">Nova partida</h1>
      <p className="mt-1 text-sm text-stone-300">Defina o ritmo antes de iniciar.</p>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold">Adversário</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {([
            ["stockfish", "Stockfish"],
            ["human", "Duas pessoas"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={opponent === value}
              className={`rounded px-3 py-2 text-sm font-semibold ${opponent === value ? "bg-amber-400 text-[#202020]" : "bg-stone-700 hover:bg-stone-600"}`}
              onClick={() => setOpponent(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-stone-300">Você joga de brancas. O Stockfish roda neste navegador.</p>
      </fieldset>

      {opponent === "stockfish" && (
        <fieldset className="mt-4">
          <legend className="text-sm font-semibold">Dificuldade</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {([
              ["easy", "Fácil"],
              ["medium", "Médio"],
              ["strong", "Forte"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={stockfishDifficulty === value}
                className={`rounded px-3 py-2 text-sm font-semibold ${stockfishDifficulty === value ? "bg-amber-400 text-[#202020]" : "bg-stone-700 hover:bg-stone-600"}`}
                onClick={() => setStockfishDifficulty(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-5">
        <p className="text-md font-semibold">Formatos comuns</p>
        <div className="mt-3 grid gap-4">
          {timeControlGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-1 text-sm font-semibold text-stone-300">{group.title}</p>
              <div className="flex flex-wrap gap-2">
                {group.controls.map((timeControl) => (
                  <button
                    key={timeControl.name}
                    type="button"
                    className={`rounded px-2 py-1 text-sm ${minutes * 60 === timeControl.initialTimeSeconds && increment === timeControl.incrementSeconds ? "bg-amber-400 text-[#202020]" : "bg-stone-700 hover:bg-stone-600"}`}
                    onClick={() => selectPreset(timeControl)}
                  >
                    {timeControl.name.replace(/.*· /, "")}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button type="button" className="mt-6 w-full rounded bg-amber-400 px-4 py-3 font-bold text-[#202020] hover:bg-amber-300" onClick={start}>
        Iniciar {minutes} + {increment}
      </button>
    </section>
  );
}
