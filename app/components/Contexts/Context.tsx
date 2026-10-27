"use client";

import type { Dispatch } from "react";
import { createContext, useContext } from "react";
import type { GameState } from "../../constant";
import type { GameAction } from "../Reducer/Reducer";

interface AppContextValue {
	appState: GameState;
	dispatch: Dispatch<GameAction>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function useAppContext(): AppContextValue {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error(
			"useAppContext deve ser usado dentro de AppContext.Provider",
		);
	}
	return context;
}

export default AppContext;
