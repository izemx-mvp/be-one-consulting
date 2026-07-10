import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { assistantConfigStore, meetingsStore, uid, useStore, type Meeting, type MeetingProvider } from "@/lib/mock-data";
import { Bot, Bell, CalendarDays, Clock, Video, Users2, MessageSquare, Sparkles, AlertTriangle, Plus, ChevronLeft, ChevronRight, Copy, Check, Pencil, Trash2, Mail, Phone, LayoutDashboard, Settings2, Link2, Paperclip, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/assistant")({
  head: () => ({ meta: [{ title: "Assistant AI — Be One Consulting" }] }),
  component: Page,
});

const PROVIDERS: MeetingProvider[] = ["Google Meet", "Zoom", "Microsoft Teams"];
const TIMINGS = ["5min", "10min", "15min", "30min", "1h", "2h", "1j"];
const IMPORTANCE: Meeting["importance"][] = ["Normale", "Haute", "Critique"];

function emptyMeeting(): Meeting {
  const dt = new Date();
  dt.setHours(dt.getHours() + 2, 0, 0, 0);
  return {
    id: "", titre: "", description: "", participants: [],
    dateHeure: dt.toISOString().slice(0, 16), duree: 30,
    provider: "Google Meet", meetingLink: "", notes: "", attachments: [],
    reminderStatus: "Programmé", reminders: ["15min"], importance: "Normale", source: "Manuel",
  };
}

function providerColor(p: MeetingProvider) {
  if (p === "Google Meet") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  if (p === "Zoom") return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30";
  return "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30";
}
function importanceColor(i: Meeting["importance"]) {
  if (i === "Critique") return "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30";
  if (i === "Haute") return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
  return "bg-muted text-muted-foreground border-border";
}

function Page() {
  return (
    <AppShell title="Assistant AI" subtitle="Agent conversationnel — gestion intelligente des réunions, rappels et agenda multi-canaux">
      <Tabs defaultValue="dashboard">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard"><LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard</TabsTrigger>
          <TabsTrigger value="calendar"><CalendarDays className="h-4 w-4 mr-2" /> Calendrier</TabsTrigger>
          <TabsTrigger value="config"><Settings2 className="h-4 w-4 mr-2" /> Configuration</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="calendar"><CalendarTab /></TabsContent>
        <TabsContent value="config"><ConfigTab /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

// ---------- Dashboard ----------
function DashboardTab() {
  const meetings = useStore(meetingsStore);
  const now = Date.now();
  const upcoming = meetings.filter((m) => new Date(m.dateHeure).getTime() > now).sort((a, b) => a.dateHeure.localeCompare(b.dateHeure));
  const today = upcoming.filter((m) => m.dateHeure.slice(0, 10) === new Date().toISOString().slice(0, 10));
  const missed = meetings.filter((m) => new Date(m.dateHeure).getTime() < now && m.reminderStatus === "Manqué");
  const nextReminders = upcoming.slice(0, 5);

  // Smart AI: conflicts + duplicates
  const conflicts: [Meeting, Meeting][] = [];
  for (let i = 0; i < meetings.length; i++) {
    for (let j = i + 1; j < meetings.length; j++) {
      const a = meetings[i], b = meetings[j];
      const as = new Date(a.dateHeure).getTime(), ae = as + a.duree * 60000;
      const bs = new Date(b.dateHeure).getTime(), be = bs + b.duree * 60000;
      if (as < be && bs < ae && a.titre !== b.titre) conflicts.push([a, b]);
    }
  }
  const duplicates = meetings.filter((m, i, arr) => arr.findIndex((x) => x.titre === m.titre && x.dateHeure === m.dateHeure) !== i);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<CalendarDays />} label="À venir" value={upcoming.length} tone="stat-primary" />
        <StatCard icon={<Clock />} label="Aujourd'hui" value={today.length} tone="stat-gold" />
        <StatCard icon={<AlertTriangle />} label="Manqués" value={missed.length} tone="stat-amber" />
        <StatCard icon={<Bell />} label="Rappels programmés" value={upcoming.reduce((s, m) => s + m.reminders.length, 0)} tone="stat-emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="card-elevated p-5 lg:col-span-2">
          <div className="section-header mb-3"><h3 className="font-semibold text-sm">Prochaines réunions</h3></div>
          <ul className="divide-y">
            {upcoming.slice(0, 6).map((m) => (
              <li key={m.id} className="py-3 flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-lg grid place-items-center shrink-0 border", providerColor(m.provider))}>
                  <Video className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{m.titre}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.participants.slice(0, 2).join(", ")}{m.participants.length > 2 ? ` +${m.participants.length - 2}` : ""}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-medium">{m.dateHeure.slice(0, 10)}</div>
                  <div className="text-[11px] text-muted-foreground">{m.dateHeure.slice(11, 16)} · {m.duree}min</div>
                </div>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", importanceColor(m.importance))}>{m.importance}</span>
              </li>
            ))}
            {upcoming.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Aucune réunion planifiée.</li>}
          </ul>
        </Card>

        <Card className="card-elevated p-5">
          <div className="section-header mb-3"><h3 className="font-semibold text-sm">Rappels imminents</h3></div>
          <ul className="space-y-2">
            {nextReminders.map((m) => (
              <li key={m.id} className="text-sm border rounded-lg p-3 hover-lift">
                <div className="flex items-start gap-2">
                  <Bell className="h-4 w-4 text-[color:var(--gold)] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{m.titre}</div>
                    <div className="text-[11px] text-muted-foreground">{m.reminders.join(", ")} avant · {m.dateHeure.slice(11, 16)}</div>
                  </div>
                </div>
              </li>
            ))}
            {nextReminders.length === 0 && <li className="text-sm text-muted-foreground">Rien de prévu.</li>}
          </ul>
        </Card>
      </div>

      <Card className="card-elevated p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[color:var(--gold)]" />
          <h3 className="font-semibold text-sm">Insights de l'agent IA</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InsightCard tone="amber" title="Conflits détectés" count={conflicts.length} action="Voir">
            {conflicts.slice(0, 2).map(([a, b], i) => (
              <div key={i} className="text-xs">• <b>{a.titre}</b> ↔ <b>{b.titre}</b> ({a.dateHeure.slice(11, 16)})</div>
            ))}
            {conflicts.length === 0 && <div className="text-xs text-muted-foreground">Aucun conflit d'horaire.</div>}
          </InsightCard>
          <InsightCard tone="red" title="Doublons détectés" count={duplicates.length} action="Nettoyer">
            {duplicates.slice(0, 2).map((m) => <div key={m.id} className="text-xs">• {m.titre}</div>)}
            {duplicates.length === 0 && <div className="text-xs text-muted-foreground">Aucun doublon.</div>}
          </InsightCard>
          <InsightCard tone="emerald" title="Suggestions IA" count={3} action="Appliquer">
            <div className="text-xs">• Ajouter un rappel 1j avant les critiques</div>
            <div className="text-xs">• Déplacer le point hebdo au mardi</div>
            <div className="text-xs">• Envoyer la synthèse Teams post-réunion</div>
          </InsightCard>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  return (
    <Card className={cn("p-4 border hover-lift", tone)}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-background/60 grid place-items-center text-[color:var(--gold)]">{icon}</div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
          <div className="text-2xl font-bold tabular-nums">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function InsightCard({ tone, title, count, action, children }: { tone: "amber" | "red" | "emerald"; title: string; count: number; action: string; children: React.ReactNode }) {
  const cls = tone === "amber" ? "stat-amber" : tone === "red" ? "border-red-500/40 bg-red-500/5" : "stat-emerald";
  return (
    <div className={cn("rounded-lg border p-3 space-y-1.5", cls)}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-background/60 tabular-nums">{count}</span>
      </div>
      <div className="space-y-0.5">{children}</div>
      <Button size="sm" variant="ghost" className="h-7 text-xs w-full" onClick={() => toast.success(`${action} — action IA lancée`)}><Zap className="h-3 w-3 mr-1" /> {action}</Button>
    </div>
  );
}

// ---------- Calendar ----------
const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DOW_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function CalendarTab() {
  const meetings = useStore(meetingsStore);
  const [cursor, setCursor] = useState(new Date());
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [detail, setDetail] = useState<Meeting | null>(null);
  const [confirmDel, setConfirmDel] = useState<Meeting | null>(null);

  const byDay = useMemo(() => {
    const m = new Map<string, Meeting[]>();
    for (const meet of meetings) {
      const d = meet.dateHeure.slice(0, 10);
      if (!m.has(d)) m.set(d, []);
      m.get(d)!.push(meet);
    }
    return m;
  }, [meetings]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);

  const shift = (delta: number) => { const d = new Date(cursor); d.setMonth(d.getMonth() + delta); setCursor(d); };
  const today = new Date().toISOString().slice(0, 10);

  const save = () => {
    if (!editing) return;
    if (!editing.titre) { toast.error("Titre requis"); return; }
    if (editing.id) { meetingsStore.update(editing.id, editing); toast.success("Réunion mise à jour"); }
    else { meetingsStore.add({ ...editing, id: uid() }); toast.success("Réunion créée", { description: "Rappels programmés automatiquement." }); }
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <Card className="card-elevated p-4 flex items-center gap-3 flex-wrap">
        <div className="text-lg font-semibold">{MONTHS_FR[month]} {year}</div>
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={() => setCursor(new Date())}>Aujourd'hui</Button>
          <Button size="icon" variant="ghost" onClick={() => shift(-1)} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => shift(1)} className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          <Button size="sm" onClick={() => setEditing(emptyMeeting())} className="btn-premium hover:[&]:btn-premium-hover ml-2"><Plus className="h-4 w-4 mr-1" /> Nouvel événement</Button>
        </div>
      </Card>

      <Card className="card-elevated p-0 overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/40 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          {DOW_FR.map((d) => <div key={d} className="p-2 text-center border-b">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const key = d ? `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` : "";
            const events = d ? byDay.get(key) ?? [] : [];
            const isToday = key === today;
            return (
              <div key={i} className={cn("min-h-[110px] border-r border-b p-1.5 text-sm", i % 7 === 6 && "border-r-0", isToday && "bg-[color:var(--gold)]/8")}>
                {d && (
                  <>
                    <div className={cn("text-xs font-semibold mb-1", isToday && "text-[color:var(--gold)]")}>{d}</div>
                    <div className="space-y-1">
                      {events.slice(0, 3).map((m) => (
                        <button key={m.id} onClick={() => setDetail(m)} className={cn("w-full text-left text-[11px] px-1.5 py-1 rounded border truncate flex items-center gap-1", providerColor(m.provider))}>
                          <Video className="h-2.5 w-2.5 shrink-0" />
                          <span className="tabular-nums text-[10px] opacity-70">{m.dateHeure.slice(11, 16)}</span>
                          <span className="truncate">{m.titre}</span>
                        </button>
                      ))}
                      {events.length > 3 && <div className="text-[10px] text-muted-foreground pl-1">+{events.length - 3} de plus</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Detail sheet */}
      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto scroll-fancy">
          {detail && (
            <>
              <SheetHeader className="border-b pb-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border inline-flex items-center gap-1", providerColor(detail.provider))}><Video className="h-3 w-3" /> {detail.provider}</span>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", importanceColor(detail.importance))}>{detail.importance}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-muted">{detail.source}</span>
                </div>
                <SheetTitle>{detail.titre}</SheetTitle>
                <div className="text-sm text-muted-foreground">{detail.dateHeure.slice(0, 10)} · {detail.dateHeure.slice(11, 16)} · {detail.duree} min</div>
              </SheetHeader>
              <div className="py-4 space-y-4">
                {detail.description && <section><h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Description</h4><p className="text-sm">{detail.description}</p></section>}
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1"><Users2 className="h-3 w-3" /> Participants</h4>
                  <div className="flex flex-wrap gap-1.5">{detail.participants.map((p) => <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-secondary">{p}</span>)}</div>
                </section>
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1"><Link2 className="h-3 w-3" /> Lien de la réunion</h4>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={detail.meetingLink} className="text-xs" />
                    <Button size="icon" variant="outline" onClick={() => { navigator.clipboard?.writeText(detail.meetingLink); toast.success("Lien copié"); }}><Copy className="h-4 w-4" /></Button>
                  </div>
                </section>
                {detail.notes && <section><h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Notes</h4><p className="text-sm text-muted-foreground">{detail.notes}</p></section>}
                {detail.attachments.length > 0 && (
                  <section><h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1"><Paperclip className="h-3 w-3" /> Pièces jointes</h4>
                    <ul className="text-sm space-y-1">{detail.attachments.map((a) => <li key={a} className="flex items-center gap-2"><Paperclip className="h-3 w-3 text-muted-foreground" /> {a}</li>)}</ul>
                  </section>
                )}
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1"><Bell className="h-3 w-3" /> Rappels</h4>
                  <div className="flex flex-wrap gap-1.5">{detail.reminders.map((r) => <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] border border-[color:var(--gold)]/30">{r} avant</span>)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Statut : <b className={cn(detail.reminderStatus === "Confirmé" && "text-emerald-600", detail.reminderStatus === "Manqué" && "text-red-600")}>{detail.reminderStatus}</b></div>
                </section>
                <section className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => { setEditing(detail); setDetail(null); }}><Pencil className="h-4 w-4 mr-2" /> Modifier</Button>
                  <Button variant="outline" className="text-destructive border-destructive/30" onClick={() => { setConfirmDel(detail); setDetail(null); }}><Trash2 className="h-4 w-4" /></Button>
                  <Button className="btn-premium hover:[&]:btn-premium-hover flex-1" onClick={() => toast.success("Résumé IA envoyé aux participants")}> <Sparkles className="h-4 w-4 mr-2" /> Résumer & envoyer</Button>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scroll-fancy">
          {editing && (
            <>
              <DialogHeader><DialogTitle>{editing.id ? "Modifier la réunion" : "Nouvel événement"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1"><Label>Titre</Label><Input value={editing.titre} onChange={(e) => setEditing({ ...editing, titre: e.target.value })} placeholder="Ex: Kick-off mission client" /></div>
                <div className="col-span-2 space-y-1"><Label>Description</Label><Textarea rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
                <div className="space-y-1"><Label>Date & heure</Label><Input type="datetime-local" value={editing.dateHeure} onChange={(e) => setEditing({ ...editing, dateHeure: e.target.value })} /></div>
                <div className="space-y-1"><Label>Durée (min)</Label><Input type="number" min={5} step={5} value={editing.duree} onChange={(e) => setEditing({ ...editing, duree: Number(e.target.value) })} /></div>
                <div className="space-y-1"><Label>Fournisseur</Label>
                  <Select value={editing.provider} onValueChange={(v) => setEditing({ ...editing, provider: v as MeetingProvider })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PROVIDERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Importance</Label>
                  <Select value={editing.importance} onValueChange={(v) => setEditing({ ...editing, importance: v as Meeting["importance"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{IMPORTANCE.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1"><Label>Lien de la réunion</Label><Input value={editing.meetingLink} onChange={(e) => setEditing({ ...editing, meetingLink: e.target.value })} placeholder="https://meet.google.com/..." /></div>
                <div className="col-span-2 space-y-1"><Label>Participants (séparés par virgules)</Label><Input value={editing.participants.join(", ")} onChange={(e) => setEditing({ ...editing, participants: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></div>
                <div className="col-span-2 space-y-1"><Label>Rappels</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {TIMINGS.map((t) => {
                      const on = editing.reminders.includes(t);
                      return <button key={t} type="button" onClick={() => setEditing({ ...editing, reminders: on ? editing.reminders.filter((x) => x !== t) : [...editing.reminders, t] })} className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors", on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>{t}</button>;
                    })}
                  </div>
                </div>
                <div className="col-span-2 space-y-1"><Label>Notes</Label><Textarea rows={2} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
                <Button onClick={save} className="btn-premium hover:[&]:btn-premium-hover">Enregistrer</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Supprimer cette réunion ?"
        destructive
        confirmLabel="Supprimer"
        onConfirm={() => { if (confirmDel) { meetingsStore.remove(confirmDel.id); toast.success("Réunion supprimée"); } setConfirmDel(null); }}
      />
    </div>
  );
}

// ---------- Config ----------
function ConfigTab() {
  const cfg = useStore(assistantConfigStore)[0];
  const update = (patch: Partial<typeof cfg>) => { assistantConfigStore.update(cfg.id, patch); toast.success("Configuration enregistrée"); };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="card-elevated p-5 space-y-4">
        <div className="section-header"><h3 className="font-semibold text-sm">Langue & rappels</h3></div>
        <div className="space-y-1"><Label>Langue des rappels</Label>
          <Select value={cfg.langue} onValueChange={(v) => update({ langue: v as typeof cfg.langue })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Français">Français</SelectItem>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="العربية">العربية</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Délais de rappel (multi-sélection)</Label>
          <div className="flex flex-wrap gap-1.5">
            {TIMINGS.map((t) => {
              const on = cfg.timings.includes(t);
              return <button key={t} type="button" onClick={() => update({ timings: on ? cfg.timings.filter((x) => x !== t) : [...cfg.timings, t] })} className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors", on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>{t} avant</button>;
            })}
          </div>
        </div>
      </Card>

      <Card className="card-elevated p-5 space-y-4">
        <div className="section-header"><h3 className="font-semibold text-sm">Fournisseur & notifications</h3></div>
        <div className="space-y-1"><Label>Fournisseur par défaut</Label>
          <Select value={cfg.provider} onValueChange={(v) => update({ provider: v as MeetingProvider })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PROVIDERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div><div className="text-sm font-medium">Notifier tous les participants</div><div className="text-xs text-muted-foreground">Sinon, seul vous êtes rappelé.</div></div>
          <Switch checked={cfg.notifyAll} onCheckedChange={(v) => update({ notifyAll: v })} />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div><div className="text-sm font-medium flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-emerald-600" /> Livraison WhatsApp</div><div className="text-xs text-muted-foreground">Les rappels sont envoyés sur votre WhatsApp.</div></div>
          <Switch checked={cfg.whatsappDelivery} onCheckedChange={(v) => update({ whatsappDelivery: v })} />
        </div>
      </Card>

      <Card className="card-elevated p-5 space-y-4 lg:col-span-2">
        <div className="section-header"><h3 className="font-semibold text-sm">Détection automatique des réunions</h3></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div><div className="text-sm font-medium flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-sky-600" /> Depuis emails</div><div className="text-xs text-muted-foreground">Détecte les invitations dans votre boîte mail.</div></div>
            <Switch checked={cfg.autoFromEmail} onCheckedChange={(v) => update({ autoFromEmail: v })} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div><div className="text-sm font-medium flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> Depuis WhatsApp</div><div className="text-xs text-muted-foreground">« Rappelle-moi lundi 9h d'appeler le client » → événement créé.</div></div>
            <Switch checked={cfg.autoFromWhatsapp} onCheckedChange={(v) => update({ autoFromWhatsapp: v })} />
          </div>
        </div>
        <div className="rounded-xl border p-4 bg-gradient-to-br from-[color:var(--gold)]/10 to-transparent border-[color:var(--gold)]/25">
          <div className="flex items-center gap-2 text-sm font-semibold"><Bot className="h-4 w-4 text-[color:var(--gold)]" /> L'assistant sait faire</div>
          <ul className="text-xs text-muted-foreground mt-2 space-y-1">
            <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-600" /> Détecter les conflits d'horaire</li>
            <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-600" /> Suggérer de meilleurs créneaux</li>
            <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-600" /> Repérer les doublons</li>
            <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-600" /> Ajuster les rappels selon l'importance</li>
            <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-600" /> Résumer les réunions avant envoi de rappel</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
