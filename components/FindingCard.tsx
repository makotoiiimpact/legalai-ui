"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiError,
  api,
  confidenceLevel,
  formatConfidence,
  parseSourceExcerpts,
  type Finding,
  type ReviewAction,
} from "@/lib/api";

interface Props {
  finding: Finding;
  onReviewed: (action: ReviewAction, allReviewed: boolean) => void;
}

function confidenceTone(f: Finding): "green" | "amber" | "red" {
  const level = confidenceLevel(f.confidence);
  if (level === "high") return "green";
  if (level === "medium") return "amber";
  return "red";
}

function statusLabel(status: ReviewAction): string {
  if (status === "confirmed") return "✓ Confirmed";
  if (status === "edited") return "✎ Edited";
  return "✗ Rejected";
}

function statusTone(status: ReviewAction): "green" | "amber" | "red" {
  if (status === "confirmed") return "green";
  if (status === "edited") return "amber";
  return "red";
}

export default function FindingCard({ finding, onReviewed }: Props) {
  const reviewed = finding.hil_status !== null;
  const [expanded, setExpanded] = useState(!reviewed);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(finding.ai_answer);
  const [submitting, setSubmitting] = useState(false);
  const excerpts = parseSourceExcerpts(finding);

  const submit = async (action: ReviewAction, editedAnswer?: string) => {
    setSubmitting(true);
    try {
      const res = await api.reviewFinding(finding.case_id, finding.id, {
        action,
        edited_answer: editedAnswer ?? null,
      });
      toast.success(`Finding ${action}`);
      onReviewed(action, res.all_reviewed);
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "Review failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setEditing(false);
    }
  };

  return (
    <div
      className={`rounded-lg border bg-white transition-opacity ${
        reviewed ? "border-slate-200 opacity-70" : "border-slate-200 shadow-sm"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((x) => !x)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-medium text-slate-900 truncate">
            {finding.label}
          </span>
          <Badge tone={confidenceTone(finding)}>
            {formatConfidence(finding.confidence)}%
          </Badge>
          {finding.priority_flag ? <Badge tone="red">⚠️ Priority</Badge> : null}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {reviewed && finding.hil_status ? (
            <Badge tone={statusTone(finding.hil_status)}>
              {statusLabel(finding.hil_status)}
            </Badge>
          ) : null}
          <svg
            viewBox="0 0 20 20"
            className={`h-4 w-4 text-slate-400 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            fill="currentColor"
            aria-hidden
          >
            <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
          </svg>
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-slate-100 px-4 py-4 space-y-4">
          {finding.priority_flag ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              ⚠️ PRIORITY — flagged by model
            </div>
          ) : null}

          <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
            {finding.edited_answer ?? finding.ai_answer}
          </p>

          {excerpts.length > 0 ? (
            <div className="space-y-2">
              {excerpts.map((ex, i) => (
                <div
                  key={i}
                  className="border-l-2 border-blue-500 bg-slate-50 px-3 py-2 text-xs italic text-slate-700"
                >
                  <p className="not-italic text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {ex.doc_name}
                  </p>
                  <p className="mt-0.5">{ex.excerpt}</p>
                </div>
              ))}
            </div>
          ) : null}

          {reviewed ? (
            <p className="text-xs text-slate-500">
              Reviewed by {finding.reviewed_by ?? "Paralegal"}
            </p>
          ) : editing ? (
            <div className="space-y-2">
              <Textarea
                rows={5}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => submit("edited", editValue)}
                  disabled={submitting || !editValue.trim()}
                >
                  Save Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditing(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="success"
                onClick={() => submit("confirmed")}
                disabled={submitting}
              >
                ✓ Confirm
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditing(true)}
                disabled={submitting}
              >
                ✎ Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => submit("rejected")}
                disabled={submitting}
              >
                ✗ Reject
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
