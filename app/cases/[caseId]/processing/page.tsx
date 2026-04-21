"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import DocThumbnail from "@/components/DocThumbnail";
import { ApiError, api } from "@/lib/api";
import type { EntityCandidate, ExtractionStatus } from "@/lib/types";

const ROLE_LABEL: Record<EntityCandidate["role"], string> = {
  judge: "Judge",
  prosecutor: "Prosecutor",
  defense_attorney: "Defense Attorney",
  co_counsel: "Co-counsel",
  defendant: "Defendant",
  officer: "Officer",
  witness: "Witness",
  expert: "Expert",
};

export default function ProcessingPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<ExtractionStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const next = await api.getExtractionStatus(caseId);
        if (cancelled) return;
        setStatus(next);
        if (next.state === "complete" || next.state === "partial" || next.state === "zero_entities" || next.state === "one_entity" || next.state === "image_only" || next.state === "error") {
          return; // stop polling
        }
        timer = setTimeout(tick, 900);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof ApiError ? err.detail : "Failed to load extraction status";
        toast.error(msg);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [caseId]);

  if (!status) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="h-6 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 h-80 w-full animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  const isComplete = status.state === "complete";
  const isError = status.state === "error";

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-6">
        <Link href="/cases" className="text-sm text-slate-500 hover:text-slate-800">
          ← Back to Cases
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          Processing: {status.documentName}
        </h1>
        <ProcessingHeadline state={status.state} />
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Extracted fields
          </h2>
          <dl className="mt-4 grid grid-cols-[160px_1fr] gap-x-4 gap-y-3 text-sm">
            {status.fields.map((f) => (
              <FieldRow key={f.key} label={f.label} value={f.value} pending={f.status === "pending"} />
            ))}
          </dl>

          {status.entities.length > 0 || isComplete ? (
            <>
              <div className="my-6 h-px bg-slate-100" />
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                People identified
              </h2>
              <ul className="mt-4 space-y-2">
                {status.entities.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {ROLE_LABEL[e.role]}
                      </p>
                      <p className="text-sm font-medium text-slate-900">{e.extractedName}</p>
                    </div>
                    <EntityMatchBadge entity={e} />
                  </li>
                ))}
                {isComplete && status.entities.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    No people identified in this document.
                  </li>
                ) : null}
              </ul>
            </>
          ) : null}

          {isComplete ? (
            <div className="mt-8 flex items-center justify-between gap-4 rounded-lg bg-emerald-50 px-4 py-3">
              <p className="text-sm text-emerald-800">
                <span aria-hidden>✅</span> Extraction complete · {status.totalEntitiesFound} entities found
              </p>
              <button
                type="button"
                onClick={() => router.push(`/cases/${caseId}/review`)}
                className="inline-flex items-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-800"
              >
                Review &amp; Confirm →
              </button>
            </div>
          ) : null}

          {isError ? (
            <div className="mt-8 space-y-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <p>
                Something went wrong while reading this document. This isn&apos;t a problem with your file — our
                system hit an error.
              </p>
              <div className="flex items-center gap-3">
                <button className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
                  Try again
                </button>
                <Link href={`/cases/${caseId}`} className="text-xs text-red-700 underline">
                  Create case manually
                </Link>
              </div>
            </div>
          ) : null}
        </section>

        <aside>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Document preview
          </h2>
          <DocThumbnail
            fileName={status.documentName}
            pageCount={status.documentPageCount}
            className="mt-3"
          />
          {!isComplete && !isError ? (
            <p className="mt-4 text-xs text-slate-500">
              You can close this page. We&apos;ll mark it ready in your cases list.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function ProcessingHeadline({ state }: { state: ExtractionStatus["state"] }) {
  if (state === "reading") {
    return (
      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
        <Spinner /> Reading document…
      </p>
    );
  }
  if (state === "extracting") {
    return (
      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
        <Spinner /> Identifying entities…
      </p>
    );
  }
  if (state === "complete") {
    return <p className="mt-1 text-sm text-emerald-700">Extraction complete</p>;
  }
  if (state === "error") {
    return <p className="mt-1 text-sm text-red-700">Extraction failed</p>;
  }
  return null;
}

function Spinner() {
  return (
    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" aria-hidden />
  );
}

function FieldRow({ label, value, pending }: { label: string; value?: string; pending: boolean }) {
  return (
    <>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="text-sm">
        {pending ? (
          <span className="inline-flex items-center gap-2 text-slate-400">
            <Spinner />
            <span className="h-3 w-44 rounded bg-slate-100" aria-hidden />
            <span className="text-xs text-slate-400">extracting…</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <span className="text-slate-900">{value ?? "—"}</span>
            <span className="text-emerald-600" aria-hidden>
              ✓
            </span>
          </span>
        )}
      </dd>
    </>
  );
}

function EntityMatchBadge({ entity }: { entity: EntityCandidate }) {
  if (entity.matchStatus === "matched") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700">
        <span aria-hidden>⚡</span> matched
      </span>
    );
  }
  if (entity.matchStatus === "auto_confirmed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
        ✓ auto-confirmed
      </span>
    );
  }
  if (entity.matchStatus === "ambiguous") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
        ⚠ review needed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
      ◌ new
    </span>
  );
}
