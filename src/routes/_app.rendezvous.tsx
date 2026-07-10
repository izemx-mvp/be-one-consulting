import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DataTable, type FilterChip } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash2, Send, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { rdvStore, CONSULTANTS, uid, useStore, type RendezVous } from "@/lib/mock-data";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/rendezvous")({
  head: () => ({ meta: [{ title: "Rendez-vous & Rappels — Be One Consulting" }] }),
  component: Page,
});

const TYPES: RendezVous["typeRdv"][] = ["Entretien candidat", "RDV client", "Restitution mission", "Kick-off projet", "Point suivi"];
const STATUTS: RendezVous["statutRappel"][] = ["Programmé", "Envoyé", "Non envoyé", "Confirmé"];
const DELAIS: RendezVous["delaiRappel"][] = ["15min", "30min", "1h", "1j"];

const typeColor: Record<RendezVous["typeRdv"], string> = {
  "Entretien candidat": "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800",
  "RDV client": "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800",
  "Restitution mission": "bg-[color:var(--gold)]/25 text-[color:var(--gold-foreground)] border-[color:var(--gold)]/40 dark:text-[color:var(--gold)]",
  "Kick-off projet": "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/60 dark:text-violet-200 dark:border-violet-800",
  "Point suivi": "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800",
};

function empty(): RendezVous {
  return {
    id: "", contact: "", typeRdv: "RDV client",
    dateHeure: new Date().toISOString().slice(0, 16),
    canal: "WhatsApp", delaiRappel: "1h", statutRappel: "Programmé",
    consultant: CONSULTANTS[0], notes: "", auto: true, historique: [],
  };
}

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function CalendarView({ items, onOpen }: { items: RendezVous[]; onOpen: (r: RendezVous) => void }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const monthLabel = cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const first = new Date(cursor);
  const start = new Date(first);
  const dow = (first.getDay() + 6) % 7; // Monday=0
  start.setDate(first.getDate() - dow);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i); return d;
  });
  const key = (d: Date) => d.toISOString().slice(0, 10);
  const byDay = items.reduce<Record<string, RendezVous[]>>((acc, r) => {
    const k = r.dateHeure.slice(0, 10);
    (acc[k] ??= []).push(r); return acc;
  }, {});
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold capitalize">{monthLabel}</div>
        <div className="flex gap-1">
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => { const d = new Date(cursor); d.setMonth(d.getMonth() - 1); setCursor(d); }}><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }}>Aujourd'hui</Button>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => { const d = new Date(cursor); d.setMonth(d.getMonth() + 1); setCursor(d); }}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[11px] text-muted-foreground text-center pb-2">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const today = key(d) === key(new Date());
          const dayItems = byDay[key(d)] ?? [];
          return (
            <div key={i} className={cn("min-h-[92px] rounded-lg border p-1.5 text-xs flex flex-col gap-1", inMonth ? "bg-card" : "bg-muted/30 text-muted-foreground", today && "ring-2 ring-[color:var(--gold)]")}>
              <div className={cn("text-[10px] font-medium", today && "text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]")}>{d.getDate()}</div>
              <div className="space-y-1 overflow-hidden">
                {dayItems.slice(0, 3).map((r) => (
                  <button key={r.id} onClick={() => onOpen(r)} className={cn("w-full text-left truncate rounded px-1.5 py-0.5 border text-[10px] hover:brightness-105 transition", typeColor[r.typeRdv])}>
                    {r.dateHeure.slice(11, 16)} · {r.contact}
                  </button>
                ))}
                {dayItems.length > 3 && <div className="text-[10px] text-muted-foreground pl-1">+{dayItems.length - 3}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Page() {
  const rows = useStore(rdvStore);
  const [type, setType] = useState("all");
  const [statut, setStatut] = useState("all");
  const [consultant, setConsultant] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RendezVous>(empty());
  const [detail, setDetail] = useState<RendezVous | null>(null);
  const [confirmDel, setConfirmDel] = useState<RendezVous | null>(null);

  const filtered = rows.filter((r) =>
    (type === "all" || r.typeRdv === type) &&
    (statut === "all" || r.statutRappel === statut) &&
    (consultant === "all" || r.consultant === consultant),
  );

  const chips: FilterChip[] = [];
  if (type !== "all") chips.push({ label: `Type : ${type}`, onRemove: () => setType("all") });
  if (statut !== "all") chips.push({ label: `Rappel : ${statut}`, onRemove: () => setStatut("all") });
  if (consultant !== "all") chips.push({ label: `Consultant : ${consultant}`, onRemove: () => setConsultant("all") });

  const save = () => {
    if (!editing.contact) { toast.error("Contact requis"); return; }
    if (editing.id) { rdvStore.update(editing.id, editing); toast.success("RDV mis à jour"); }
    else { rdvStore.add({ ...editing, id: uid(), historique: [{ at: new Date().toISOString().slice(0, 16), msg: "RDV créé" }] }); toast.success("RDV créé"); }
    setOpen(false);
  };

  const sendRappel = (r: RendezVous) => {
    const hist = [...r.historique, { at: new Date().toISOString().slice(0, 16), msg: "Rappel WhatsApp envoyé manuellement" }];
    rdvStore.update(r.id, { statutRappel: "Envoyé", historique: hist });
    setDetail({ ...r, statutRappel: "Envoyé", historique: hist });
    toast.success("Rappel envoyé", { description: `Message WhatsApp à ${r.contact}` });
  };

  return (
    <AppShell title="Rendez-vous & Rappels" subtitle="Agenda unifié et rappels WhatsApp automatisés">
      <Tabs defaultValue="calendar">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="list">Liste</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tous les types</SelectItem>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={consultant} onValueChange={setConsultant}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Consultant" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tous consultants</SelectItem>{CONSULTANTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={() => { setEditing(empty()); setOpen(true); }} className="ml-auto bg-primary text-primary-foreground">Nouveau rendez-vous</Button>
          </div>
          <CalendarView items={filtered} onOpen={setDetail} />
        </TabsContent>

        <TabsContent value="list">
          <DataTable<RendezVous>
            data={filtered}
            searchKeys={["contact", "typeRdv"]}
            searchPlaceholder="Rechercher un contact, un type..."
            addLabel="Nouveau rendez-vous"
            onAdd={() => { setEditing(empty()); setOpen(true); }}
            onRowClick={setDetail}
            filterChips={chips}
            filters={
              <>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Tous types</SelectItem>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={statut} onValueChange={setStatut}>
                  <SelectTrigger className="w-[170px]"><SelectValue placeholder="Rappel" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Tous rappels</SelectItem>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={consultant} onValueChange={setConsultant}>
                  <SelectTrigger className="w-[170px]"><SelectValue placeholder="Consultant" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Tous</SelectItem>{CONSULTANTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </>
            }
            columns={[
              { header: "Contact", sortKey: "contact", cell: (r) => <span className="font-medium">{r.contact}</span> },
              { header: "Type", cell: (r) => <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs border", typeColor[r.typeRdv])}>{r.typeRdv}</span> },
              { header: "Date & heure", sortKey: "dateHeure", cell: (r) => <span className="text-sm">{fmt(r.dateHeure)}</span> },
              { header: "Consultant", cell: (r) => <span className="text-sm text-muted-foreground">{r.consultant}</span> },
              { header: "Canal", cell: (r) => <span className="inline-flex items-center gap-1.5 text-sm"><MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> {r.canal} · {r.delaiRappel}</span> },
              { header: "Rappel", cell: (r) => <StatusBadge status={r.statutRappel} dot /> },
            ]}
            rowActions={(r) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setDetail(r)}><Eye className="h-4 w-4 mr-2" /> Détails</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4 mr-2" /> Modifier</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => sendRappel(r)}><Send className="h-4 w-4 mr-2" /> Envoyer rappel</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDel(r)}><Trash2 className="h-4 w-4 mr-2" /> Supprimer</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </TabsContent>
      </Tabs>

      {/* Add/Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing.id ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label>Client / Candidat</Label><Input value={editing.contact} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Type de RDV</Label>
              <Select value={editing.typeRdv} onValueChange={(v) => setEditing({ ...editing, typeRdv: v as RendezVous["typeRdv"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Consultant</Label>
              <Select value={editing.consultant} onValueChange={(v) => setEditing({ ...editing, consultant: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONSULTANTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1"><Label>Date & heure</Label><Input type="datetime-local" value={editing.dateHeure} onChange={(e) => setEditing({ ...editing, dateHeure: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Délai de rappel</Label>
              <Select value={editing.delaiRappel} onValueChange={(v) => setEditing({ ...editing, delaiRappel: v as RendezVous["delaiRappel"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DELAIS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Statut du rappel</Label>
              <Select value={editing.statutRappel} onValueChange={(v) => setEditing({ ...editing, statutRappel: v as RendezVous["statutRappel"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1"><Label>Notes</Label><Textarea rows={3} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} className="bg-primary text-primary-foreground">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Drawer */}
      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          {detail && (
            <>
              <SheetHeader className="border-b pb-4">
                <SheetTitle className="text-xl">{detail.contact}</SheetTitle>
                <div className="text-sm text-muted-foreground">{fmt(detail.dateHeure)} · {detail.consultant}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs border", typeColor[detail.typeRdv])}>{detail.typeRdv}</span>
                  <StatusBadge status={detail.statutRappel} dot />
                </div>
              </SheetHeader>
              <div className="py-4 space-y-5">
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Rappels automatiques</h4>
                  <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                    <div>
                      <div className="text-sm font-medium">Rappel WhatsApp</div>
                      <div className="text-xs text-muted-foreground">Envoyé automatiquement {detail.delaiRappel} avant le RDV.</div>
                    </div>
                    <Switch checked={detail.auto} onCheckedChange={(v) => { rdvStore.update(detail.id, { auto: v }); setDetail({ ...detail, auto: v }); toast.success(v ? "Rappel auto activé" : "Rappel auto désactivé"); }} />
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Historique</h4>
                  <ul className="relative pl-5 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-border">
                    {detail.historique.map((h, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-5 top-1 h-3 w-3 rounded-full bg-[color:var(--gold)]" />
                        <div className="text-sm">{h.msg}</div>
                        <div className="text-[11px] text-muted-foreground">{h.at.replace("T", " ")}</div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{detail.notes || "Aucune note."}</p>
                </section>

                <Button onClick={() => sendRappel(detail)} className="w-full bg-primary text-primary-foreground">
                  <Send className="h-4 w-4 mr-2" /> Envoyer un rappel maintenant
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Annuler ce rendez-vous ?"
        destructive
        confirmLabel="Supprimer"
        onConfirm={() => { if (confirmDel) { rdvStore.remove(confirmDel.id); toast.success("RDV supprimé"); } setConfirmDel(null); }}
      />
    </AppShell>
  );
}
