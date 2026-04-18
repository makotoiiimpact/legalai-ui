interface Props {
  reviewed: number;
  total: number;
}

export default function FindingsProgress({ reviewed, total }: Props) {
  const pct = total === 0 ? 0 : Math.round((reviewed / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">Review Progress</span>
        <span className="text-slate-500">
          {reviewed} / {total} reviewed
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
