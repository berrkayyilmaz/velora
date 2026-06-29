import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAnalyticsSummary } from "@/hooks/useAdminAnalytics";
import { getApiErrorMessage } from "@/utils/api-error";

const SUMMARY_ITEMS = [
  { key: "userCount", label: "Users" },
  { key: "productCount", label: "Products" },
  { key: "wishlistItemCount", label: "Wishlist Items" },
  { key: "outfitCount", label: "Outfits" },
  { key: "analyticsEventCount", label: "Analytics Events" },
  { key: "redirectCount", label: "Redirects" }
] as const;

export function DashboardScreen() {
  const summaryQuery = useAdminAnalyticsSummary();

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {summaryQuery.isPending ? (
        <section
          aria-label="Loading analytics summary"
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {SUMMARY_ITEMS.map((item) => (
            <Skeleton className="h-24" key={item.key} />
          ))}
        </section>
      ) : summaryQuery.isError ? (
        <div className="mt-6" role="alert">
          <p className="text-destructive">{getApiErrorMessage(summaryQuery.error)}</p>
          <Button
            className="mt-3"
            onClick={() => void summaryQuery.refetch()}
            type="button"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      ) : (
        <section aria-label="Analytics summary" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUMMARY_ITEMS.map((item) => (
            <Card key={item.key}>
              <CardContent>
                <h2 className="text-sm font-medium text-muted-foreground">{item.label}</h2>
                <p className="mt-2 text-2xl font-semibold">
                  {summaryQuery.data[item.key].toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}
