export default function Loading() {
  return (
    <div className="flex h-dvh items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="size-5 animate-spin rounded-full border border-muted border-t-foreground" />
        <span className="text-muted-foreground text-xs">Loading PDF viewer…</span>
      </div>
    </div>
  );
}
