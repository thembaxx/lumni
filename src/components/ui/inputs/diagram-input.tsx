"use client";

import CloudUploadIcon from "@hugeicons/core-free-icons/CloudUploadIcon";
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface DiagramInputProps {
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DiagramInput({ value, onChange, disabled }: DiagramInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      onChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setPreview(null);
    onChange("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-3">
      {preview ? (
        <div className="relative inline-block">
          <Image
            src={preview ?? ""}
            alt="Uploaded diagram"
            width={500}
            height={192}
            unoptimized
            className="max-h-48 max-w-sm rounded border object-contain outline outline-black/10 -outline-offset-1 dark:outline-white/10"
          />
          {!disabled && (
            <Button
              variant="destructive"
              size="icon-sm"
              className="absolute top-1 right-1"
              onClick={handleClear}
              aria-label="Clear diagram"
            >
              <HugeiconsIcon icon={Delete02Icon} data-icon />
            </Button>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="w-full cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:bg-muted/50"
          onClick={() => !disabled && fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!disabled) fileRef.current?.click();
            }
          }}
        >
          <HugeiconsIcon
            icon={CloudUploadIcon}
            className="mx-auto mb-2 size-8 text-muted-foreground"
          />
          <p className="text-muted-foreground text-sm">Click to upload a diagram or sketch</p>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
        disabled={disabled}
        aria-label="Upload diagram image"
      />
    </div>
  );
}
