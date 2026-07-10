import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarEvent = { id: string; date: string; title: string; tone?: "primary" | "gold" | "muted" | "success" | "warn"; onClick?: () => void };

const toneClass: Record<NonNullable<CalendarEvent["tone"]>, string> = {
  primary: "bg-primary/15 text-primary border-primary/30",
  gold: "bg-[color:var(--gold)]/20 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)] border-[color:var(--gold)]/35",
  muted: "bg-muted text-muted-foreground border-border",
  success: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  warn: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
};

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DOW = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function MiniCalendar({ events, title }: { events: CalendarEvent[]; title?: string }) {
  const now = new Date();
  const [ym, setYm] = useState<{ y: number; m: number }>({ y: now.getFullYear(), m: now.getMonth() });

  const grid = useMemo(() => {
    const first = new Date(ym.y, ym.m, 1);
    const startDow = (first.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
    const cells: { date: Date | null }[] = [];
    for (let i = 0; i < startDow; i++) cells.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(ym.y, ym.m, d) });
    while (cells.length % 7 !== 0) cells.push({ date: null });
    return cells;
  }, [ym]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const key = ev.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return map;
  }, [events]);

  const prev = () => setYm((s) => (s.m === 0 ? { y: s.y - 1, m: 11 } : { y: s.y, m: s.m - 1 }));
  const next = () => setYm((s) => (s.m === 11 ? { y: s.y + 1, m: 0 } : { y: s.y, m: s.m + 1 }));
  const today = () => setYm({ y: now.getFullYear(), m: now.getMonth() });

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <div className="text-sm font-semibold">{title ?? "Calendrier"}</div>
          <div className="text-xs text-muted-foreground">{MONTHS[ym.m]} {ym.y}</div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={today} className="h-8">Aujourd'hui</Button>
          <Button size="icon" variant="ghost" onClick={prev} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={next} className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b bg-muted/30 text-[11px] font-semibold text-muted-foreground">
        {DOW.map((d) => <div key={d} className="p-2 text-center">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 auto-rows-[minmax(100px,1fr)]">
        {grid.map((cell, i) => {
          const key = cell.date ? `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(2, "0")}-${String(cell.date.getDate()).padStart(2, "0")}` : "";
          const evs = key ? eventsByDay.get(key) ?? [] : [];
          const isToday = cell.date && cell.date.toDateString() === now.toDateString();
          return (
            <div key={i} className={cn("border-r border-b p-1.5 last:border-r-0 min-h-[100px]", (i % 7 === 6) && "border-r-0", !cell.date && "bg-muted/20")}>
              {cell.date && (
                <>
                  <div className={cn("text-xs font-medium mb-1 h-5 w-5 grid place-items-center rounded-full", isToday && "bg-primary text-primary-foreground")}>{cell.date.getDate()}</div>
                  <div className="space-y-1">
                    {evs.slice(0, 3).map((ev) => (
                      <button key={ev.id} onClick={ev.onClick} className={cn("w-full text-left text-[10px] leading-tight px-1.5 py-1 rounded border truncate transition-colors hover:brightness-95", toneClass[ev.tone ?? "primary"])} title={ev.title}>
                        {ev.title}
                      </button>
                    ))}
                    {evs.length > 3 && <div className="text-[10px] text-muted-foreground pl-1">+{evs.length - 3} autres</div>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
