"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ApiError, api } from "@/lib/api";

const DOC_TYPES = [
  { label: "Police Report", value: "police_report" },
  { label: "Breathalyzer Log", value: "breathalyzer_log" },
  { label: "Field Sobriety Test", value: "fst" },
  { label: "Witness Statement", value: "witness_statement" },
  { label: "Medical Record", value: "medical_record" },
  { label: "Court Filing", value: "court_filing" },
  { label: "Other", value: "other" },
];

interface Props {
  caseId: string;
  onUploaded?: () => void;
}

export default function DocumentUpload({ caseId, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("other");
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrag(false);
    onPick(e.dataTransfer.files?.[0]);
  };

  const doUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadDocument(caseId, file, docType);
      toast.success(`Uploaded ${file.name}`);
      setFile(null);
      setDocType("other");
      if (inputRef.current) inputRef.current.value = "";
      onUploaded?.();
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          drag ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:bg-slate-50"
        }`}
      >
        <p className="text-sm text-slate-600">
          {file ? (
            <span className="font-medium text-slate-900">{file.name}</span>
          ) : (
            <>
              Drag & drop a file, or <span className="text-blue-600">browse</span>
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-slate-400">PDF, DOCX, TXT</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </div>

      {file ? (
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Select
              label="Document Type"
              options={DOC_TYPES}
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            />
          </div>
          <Button onClick={doUpload} disabled={uploading}>
            {uploading ? "Uploading…" : "Upload"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            disabled={uploading}
          >
            Cancel
          </Button>
        </div>
      ) : null}
    </div>
  );
}
