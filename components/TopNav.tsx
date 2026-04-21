"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function TopNav() {
  const pathname = usePathname();
  const onAddCase = pathname === "/cases/new";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/cases" className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-xs font-bold tracking-tight text-white">
            LA
          </div>
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-widest text-slate-400">LegalAI</p>
            <p className="text-sm font-semibold text-slate-900">Your firm intelligence</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/cases"
            className={`text-sm transition-colors ${
              pathname === "/cases" ? "text-slate-900 font-medium" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Cases
          </Link>
          {onAddCase ? null : (
            <Link href="/cases/new">
              <Button size="sm" variant="primary">
                + Add Case
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
