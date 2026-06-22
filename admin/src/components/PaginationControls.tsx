import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationControlsProps = {
  label: string;
  page: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
};

export function PaginationControls({
  label,
  page,
  hasNextPage,
  onPageChange
}: PaginationControlsProps) {
  return (
    <nav aria-label={`${label} pagination`} className="flex items-center justify-between py-4">
      <button
        aria-label={`Previous ${label} page`}
        className="inline-flex size-9 items-center justify-center rounded-md border border-border disabled:opacity-50"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        title={`Previous ${label} page`}
        type="button"
      >
        <ChevronLeft aria-hidden="true" size={18} />
      </button>
      <span className="text-sm text-muted-foreground">Page {page}</span>
      <button
        aria-label={`Next ${label} page`}
        className="inline-flex size-9 items-center justify-center rounded-md border border-border disabled:opacity-50"
        disabled={!hasNextPage}
        onClick={() => onPageChange(page + 1)}
        title={`Next ${label} page`}
        type="button"
      >
        <ChevronRight aria-hidden="true" size={18} />
      </button>
    </nav>
  );
}
