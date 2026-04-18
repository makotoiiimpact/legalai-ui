"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, api } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  caseId: string;
}

export default function ApproveMemoDialog({ open, onClose, caseId }: Props) {
  const router = useRouter();
  const [attorneyName, setAttorneyName] = useState("G. Ogata");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const approve = async () => {
    setSubmitting(true);
    try {
      await api.approveMemo(caseId, {
        attorney_name: attorneyName,
        notes: notes || null,
      });
      toast.success("Memo approved — case marked complete");
      onClose();
      router.push("/cases");
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "Approval failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} labelledBy="approve-title">
      <DialogHeader title="Attorney Approval" onClose={onClose} id="approve-title" />
      <DialogBody className="space-y-4">
        <p className="text-sm text-slate-700">
          This action confirms attorney review and approval. The case will be marked
          complete.
        </p>
        <Input
          label="Attorney Name"
          value={attorneyName}
          onChange={(e) => setAttorneyName(e.target.value)}
        />
        <Textarea
          label="Notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes for the audit trail"
        />
      </DialogBody>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="attorney" onClick={approve} disabled={submitting || !attorneyName.trim()}>
          {submitting ? "Approving…" : "Approve & Close"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
