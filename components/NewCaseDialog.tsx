"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, api, type CreateCaseBody } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const CASE_TYPES = [
  { label: "DUI", value: "DUI" },
  { label: "Drug", value: "Drug" },
  { label: "Assault", value: "Assault" },
  { label: "Murder", value: "Murder" },
  { label: "Domestic Violence", value: "Domestic Violence" },
  { label: "Theft", value: "Theft" },
  { label: "Other", value: "Other" },
];

const SEVERITY = [
  { label: "Misdemeanor", value: "misdemeanor" },
  { label: "Gross Misdemeanor", value: "gross_misdemeanor" },
  { label: "Felony", value: "felony" },
];

export default function NewCaseDialog({ open, onClose, onCreated }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateCaseBody>({
    case_number: "",
    client_name: "",
    case_type: "DUI",
    charge: "",
    charge_severity: "misdemeanor",
    incident_date: "",
    notes: "",
  });

  const update = <K extends keyof CreateCaseBody>(key: K, value: CreateCaseBody[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.case_number.trim() || !form.client_name.trim()) return;
    setSubmitting(true);
    try {
      const payload: CreateCaseBody = {
        ...form,
        charge: form.charge || null,
        incident_date: form.incident_date || null,
        notes: form.notes || null,
      };
      const created = await api.createCase(payload);
      toast.success(`Case ${created.case_number} created`);
      onCreated?.();
      onClose();
      router.push(`/cases/${created.id}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "Failed to create case";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} side="right" labelledBy="new-case-title">
      <DialogHeader title="New Case" onClose={onClose} id="new-case-title" />
      <form onSubmit={submit} className="flex flex-col flex-1 min-h-0">
        <DialogBody className="flex-1 space-y-4">
          <Input
            label="Case Number"
            placeholder="GTO-2024-004"
            required
            value={form.case_number}
            onChange={(e) => update("case_number", e.target.value)}
          />
          <Input
            label="Client Name"
            required
            value={form.client_name}
            onChange={(e) => update("client_name", e.target.value)}
          />
          <Select
            label="Case Type"
            options={CASE_TYPES}
            value={form.case_type}
            onChange={(e) => update("case_type", e.target.value)}
          />
          <Input
            label="Charge"
            value={form.charge ?? ""}
            onChange={(e) => update("charge", e.target.value)}
          />
          <Select
            label="Charge Severity"
            options={SEVERITY}
            value={form.charge_severity ?? "misdemeanor"}
            onChange={(e) => update("charge_severity", e.target.value)}
          />
          <Input
            label="Incident Date"
            type="date"
            value={form.incident_date ?? ""}
            onChange={(e) => update("incident_date", e.target.value)}
          />
          <Textarea
            label="Notes"
            rows={3}
            value={form.notes ?? ""}
            onChange={(e) => update("notes", e.target.value)}
          />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create Case"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
