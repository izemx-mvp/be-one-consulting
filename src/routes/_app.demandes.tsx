import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DataTable, highlight, type FilterChip } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash2, ArrowRightCircle, Globe, MessageCircle, Mail, Send } from "lucide-react";
import { demandesStore, candidatsStore, uid, useStore, type Demande, type DemandeType } from "@/lib/mock-data";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/demandes")({
  head: () => ({ meta: [{ title: "Demandes Clients — Be One Consulting" }] }),
  component: Page,
});

const TYPES: DemandeType[] = ["Conseil", "Recrutement", "Formation", "Enquête", "Assessment", "Bilan de compétences"];
const STATUTS: Demande["statut"][] = ["Nouveau", "En cours de qualification", "Redirigé", "Traité"];
const CANAUX: Demande["canal"][] = ["Site web", "WhatsApp", "Email"];

function empty(): Demande {
  return {
    id: "", nom: "", entreprise: "", type: "Conseil", canal: "Site web",
    date: new Date().toISOString().slice(0, 10), statut: "Nouveau", priorite: "Moyenne",
    email: "", telephone: "", message: "", chatLog: [], notes: "",
  };
}

const canalIcon = { "Site web": Globe, "WhatsApp": MessageCircle, "Email": Mail };
const typeTone: Record<DemandeType, string> = {
  "Conseil": "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  "Recrutement": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  "Formation": "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  "Enquête": "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
  "Assessment": "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
  "Bilan de compétences": "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-200",
};

function Page() {
  const rows = useStore(demandesStore);
  const [type, setType] = useState("all");
  const [statut, setStatut] = useState("all");
  const [canal, setCanal] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Demande>(empty());
  const [detail, setDetail] = useState<Demande | null>(null);
  const [confirmDel, setConfirmDel] = useState<Demande | null>(null);

  const filtered = rows.filter((r) =>
    (type === "all" || r.type === type) &&
    (statut === "all" || r.statut === statut) &&
    (canal === "all" || r.canal === canal),
  );

  const chips: FilterChip[] = [];
  if (type !== "all") chips.push({ label: `Type : ${type}`, onRemove: () => setType("all") });
  if (statut !== "all") chips.push({ label: `Statut : ${statut}`, onRemove: () => setStatut("all") });
  if (canal !== "all") chips.push({ label: `Canal : ${canal}`, onRemove: () => setCanal("all") });

  const save = () => {
    if (!editing.nom || !editing.entreprise) { toast.error("Nom et entreprise requis"); return; }
    if (editing.id) { demandesStore.update(editing.id, editing); toast.success("Demande mise à jour"); }
    else { demandesStore.add({ ...editing, id: uid() }); toast.success("Demande ajoutée"); }
    setOpen(false);
  };

  const rediriger = (d: Demande) => {
    demandesStore.update(d.id, { statut: "Redirigé" });
    candidatsStore.add({
      id: uid(),
      nom: d.nom, poste: d.posteRecherche ?? "À qualifier",
      source: "LinkedIn", score: 55, scoreAdequation: 55, scoreExperience: 55, scoreSoftSkills: 55,
      experience: 3, competences: [], statut: "Nouveau",
      email: d.email, telephone: d.telephone, date: new Date().toISOString().slice(0, 10),
      resume: `Redirigé depuis la demande client ${d.entreprise}.`,
    });
    toast.success("Demande redirigée vers Recrutement", { description: "Un nouveau candidat a été créé." });
    setDetail(null);
  };

  const searchTerm = ""; // handled by DataTable internally; highlight applied via wrapper below

  return (
    <AppShell title="Demandes Clients" subtitle="Point d'entrée unique — qualification et routage des demandes entrantes">
      <DataTable<Demande>
        data={filtered}
        searchKeys={["nom", "entreprise", "email", "message"]}
        searchPlaceholder="Rechercher par nom, entreprise, message..."
        addLabel="Nouvelle demande"
        onAdd={() => { setEditing(empty()); setOpen(true); }}
        onRowClick={(r) => setDetail(r)}
        filterChips={chips}
        filters={
          <>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={canal} onValueChange={setCanal}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Canal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous canaux</SelectItem>
                {CANAUX.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        }
        columns={[
          { header: "Contact", sortKey: "nom", cell: (r) => (
            <div>
              <div className="font-medium">{highlight(r.nom, searchTerm)}</div>
              <div className="text-xs text-muted-foreground">{r.email}</div>
            </div>
          ) },
          { header: "Entreprise", sortKey: "entreprise", cell: (r) => <span className="text-sm">{r.entreprise}</span> },
          { header: "Type", cell: (r) => (
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", typeTone[r.type])}>{r.type}</span>
          ) },
          { header: "Canal", cell: (r) => {
            const Icon = canalIcon[r.canal];
            return <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {r.canal}</span>;
          } },
          { header: "Date", sortKey: "date", cell: (r) => <span className="text-sm text-muted-foreground">{r.date}</span> },
          { header: "Priorité", cell: (r) => (
            <span className="inline-flex items-center gap-1.5 text-xs">
              <span className={cn("h-2 w-2 rounded-full", r.priorite === "Haute" && "bg-red-500", r.priorite === "Moyenne" && "bg-amber-500", r.priorite === "Basse" && "bg-muted-foreground/50")} />
              {r.priorite}
            </span>
          ) },
          { header: "Statut", cell: (r) => <StatusBadge status={r.statut} dot /> },
        ]}
        rowActions={(r) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDetail(r)}><Eye className="h-4 w-4 mr-2" /> Voir détails</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4 mr-2" /> Modifier</DropdownMenuItem>
              {r.type === "Recrutement" && r.statut !== "Redirigé" && (
                <DropdownMenuItem onClick={() => rediriger(r)}><ArrowRightCircle className="h-4 w-4 mr-2" /> Rediriger vers Recrutement</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDel(r)}><Trash2 className="h-4 w-4 mr-2" /> Supprimer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      {/* Add/Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing.id ? "Modifier la demande" : "Nouvelle demande"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label>Nom du contact</Label><Input value={editing.nom} onChange={(e) => setEditing({ ...editing, nom: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Entreprise</Label><Input value={editing.entreprise} onChange={(e) => setEditing({ ...editing, entreprise: e.target.value })} /></div>
            <div className="space-y-1"><Label>Email</Label><Input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
            <div className="space-y-1"><Label>Téléphone</Label><Input value={editing.telephone} onChange={(e) => setEditing({ ...editing, telephone: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as DemandeType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Canal</Label>
              <Select value={editing.canal} onValueChange={(v) => setEditing({ ...editing, canal: v as Demande["canal"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CANAUX.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Statut</Label>
              <Select value={editing.statut} onValueChange={(v) => setEditing({ ...editing, statut: v as Demande["statut"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Priorité</Label>
              <Select value={editing.priorite} onValueChange={(v) => setEditing({ ...editing, priorite: v as Demande["priorite"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Haute">Haute</SelectItem><SelectItem value="Moyenne">Moyenne</SelectItem><SelectItem value="Basse">Basse</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1"><Label>Message</Label><Textarea rows={3} value={editing.message} onChange={(e) => setEditing({ ...editing, message: e.target.value })} /></div>
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
                <SheetTitle className="text-xl">{detail.nom}</SheetTitle>
                <div className="text-sm text-muted-foreground">{detail.entreprise} · {detail.email}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", typeTone[detail.type])}>{detail.type}</span>
                  <StatusBadge status={detail.statut} dot />
                  <StatusBadge status={detail.priorite} />
                </div>
              </SheetHeader>
              <div className="py-4 space-y-6">
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Coordonnées</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Téléphone :</span> {detail.telephone}</div>
                    <div><span className="text-muted-foreground">Canal :</span> {detail.canal}</div>
                    <div><span className="text-muted-foreground">Date :</span> {detail.date}</div>
                    {detail.posteRecherche && <div><span className="text-muted-foreground">Poste :</span> {detail.posteRecherche}</div>}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Qualification</h4>
                  <div className="rounded-lg border p-3 text-sm space-y-2 bg-muted/30">
                    <div><span className="text-muted-foreground">Budget indicatif :</span> {detail.budget}</div>
                    <div><span className="text-muted-foreground">Délai souhaité :</span> {detail.delai}</div>
                    <div><span className="text-muted-foreground">Message initial :</span></div>
                    <div className="italic">« {detail.message} »</div>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Historique de qualification (agent IA)</h4>
                  <div className="space-y-2">
                    {detail.chatLog.map((m, i) => (
                      <div key={i} className={cn("flex", m.from === "agent" ? "justify-start" : "justify-end")}>
                        <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", m.from === "agent" ? "bg-primary text-primary-foreground rounded-bl-none" : "bg-muted rounded-br-none")}>
                          <div>{m.text}</div>
                          <div className={cn("text-[10px] mt-1", m.from === "agent" ? "text-primary-foreground/60" : "text-muted-foreground")}>{m.at}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Actions</h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Statut</Label>
                      <Select value={detail.statut} onValueChange={(v) => { demandesStore.update(detail.id, { statut: v as Demande["statut"] }); setDetail({ ...detail, statut: v as Demande["statut"] }); toast.success("Statut mis à jour"); }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Notes internes</Label>
                      <Textarea rows={3} value={detail.notes ?? ""} onChange={(e) => { const notes = e.target.value; setDetail({ ...detail, notes }); demandesStore.update(detail.id, { notes }); }} />
                    </div>
                    {detail.type === "Recrutement" && detail.statut !== "Redirigé" && (
                      <Button onClick={() => rediriger(detail)} className="w-full bg-primary text-primary-foreground">
                        <ArrowRightCircle className="h-4 w-4 mr-2" /> Rediriger vers Recrutement
                      </Button>
                    )}
                    <Button variant="outline" className="w-full" onClick={() => toast.success("Réponse WhatsApp envoyée")}>
                      <Send className="h-4 w-4 mr-2" /> Répondre au client
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
        title="Supprimer cette demande ?"
        description="Cette action est irréversible."
        destructive
        confirmLabel="Supprimer"
        onConfirm={() => { if (confirmDel) { demandesStore.remove(confirmDel.id); toast.success("Demande supprimée"); } setConfirmDel(null); }}
      />
    </AppShell>
  );
}
