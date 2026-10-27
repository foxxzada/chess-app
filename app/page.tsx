"use client";

import { useReducer } from "react";
import Board from "./components/ChessBoard/Board";
import GameSetup from "./components/GameSetup/GameSetup";
import AppContext from "./components/Contexts/Context";
import { reducer } from "./components/Reducer/Reducer";
import { initialGameState } from "./constant";

export default function Home() {
	const [appState, dispatch] = useReducer(reducer, initialGameState);
	return (
		<AppContext.Provider value={{ appState, dispatch }}>
			<main>
				{appState.status === "setup" ? <GameSetup /> : <Board />}
			</main>
		</AppContext.Provider>
	);
}
