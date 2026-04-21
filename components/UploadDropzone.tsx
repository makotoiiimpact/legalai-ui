"use client";

import { useCallback, useRef, useState } from "react";
import { ACCEPTED_EXTS, MAX_FILE_BYTES } from "@/lib/api";
import { formatFileSize } from "@/lib/case-helpers";

type DropzoneState =
  | { kind: "idle" }
  | { kind: "hovering" }
  | { kind: "selected"; file: File }
  | { kind: "error"; message: string }
  | { kind: "uploading"; file: File }
  | { kind: "done"; file: File };

interface Props {
  onUpload: (file: File) => Promise<void>;
}

export default function UploadDropzone({ onUpload }: Props) {
  const [state, setState] = useState<DropzoneState>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((file: File): string | null => {
    const lower = file.name.toLowerCase();
    const extOk = ACCEPTED_EXTS.some((ext) => lower.endsWith(ext));
    if (!extOk) {
      const ext = lower.slice(lower.lastIndexOf("."));
      return `We accept PDF, DOCX, JPG, PNG, and HEIC files. You dropped a [${ext || "no-ext"}]. Try again with a case filing.`;
    }
    if (file.size > MAX_FILE_BYTES) {
      return `This file is ${formatFileSize(file.size)}, which exceeds the 25 MB limit. Try reducing scan quality or splitting the filing.`;
    }
    return null;
  }, []);

  const pick = useCallback(
    (file: File) => {
      const err = validate(file);
      if (err) {
        setState({ kind: "error", message: err });
        return;
      }
      setState({ kind: "selected", file });
    },
    [validate],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) pick(file);
    },
    [pick],
  );

  const doUpload = useCallback(async () => {
    if (state.kind !== "selected") return;
    const { file } = state;
    setState({ kind: "uploading", file });
    try {
      await onUpload(file);
      setState({ kind: "done", file });
    } catch {
      setState({ kind: "error", message: "Upload failed. Try again." });
    }
  }, [state, onUpload]);

  const reset = useCallback(() => {
    setState({ kind: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const hovering = state.kind === "hovering";
  const uploading = state.kind === "uploading";

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (state.kind === "idle" || state.kind === "error") inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && (state.kind === "idle" || state.kind === "error")) {
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (state.kind === "idle" || state.kind === "error") setState({ kind: "hovering" });
        }}
        onDragLeave={() => {
          if (hovering) setState({ kind: "idle" });
        }}
        onDrop={onDrop}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
          hovering ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:bg-slate-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTS.join(",")}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) pick(file);
          }}
          disabled={uploading}
        />

        {state.kind === "uploading" || state.kind === "done" ? (
          <UploadProgress fileName={state.file.name} done={state.kind === "done"} />
        ) : state.kind === "selected" ? (
          <SelectedPreview
            file={state.file}
            onUpload={doUpload}
            onRemove={reset}
          />
        ) : (
          <>
            <div className="text-5xl" aria-hidden>
              {hovering ? "📥" : "📄"}
            </div>
            <p className="mt-4 text-base font-medium text-slate-900">
              {hovering ? "Release to upload" : "Drop a case document here"}
            </p>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Complaint, indictment, information, or any filing that identifies a case.
            </p>
            <p className="mt-4 text-xs text-slate-400">PDF, DOCX, JPG, PNG, HEIC · Max 25 MB</p>
            <p className="mt-4 text-xs text-slate-500">— or —</p>
            <button
              type="button"
              className="mt-4 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              Browse files
            </button>
          </>
        )}
      </div>

      {state.kind === "error" ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}{" "}
          <button className="ml-2 underline" onClick={reset}>
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SelectedPreview({
  file,
  onUpload,
  onRemove,
}: {
  file: File;
  onUpload: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-4xl" aria-hidden>
        📄
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900">{file.name}</p>
        <p className="mt-0.5 text-xs text-slate-500">{formatFileSize(file.size)}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUpload();
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          Upload
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-xs text-slate-500 underline hover:text-slate-700"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function UploadProgress({ fileName, done }: { fileName: string; done: boolean }) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center">
      <div className="text-4xl" aria-hidden>
        📄
      </div>
      <p className="mt-3 text-sm font-medium text-slate-900 truncate w-full">{fileName}</p>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full bg-blue-600 transition-all ${done ? "w-full" : "w-2/3 animate-pulse"}`}
          aria-hidden
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">{done ? "Done — starting extraction…" : "Uploading…"}</p>
    </div>
  );
}
