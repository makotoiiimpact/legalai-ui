import TopNav from "@/components/TopNav";

export default function CasesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <TopNav />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
