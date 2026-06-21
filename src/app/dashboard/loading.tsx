import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="container pb-16">
      <header className="py-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-9 w-64" />
        <Skeleton className="mt-3 h-6 w-40" />
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <div className="flex flex-col gap-6 sm:flex-row">
              <Skeleton className="h-80 w-56 shrink-0 rounded-2xl" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
                <Skeleton className="h-24 rounded-xl" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <Skeleton className="h-6 w-48" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-32" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Card>
          ))}
        </aside>
      </div>
    </div>
  );
}
