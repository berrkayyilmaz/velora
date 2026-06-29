import { useState } from "react";

import { PaginationControls } from "@/components/PaginationControls";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminAnalyticsEvents,
  useAdminAnalyticsRedirects
} from "@/hooks/useAdminAnalytics";
import type {
  AdminAnalyticsEvent,
  AdminAnalyticsRedirect
} from "@/types/admin-analytics";
import { getApiErrorMessage } from "@/utils/api-error";

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function EventRow({ event }: { event: AdminAnalyticsEvent }) {
  return (
    <tr className="border-b border-border">
      <td className="whitespace-nowrap px-3 py-2">{formatDate(event.createdAt)}</td>
      <td className="px-3 py-2">{event.eventType}</td>
      <td className="px-3 py-2">{event.sourceScreen ?? "-"}</td>
      <td className="px-3 py-2 font-mono text-xs">{event.userId ?? "-"}</td>
      <td className="px-3 py-2 font-mono text-xs">{event.productId ?? "-"}</td>
      <td className="px-3 py-2 font-mono text-xs">{event.outfitId ?? "-"}</td>
    </tr>
  );
}

function RedirectRow({ redirect }: { redirect: AdminAnalyticsRedirect }) {
  return (
    <tr className="border-b border-border">
      <td className="whitespace-nowrap px-3 py-2">{formatDate(redirect.createdAt)}</td>
      <td className="px-3 py-2">{redirect.sourceScreen}</td>
      <td className="px-3 py-2 font-mono text-xs">{redirect.userId ?? "-"}</td>
      <td className="px-3 py-2 font-mono text-xs">{redirect.productId}</td>
      <td className="px-3 py-2 font-mono text-xs">{redirect.outfitId ?? "-"}</td>
      <td className="px-3 py-2 font-mono text-xs">{redirect.sourcePlatformId}</td>
    </tr>
  );
}

export function AnalyticsScreen() {
  const [eventsPage, setEventsPage] = useState(1);
  const [redirectsPage, setRedirectsPage] = useState(1);
  const eventsQuery = useAdminAnalyticsEvents(eventsPage);
  const redirectsQuery = useAdminAnalyticsRedirects(redirectsPage);

  return (
    <main className="mx-auto w-full max-w-7xl p-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      <section className="mt-8" aria-labelledby="events-heading">
        <h2 className="text-lg font-semibold" id="events-heading">Events</h2>
        {eventsQuery.isPending ? (
          <div aria-label="Loading events" className="mt-4 grid gap-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : eventsQuery.isError ? (
          <div className="mt-4" role="alert">
            <p className="text-destructive">{getApiErrorMessage(eventsQuery.error)}</p>
            <Button
              className="mt-3"
              onClick={() => void eventsQuery.refetch()}
              type="button"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        ) : eventsQuery.data.data.items.length === 0 ? (
          <EmptyState className="mt-4 border-y border-border" title="No analytics events found" />
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Event</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Outfit</th>
                  </tr>
                </thead>
                <tbody>
                  {eventsQuery.data.data.items.map((event) => (
                    <EventRow event={event} key={event.id} />
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              hasNextPage={eventsQuery.data.meta.pagination.hasNextPage}
              label="events"
              onPageChange={setEventsPage}
              page={eventsPage}
            />
          </>
        )}
      </section>

      <section className="mt-10" aria-labelledby="redirects-heading">
        <h2 className="text-lg font-semibold" id="redirects-heading">Redirects</h2>
        {redirectsQuery.isPending ? (
          <div aria-label="Loading redirects" className="mt-4 grid gap-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : redirectsQuery.isError ? (
          <div className="mt-4" role="alert">
            <p className="text-destructive">{getApiErrorMessage(redirectsQuery.error)}</p>
            <Button
              className="mt-3"
              onClick={() => void redirectsQuery.refetch()}
              type="button"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        ) : redirectsQuery.data.data.items.length === 0 ? (
          <EmptyState className="mt-4 border-y border-border" title="No retailer redirects found" />
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Outfit</th>
                    <th className="px-3 py-2">Platform</th>
                  </tr>
                </thead>
                <tbody>
                  {redirectsQuery.data.data.items.map((redirect) => (
                    <RedirectRow key={redirect.id} redirect={redirect} />
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              hasNextPage={redirectsQuery.data.meta.pagination.hasNextPage}
              label="redirects"
              onPageChange={setRedirectsPage}
              page={redirectsPage}
            />
          </>
        )}
      </section>
    </main>
  );
}
