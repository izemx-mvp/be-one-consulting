import { useEffect, useState } from "react";

export function useSimulatedLoading(deps: unknown[] = [], delay = 400) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return loading;
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="skeleton h-11" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-t">
          <div className="skeleton h-8 w-8 rounded-full" />
          <div className="skeleton h-3 flex-1 max-w-[220px]" />
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-3 w-16" />
          <div className="skeleton h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ n = 6 }: { n?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
          <div className="skeleton h-32 w-full" />
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
