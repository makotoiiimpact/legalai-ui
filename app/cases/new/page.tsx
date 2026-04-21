"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import UploadDropzone from "@/components/UploadDropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, api } from "@/lib/api";

export default function NewCasePage() {
  const router = useRouter();
  const [caseNumber, setCaseNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onUpload(file: File) {
    const created = await api.uploadCaseDocument(file);
    // Image uploads don't trigger extraction — land directly on the case view.
    if (created.reviewStatus === "shell") {
      router.push(`/cases/${created.id}`);
      return;
    }
    router.push(`/cases/${created.id}/processing`);
  }

  async function onCreateFromNumber(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = caseNumber.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const { caseId, duplicateOf } = await api.createCase(trimmed);
      if (duplicateOf) {
        toast.message("A case with that number already exists.", {
          description: "Taking you there.",
        });
      }
      router.push(`/cases/${caseId}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "Failed to create case";
      toast.error(msg);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-8">
        <Link href="/cases" className="text-sm text-slate-500 hover:text-slate-800">
          ← Back to Cases
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Add a New Case</h1>
      </div>

      <UploadDropzone onUpload={onUpload} />

      <div className="my-8 flex items-center gap-3 text-xs uppercase tracking-widest text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        <span>or start with a case number</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={onCreateFromNumber} className="flex items-start gap-3">
        <div className="flex-1">
          <Input
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            placeholder="e.g. A-21-123456-C"
            autoComplete="off"
            aria-label="Case number"
          />
        </div>
        <Button type="submit" variant="secondary" disabled={!caseNumber.trim() || submitting}>
          Create Case
        </Button>
      </form>

      <p className="mt-10 text-xs text-slate-400">
        Your documents are processed privately. Only your firm sees extracted intelligence.
      </p>
    </div>
  );
}
