import { create } from "zustand";

interface ToolsStore {
  open: boolean;
  initialTab: string;
  cameraFocus: boolean;
  openTools: (tab?: string, camera?: boolean) => void;
  closeTools: () => void;
}

export const useToolsStore = create<ToolsStore>((set) => ({
  open: false,
  initialTab: "solver",
  cameraFocus: false,
  openTools: (tab = "solver", camera = false) =>
    set({ open: true, initialTab: tab, cameraFocus: camera }),
  closeTools: () => set({ open: false, cameraFocus: false }),
}));
