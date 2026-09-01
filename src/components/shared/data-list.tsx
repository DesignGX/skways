import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export type Column<T> = {
  key: string;
  header: string;
  className?: string;
  cell: (row: T) => React.ReactNode;
  hideOnMobile?: boolean;
};

/**
 * Responsive table: renders a real <table> on sm+ screens and stacked cards
 * on small screens (mobile-first for drivers on phones).
 */
export function DataList<T extends Record<string, unknown>>({
  columns,
  rows,
  hrefFor,
  empty = { title: "Nothing here yet", description: "Records will appear here." },
}: {
  columns: Column<T>[];
  rows: T[];
  hrefFor?: (row: T) => string;
  empty?: { title: string; description: string; icon?: LucideIcon };
}) {
  if (rows.length === 0) {
    const EmptyIcon = empty.icon;
    return (
      <Card className="flex flex-col items-center justify-center gap-2 py-14 text-center">
        {EmptyIcon ? <EmptyIcon className="h-8 w-8 text-muted-foreground" /> : null}
        <p className="font-semibold">{empty.title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{empty.description}</p>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-lg border bg-background sm:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.className}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => {
                const href = hrefFor?.(row);
                const cells = columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    <CellLink href={href}>{col.cell(row)}</CellLink>
                  </TableCell>
                ));
                return <TableRow key={i}>{cells}</TableRow>;
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile stacked cards */}
      <div className="space-y-3 sm:hidden">
        {rows.map((row, i) => {
          const href = hrefFor?.(row);
          const firstCells = columns.slice(0, 2);
          const rest = columns.slice(2);
          return (
            <Card key={i} className="p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                {firstCells.map((col) => (
                  <div key={col.key} className={col.hideOnMobile ? "hidden" : ""}>
                    <CellLink href={href}>{col.cell(row)}</CellLink>
                  </div>
                ))}
              </div>
              <div className="mt-2 grid gap-1.5 text-sm text-muted-foreground">
                {rest.map((col) => (
                  <div key={col.key} className="flex items-center justify-between gap-3">
                    <span className="shrink-0 text-xs uppercase tracking-wide">{col.header}</span>
                    <span className={col.hideOnMobile ? "hidden" : "text-right"}>
                      <CellLink href={href}>{col.cell(row)}</CellLink>
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function CellLink({ href, children }: { href?: string; children: React.ReactNode }) {
  if (href) {
    return (
      <Link href={href} className="block">
        {children}
      </Link>
    );
  }
  return <>{children}</>;
}

export { Link };