export function PageFallback() {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center"
      aria-live="polite"
      aria-label="Loading page"
    >
      <span className="sr-only">Loading…</span>
    </div>
  );
}
