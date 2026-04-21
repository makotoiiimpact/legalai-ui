// Lightweight placeholder for the uploaded document preview.
// The spec's Screen 2 asks for a thumbnail "proof-of-upload, nothing more"
// — no real PDF rendering in v1.
export default function DocThumbnail({
  fileName,
  pageCount,
  className = "",
}: {
  fileName: string;
  pageCount?: number;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-11 items-center justify-center rounded border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 text-[10px] font-semibold text-slate-500">
          PDF
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">{fileName}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {pageCount ? `${pageCount} page${pageCount === 1 ? "" : "s"}` : "Document preview"}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2" aria-hidden>
        <div className="h-1.5 w-5/6 rounded bg-slate-100" />
        <div className="h-1.5 w-full rounded bg-slate-100" />
        <div className="h-1.5 w-4/6 rounded bg-slate-100" />
        <div className="h-1.5 w-11/12 rounded bg-slate-100" />
        <div className="h-1.5 w-3/4 rounded bg-slate-100" />
      </div>
    </div>
  );
}
