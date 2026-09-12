export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
