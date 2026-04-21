"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import EntityCard from "@/components/EntityCard";
import CorrectionModal from "@/components/CorrectionModal";
import DocThumbnail from "@/components/DocThumbnail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { ApiError, api } from "@/lib/api";
import type { CaseDetail, CorrectionPayload, EntityCandidate, EntityRole } from "@/lib/types";

const ROLE_OPTIONS = [
  { value: "judge", label: "Judge" },
  { value: "prosecutor", label: "Prosecutor" },
  { value: "defense_attorney", label: "Defense Attorney" },
  { value: "co_counsel", label: "Co-counsel" },
  { value: "defendant", label: "Defendant" },
  { value: "officer", label: "Officer" },
  { value: "witness", label: "Witness" },
  { value: "expert", label: "Expert" },
];

export default function ReviewPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [busyEntityId, setBusyEntityId] = useState<string | null>(null);
  const [correcting, setCorrecting] = useState<EntityCandidate | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getCase(caseId)
      .then((c) => {
        if (!cancelled) setCaseData(c);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof ApiError ? err.detail : "Failed to load case";
        toast.error(msg);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  // If extraction hasn't finished, send the user to the processing view.
  useEffect(() => {
    if (caseData?.reviewStatus === "processing") {
      router.replace(`/cases/${caseId}/processing`);
    }
  }, [caseData?.reviewStatus, caseId, router]);

  const pendingCount = useMemo(() => {
    if (!caseData) return 0;
    return caseData.entities.filter((e) => e.reviewStatus === "pending").length;
  }, [caseData]);

  const canConfirmAll = useMemo(() => {
    if (!caseData) return false;
    const pending = caseData.entities.filter((e) => e.reviewStatus === "pending");
    if (pending.length === 0) return false;
    return pending.every((e) => e.confidence === "high" && e.matchStatus !== "ambiguous");
  }, [caseData]);

  if (!caseData) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="h-6 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 h-96 w-full animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  async function withBusy<T>(entityId: string, fn: () => Promise<T>): Promise<T | null> {
    setBusyEntityId(entityId);
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "Action failed";
      toast.error(msg);
      return null;
    } finally {
      setBusyEntityId(null);
    }
  }

  async function confirm(entityId: string) {
    const updated = await withBusy(entityId, () => api.confirmEntity(caseId, entityId));
    if (updated) {
      setCaseData(updated);
      if (updated.reviewStatus === "confirmed") {
        toast.success("All entities confirmed.");
        router.push(`/cases/${caseId}`);
      }
    }
  }

  async function handleCorrection(payload: CorrectionPayload) {
    if (!correcting) return;
    const entityId = correcting.id;
    const updated = await withBusy(entityId, () => api.applyCorrection(caseId, entityId, payload));
    if (updated) {
      setCaseData(updated);
      toast.success("Correction applied.");
      if (updated.reviewStatus === "confirmed") {
        router.push(`/cases/${caseId}`);
      }
    }
  }

  async function editName(entityId: string, name: string) {
    const updated = await withBusy(entityId, () =>
      api.applyCorrection(caseId, entityId, {
        correctionType: "wrong_person",
        newEntityName: name,
      }),
    );
    if (updated) {
      setCaseData(updated);
      toast.success("Name updated.");
    }
  }

  async function resolveAmbiguous(entityId: string, pickedEntityId: string | null) {
    const updated = await withBusy(entityId, () => api.resolveAmbiguous(caseId, entityId, pickedEntityId));
    if (updated) {
      setCaseData(updated);
      toast.success("Match resolved.");
    }
  }

  async function confirmAll() {
    const updated = await withBusy("__all__", () => api.confirmAllRemaining(caseId));
    if (updated) {
      setCaseData(updated);
      if (updated.reviewStatus === "confirmed") {
        toast.success("All entities confirmed.");
        router.push(`/cases/${caseId}`);
      }
    }
  }

  async function addEntity(name: string, role: EntityRole) {
    const updated = await api.addEntity(caseId, name, role).catch((err) => {
      const msg = err instanceof ApiError ? err.detail : "Failed to add entity";
      toast.error(msg);
      return null;
    });
    if (updated) {
      setCaseData(updated);
      toast.success("Entity added.");
    }
  }

  const totalEntities = caseData.entities.length;
  const docName = caseData.documents[0]?.name;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 pb-32">
      <div className="mb-6">
        <Link href="/cases" className="text-sm text-slate-500 hover:text-slate-800">
          ← Back to Cases
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          Review Extracted Case Data
        </h1>
        {docName ? (
          <p className="mt-1 text-sm text-slate-500">{docName} · Uploaded just now</p>
        ) : null}
        <p className="mt-3 max-w-xl text-sm text-slate-600">
          Confirm each detail below. Edit anything that&apos;s wrong. The system learns from your
          corrections.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="space-y-6">
          <CaseDetailsCard caseData={caseData} />
          <PeopleSection
            caseData={caseData}
            busyEntityId={busyEntityId}
            onConfirm={confirm}
            onCorrect={(entity) => setCorrecting(entity)}
            onEdit={editName}
            onResolveAmbiguous={resolveAmbiguous}
            onAddMissed={() => setAddOpen(true)}
          />
        </div>
        {docName ? (
          <aside className="hidden lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Document
            </p>
            <DocThumbnail
              fileName={docName}
              pageCount={caseData.documents[0]?.pageCount}
              className="mt-3"
            />
          </aside>
        ) : null}
      </div>

      <ReviewFooter
        pendingCount={pendingCount}
        totalEntities={totalEntities}
        canConfirmAll={canConfirmAll}
        busy={busyEntityId !== null}
        onConfirmAll={confirmAll}
        onSaveLater={() => router.push("/cases")}
      />

      {correcting ? (
        <CorrectionModal
          entity={correcting}
          open
          onClose={() => setCorrecting(null)}
          onSubmit={handleCorrection}
        />
      ) : null}

      <AddEntityDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (name, role) => {
          await addEntity(name, role);
          setAddOpen(false);
        }}
      />
    </div>
  );
}

// ---------- Case details ----------

function CaseDetailsCard({ caseData }: { caseData: CaseDetail }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Case details</h2>
      <dl className="mt-4 grid grid-cols-[180px_1fr] gap-x-4 gap-y-3 text-sm">
        <Field label="Case Number" value={caseData.caseNumber || "—"} />
        <Field label="Court" value={[caseData.court, caseData.courtDept].filter(Boolean).join(", ") || "—"} />
        <Field label="Filed" value={caseData.filedDate ?? "—"} />
        <Field label="Case Type" value={caseData.caseType ?? "—"} />
      </dl>

      {caseData.charges.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-xs font-medium text-slate-500">Charges</h3>
          <ol className="mt-2 space-y-2">
            {caseData.charges.map((c, i) => (
              <li key={c.id} className="flex items-baseline gap-2 text-sm">
                <span className="font-mono text-xs text-slate-400">{i + 1}.</span>
                <span className="text-slate-900">{c.text}</span>
                {c.statute ? <span className="text-xs text-slate-500">({c.statute})</span> : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{value}</dd>
    </>
  );
}

// ---------- People section ----------

function PeopleSection({
  caseData,
  busyEntityId,
  onConfirm,
  onCorrect,
  onEdit,
  onResolveAmbiguous,
  onAddMissed,
}: {
  caseData: CaseDetail;
  busyEntityId: string | null;
  onConfirm: (entityId: string) => void;
  onCorrect: (entity: EntityCandidate) => void;
  onEdit: (entityId: string, name: string) => void;
  onResolveAmbiguous: (entityId: string, pickedEntityId: string | null) => void;
  onAddMissed: () => void;
}) {
  return (
    <section>
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">People on this case</h2>
      <div className="mt-4 space-y-3">
        {caseData.entities.map((e) => (
          <EntityCard
            key={e.id}
            entity={e}
            busy={busyEntityId === e.id || busyEntityId === "__all__"}
            onConfirm={() => onConfirm(e.id)}
            onCorrect={() => onCorrect(e)}
            onEdit={(name) => onEdit(e.id, name)}
            onResolveAmbiguous={(pickedEntityId) => onResolveAmbiguous(e.id, pickedEntityId)}
          />
        ))}
      </div>
      <div className="mt-4">
        <button
          type="button"
          onClick={onAddMissed}
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          + Add person missed
        </button>
      </div>
    </section>
  );
}

// ---------- Footer ----------

function ReviewFooter({
  pendingCount,
  totalEntities,
  canConfirmAll,
  busy,
  onConfirmAll,
  onSaveLater,
}: {
  pendingCount: number;
  totalEntities: number;
  canConfirmAll: boolean;
  busy: boolean;
  onConfirmAll: () => void;
  onSaveLater: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <p className="text-sm text-slate-600">
          {pendingCount === 0
            ? `${totalEntities} of ${totalEntities} entities confirmed`
            : `${pendingCount} of ${totalEntities} entities need confirmation`}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSaveLater}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Save &amp; Review Later
          </button>
          <Button
            variant={canConfirmAll ? "primary" : "secondary"}
            disabled={!canConfirmAll || busy}
            onClick={onConfirmAll}
          >
            Confirm All Remaining
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Add missed entity dialog ----------

function AddEntityDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, role: EntityRole) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<EntityRole>("witness");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName("");
    setRole("witness");
    setSubmitting(false);
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      labelledBy="add-entity-title"
    >
      <DialogHeader
        title="Add a person missed"
        onClose={() => {
          reset();
          onClose();
        }}
        id="add-entity-title"
      />
      <DialogBody className="space-y-4">
        <Input
          label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Trooper David Hayes"
          autoFocus
        />
        <Select
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as EntityRole)}
          options={ROLE_OPTIONS}
        />
      </DialogBody>
      <DialogFooter>
        <Button
          variant="secondary"
          onClick={() => {
            reset();
            onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          disabled={!name.trim() || submitting}
          onClick={async () => {
            setSubmitting(true);
            try {
              await onSubmit(name.trim(), role);
              reset();
            } finally {
              setSubmitting(false);
            }
          }}
        >
          Add entity
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
