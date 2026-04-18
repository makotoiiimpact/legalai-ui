"use client";

import { Badge } from "@/components/ui/badge";
import type { Document } from "@/lib/api";

export default function DocumentList({ docs }: { docs: Document[] }) {
  if (docs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        No documents uploaded yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-2.5">Filename</th>
            <th className="px-4 py-2.5">Type</th>
            <th className="px-4 py-2.5">Size</th>
            <th className="px-4 py-2.5">Pages</th>
            <th className="px-4 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {docs.map((d) => (
            <tr key={d.id}>
              <td className="px-4 py-3 font-medium text-slate-900">{d.name}</td>
              <td className="px-4 py-3 text-slate-600">{d.doc_type}</td>
              <td className="px-4 py-3 text-slate-500">
                {d.file_size_kb > 0 ? `${d.file_size_kb} KB` : "—"}
              </td>
              <td className="px-4 py-3 text-slate-500">{d.page_count}</td>
              <td className="px-4 py-3">
                {d.indexed ? (
                  <Badge tone="green">✓ Indexed</Badge>
                ) : (
                  <Badge tone="amber">⏳ Processing</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
