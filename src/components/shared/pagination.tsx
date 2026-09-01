import { Button } from "@/components/ui/button";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  buildHref: (page: number) => string;
};

export function Pagination({ page, pageSize, total, buildHref }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm text-muted-foreground">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-1">
        <Button asChild variant="outline" size="sm" aria-disabled={page <= 1}>
          <a href={buildHref(Math.max(1, page - 1))}>Previous</a>
        </Button>
        <Button asChild variant="outline" size="sm" aria-disabled={page >= totalPages}>
          <a href={buildHref(Math.min(totalPages, page + 1))}>Next</a>
        </Button>
      </div>
    </div>
  );
}