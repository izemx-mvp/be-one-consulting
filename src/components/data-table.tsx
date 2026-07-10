import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

type Props<T extends { id: string }> = {
  data: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  filters?: ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  pageSize?: number;
  rowActions?: (row: T) => ReactNode;
  emptyLabel?: string;
};

export function DataTable<T extends { id: string }>({
  data, columns, searchKeys, filters, onAdd, addLabel = "Ajouter",
  pageSize = 8, rowActions, emptyLabel = "Aucun élément",
}: Props<T>) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!q || !searchKeys) return data;
    const needle = q.toLowerCase();
    return data.filter((r) =>
      searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(needle)),
    );
  }, [data, q, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {searchKeys && (
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Rechercher..."
              className="pl-9"
            />
          </div>
        )}
        {filters}
        <div className="ml-auto flex items-center gap-2">
          {onAdd && (
            <Button onClick={onAdd} className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-1" /> {addLabel}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((c, i) => (
                <TableHead key={i} className={c.className}>{c.header}</TableHead>
              ))}
              {rowActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (rowActions ? 1 : 0)} className="text-center py-10 text-muted-foreground">
                  {emptyLabel}
                </TableCell>
              </TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                {columns.map((c, i) => (
                  <TableCell key={i} className={c.className}>{c.cell(r)}</TableCell>
                ))}
                {rowActions && <TableCell className="text-right">{rowActions(r)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""} · Page {current} / {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={current === 1}>
            <ChevronLeft className="h-4 w-4" /> Précédent
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
            Math.max(0, current - 3),
            Math.max(0, current - 3) + 5,
          ).map((n) => (
            <Button
              key={n}
              size="sm"
              variant={n === current ? "default" : "outline"}
              onClick={() => setPage(n)}
              className={n === current ? "bg-primary text-primary-foreground" : ""}
            >
              {n}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={current === totalPages}>
            Suivant <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
