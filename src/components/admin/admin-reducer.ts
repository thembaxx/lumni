export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: string;
  color?: string;
}

export type AdminState = {
  selectedSubjects: Set<string>;
  editSubject: Subject | null;
  newSubject: {
    name: string;
    code: string;
    description: string;
    category: string;
  };
  activeTab: "exam" | "subjects";
  showSuccess: boolean;
};

export type AdminAction =
  | { type: "TOGGLE_SUBJECT"; payload: string }
  | { type: "SET_EDIT_SUBJECT"; payload: Subject | null }
  | { type: "SET_FORM_DATA"; payload: AdminState["newSubject"] }
  | { type: "RESET_FORM_DATA" }
  | { type: "SET_TAB"; payload: "exam" | "subjects" }
  | { type: "SHOW_SUCCESS" }
  | { type: "HIDE_SUCCESS" };

export function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case "TOGGLE_SUBJECT": {
      const next = new Set(state.selectedSubjects);
      if (next.has(action.payload)) next.delete(action.payload);
      else next.add(action.payload);
      return { ...state, selectedSubjects: next };
    }
    case "SET_EDIT_SUBJECT":
      return { ...state, editSubject: action.payload };
    case "SET_FORM_DATA":
      return { ...state, newSubject: action.payload };
    case "RESET_FORM_DATA":
      return {
        ...state,
        newSubject: {
          name: "",
          code: "",
          description: "",
          category: "general",
        },
      };
    case "SET_TAB":
      return { ...state, activeTab: action.payload };
    case "SHOW_SUCCESS":
      return { ...state, showSuccess: true };
    case "HIDE_SUCCESS":
      return { ...state, showSuccess: false };
    default:
      return state;
  }
}

export const adminInitialState: AdminState = {
  selectedSubjects: new Set(),
  editSubject: null,
  newSubject: { name: "", code: "", description: "", category: "general" },
  activeTab: "exam",
  showSuccess: false,
};
