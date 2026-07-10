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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash2, Linkedin, Facebook, Instagram, Calendar, MessageSquare, XCircle, ArrowRight, Target, FileText, Download, Eye as EyeIcon, Upload, FileType2 } from "lucide-react";
import { candidatsStore, POSTES, rdvStore, uid, useStore, type Candidat, type CandidatCV } from "@/lib/mock-data";
import { HeadHuntingPanel } from "@/components/head-hunting";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/recrutement")({
  head: () => ({ meta: [{ title: "Recrutement AI — Be One Consulting" }] }),
  component: Page,
});

const SOURCES: Candidat["source"][] = ["LinkedIn", "Facebook", "Instagram"];
const STATUTS: Candidat["statut"][] = ["Nouveau", "Présélectionné", "Entretien", "Offre", "Recruté", "Rejeté"];

const sourceIcon = { LinkedIn: Linkedin, Facebook, Instagram };
const sourceColor: Record<Candidat["source"], string> = {
  LinkedIn: "text-sky-700 bg-sky-100 dark:bg-sky-950/50 dark:text-sky-300",
  Facebook: "text-blue-700 bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300",
  Instagram: "text-pink-700 bg-pink-100 dark:bg-pink-950/50 dark:text-pink-300",
};

function empty(): Candidat {
  return {
    id: "", nom: "", poste: POSTES[0], source: "LinkedIn",
    score: 60, scoreAdequation: 60, scoreExperience: 60, scoreSoftSkills: 60,
    experience: 3, competences: [], statut: "Nouveau",
    email: "", telephone: "", date: new Date().toISOString().slice(0, 10),
    resume: "",
  };
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  const hue = Math.abs(name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 360;
  return (
    <div className="h-9 w-9 rounded-full grid place-items-center text-xs font-semibold text-white shrink-0" style={{ background: `linear-gradient(135deg, hsl(${hue} 60% 45%), hsl(${(hue + 40) % 360} 55% 55%))` }}>
      {initials}
    </div>
  );
}

function ScoreBar({ v }: { v: number }) {
  const color = v >= 75 ? "bg-emerald-500" : v >= 55 ? "bg-[color:var(--gold)]" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full transition-all", color)} style={{ width: `${v}%` }} />
      </div>
      <span className="text-xs tabular-nums font-medium">{v}</span>
    </div>
  );
}

function Page() {
  const rows = useStore(candidatsStore);
  const [statut, setStatut] = useState("all");
  const [source, setSource] = useState("all");
  const [poste, setPoste] = useState("all");
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Candidat>(empty());
  const [detail, setDetail] = useState<Candidat | null>(null);
  const [confirmDel, setConfirmDel] = useState<Candidat | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = rows.filter((r) =>
    (statut === "all" || r.statut === statut) &&
    (source === "all" || r.source === source) &&
    (poste === "all" || r.poste === poste) &&
    r.score >= scoreRange[0] && r.score <= scoreRange[1],
  );

  const chips: FilterChip[] = [];
  if (statut !== "all") chips.push({ label: `Statut : ${statut}`, onRemove: () => setStatut("all") });
  if (source !== "all") chips.push({ label: `Source : ${source}`, onRemove: () => setSource("all") });
  if (poste !== "all") chips.push({ label: `Poste : ${poste}`, onRemove: () => setPoste("all") });
  if (scoreRange[0] !== 0 || scoreRange[1] !== 100) chips.push({ label: `Score : ${scoreRange[0]}-${scoreRange[1]}`, onRemove: () => setScoreRange([0, 100]) });

  const save = () => {
    if (!editing.nom || !editing.poste) { toast.error("Nom et poste requis"); return; }
    if (editing.id) { candidatsStore.update(editing.id, editing); toast.success("Candidat mis à jour"); }
    else { candidatsStore.add({ ...editing, id: uid() }); toast.success("Candidat ajouté"); }
    setOpen(false);
  };

  const moveTo = (id: string, to: Candidat["statut"]) => {
    candidatsStore.update(id, { statut: to });
    toast.success(`Candidat déplacé vers « ${to} »`);
  };

  const scheduleInterview = (c: Candidat) => {
    rdvStore.add({
      id: uid(), contact: c.nom, typeRdv: "Entretien candidat",
      dateHeure: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 16),
      canal: "WhatsApp", delaiRappel: "1h", statutRappel: "Programmé",
      consultant: "F.Z. Abbadi", notes: `Entretien avec ${c.nom} pour le poste ${c.poste}.`,
      auto: true, historique: [{ at: new Date().toISOString().slice(0, 16), msg: "RDV programmé depuis fiche candidat." }],
    });
    candidatsStore.update(c.id, { statut: "Entretien" });
    toast.success("Entretien programmé", { description: "Un rappel WhatsApp sera envoyé." });
    setDetail(null);
  };

  return (
    <AppShell title="Recrutement AI" subtitle="CVthèque intelligente + chasse de tête ciblée sur LinkedIn, Facebook et le web">
      <Tabs defaultValue="table">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <TabsList>
            <TabsTrigger value="table">CVthèque — Tableau</TabsTrigger>
            <TabsTrigger value="kanban">Pipeline</TabsTrigger>
            <TabsTrigger value="hunting"><Target className="h-4 w-4 mr-1.5" /> Head Hunting</TabsTrigger>
          </TabsList>
        </div>



        <TabsContent value="table">
          <DataTable<Candidat>
            data={filtered}
            searchKeys={["nom", "poste", "email"]}
            searchPlaceholder="Rechercher un candidat, un poste, une compétence..."
            addLabel="Nouveau candidat"
            onAdd={() => { setEditing(empty()); setOpen(true); }}
            onRowClick={(r) => setDetail(r)}
            filterChips={chips}
            filters={
              <>
                <Select value={poste} onValueChange={setPoste}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Poste" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les postes</SelectItem>
                    {POSTES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Source" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes sources</SelectItem>
                    {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statut} onValueChange={setStatut}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    {STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 min-w-[220px] px-3 py-1.5 rounded-md border bg-background">
                  <span className="text-xs text-muted-foreground">Score</span>
                  <Slider min={0} max={100} step={5} value={scoreRange} onValueChange={(v) => setScoreRange(v as [number, number])} className="flex-1" />
                  <span className="text-xs tabular-nums w-16 text-right">{scoreRange[0]}-{scoreRange[1]}</span>
                </div>
              </>
            }
            columns={[
              { header: "Candidat", sortKey: "nom", cell: (r) => (
                <div className="flex items-center gap-3">
                  <Avatar name={r.nom} />
                  <div>
                    <div className="font-medium">{r.nom}</div>
                    <div className="text-xs text-muted-foreground">{r.experience} ans d'exp.</div>
                  </div>
                </div>
              ) },
              { header: "Poste visé", sortKey: "poste", cell: (r) => r.poste },
              { header: "Source", cell: (r) => {
                const Icon = sourceIcon[r.source];
                return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs", sourceColor[r.source])}><Icon className="h-3 w-3" /> {r.source}</span>;
              } },
              { header: "Score", sortKey: "score", cell: (r) => <ScoreBar v={r.score} /> },
              { header: "Date", sortKey: "date", cell: (r) => <span className="text-sm text-muted-foreground">{r.date}</span> },
              { header: "Statut", cell: (r) => <StatusBadge status={r.statut} dot /> },
            ]}
            rowActions={(r) => (
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDetail(r); }}>
                <Eye className="h-4 w-4 mr-1.5" /> Voir détails
              </Button>
            )}
          />
        </TabsContent>

        <TabsContent value="kanban">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {STATUTS.map((col) => {
              const cards = rows.filter((r) => r.statut === col);
              return (
                <div
                  key={col}
                  className="bg-muted/40 rounded-xl p-3 min-h-[400px]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (dragId) { moveTo(dragId, col); setDragId(null); } }}
                >
                  <div className="flex items-center justify-between mb-3 sticky top-0">
                    <span className="text-sm font-semibold">{col}</span>
                    <span className="text-xs bg-background rounded-full px-2 py-0.5 tabular-nums">{cards.length}</span>
                  </div>
                  <div className="space-y-2">
                    {cards.map((c) => (
                      <Card
                        key={c.id}
                        draggable
                        onDragStart={() => setDragId(c.id)}
                        onClick={() => setDetail(c)}
                        className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 transition-all fade-up"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar name={c.nom} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{c.nom}</div>
                            <div className="text-xs text-muted-foreground truncate">{c.poste}</div>
                          </div>
                        </div>
                        <div className="mt-2"><ScoreBar v={c.score} /></div>
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          <span>{c.source}</span>
                          <span>{c.experience} ans</span>
                        </div>
                      </Card>
                    ))}
                    {cards.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-8 border border-dashed rounded-lg">
                        Glisser un candidat ici
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="hunting">
          <HeadHuntingPanel />
        </TabsContent>
      </Tabs>


      {/* Add/Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing.id ? "Modifier le candidat" : "Nouveau candidat"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label>Nom complet</Label><Input value={editing.nom} onChange={(e) => setEditing({ ...editing, nom: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Poste visé</Label><Input value={editing.poste} onChange={(e) => setEditing({ ...editing, poste: e.target.value })} /></div>
            <div className="space-y-1"><Label>Email</Label><Input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
            <div className="space-y-1"><Label>Téléphone</Label><Input value={editing.telephone} onChange={(e) => setEditing({ ...editing, telephone: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Source</Label>
              <Select value={editing.source} onValueChange={(v) => setEditing({ ...editing, source: v as Candidat["source"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Statut</Label>
              <Select value={editing.statut} onValueChange={(v) => setEditing({ ...editing, statut: v as Candidat["statut"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Expérience (années)</Label><Input type="number" min={0} value={editing.experience} onChange={(e) => setEditing({ ...editing, experience: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Score global (0-100)</Label><Input type="number" min={0} max={100} value={editing.score} onChange={(e) => setEditing({ ...editing, score: Number(e.target.value) })} /></div>
            <div className="col-span-2 space-y-1"><Label>Résumé</Label><Input value={editing.resume} onChange={(e) => setEditing({ ...editing, resume: e.target.value })} /></div>
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
                <div className="flex items-center gap-3">
                  <Avatar name={detail.nom} />
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-xl">{detail.nom}</SheetTitle>
                    <div className="text-sm text-muted-foreground">{detail.poste} · {detail.experience} ans d'expérience</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <StatusBadge status={detail.statut} dot />
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs", sourceColor[detail.source])}>{detail.source}</span>
                </div>
              </SheetHeader>
              <div className="py-4 space-y-6">
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Score de qualification IA</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[["Adéquation poste", detail.scoreAdequation], ["Expérience", detail.scoreExperience], ["Soft skills", detail.scoreSoftSkills]].map(([label, v]) => (
                      <Card key={label as string} className="p-3">
                        <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
                        <div className="text-lg font-bold tabular-nums mt-0.5">{v}</div>
                        <div className="mt-1"><ScoreBar v={v as number} /></div>
                      </Card>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Coordonnées</h4>
                  <div className="text-sm space-y-1">
                    <div><span className="text-muted-foreground">Email :</span> {detail.email}</div>
                    <div><span className="text-muted-foreground">Téléphone :</span> {detail.telephone}</div>
                    <div><span className="text-muted-foreground">Candidature reçue :</span> {detail.date}</div>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Compétences</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.competences.map((c) => (
                      <span key={c} className="text-xs px-2 py-1 rounded-full bg-secondary">{c}</span>
                    ))}
                    {detail.competences.length === 0 && <span className="text-xs text-muted-foreground">Aucune compétence renseignée</span>}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">CV résumé</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{detail.resume}</p>
                </section>

                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => scheduleInterview(detail)} className="bg-primary text-primary-foreground"><Calendar className="h-4 w-4 mr-2" /> Programmer entretien</Button>
                    <Button variant="outline" onClick={() => toast.success("Message WhatsApp envoyé")}><MessageSquare className="h-4 w-4 mr-2" /> Message</Button>
                    <Button variant="outline" onClick={() => { const next = STATUTS[Math.min(STATUTS.indexOf(detail.statut) + 1, 4)]; candidatsStore.update(detail.id, { statut: next }); setDetail({ ...detail, statut: next }); toast.success(`Passé à « ${next} »`); }}>
                      <ArrowRight className="h-4 w-4 mr-2" /> Étape suivante
                    </Button>
                    <Button variant="outline" className="text-destructive border-destructive/30" onClick={() => { candidatsStore.update(detail.id, { statut: "Rejeté" }); setDetail({ ...detail, statut: "Rejeté" }); toast.success("Candidat rejeté"); }}>
                      <XCircle className="h-4 w-4 mr-2" /> Rejeter
                    </Button>
                  </div>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>


      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Supprimer ce candidat ?"
        description="Cette action est irréversible."
        destructive
        confirmLabel="Supprimer"
        onConfirm={() => { if (confirmDel) { candidatsStore.remove(confirmDel.id); toast.success("Candidat supprimé"); } setConfirmDel(null); }}
      />
    </AppShell>
  );
}
