"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentList from "@/components/DocumentList";
import { Button } from "@/components/ui/button";
import { ApiError, api, type Document } from "@/lib/api";
import { usePoll } from "@/lib/usePoll";

interface Props {
  caseId: string;
  onAnalysisStarted: () => void;
}

export default function DocumentsTab({ caseId, onAnalysisStarted }: Props) {
  const [analyzing, setAnalyzing] = useState(false);

  const fetchDocs = useCallback(() => api.getDocuments(caseId), [caseId]);

  const { data: docs, refetch } = usePoll<Document[]>(
    fetchDocs,
    {
      intervalMs: 5000,
      shouldStop: (ds) => ds.length > 0 && ds.every((d) => d.indexed),
    },
    [caseId],
  );

  const list = docs ?? [];
  const indexedCount = list.filter((d) => d.indexed).length;
  const canAnalyze = indexedCount >= 1 && !analyzing;

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      await api.runAnalysis(caseId);
      toast.success("Analysis running — findings will appear shortly");
      onAnalysisStarted();
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "Failed to start analysis";
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Upload Documents
        </h2>
        <DocumentUpload caseId={caseId} onUploaded={refetch} />
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Documents ({list.length})
          </h2>
          <Button onClick={runAnalysis} disabled={!canAnalyze}>
            {analyzing ? "Starting…" : "Run AI Analysis"}
          </Button>
        </div>
        <DocumentList docs={list} />
      </section>
    </div>
  );
}
