"use client";

import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import PencilIcon from "@hugeicons/core-free-icons/PencilIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  icon?: React.ReactNode;
}

export function EditableField({ value, onSave, placeholder, icon }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = useCallback(async () => {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      setDraft(value);
    } finally {
      setSaving(false);
    }
  }, [draft, value, onSave]);

  const handleCancel = useCallback(() => {
    setDraft(value);
    setEditing(false);
  }, [value]);

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {icon && (
            <div className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            placeholder={placeholder}
            className={`h-9 rounded-lg border-border/40 bg-system-surface text-sm ${icon ? "pl-9" : ""}`}
          />
        </div>
        <Button
          size="icon-sm"
          onClick={handleSave}
          disabled={saving || !draft.trim()}
          aria-label="Save profile changes"
          className="relative size-8 shrink-0 rounded-full bg-system-accent text-white hover:bg-system-accent/90 disabled:opacity-50 after:absolute after:-inset-2"
        >
          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={handleCancel}
          aria-label="Cancel editing"
          className="relative size-8 shrink-0 rounded-full bg-system-fill text-muted-foreground hover:bg-system-fill/80 after:absolute after:-inset-2"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className="group w-full justify-start text-left"
    >
      <span className="flex-1 truncate font-medium text-foreground text-sm">
        {value || placeholder || "Not set"}
      </span>
      <HugeiconsIcon
        icon={PencilIcon}
        className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
      />
    </Button>
  );
}
