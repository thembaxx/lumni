"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  label: string;
}

export function ItemPickerDialog({
  open,
  onOpenChange,
  title,
  items,
  selectedIds,
  onToggle,
  emptyMessage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: Item[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  emptyMessage: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-xs italic">{emptyMessage}</p>
          ) : (
            items.map((item) => {
              const selected = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() => onToggle(item.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-system-accent hover:bg-muted",
                    selected ? "bg-accent/20 font-medium" : "",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border text-[10px]",
                      selected
                        ? "border-system-accent bg-system-accent text-system-accent-foreground"
                        : "border-border/50",
                    )}
                  >
                    {selected ? "\u2713" : ""}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })
          )}
        </div>
        <div className="flex justify-end pt-2">
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
