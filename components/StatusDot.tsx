import type { ReviewStatus } from "@/lib/types";

const DOT_CLASSES: Record<ReviewStatus, string> = {
  processing: "bg-blue-500 animate-pulse",
  needs_review: "bg-amber-500",
  in_review: "bg-indigo-500",
  confirmed: "bg-emerald-500",
  shell: "bg-slate-300",
};

const RING_CLASSES: Record<ReviewStatus, string> = {
  processing: "ring-blue-200",
  needs_review: "ring-amber-200",
  in_review: "ring-indigo-200",
  confirmed: "ring-emerald-200",
  shell: "ring-slate-200",
};

export function StatusDot({ status, size = "md" }: { status: ReviewStatus; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-2 w-2 ring-2" : "h-2.5 w-2.5 ring-4";
  return <span className={`inline-block rounded-full ${dim} ${DOT_CLASSES[status]} ${RING_CLASSES[status]}`} aria-hidden />;
}
