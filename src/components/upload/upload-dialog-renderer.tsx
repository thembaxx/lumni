"use client";

import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UPLOAD_CLOSE_DELAY } from "@/lib/shared/durations";
import { setOpenUploadHandler } from "@/lib/upload-dialog";
import type { UploadedFile } from "@/lib/uploadthing";
import { useUploadThing } from "@/lib/uploadthing";
import { type FileUploadState, UploadFileItem, UploadHeader } from "./upload-file-item";

export function UploadDialogRenderer({ children }: { children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<FileUploadState[]>([]);
  const [endpoint, setEndpoint] = useState("generalUploader" as const);
  const pendingFilesRef = useRef<File[]>([]);
  const completedCountRef = useRef(0);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startUploadRef = useRef<
    ((files: File[]) => Promise<UploadedFile[] | undefined> | undefined) | null
  >(null);
  const fileNameToItemRef = useRef<Map<string, number> | null>(null);
  if (fileNameToItemRef.current === null) {
    fileNameToItemRef.current = new Map();
  }

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    uploadProgressGranularity: "fine",
    onClientUploadComplete: (res: UploadedFile[]) => {
      setItems((prev) =>
        prev.map((item) => {
          const uploaded = res.find((r) => r.name === item.name);
          if (!uploaded) return item;
          return {
            ...item,
            status: "complete",
            url: uploaded.ufsUrl ?? uploaded.url,
          };
        }),
      );
      completedCountRef.current += res.length;
      checkAllDone();
    },
    onUploadError: (error: Error) => {
      const msg = error?.message ?? "Upload failed";
      setItems((prev) =>
        prev.map((item) => {
          if (item.status === "uploading") {
            return { ...item, status: "error", error: msg };
          }
          return item;
        }),
      );
      completedCountRef.current += 1;
      checkAllDone();
    },
    onUploadProgress: (progress: number) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.status === "uploading") {
            return { ...item, progress };
          }
          return item;
        }),
      );
    },
  });

  const checkAllDone = useCallback(() => {
    const total = fileNameToItemRef.current?.size ?? 0;
    if (total > 0 && completedCountRef.current >= total) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => setIsOpen(false), UPLOAD_CLOSE_DELAY);
    }
  }, []);

  useEffect(() => {
    startUploadRef.current = startUpload;
  }, [startUpload]);

  const open = useCallback((files: File[], ep?: "generalUploader") => {
    if (ep) setEndpoint(ep);
    completedCountRef.current = 0;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    const newItems = files.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: "pending" as const,
    }));
    const nameMap = new Map<string, number>();
    newItems.forEach((item, idx) => {
      nameMap.set(item.name, idx);
    });
    fileNameToItemRef.current = nameMap;
    setItems(newItems);
    pendingFilesRef.current = files;
    setIsOpen(true);
    setTimeout(() => {
      if (startUploadRef.current) {
        startUploadRef.current(files);
      }
    }, 50);
  }, []);

  setOpenUploadHandler(open);

  const close = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    completedCountRef.current = 0;
    setIsOpen(false);
    setItems([]);
    pendingFilesRef.current = [];
  }, []);

  const cancel = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    completedCountRef.current = 0;
    setIsOpen(false);
    setItems([]);
    pendingFilesRef.current = [];
  }, []);

  const retryFailed = useCallback(() => {
    const failedFiles = items.reduce((acc, item) => {
      if (item.status === "error") acc.push(item.file);
      return acc;
    }, [] as File[]);
    if (failedFiles.length === 0) return;

    setItems((prev) =>
      prev.map((item) =>
        item.status === "error"
          ? { ...item, status: "pending", progress: 0, error: undefined }
          : item,
      ),
    );
    setTimeout(() => {
      startUploadRef.current?.(failedFiles);
    }, 0);
  }, [items]);

  const hasErrors = items.some((item) => item.status === "error");
  const completedCount = items.filter((item) => item.status === "complete").length;

  return (
    <>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              <UploadHeader
                totalFiles={items.length}
                completedFiles={completedCount}
                isUploading={isUploading}
              />
            </DialogTitle>
            {hasErrors && (
              <DialogDescription className="flex items-center gap-1.5 text-destructive">
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  className="size-4 shrink-0"
                  data-icon="inline-start"
                />
                Some files failed to upload
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="-mx-1 flex max-h-64 flex-col gap-2 overflow-y-auto px-1">
            {items.map((item) => (
              <UploadFileItem
                key={`${item.name}-${item.size}`}
                item={item}
                onRetry={item.status === "error" ? retryFailed : undefined}
              />
            ))}
          </div>

          <DialogFooter>
            {isUploading ? (
              <Button variant="outline" onClick={cancel} className="w-full">
                Cancel
              </Button>
            ) : (
              <div className="flex w-full gap-2">
                {hasErrors && (
                  <Button variant="secondary" onClick={retryFailed} className="flex-1">
                    Retry Failed
                  </Button>
                )}
                <Button onClick={close} className="flex-1">
                  {hasErrors ? "Close" : "Done"}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
