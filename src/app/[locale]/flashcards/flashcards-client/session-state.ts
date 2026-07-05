import type { SessionState, SessionAction, CardsState, CardsAction } from "./types";

export const initialSessionState: SessionState = {
  selectedSubject: "",
  source: "ai",
  isActive: false,
  sessionComplete: false,
};

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "START_SESSION":
      return {
        ...state,
        selectedSubject: action.payload.subject,
        source: action.payload.source,
        isActive: true,
        sessionComplete: false,
      };
    case "STOP_SESSION":
      return { ...state, isActive: false, selectedSubject: "" };
    case "COMPLETE_SESSION":
      return { ...state, sessionComplete: true };
    case "RESTART":
      return { ...state, sessionComplete: false };
    default:
      return state;
  }
}

export const initialCardsState: CardsState = {
  mistakeCards: [],
  sm2Cards: [],
  qualityMap: new Map(),
};

export function cardsReducer(state: CardsState, action: CardsAction): CardsState {
  switch (action.type) {
    case "SET_MISTAKE_CARDS":
      return { ...state, mistakeCards: action.payload };
    case "SET_SM2_CARDS":
      return { ...state, sm2Cards: action.payload };
    case "RESET":
      return { ...state, mistakeCards: [], sm2Cards: [], qualityMap: new Map() };
    case "SET_QUALITY":
      return {
        ...state,
        qualityMap: new Map(state.qualityMap).set(action.payload.cardId, action.payload.quality),
      };
    default:
      return state;
  }
}
