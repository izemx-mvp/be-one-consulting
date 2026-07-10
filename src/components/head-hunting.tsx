import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, Linkedin, Facebook, Globe, Plus, Pencil, Trash2, Target, MapPin, Languages, Building2, Ban, Sparkles, ExternalLink, GraduationCap, Briefcase, Users2, ShieldCheck, Award, ClipboardList, Clock, Calendar as CalendarIcon, Info, Instagram, Mail, Phone, Star } from "lucide-react";
import { huntingStore, candidatsStore, uid, useStore, POSTES, ENTREPRISES, CONSULTANTS, type HuntingMission, type Candidat } from "@/lib/mock-data";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SECTEURS = ["Industrie / Mines", "Télécoms", "FinTech", "Banque & Assurance", "Agroalimentaire", "Distribution / Retail", "Conseil", "BTP & Immobilier", "Santé", "Énergie", "Technologie", "Automobile", "Luxe / Cosmétique", "Éducation", "ONG / International"];
const LANGUES = ["Français", "Anglais", "Arabe", "Espagnol", "Portugais", "Allemand", "Italien"];
const SENIORITES: HuntingMission["seniorite"][] = ["Manager", "Directeur", "C-level", "Expert"];
const URGENCES: HuntingMission["urgence"][] = ["Standard", "Prioritaire", "Critique"];
const STATUTS_H: HuntingMission["statut"][] = ["En sourcing", "En qualification", "Shortlist", "Livrée"];
const MOBILITES: NonNullable<HuntingMission["mobilite"]>[] = ["Aucune", "Nationale", "Internationale", "Négociable"];
const DISCRETIONS: NonNullable<HuntingMission["discretion"]>[] = ["Publique", "Confidentielle", "Ultra-confidentielle"];
const AVANTAGES = ["Voiture de fonction", "Assurance santé premium", "Bonus performance", "Stock-options / BSPCE", "Télétravail flexible", "Formation continue", "13ème mois", "Retraite complémentaire", "Frais de représentation"];
const FORMATIONS = ["Bac+3", "Bac+5", "Grande École Ingénieur", "Grande École Commerce (HEC, ESSEC…)", "ISCAE / ENCG", "MBA", "Doctorat", "Autre"];

const urgenceColor: Record<HuntingMission["urgence"], string> = {
  Standard: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Prioritaire: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  Critique: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 ring-1 ring-red-500/40",
};
const discretionColor: Record<NonNullable<HuntingMission["discretion"]>, string> = {
  Publique: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  Confidentielle: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  "Ultra-confidentielle": "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};

// Deterministic pseudo-random pick of candidates for a mission — mixes matches by poste keywords + a seeded sample.
function candidatesForMission(mission: HuntingMission, all: Candidat[]): Candidat[] {
  const kw = mission.poste.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const scored = all.map((c) => {
    const t = (c.poste + " " + c.competences.join(" ")).toLowerCase();
    const kwHits = kw.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0);
    // deterministic jitter per (mission,candidat)
    let h = 0; const s = mission.id + c.id;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    const jitter = (h % 20) - 10; // -10..+9
    return { c, rank: kwHits * 100 + c.score + jitter };
  });
  scored.sort((a, b) => b.rank - a.rank);
  const n = Math.max(6, Math.min(10, mission.profilsQualifies || 8));
  return scored.slice(0, n).map((x) => x.c);
}

const sourceIcon: Record<Candidat["source"], React.ReactNode> = {
  LinkedIn: <Linkedin className="h-3 w-3" />,
  Facebook: <Facebook className="h-3 w-3" />,
  Instagram: <Instagram className="h-3 w-3" />,
};

function empty(): HuntingMission {
  return {
    id: "", poste: "", entreprise: "", seniorite: "Directeur", secteur: SECTEURS[0], localisation: "Casablanca",
    languages: ["Français"], competencesCles: [], entreprisesCibles: [], entreprisesExclues: [],
    fourchetteRemu: "", sources: { linkedin: true, facebook: false, web: true, rekrute: false, indeed: false, reseau: true },
    motsClesLinkedin: "", urgence: "Standard", statut: "En sourcing",
    profilsIdentifies: 0, profilsQualifies: 0, consultant: CONSULTANTS[0],
    dateOuverture: new Date().toISOString().slice(0, 10), echeance: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    briefing: "",
    formation: "", ageMin: undefined, ageMax: undefined, experienceMin: 5, mobilite: "Nationale",
    disponibilite: "3 mois", packageDetails: "", avantages: [], discretion: "Confidentielle",
    livrablesAttendus: "Shortlist de 3-5 candidats avec rapport détaillé", criteresExclusion: "", notesInternes: "",
  };
}

const STEP_LABELS = ["Brief poste", "Profil recherché", "Package & mobilité", "Cibles & sources", "Planning & discrétion"];

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
    setEditing({ ...empty(), ...m }); setStep(1);
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

  const toggleAvantage = (a: string) => {
    const cur = editing.avantages ?? [];
    setEditing({ ...editing, avantages: cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a] });
  };

  return (
    <div>
      <Card className="p-4 mb-4 bg-gradient-to-br from-[color:var(--gold)]/10 via-primary/5 to-transparent border-[color:var(--gold)]/25 flex items-center gap-3 flex-wrap">
        <div className="h-11 w-11 rounded-xl bg-[color:var(--gold)]/25 grid place-items-center ring-1 ring-[color:var(--gold)]/30"><Target className="h-5 w-5 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]" /></div>
        <div className="flex-1 min-w-[240px]">
          <div className="font-semibold">Chasse de tête — Head Hunting AI</div>
          <div className="text-xs text-muted-foreground">L'agent recherche activement les meilleurs profils sur LinkedIn, Facebook, Rekrute, Indeed et le web ouvert selon un brief ultra-personnalisé par mission.</div>
        </div>
        <Button onClick={openNew} className="btn-premium hover:[&]:btn-premium-hover"><Plus className="h-4 w-4 mr-1" /> Nouvelle mission de chasse</Button>
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
                {m.sources.rekrute && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">Rekrute</span>}
                {m.sources.indeed && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">Indeed</span>}
                {m.sources.reseau && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[color:var(--gold)]/20 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]">Réseau</span>}
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

      {/* Multi-step flexible form */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0">
          <div className="bg-gradient-to-r from-primary via-primary/90 to-[color:var(--gold)]/70 text-primary-foreground px-6 py-5 border-b">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5" /> {editing.id ? "Modifier la mission" : "Nouvelle mission de chasse de tête"}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-1.5 pt-3">
              {STEP_LABELS.map((_, idx) => <span key={idx} className={cn("h-1.5 flex-1 rounded-full transition-colors", idx + 1 <= step ? "bg-[color:var(--gold)]" : "bg-white/25")} />)}
            </div>
            <div className="text-xs text-primary-foreground/80 pt-2 font-medium">Étape {step} / {STEP_LABELS.length} — {STEP_LABELS[step - 1]}</div>
          </div>
          <div className="px-6 py-5">
            {step === 1 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5"><Label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Briefcase className="h-3.5 w-3.5" /> Poste à pourvoir *</Label><Input value={editing.poste} onChange={(e) => setEditing({ ...editing, poste: e.target.value })} placeholder="Ex: Directeur Financier Groupe" list="postes-list" className="h-11" /><datalist id="postes-list">{POSTES.map((p) => <option key={p} value={p} />)}</datalist></div>
                <div className="col-span-2 space-y-1.5"><Label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Building2 className="h-3.5 w-3.5" /> Entreprise cliente *</Label><Input value={editing.entreprise} onChange={(e) => setEditing({ ...editing, entreprise: e.target.value })} placeholder="Ex: OCP Group" list="ent-list" className="h-11" /><datalist id="ent-list">{ENTREPRISES.map((e) => <option key={e} value={e} />)}</datalist></div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Séniorité</Label>
                  <Select value={editing.seniorite} onValueChange={(v) => setEditing({ ...editing, seniorite: v as HuntingMission["seniorite"] })}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>{SENIORITES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Secteur</Label>
                  <Select value={editing.secteur} onValueChange={(v) => setEditing({ ...editing, secteur: v })}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>{SECTEURS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5"><Label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Info className="h-3.5 w-3.5" /> Contexte de la mission</Label><Textarea rows={4} value={editing.briefing} onChange={(e) => setEditing({ ...editing, briefing: e.target.value })} placeholder="Ex: remplacement stratégique, création de poste, transformation en cours, contexte politique interne..." /></div>
                <div className="col-span-2 space-y-1.5"><Label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><ClipboardList className="h-3.5 w-3.5" /> Livrables attendus</Label><Textarea rows={2} value={editing.livrablesAttendus} onChange={(e) => setEditing({ ...editing, livrablesAttendus: e.target.value })} placeholder="Ex: Shortlist de 5 profils, assessment complet, rapport de références" /></div>
              </div>
            )}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><GraduationCap className="h-3.5 w-3.5" /> Formation minimum</Label>
                  <Select value={editing.formation || ""} onValueChange={(v) => setEditing({ ...editing, formation: v })}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>{FORMATIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expérience min. (années)</Label><Input type="number" min={0} value={editing.experienceMin ?? ""} onChange={(e) => setEditing({ ...editing, experienceMin: e.target.value ? Number(e.target.value) : undefined })} className="h-11" placeholder="Ex: 8" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Âge min.</Label><Input type="number" min={18} max={70} value={editing.ageMin ?? ""} onChange={(e) => setEditing({ ...editing, ageMin: e.target.value ? Number(e.target.value) : undefined })} className="h-11" placeholder="—" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Âge max.</Label><Input type="number" min={18} max={70} value={editing.ageMax ?? ""} onChange={(e) => setEditing({ ...editing, ageMax: e.target.value ? Number(e.target.value) : undefined })} className="h-11" placeholder="—" /></div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Languages className="h-3.5 w-3.5" /> Langues requises</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {LANGUES.map((l) => {
                      const on = editing.languages.includes(l);
                      return <button type="button" key={l} onClick={() => setEditing({ ...editing, languages: on ? editing.languages.filter((x) => x !== l) : [...editing.languages, l] })} className={cn("text-xs px-3 py-1.5 rounded-full border transition-all", on ? "bg-primary text-primary-foreground border-primary shadow-sm" : "hover:bg-muted border-border")}>{l}</button>;
                    })}
                  </div>
                </div>
                <div className="col-span-2 space-y-1.5"><Label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Award className="h-3.5 w-3.5" /> Compétences clés (séparées par virgules)</Label><Textarea rows={2} value={compInput} onChange={(e) => setCompInput(e.target.value)} placeholder="Ex: IFRS, M&A, SAP FI, Reporting groupe, Management d'équipe 20+" /></div>
                <div className="col-span-2 space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Critères d'exclusion (soft)</Label><Textarea rows={2} value={editing.criteresExclusion || ""} onChange={(e) => setEditing({ ...editing, criteresExclusion: e.target.value })} placeholder="Ex: pas de profil ayant travaillé en cabinet Big 4 uniquement, éviter les profils multi-turnover" /></div>
              </div>
            )}
            {step === 3 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fourchette de rémunération</Label><Input value={editing.fourchetteRemu} onChange={(e) => setEditing({ ...editing, fourchetteRemu: e.target.value })} placeholder="Ex: 80-110k MAD brut/mois + bonus 25%" className="h-11" /></div>
                <div className="col-span-2 space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Détails package</Label><Textarea rows={2} value={editing.packageDetails || ""} onChange={(e) => setEditing({ ...editing, packageDetails: e.target.value })} placeholder="Ex: bonus 20-30% variable, prime signature 100k MAD, participation résultats" /></div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avantages proposés</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVANTAGES.map((a) => {
                      const on = (editing.avantages ?? []).includes(a);
                      return <button type="button" key={a} onClick={() => toggleAvantage(a)} className={cn("text-xs px-3 py-1.5 rounded-full border transition-all", on ? "bg-[color:var(--gold)]/25 border-[color:var(--gold)]/50 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]" : "hover:bg-muted border-border")}>{a}</button>;
                    })}
                  </div>
                </div>
                <div className="space-y-1.5"><Label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Localisation</Label><Input value={editing.localisation} onChange={(e) => setEditing({ ...editing, localisation: e.target.value })} placeholder="Casablanca, Rabat..." className="h-11" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mobilité</Label>
                  <Select value={editing.mobilite || "Nationale"} onValueChange={(v) => setEditing({ ...editing, mobilite: v as HuntingMission["mobilite"] })}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>{MOBILITES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Disponibilité souhaitée</Label><Input value={editing.disponibilite || ""} onChange={(e) => setEditing({ ...editing, disponibilite: e.target.value })} placeholder="Ex: immédiate, préavis 3 mois" className="h-11" /></div>
              </div>
            )}
            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded-xl border p-4 bg-gradient-to-br from-muted/30 to-transparent">
                  <div className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Users2 className="h-4 w-4" /> Canaux de recherche activés</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { k: "linkedin", label: "LinkedIn Recruiter", desc: "profils cadres, chasse ciblée", icon: Linkedin, color: "text-sky-600" },
                      { k: "facebook", label: "Facebook", desc: "groupes professionnels marocains", icon: Facebook, color: "text-blue-600" },
                      { k: "web", label: "Web ouvert", desc: "sites d'entreprise, presse, associations", icon: Globe, color: "" },
                      { k: "rekrute", label: "Rekrute.com", desc: "site emploi #1 au Maroc", icon: Briefcase, color: "text-violet-600" },
                      { k: "indeed", label: "Indeed", desc: "base internationale", icon: Briefcase, color: "text-indigo-600" },
                      { k: "reseau", label: "Réseau propriétaire", desc: "CVthèque + recommandations Be One", icon: Users2, color: "text-[color:var(--gold)]" },
                    ].map(({ k, label, desc, icon: Icon, color }) => (
                      <label key={k} className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/40 transition-colors">
                        <span className="inline-flex items-center gap-2 text-sm"><Icon className={cn("h-4 w-4", color)} /> <span><span className="font-medium">{label}</span> <span className="text-xs text-muted-foreground block">{desc}</span></span></span>
                        <Switch checked={!!(editing.sources as Record<string, boolean>)[k]} onCheckedChange={(v) => setEditing({ ...editing, sources: { ...editing.sources, [k]: v } })} />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mots-clés Boolean LinkedIn</Label><Input value={editing.motsClesLinkedin} onChange={(e) => setEditing({ ...editing, motsClesLinkedin: e.target.value })} placeholder='Ex: (CFO OR "Directeur Financier") AND (IFRS OR "M&A") AND Maroc' className="font-mono text-xs h-11" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Building2 className="h-3.5 w-3.5" /> Entreprises cibles</Label><Textarea rows={3} value={cibleInput} onChange={(e) => setCibleInput(e.target.value)} placeholder="Ex: Managem, Cosumar, Lafarge, Holcim" /></div>
                  <div className="space-y-1.5"><Label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-destructive"><Ban className="h-3.5 w-3.5" /> Entreprises exclues (off-limits)</Label><Textarea rows={3} value={exclusInput} onChange={(e) => setExclusInput(e.target.value)} placeholder="Ex: Attijariwafa (client actif)" /></div>
                </div>
              </div>
            )}
            {step === 5 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><CalendarIcon className="h-3.5 w-3.5" /> Date d'ouverture</Label><Input type="date" value={editing.dateOuverture} onChange={(e) => setEditing({ ...editing, dateOuverture: e.target.value })} className="h-11" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Échéance shortlist</Label><Input type="date" value={editing.echeance} onChange={(e) => setEditing({ ...editing, echeance: e.target.value })} className="h-11" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Consultant en charge</Label>
                  <Select value={editing.consultant} onValueChange={(v) => setEditing({ ...editing, consultant: v })}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>{CONSULTANTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Urgence</Label>
                  <Select value={editing.urgence} onValueChange={(v) => setEditing({ ...editing, urgence: v as HuntingMission["urgence"] })}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>{URGENCES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5"><Label className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Niveau de discrétion</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {DISCRETIONS.map((d) => (
                      <button type="button" key={d} onClick={() => setEditing({ ...editing, discretion: d })} className={cn("text-xs px-3 py-2 rounded-lg border transition-all font-medium", editing.discretion === d ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "hover:bg-muted")}>{d}</button>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Statut initial</Label>
                  <Select value={editing.statut} onValueChange={(v) => setEditing({ ...editing, statut: v as HuntingMission["statut"] })}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUTS_H.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes internes (privées)</Label><Textarea rows={3} value={editing.notesInternes || ""} onChange={(e) => setEditing({ ...editing, notesInternes: e.target.value })} placeholder="Notes visibles uniquement par l'équipe Be One..." /></div>
                <div className="col-span-2 rounded-xl border p-4 bg-gradient-to-br from-[color:var(--gold)]/10 to-transparent border-[color:var(--gold)]/25 text-sm">
                  <div className="flex items-center gap-2 mb-1"><Sparkles className="h-4 w-4 text-[color:var(--gold)]" /><span className="font-semibold">L'agent IA est prêt</span></div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    Recherche croisée sur {Object.entries(editing.sources).filter(([, v]) => v).map(([k]) => k).join(", ") || "aucun canal"} — scoring automatique, notifications quotidiennes, shortlist livrée avant le <b>{editing.echeance}</b>.
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-row justify-between sm:justify-between">
            <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : setOpen(false)}>{step > 1 ? "Précédent" : "Annuler"}</Button>
            {step < STEP_LABELS.length ? <Button onClick={() => setStep(step + 1)} className="btn-premium hover:[&]:btn-premium-hover">Suivant</Button> : <Button onClick={save} className="btn-premium hover:[&]:btn-premium-hover">{editing.id ? "Enregistrer" : "Lancer la mission"}</Button>}
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
                  {detail.discretion && <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase", discretionColor[detail.discretion])}>{detail.discretion}</span>}
                </div>
              </SheetHeader>
              <div className="py-4 space-y-5">
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Briefing</h4>
                  <p className="text-sm leading-relaxed">{detail.briefing || <span className="italic text-muted-foreground">Aucun briefing.</span>}</p>
                </section>
                <section className="grid grid-cols-2 gap-2 text-sm">
                  <div><div className="text-xs text-muted-foreground">Localisation</div><div>{detail.localisation}</div></div>
                  <div><div className="text-xs text-muted-foreground">Mobilité</div><div>{detail.mobilite || "—"}</div></div>
                  <div><div className="text-xs text-muted-foreground">Rémunération</div><div>{detail.fourchetteRemu || "—"}</div></div>
                  <div><div className="text-xs text-muted-foreground">Disponibilité</div><div>{detail.disponibilite || "—"}</div></div>
                  <div><div className="text-xs text-muted-foreground">Formation</div><div>{detail.formation || "—"}</div></div>
                  <div><div className="text-xs text-muted-foreground">Expérience min.</div><div>{detail.experienceMin ? `${detail.experienceMin} ans` : "—"}</div></div>
                  <div><div className="text-xs text-muted-foreground">Langues</div><div>{detail.languages.join(", ")}</div></div>
                  <div><div className="text-xs text-muted-foreground">Consultant</div><div>{detail.consultant}</div></div>
                  <div><div className="text-xs text-muted-foreground">Ouverte le</div><div>{detail.dateOuverture}</div></div>
                  <div><div className="text-xs text-muted-foreground">Échéance</div><div>{detail.echeance}</div></div>
                </section>
                {(detail.avantages && detail.avantages.length > 0) && (
                  <section>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Avantages package</h4>
                    <div className="flex flex-wrap gap-1.5">{detail.avantages.map((a) => <span key={a} className="text-xs px-2 py-1 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)] border border-[color:var(--gold)]/30">{a}</span>)}</div>
                  </section>
                )}
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Compétences clés</h4>
                  <div className="flex flex-wrap gap-1.5">{detail.competencesCles.map((c) => <span key={c} className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{c}</span>)}</div>
                </section>
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Sources activées</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.sources.linkedin && <span className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"><Linkedin className="h-3 w-3" /> LinkedIn</span>}
                    {detail.sources.facebook && <span className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"><Facebook className="h-3 w-3" /> Facebook</span>}
                    {detail.sources.web && <span className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted"><Globe className="h-3 w-3" /> Web</span>}
                    {detail.sources.rekrute && <span className="text-xs px-2 py-1 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">Rekrute</span>}
                    {detail.sources.indeed && <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">Indeed</span>}
                    {detail.sources.reseau && <span className="text-xs px-2 py-1 rounded-full bg-[color:var(--gold)]/20 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]">Réseau Be One</span>}
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
                  <Button onClick={() => launchSearch(detail)} className="flex-1 btn-premium hover:[&]:btn-premium-hover"><Sparkles className="h-4 w-4 mr-2" /> Relancer la recherche IA</Button>
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
