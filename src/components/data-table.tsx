import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, Search, ArrowUpDown, X, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  sortKey?: keyof T;
};

export type FilterChip = { label: string; onRemove: () => void };

type Props<T extends { id: string }> = {
  data: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  filters?: ReactNode;
  filterChips?: FilterChip[];
  onAdd?: () => void;
  addLabel?: string;
  pageSize?: number;
  rowActions?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  emptyLabel?: string;
  emptyHint?: string;
};

export function highlight(text: string, needle: string) {
  if (!needle) return text;
  const parts = text.split(new RegExp(`(${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return parts.map((p, i) =>
    p.toLowerCase() === needle.toLowerCase()
      ? <mark key={i} className="bg-[color:var(--gold)]/40 text-inherit rounded px-0.5">{p}</mark>
      : <span key={i}>{p}</span>,
  );
}

export function DataTable<T extends { id: string }>({
  data, columns, searchKeys, searchPlaceholder = "Rechercher...", filters, filterChips,
  onAdd, addLabel = "Ajouter", pageSize: initialPageSize = 10, rowActions, onRowClick,
  emptyLabel = "Aucun résultat", emptyHint = "Essayez d'ajuster vos filtres ou votre recherche.",
}: Props<T>) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortIdx, setSortIdx] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    if (!q || !searchKeys) return data;
    const needle = q.toLowerCase();
    return data.filter((r) =>
      searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(needle)),
    );
  }, [data, q, searchKeys]);

  const sorted = useMemo(() => {
    if (sortIdx === null) return filtered;
    const col = columns[sortIdx];
    if (!col?.sortKey) return filtered;
    const k = col.sortKey;
    return [...filtered].sort((a, b) => {
      const av = a[k], bv = b[k];
      const cmp = String(av).localeCompare(String(bv), "fr", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortIdx, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, totalPages);
  const rows = sorted.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (i: number) => {
    if (!columns[i].sortKey) return;
    if (sortIdx === i) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortIdx(i); setSortDir("desc"); }
  };

  return (
    <div className="space-y-4 fade-up">
      <div className="flex flex-wrap items-center gap-3">
        {searchKeys && (
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
        )}
        {filters}
        <div className="ml-auto flex items-center gap-2">
          {onAdd && (
            <Button onClick={onAdd} className="bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-shadow">
              <Plus className="h-4 w-4 mr-1" /> {addLabel}
            </Button>
          )}
        </div>
      </div>

      {filterChips && filterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtres actifs :</span>
          {filterChips.map((c, i) => (
            <button key={i} onClick={c.onRemove} className="inline-flex items-center gap-1 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs px-2.5 py-1 transition-colors">
              {c.label}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map((c, i) => (
                <TableHead key={i} className={cn(c.className, c.sortKey && "cursor-pointer select-none")} onClick={() => toggleSort(i)}>
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {c.sortKey && <ArrowUpDown className={cn("h-3 w-3", sortIdx === i ? "text-foreground" : "text-muted-foreground/40")} />}
                  </span>
                </TableHead>
              ))}
              {rowActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (rowActions ? 1 : 0)} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="h-12 w-12 rounded-full bg-muted grid place-items-center"><Inbox className="h-6 w-6" /></div>
                    <div className="font-medium text-foreground">{emptyLabel}</div>
                    <div className="text-xs">{emptyHint}</div>
                  </div>
                </TableCell>
              </TableRow>
            ) : rows.map((r) => (
              <TableRow
                key={r.id}
                className={cn(onRowClick && "cursor-pointer hover:bg-muted/40 transition-colors")}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
              >
                {columns.map((c, i) => (
                  <TableCell key={i} className={c.className}>{c.cell(r)}</TableCell>
                ))}
                {rowActions && <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>{rowActions(r)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            {sorted.length} résultat{sorted.length > 1 ? "s" : ""} · Page {current} / {totalPages}
          </span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="25">25 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={current === 1}>
            <ChevronLeft className="h-4 w-4" />
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
              className={cn("min-w-9", n === current && "bg-primary text-primary-foreground")}
            >
              {n}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={current === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
