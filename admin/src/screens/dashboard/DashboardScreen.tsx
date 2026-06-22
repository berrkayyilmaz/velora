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
        <p className="mt-6 text-muted-foreground">Loading dashboard.</p>
      ) : summaryQuery.isError ? (
        <div className="mt-6" role="alert">
          <p className="text-destructive">{getApiErrorMessage(summaryQuery.error)}</p>
          <button
            className="mt-3 rounded-md border border-border px-3 py-2"
            onClick={() => void summaryQuery.refetch()}
            type="button"
          >
            Retry
          </button>
        </div>
      ) : (
        <section aria-label="Analytics summary" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUMMARY_ITEMS.map((item) => (
            <article className="rounded-md border border-border p-4" key={item.key}>
              <h2 className="text-sm font-medium text-muted-foreground">{item.label}</h2>
              <p className="mt-2 text-2xl font-semibold">
                {summaryQuery.data[item.key].toLocaleString()}
              </p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
