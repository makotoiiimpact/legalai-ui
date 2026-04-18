"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FindingCard from "@/components/FindingCard";
import FindingsProgress from "@/components/FindingsProgress";
import { Button } from "@/components/ui/button";
import { ApiError, api, type Finding, type ReviewAction } from "@/lib/api";
import { usePoll } from "@/lib/usePoll";

interface Props {
  caseId: string;
  analysisJustStarted: boolean;
}

export default function FindingsTab({ caseId, analysisJustStarted }: Props) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [localReviews, setLocalReviews] = useState<Record<string, ReviewAction>>({});

  const fetchFindings = useCallback(() => api.getFindings(caseId), [caseId]);

  const { data, isLoading, refetch } = usePoll<Finding[]>(
    fetchFindings,
    {
      intervalMs: 3000,
      shouldStop: (fs) => !analysisJustStarted && fs.length > 0,
    },
    [caseId, analysisJustStarted],
  );

  const findings = useMemo(() => {
    if (!data) return [];
    return data.map((f) => {
      const local = localReviews[f.id];
      if (local && !f.hil_status) {
        return { ...f, hil_status: local };
      }
      return f;
    });
  }, [data, localReviews]);

  const reviewed = findings.filter((f) => f.hil_status !== null);
  const unreviewed = findings.filter((f) => f.hil_status === null);
  const total = findings.length;
  const allReviewed = total > 0 && reviewed.length === total;

  const handleReviewed = (id: string, action: ReviewAction) => {
    setLocalReviews((prev) => ({ ...prev, [id]: action }));
    void refetch();
  };

  const generateMemo = async () => {
    setGenerating(true);
    try {
      await api.generateMemo(caseId);
      toast.success("Generating memo…");
      router.push(`/cases/${caseId}/memo`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "Failed to generate memo";
      toast.error(msg);
      setGenerating(false);
    }
  };

  if (isLoading && findings.length === 0) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-16 animate-pulse rounded bg-slate-200" />
        <div className="h-16 animate-pulse rounded bg-slate-200" />
        <div className="h-16 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  if (findings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm text-slate-600">
          No findings yet. Upload documents, then click{" "}
          <span className="font-medium">Run AI Analysis</span> on the Documents tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FindingsProgress reviewed={reviewed.length} total={total} />

      {unreviewed.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            To Review ({unreviewed.length})
          </h3>
          {unreviewed.map((f) => (
            <FindingCard
              key={f.id}
              finding={f}
              onReviewed={(action) => handleReviewed(f.id, action)}
            />
          ))}
        </section>
      ) : null}

      {reviewed.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Reviewed ({reviewed.length})
          </h3>
          {reviewed.map((f) => (
            <FindingCard
              key={f.id}
              finding={f}
              onReviewed={(action) => handleReviewed(f.id, action)}
            />
          ))}
        </section>
      ) : null}

      {allReviewed ? (
        <div className="sticky bottom-4 flex justify-end">
          <Button size="lg" onClick={generateMemo} disabled={generating}>
            {generating ? "Generating…" : "Generate Disposition Memo →"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
