"use client";

import { useState } from "react";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CorrectionPayload, EntityCandidate, EntityRole } from "@/lib/types";

const ROLE_OPTIONS: Array<{ value: EntityRole; label: string }> = [
  { value: "defense_attorney", label: "Defense Attorney" },
  { value: "co_counsel", label: "Co-counsel" },
  { value: "judge", label: "Judge" },
  { value: "prosecutor", label: "Prosecutor" },
  { value: "witness", label: "Witness" },
  { value: "expert", label: "Expert" },
  { value: "officer", label: "Officer" },
  { value: "defendant", label: "Defendant" },
];

// Mock "existing in your system" directory — in production this would come
// from the API's entity search endpoint.
const EXISTING_DIRECTORY: Array<{ id: string; name: string; role: EntityRole; cases: number }> = [
  { id: "pros-michael-smith", name: "Michael Smith, DDA", role: "prosecutor", cases: 8 },
  { id: "pros-michelle-santos", name: "Michelle Santos, DDA", role: "prosecutor", cases: 2 },
  { id: "pros-john-jones", name: "John Jones, DDA", role: "prosecutor", cases: 12 },
  { id: "pros-james-jones", name: "James Jones, DDA", role: "prosecutor", cases: 2 },
  { id: "judge-kephart", name: "William Kephart", role: "judge", cases: 4 },
  { id: "judge-delaney", name: "Kathleen Delaney", role: "judge", cases: 1 },
];

interface Props {
  entity: EntityCandidate;
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CorrectionPayload) => Promise<void>;
}

type Step = "categorize" | "wrong_person" | "wrong_role" | "not_entity";

const ROLE_LABEL: Record<EntityRole, string> = {
  judge: "Judge",
  prosecutor: "Prosecutor",
  defense_attorney: "Defense Attorney",
  co_counsel: "Co-counsel",
  defendant: "Defendant",
  officer: "Officer",
  witness: "Witness",
  expert: "Expert",
};

export default function CorrectionModal({ entity, open, onClose, onSubmit }: Props) {
  const [step, setStep] = useState<Step>("categorize");
  const [submitting, setSubmitting] = useState(false);

  // Branch A state
  const [search, setSearch] = useState("");
  const [pickedExisting, setPickedExisting] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [useNewPerson, setUseNewPerson] = useState(false);

  // Branch B state
  const [newRole, setNewRole] = useState<EntityRole>(entity.role);

  function reset() {
    setStep("categorize");
    setSearch("");
    setPickedExisting(null);
    setNewName("");
    setUseNewPerson(false);
    setNewRole(entity.role);
    setSubmitting(false);
  }

  function close() {
    reset();
    onClose();
  }

  const existingMatches = EXISTING_DIRECTORY.filter((d) => {
    if (d.role !== entity.role) return false;
    if (!search.trim()) return true;
    return d.name.toLowerCase().includes(search.trim().toLowerCase());
  });

  async function submitWrongPerson() {
    setSubmitting(true);
    try {
      await onSubmit({
        correctionType: "wrong_person",
        correctedEntityId: useNewPerson ? undefined : pickedExisting ?? undefined,
        newEntityName: useNewPerson ? newName.trim() : undefined,
      });
      close();
    } finally {
      setSubmitting(false);
    }
  }

  async function submitWrongRole() {
    setSubmitting(true);
    try {
      await onSubmit({ correctionType: "wrong_role", correctedRole: newRole });
      close();
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNotEntity() {
    setSubmitting(true);
    try {
      await onSubmit({ correctionType: "not_entity" });
      close();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={close} labelledBy="correction-title">
      <DialogHeader
        title={
          step === "categorize"
            ? "What's wrong?"
            : step === "wrong_person"
              ? "Correct this entity"
              : step === "wrong_role"
                ? "Correct the role"
                : "Remove this entity"
        }
        onClose={close}
        id="correction-title"
      />

      {step === "categorize" ? (
        <>
          <DialogBody className="space-y-4">
            <p className="text-sm text-slate-600">
              We extracted: <span className="font-medium text-slate-900">{entity.extractedName}</span>{" "}
              as <span className="font-medium text-slate-900">{ROLE_LABEL[entity.role]}</span>
            </p>
            <div className="space-y-2">
              <Radio
                label="Wrong person — the role is right, but this isn't who it is"
                checked={false}
                onChange={() => setStep("wrong_person")}
              />
              <Radio
                label={`Wrong role — this person is on the case, but not as ${ROLE_LABEL[entity.role]}`}
                checked={false}
                onChange={() => setStep("wrong_role")}
              />
              <Radio
                label="Not a real entity — remove this entirely"
                checked={false}
                onChange={() => setStep("not_entity")}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
          </DialogFooter>
        </>
      ) : null}

      {step === "wrong_person" ? (
        <>
          <DialogBody className="space-y-4">
            <p className="text-sm text-slate-600">
              We extracted:{" "}
              <span className="font-medium text-slate-900">
                {entity.extractedName} ({ROLE_LABEL[entity.role]})
              </span>
              . Who is the {ROLE_LABEL[entity.role].toLowerCase()}?
            </p>
            <input
              type="text"
              placeholder="🔍 Search or type name"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setUseNewPerson(false);
              }}
            />
            {!useNewPerson && existingMatches.length > 0 ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Existing in your system
                </p>
                <ul className="mt-2 space-y-1">
                  {existingMatches.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => setPickedExisting(d.id)}
                        className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          pickedExisting === d.id
                            ? "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-300"
                            : "bg-white hover:bg-slate-50"
                        }`}
                      >
                        <span className="font-medium">{d.name}</span>
                        <span className="ml-2 text-xs text-slate-500">· {d.cases} cases</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <button
              type="button"
              className="text-xs font-medium text-indigo-700 hover:text-indigo-900"
              onClick={() => {
                setUseNewPerson(true);
                setPickedExisting(null);
                setNewName(search);
              }}
            >
              + Add new person not in system
            </button>
            {useNewPerson ? (
              <input
                type="text"
                placeholder="Full name"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setStep("categorize")}>
              Back
            </Button>
            <Button
              disabled={submitting || (!pickedExisting && !(useNewPerson && newName.trim()))}
              onClick={submitWrongPerson}
            >
              Apply Correction
            </Button>
          </DialogFooter>
        </>
      ) : null}

      {step === "wrong_role" ? (
        <>
          <DialogBody className="space-y-4">
            <p className="text-sm text-slate-600">
              We extracted:{" "}
              <span className="font-medium text-slate-900">{entity.extractedName}</span> as{" "}
              <span className="font-medium text-slate-900">{ROLE_LABEL[entity.role]}</span>. The name is
              correct but the role is wrong.
            </p>
            <p className="text-xs font-medium text-slate-500">
              What is {entity.extractedName}&apos;s role on this case?
            </p>
            <div className="space-y-2">
              {ROLE_OPTIONS.filter((r) => r.value !== entity.role).map((r) => (
                <Radio
                  key={r.value}
                  label={r.label}
                  checked={newRole === r.value}
                  onChange={() => setNewRole(r.value)}
                />
              ))}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setStep("categorize")}>
              Back
            </Button>
            <Button disabled={submitting || newRole === entity.role} onClick={submitWrongRole}>
              Apply Correction
            </Button>
          </DialogFooter>
        </>
      ) : null}

      {step === "not_entity" ? (
        <>
          <DialogBody className="space-y-4">
            <p className="text-sm text-slate-600">
              We extracted:{" "}
              <span className="font-medium text-slate-900">{entity.extractedName}</span> as a person on
              this case. Remove it entirely?
            </p>
            <p className="text-xs text-slate-500">
              This helps us avoid similar mistakes on future extractions.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setStep("categorize")}>
              Back
            </Button>
            <Button variant="danger" disabled={submitting} onClick={submitNotEntity}>
              Remove from case
            </Button>
          </DialogFooter>
        </>
      ) : null}
    </Dialog>
  );
}

function Radio({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
        checked ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <input type="radio" className="mt-1" checked={checked} onChange={onChange} />
      <span className="text-slate-800">{label}</span>
    </label>
  );
}
