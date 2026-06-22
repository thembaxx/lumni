export interface CalcButton {
  id: string;
  label: string;
  variant: "default" | "secondary" | "ghost" | "destructive";
  span?: 2;
}

export const ROWS: CalcButton[][] = [
  [
    { id: "(", label: "(", variant: "ghost" },
    { id: ")", label: ")", variant: "ghost" },
    { id: "mc", label: "MC", variant: "ghost" },
    { id: "mr", label: "MR", variant: "ghost" },
    { id: "m+", label: "M+", variant: "ghost" },
    { id: "m-", label: "M-", variant: "ghost" },
  ],
  [
    { id: "x²", label: "x²", variant: "ghost" },
    { id: "x³", label: "x³", variant: "ghost" },
    { id: "√(", label: "√(", variant: "ghost" },
    { id: "∛(", label: "∛(", variant: "ghost" },
    { id: "^", label: "^", variant: "ghost" },
    { id: "!", label: "n!", variant: "ghost" },
  ],
  [
    { id: "sin(", label: "sin(", variant: "ghost" },
    { id: "cos(", label: "cos(", variant: "ghost" },
    { id: "tan(", label: "tan(", variant: "ghost" },
    { id: "log(", label: "log(", variant: "ghost" },
    { id: "ln(", label: "ln(", variant: "ghost" },
    { id: "1/x", label: "1/x", variant: "ghost" },
  ],
  [
    { id: "sin⁻¹(", label: "sin⁻¹(", variant: "ghost" },
    { id: "cos⁻¹(", label: "cos⁻¹(", variant: "ghost" },
    { id: "tan⁻¹(", label: "tan⁻¹(", variant: "ghost" },
    { id: "mod", label: "mod", variant: "ghost" },
    { id: "π", label: "π", variant: "ghost" },
    { id: "e", label: "e", variant: "ghost" },
  ],
  [
    { id: "7", label: "7", variant: "default" },
    { id: "8", label: "8", variant: "default" },
    { id: "9", label: "9", variant: "default" },
    { id: "del", label: "⌫", variant: "secondary" },
    { id: "clear", label: "CE", variant: "destructive" },
  ],
  [
    { id: "4", label: "4", variant: "default" },
    { id: "5", label: "5", variant: "default" },
    { id: "6", label: "6", variant: "default" },
    { id: "÷", label: "÷", variant: "secondary" },
    { id: "×", label: "×", variant: "secondary" },
  ],
  [
    { id: "1", label: "1", variant: "default" },
    { id: "2", label: "2", variant: "default" },
    { id: "3", label: "3", variant: "default" },
    { id: "−", label: "−", variant: "secondary" },
    { id: "+", label: "+", variant: "secondary" },
  ],
  [
    { id: "±", label: "±", variant: "ghost" },
    { id: "0", label: "0", variant: "default" },
    { id: ".", label: ".", variant: "default" },
    { id: "ans", label: "Ans", variant: "ghost" },
    { id: "=", label: "=", variant: "secondary" },
  ],
];

export const VARIANT_CLASSES: Record<string, string> = {
  default: "bg-system-fill hover:bg-system-fill-secondary text-foreground",
  secondary: "bg-[--system-accent]/10 text-[--system-accent] hover:bg-[--system-accent]/20",
  ghost: "text-[--system-text-secondary] hover:bg-system-fill",
  destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
};
