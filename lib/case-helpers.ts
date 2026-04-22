import type { CaseSummary, ReviewStatus } from "./types";

export const STATUS_LABEL: Record<ReviewStatus, string> = {
  processing: "Processing",
  needs_review: "Needs Review",
  in_review: "In Review",
  confirmed: "Confirmed",
  shell: "Shell",
};

export const STATUS_DESCRIPTION: Record<ReviewStatus, string> = {
  processing: "Reading document…",
  needs_review: "Extraction complete — review entities",
  in_review: "Partially reviewed",
  confirmed: "All entities confirmed",
  shell: "No document uploaded yet",
};

export function statusPath(caseSummary: Pick<CaseSummary, "id" | "reviewStatus">): string {
  switch (caseSummary.reviewStatus) {
    case "processing":
      return `/cases/${caseSummary.id}/processing`;
    case "needs_review":
    case "in_review":
      return `/cases/${caseSummary.id}/review`;
    case "confirmed":
    case "shell":
    default:
      return `/cases/${caseSummary.id}`;
  }
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.round(hr / 24);
  return `${days}d ago`;
}

export function caseDisplayName(c: Pick<CaseSummary, "caseName" | "caseNumber">): string {
  if (c.caseName) return c.caseName;
  if (c.caseNumber) return c.caseNumber;
  return "Untitled case";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  // Bare "YYYY-MM-DD" is parsed as UTC midnight by Date(); in PST that rolls
  // back to the previous day. Parse date-only strings as local instead.
  const dateOnly = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
}

// Extraction preserves the PDF's casing, which is often ALL CAPS for names in
// the caption. Title-case on render so "WILLIAM KEPHART" → "William Kephart"
// without mutating what we stored. Strings that already contain any lowercase
// letter are assumed to be properly cased and returned unchanged.
export function titleCaseName(s: string | null | undefined): string {
  if (!s) return "";
  if (/[a-z]/.test(s)) return s;
  return s
    .split(/(\s+)/)
    .map((w) => {
      if (/^\s+$/.test(w)) return w;
      // Preserve single-letter initials like "T." — any longer all-caps token
      // is more likely a name than an acronym in this domain (e.g. "CHEN"),
      // so we title-case it. Titles with true acronyms ("DDA", "ESQ") come in
      // as mixed-case already and bypass this branch entirely.
      if (/^[A-Z]\.?$/.test(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join("");
}
