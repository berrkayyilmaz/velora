import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

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
      <Button
        aria-label={`Previous ${label} page`}
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        size="icon"
        title={`Previous ${label} page`}
        type="button"
        variant="outline"
      >
        <ChevronLeft aria-hidden="true" size={18} />
      </Button>
      <span className="text-sm text-muted-foreground">Page {page}</span>
      <Button
        aria-label={`Next ${label} page`}
        disabled={!hasNextPage}
        onClick={() => onPageChange(page + 1)}
        size="icon"
        title={`Next ${label} page`}
        type="button"
        variant="outline"
      >
        <ChevronRight aria-hidden="true" size={18} />
      </Button>
    </nav>
  );
}
