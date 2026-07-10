import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, Linkedin, Facebook, Globe, Plus, Pencil, Trash2, Target, MapPin, Languages, Building2, Ban, Sparkles, Users, ExternalLink } from "lucide-react";
import { huntingStore, uid, useStore, POSTES, ENTREPRISES, CONSULTANTS, type HuntingMission } from "@/lib/mock-data";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SECTEURS = ["Industrie / Mines", "Télécoms", "FinTech", "Banque & Assurance", "Agroalimentaire", "Distribution / Retail", "Conseil", "BTP & Immobilier", "Santé", "Énergie", "Technologie"];
const LANGUES = ["Français", "Anglais", "Arabe", "Espagnol", "Portugais"];
const SENIORITES: HuntingMission["seniorite"][] = ["Manager", "Directeur", "C-level", "Expert"];
const URGENCES: HuntingMission["urgence"][] = ["Standard", "Prioritaire", "Critique"];
const STATUTS_H: HuntingMission["statut"][] = ["En sourcing", "En qualification", "Shortlist", "Livrée"];

const urgenceColor: Record<HuntingMission["urgence"], string> = {
  Standard: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Prioritaire: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  Critique: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 ring-1 ring-red-500/40",
};

function empty(): HuntingMission {
  return {
    id: "", poste: "", entreprise: "", seniorite: "Directeur", secteur: SECTEURS[0], localisation: "Casablanca",
    languages: ["Français"], competencesCles: [], entreprisesCibles: [], entreprisesExclues: [],
    fourchetteRemu: "", sources: { linkedin: true, facebook: false, web: true },
    motsClesLinkedin: "", urgence: "Standard", statut: "En sourcing",
    profilsIdentifies: 0, profilsQualifies: 0, consultant: CONSULTANTS[0],
    dateOuverture: new Date().toISOString().slice(0, 10), echeance: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    briefing: "",
  };
}

export function HeadHuntingPanel() {
  const rows = useStore(huntingStore);
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState("all");
  const [urgence, setUrgence] = useState("all");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [editing, setEditing] = useState<HuntingMission>(empty());
  const [compInput, setCompInput] = useState("");
  const [cibleInput, setCibleInput] = useState("");
  const [exclusInput, setExclusInput] = useState("");
  const [detail, setDetail] = useState<HuntingMission | null>(null);
  const [confirmDel, setConfirmDel] = useState<HuntingMission | null>(null);

  const filtered = useMemo(() => rows.filter((r) => (statut === "all" || r.statut === statut) && (urgence === "all" || r.urgence === urgence) && (!q || r.poste.toLowerCase().includes(q.toLowerCase()) || r.entreprise.toLowerCase().includes(q.toLowerCase()))), [rows, q, statut, urgence]);

  const openEdit = (m: HuntingMission) => {
    setEditing(m); setStep(1);
    setCompInput(m.competencesCles.join(", "));
    setCibleInput(m.entreprisesCibles.join(", "));
    setExclusInput(m.entreprisesExclues.join(", "));
    setOpen(true);
  };
  const openNew = () => {
    setEditing(empty()); setStep(1);
    setCompInput(""); setCibleInput(""); setExclusInput("");
    setOpen(true);
  };

  const save = () => {
    if (!editing.poste || !editing.entreprise) { toast.error("Poste et entreprise requis"); return; }
    const payload = {
      ...editing,
      competencesCles: compInput.split(",").map((s) => s.trim()).filter(Boolean),
      entreprisesCibles: cibleInput.split(",").map((s) => s.trim()).filter(Boolean),
      entreprisesExclues: exclusInput.split(",").map((s) => s.trim()).filter(Boolean),
    };
    if (editing.id) { huntingStore.update(editing.id, payload); toast.success("Mission mise à jour"); }
    else { huntingStore.add({ ...payload, id: uid() }); toast.success("Mission de chasse ouverte", { description: "L'agent lance la recherche sur les canaux configurés." }); }
    setOpen(false);
  };

  const launchSearch = (m: HuntingMission) => {
    huntingStore.update(m.id, { profilsIdentifies: m.profilsIdentifies + 12, statut: "En qualification" });
    toast.success("Recherche relancée", { description: "L'agent explore LinkedIn, Facebook et le web ouvert." });
  };

  return (
    <div>
      <Card className="p-4 mb-4 bg-gradient-to-br from-[color:var(--gold)]/10 to-transparent border-[color:var(--gold)]/25 flex items-center gap-3 flex-wrap">
        <div className="h-10 w-10 rounded-lg bg-[color:var(--gold)]/25 grid place-items-center"><Target className="h-5 w-5 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]" /></div>
        <div className="flex-1 min-w-[240px]">
          <div className="font-semibold">Chasse de tête — Head Hunting AI</div>
          <div className="text-xs text-muted-foreground">L'agent recherche activement les meilleurs profils sur LinkedIn, Facebook et le web ouvert selon un brief ultra-personnalisé par mission.</div>
        </div>
        <Button onClick={openNew} className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Nouvelle mission de chasse</Button>
      </Card>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher poste, entreprise..." className="pl-9" />
        </div>
        <Select value={statut} onValueChange={setStatut}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tous statuts</SelectItem>{STATUTS_H.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={urgence} onValueChange={setUrgence}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Urgence" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Toutes urgences</SelectItem>{URGENCES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((m) => {
          const conversion = m.profilsIdentifies > 0 ? Math.round((m.profilsQualifies / m.profilsIdentifies) * 100) : 0;
          return (
            <Card key={m.id} className="p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all fade-up flex flex-col cursor-pointer" onClick={() => setDetail(m)}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">{m.seniorite} · {m.secteur}</div>
                  <div className="font-semibold text-base leading-tight mt-0.5 truncate">{m.poste}</div>
                  <div className="text-sm text-muted-foreground truncate">chez {m.entreprise}</div>
                </div>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase", urgenceColor[m.urgence])}>{m.urgence}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 my-2">
                {m.sources.linkedin && <span className="text-[10px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"><Linkedin className="h-3 w-3" /> LinkedIn</span>}
                {m.sources.facebook && <span className="text-[10px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"><Facebook className="h-3 w-3" /> Facebook</span>}
                {m.sources.web && <span className="text-[10px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted"><Globe className="h-3 w-3" /> Web</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="rounded-lg bg-muted/40 p-2 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase">Identifiés</div>
                  <div className="font-bold text-lg tabular-nums">{m.profilsIdentifies}</div>
                </div>
                <div className="rounded-lg bg-[color:var(--gold)]/15 p-2 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase">Qualifiés</div>
                  <div className="font-bold text-lg tabular-nums">{m.profilsQualifies}</div>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5"><span>Taux de conversion</span><span>{conversion}%</span></div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-[color:var(--gold)]" style={{ width: `${conversion}%` }} /></div>
              </div>
              <div className="mt-auto pt-3 flex items-center justify-between text-xs">
                <StatusBadge status={m.statut} dot />
                <span className="text-muted-foreground">Échéance {m.echeance}</span>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && <Card className="p-16 text-center text-muted-foreground col-span-full"><Target className="h-10 w-10 mx-auto mb-2 opacity-40" /> Aucune mission de chasse.</Card>}
      </div>

      {/* Multi-step form */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Modifier la mission" : "Nouvelle mission de chasse de tête"}</DialogTitle>
            <div className="flex items-center gap-2 pt-2 text-xs">
              {[1, 2, 3, 4].map((s) => <span key={s} className={cn("h-1.5 flex-1 rounded-full", s <= step ? "bg-[color:var(--gold)]" : "bg-muted")} />)}
            </div>
            <div className="text-xs text-muted-foreground pt-1">Étape {step} sur 4 — {["Brief poste", "Profil recherché", "Cibles & sources", "Planning"][step - 1]}</div>
          </DialogHeader>
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1"><Label>Poste à pourvoir</Label><Input value={editing.poste} onChange={(e) => setEditing({ ...editing, poste: e.target.value })} placeholder="Ex: Directeur Financier Groupe" list="postes-list" /><datalist id="postes-list">{POSTES.map((p) => <option key={p} value={p} />)}</datalist></div>
              <div className="col-span-2 space-y-1"><Label>Entreprise cliente</Label><Input value={editing.entreprise} onChange={(e) => setEditing({ ...editing, entreprise: e.target.value })} placeholder="Ex: OCP Group" list="ent-list" /><datalist id="ent-list">{ENTREPRISES.map((e) => <option key={e} value={e} />)}</datalist></div>
              <div className="space-y-1"><Label>Séniorité</Label>
                <Select value={editing.seniorite} onValueChange={(v) => setEditing({ ...editing, seniorite: v as HuntingMission["seniorite"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SENIORITES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Secteur</Label>
                <Select value={editing.secteur} onValueChange={(v) => setEditing({ ...editing, secteur: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SECTEURS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1"><Label>Briefing / contexte de la mission</Label><Textarea rows={4} value={editing.briefing} onChange={(e) => setEditing({ ...editing, briefing: e.target.value })} placeholder="Ex: remplacement stratégique, profil confidentiel, contexte de transformation..." /></div>
            </div>
          )}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Localisation</Label><Input value={editing.localisation} onChange={(e) => setEditing({ ...editing, localisation: e.target.value })} placeholder="Casablanca, Rabat, mobilité..." /></div>
              <div className="space-y-1"><Label>Fourchette de rémunération</Label><Input value={editing.fourchetteRemu} onChange={(e) => setEditing({ ...editing, fourchetteRemu: e.target.value })} placeholder="Ex: 80-110k MAD brut/mois" /></div>
              <div className="col-span-2 space-y-1">
                <Label className="inline-flex items-center gap-1.5"><Languages className="h-3.5 w-3.5" /> Langues requises</Label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUES.map((l) => {
                    const on = editing.languages.includes(l);
                    return (
                      <button type="button" key={l} onClick={() => setEditing({ ...editing, languages: on ? editing.languages.filter((x) => x !== l) : [...editing.languages, l] })} className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors", on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>{l}</button>
                    );
                  })}
                </div>
              </div>
              <div className="col-span-2 space-y-1"><Label>Compétences clés (séparées par virgules)</Label><Textarea rows={2} value={compInput} onChange={(e) => setCompInput(e.target.value)} placeholder="Ex: IFRS, M&A, SAP FI, Reporting groupe" /></div>
              <div className="space-y-1"><Label>Urgence</Label>
                <Select value={editing.urgence} onValueChange={(v) => setEditing({ ...editing, urgence: v as HuntingMission["urgence"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{URGENCES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Statut</Label>
                <Select value={editing.statut} onValueChange={(v) => setEditing({ ...editing, statut: v as HuntingMission["statut"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUTS_H.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <div className="rounded-xl border p-3">
                <div className="text-sm font-semibold mb-2">Canaux de recherche</div>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:bg-muted/40">
                    <span className="inline-flex items-center gap-2 text-sm"><Linkedin className="h-4 w-4 text-sky-600" /> LinkedIn Recruiter <span className="text-xs text-muted-foreground">— profils cadres, chasse ciblée</span></span>
                    <Switch checked={editing.sources.linkedin} onCheckedChange={(v) => setEditing({ ...editing, sources: { ...editing.sources, linkedin: v } })} />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:bg-muted/40">
                    <span className="inline-flex items-center gap-2 text-sm"><Facebook className="h-4 w-4 text-blue-600" /> Facebook <span className="text-xs text-muted-foreground">— groupes professionnels marocains</span></span>
                    <Switch checked={editing.sources.facebook} onCheckedChange={(v) => setEditing({ ...editing, sources: { ...editing.sources, facebook: v } })} />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:bg-muted/40">
                    <span className="inline-flex items-center gap-2 text-sm"><Globe className="h-4 w-4" /> Web ouvert <span className="text-xs text-muted-foreground">— sites d'entreprise, presse, associations pro</span></span>
                    <Switch checked={editing.sources.web} onCheckedChange={(v) => setEditing({ ...editing, sources: { ...editing.sources, web: v } })} />
                  </label>
                </div>
              </div>
              <div className="space-y-1"><Label>Mots-clés Boolean LinkedIn</Label><Input value={editing.motsClesLinkedin} onChange={(e) => setEditing({ ...editing, motsClesLinkedin: e.target.value })} placeholder='Ex: (CFO OR "Directeur Financier") AND (IFRS OR "M&A") AND Maroc' /></div>
              <div className="space-y-1"><Label className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Entreprises cibles (viviers privilégiés)</Label><Textarea rows={2} value={cibleInput} onChange={(e) => setCibleInput(e.target.value)} placeholder="Ex: Managem, Cosumar, Lafarge, Holcim" /></div>
              <div className="space-y-1"><Label className="inline-flex items-center gap-1.5 text-destructive"><Ban className="h-3.5 w-3.5" /> Entreprises exclues (conflit / off-limits)</Label><Textarea rows={2} value={exclusInput} onChange={(e) => setExclusInput(e.target.value)} placeholder="Ex: Attijariwafa (client actif)" /></div>
            </div>
          )}
          {step === 4 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Date d'ouverture</Label><Input type="date" value={editing.dateOuverture} onChange={(e) => setEditing({ ...editing, dateOuverture: e.target.value })} /></div>
              <div className="space-y-1"><Label>Échéance shortlist</Label><Input type="date" value={editing.echeance} onChange={(e) => setEditing({ ...editing, echeance: e.target.value })} /></div>
              <div className="col-span-2 space-y-1"><Label>Consultant en charge</Label>
                <Select value={editing.consultant} onValueChange={(v) => setEditing({ ...editing, consultant: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONSULTANTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 rounded-lg border p-3 bg-gradient-to-br from-[color:var(--gold)]/10 to-transparent border-[color:var(--gold)]/25 text-sm">
                <div className="flex items-center gap-2 mb-1"><Sparkles className="h-4 w-4 text-[color:var(--gold)]" /><span className="font-semibold">L'agent va démarrer</span></div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Recherche croisée sur {Object.entries(editing.sources).filter(([, v]) => v).map(([k]) => k).join(", ")} — scoring automatique, notifications quotidiennes, shortlist livrée avant le <b>{editing.echeance}</b>.
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="justify-between">
            <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : setOpen(false)}>{step > 1 ? "Précédent" : "Annuler"}</Button>
            {step < 4 ? <Button onClick={() => setStep(step + 1)} className="bg-primary text-primary-foreground">Suivant</Button> : <Button onClick={save} className="bg-primary text-primary-foreground">{editing.id ? "Enregistrer" : "Lancer la mission"}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail drawer */}
      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          {detail && (
            <>
              <SheetHeader className="border-b pb-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{detail.seniorite} · {detail.secteur}</div>
                <SheetTitle className="text-xl">{detail.poste}</SheetTitle>
                <div className="text-sm text-muted-foreground">Mission pour <b>{detail.entreprise}</b></div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <StatusBadge status={detail.statut} dot />
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase", urgenceColor[detail.urgence])}>{detail.urgence}</span>
                </div>
              </SheetHeader>
              <div className="py-4 space-y-5">
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Briefing</h4>
                  <p className="text-sm leading-relaxed">{detail.briefing || <span className="italic text-muted-foreground">Aucun briefing.</span>}</p>
                </section>
                <section className="grid grid-cols-2 gap-2 text-sm">
                  <div><div className="text-xs text-muted-foreground">Localisation</div><div>{detail.localisation}</div></div>
                  <div><div className="text-xs text-muted-foreground">Rémunération</div><div>{detail.fourchetteRemu}</div></div>
                  <div><div className="text-xs text-muted-foreground">Langues</div><div>{detail.languages.join(", ")}</div></div>
                  <div><div className="text-xs text-muted-foreground">Consultant</div><div>{detail.consultant}</div></div>
                  <div><div className="text-xs text-muted-foreground">Ouverte le</div><div>{detail.dateOuverture}</div></div>
                  <div><div className="text-xs text-muted-foreground">Échéance</div><div>{detail.echeance}</div></div>
                </section>
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Compétences clés</h4>
                  <div className="flex flex-wrap gap-1.5">{detail.competencesCles.map((c) => <span key={c} className="text-xs px-2 py-1 rounded-full bg-secondary">{c}</span>)}</div>
                </section>
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Sources activées</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.sources.linkedin && <span className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"><Linkedin className="h-3 w-3" /> LinkedIn</span>}
                    {detail.sources.facebook && <span className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"><Facebook className="h-3 w-3" /> Facebook</span>}
                    {detail.sources.web && <span className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted"><Globe className="h-3 w-3" /> Web</span>}
                  </div>
                  {detail.motsClesLinkedin && <div className="mt-2 text-xs bg-muted/40 rounded p-2 font-mono">{detail.motsClesLinkedin}</div>}
                </section>
                <section className="grid grid-cols-2 gap-2">
                  <div><h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Cibles</h4><div className="text-xs">{detail.entreprisesCibles.join(", ") || "—"}</div></div>
                  <div><h4 className="text-xs font-semibold uppercase text-destructive mb-1">Exclues</h4><div className="text-xs">{detail.entreprisesExclues.join(", ") || "—"}</div></div>
                </section>
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Avancement</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Card className="p-3 text-center"><div className="text-xs text-muted-foreground">Profils identifiés</div><div className="text-2xl font-bold">{detail.profilsIdentifies}</div></Card>
                    <Card className="p-3 text-center bg-[color:var(--gold)]/10"><div className="text-xs text-muted-foreground">Qualifiés</div><div className="text-2xl font-bold text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]">{detail.profilsQualifies}</div></Card>
                  </div>
                </section>
                <div className="flex gap-2">
                  <Button onClick={() => launchSearch(detail)} className="flex-1 bg-primary text-primary-foreground"><Sparkles className="h-4 w-4 mr-2" /> Relancer la recherche IA</Button>
                  <Button variant="outline" onClick={() => toast.info("Shortlist exportée", { description: "Envoi par email au consultant." })}><ExternalLink className="h-4 w-4 mr-2" /> Voir profils</Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => openEdit(detail)}><Pencil className="h-4 w-4 mr-2" /> Modifier</Button>
                  <Button variant="outline" className="text-destructive border-destructive/30" onClick={() => setConfirmDel(detail)}><Trash2 className="h-4 w-4 mr-2" /> Supprimer</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)} title="Supprimer cette mission ?" destructive confirmLabel="Supprimer" onConfirm={() => { if (confirmDel) { huntingStore.remove(confirmDel.id); toast.success("Mission supprimée"); setDetail(null); } setConfirmDel(null); }} />
    </div>
  );
}
