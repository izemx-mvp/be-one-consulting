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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MoreHorizontal, Eye, Pencil, Trash2, Send, ChevronLeft, ChevronRight, LayoutList, CalendarDays, Sparkles, Wand2, Plus, X } from "lucide-react";
import { enquetesStore, ENTREPRISES, uid, useStore, type Enquete, type EnqueteDest } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MiniCalendar, type CalendarEvent } from "@/components/mini-calendar";
import { toast } from "sonner";
import { CountUp } from "@/components/count-up";

export const Route = createFileRoute("/_app/enquetes")({
  head: () => ({ meta: [{ title: "Enquêtes AI — Be One Consulting" }] }),
  component: Page,
});

const TYPES: Enquete["type"][] = ["Enquête satisfaction", "Étude de marché", "Audit organisationnel"];
const STATUTS: Enquete["statut"][] = ["Brouillon", "En cours", "Relance en cours", "Terminé"];

const QUESTIONNAIRES_TYPES = [
  { id: "nps", nom: "Satisfaction NPS", questions: 10, desc: "Score de recommandation + verbatims" },
  { id: "engagement", nom: "Baromètre engagement collaborateur", questions: 22, desc: "Motivation, environnement, management" },
  { id: "b2b", nom: "Étude marché B2B", questions: 15, desc: "Concurrence, besoins, freins d'achat" },
  { id: "audit", nom: "Audit organisationnel", questions: 25, desc: "Structure, process, culture" },
];

function empty(): Enquete {
  return {
    id: "", nom: "", client: "", type: "Enquête satisfaction",
    envoyees: 100, reponses: 0, dateLancement: new Date().toISOString().slice(0, 10),
    dateCloture: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    statut: "Brouillon", destinataires: [], relances: [],
  };
}

function Page() {
  const rows = useStore(enquetesStore);
  const [type, setType] = useState("all");
  const [statut, setStatut] = useState("all");
  const [client, setClient] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Enquete>(empty());
  const [step, setStep] = useState(1);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [planTime, setPlanTime] = useState("09:00");
  const [selectedTemplate, setSelectedTemplate] = useState("nps");
  const [detail, setDetail] = useState<Enquete | null>(null);
  const [destPage, setDestPage] = useState(1);
  const [confirmDel, setConfirmDel] = useState<Enquete | null>(null);

  const filtered = rows.filter((r) =>
    (type === "all" || r.type === type) &&
    (statut === "all" || r.statut === statut) &&
    (client === "all" || r.client === client),
  );

  const chips: FilterChip[] = [];
  if (type !== "all") chips.push({ label: `Type : ${type}`, onRemove: () => setType("all") });
  if (statut !== "all") chips.push({ label: `Statut : ${statut}`, onRemove: () => setStatut("all") });
  if (client !== "all") chips.push({ label: `Client : ${client}`, onRemove: () => setClient("all") });

  const save = () => {
    if (!editing.nom || !editing.client) { toast.error("Nom et client requis"); return; }
    if (editing.id) { enquetesStore.update(editing.id, editing); toast.success("Enquête mise à jour"); }
    else { enquetesStore.add({ ...editing, id: uid() }); toast.success("Enquête planifiée", { description: `Envoi programmé le ${editing.dateLancement} à ${planTime}` }); }
    setOpen(false); setStep(1); setAiQuestions([]);
  };

  const generateWithAI = () => {
    setAiLoading(true);
    setTimeout(() => {
      const base = [
        "Quel est votre niveau global de satisfaction ?",
        "Recommanderiez-vous nos services (0-10) ?",
        "Quels sont les points forts que vous avez appréciés ?",
        "Quels sont les axes d'amélioration prioritaires ?",
        "La communication avec l'équipe a-t-elle été claire ?",
        "Les délais annoncés ont-ils été respectés ?",
        "Le rapport qualité / prix vous semble-t-il juste ?",
        "Un mot pour l'équipe ?",
      ];
      setAiQuestions(base);
      setAiLoading(false);
      toast.success("Questionnaire généré par l'IA", { description: `${base.length} questions proposées, éditables.` });
    }, 900);
  };

  const relancerNonRepondants = (e: Enquete) => {
    const newDest = e.destinataires.map((d) => (d.statut === "Non répondu" || d.statut === "Envoyé") ? { ...d, statut: "Relancé" as const } : d);
    const nb = newDest.filter((d) => d.statut === "Relancé").length;
    enquetesStore.update(e.id, {
      destinataires: newDest,
      statut: "Relance en cours",
      relances: [...e.relances, { at: new Date().toISOString().slice(0, 10), nb }],
    });
    setDetail({ ...e, destinataires: newDest, statut: "Relance en cours", relances: [...e.relances, { at: new Date().toISOString().slice(0, 10), nb }] });
    toast.success(`${nb} non-répondants relancés`, { description: "Messages envoyés par email + WhatsApp." });
  };

  const destData = detail
    ? [
        { note: "Très satisfait", n: Math.round(detail.reponses * 0.45) },
        { note: "Satisfait", n: Math.round(detail.reponses * 0.32) },
        { note: "Neutre", n: Math.round(detail.reponses * 0.14) },
        { note: "Peu satisfait", n: Math.round(detail.reponses * 0.06) },
        { note: "Insatisfait", n: Math.round(detail.reponses * 0.03) },
      ]
    : [];

  const satisfaction = detail
    ? [
        { name: "Promoteurs", value: 62, fill: "var(--chart-4)" },
        { name: "Passifs", value: 24, fill: "var(--chart-2)" },
        { name: "Détracteurs", value: 14, fill: "var(--chart-5)" },
      ]
    : [];

  const destPageSize = 6;
  const destTotalPages = detail ? Math.max(1, Math.ceil(detail.destinataires.length / destPageSize)) : 1;
  const destSlice = detail ? detail.destinataires.slice((destPage - 1) * destPageSize, destPage * destPageSize) : [];

  const calendarEvents: CalendarEvent[] = rows.flatMap((e) => [
    { id: `${e.id}-launch`, date: e.dateLancement, title: `▶ ${e.nom}`, tone: (e.statut === "Terminé" ? "muted" : "primary") as CalendarEvent["tone"], onClick: () => { setDetail(e); setDestPage(1); } },
    { id: `${e.id}-close`, date: e.dateCloture, title: `⏹ ${e.nom} (clôture)`, tone: "warn" as CalendarEvent["tone"], onClick: () => { setDetail(e); setDestPage(1); } },
  ]);

  return (
    <AppShell title="Enquêtes AI" subtitle="Agent Études — génération IA du questionnaire, envoi et relance automatisés, synthèse visuelle">
      <Tabs defaultValue="list">
        <TabsList className="mb-4">
          <TabsTrigger value="list"><LayoutList className="h-4 w-4 mr-2" /> Enquêtes</TabsTrigger>
          <TabsTrigger value="calendar"><CalendarDays className="h-4 w-4 mr-2" /> Calendrier des envois</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <DataTable<Enquete>
            data={filtered}
            searchKeys={["nom", "client"]}
            searchPlaceholder="Rechercher une enquête, un client..."
            addLabel="Nouvelle enquête"
            onAdd={() => { setEditing(empty()); setStep(1); setAiQuestions([]); setOpen(true); }}
            onRowClick={(r) => { setDetail(r); setDestPage(1); }}
            filterChips={chips}
            filters={
              <>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={client} onValueChange={setClient}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous clients</SelectItem>
                    {ENTREPRISES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statut} onValueChange={setStatut}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    {STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </>
            }
            columns={[
              { header: "Enquête", sortKey: "nom", cell: (r) => <span className="font-medium">{r.nom}</span> },
              { header: "Client", sortKey: "client", cell: (r) => r.client },
              { header: "Type", cell: (r) => <span className="text-xs">{r.type}</span> },
              { header: "Réponses", sortKey: "reponses", cell: (r) => (
                <div className="min-w-[140px]">
                  <div className="text-sm"><span className="font-medium">{r.reponses}</span> <span className="text-muted-foreground">/ {r.envoyees}</span> <span className="text-xs text-muted-foreground">({Math.round((r.reponses / r.envoyees) * 100)}%)</span></div>
                  <div className="w-32 h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                    <div className="h-full bg-[color:var(--gold)] transition-all" style={{ width: `${(r.reponses / r.envoyees) * 100}%` }} />
                  </div>
                </div>
              ) },
              { header: "Lancement", sortKey: "dateLancement", cell: (r) => <span className="text-sm text-muted-foreground">{r.dateLancement}</span> },
              { header: "Statut", cell: (r) => <StatusBadge status={r.statut} dot /> },
            ]}
            rowActions={(r) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setDetail(r); setDestPage(1); }}><Eye className="h-4 w-4 mr-2" /> Voir résultats</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setEditing(r); setStep(1); setOpen(true); }}><Pencil className="h-4 w-4 mr-2" /> Modifier</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDel(r)}><Trash2 className="h-4 w-4 mr-2" /> Supprimer</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </TabsContent>
        <TabsContent value="calendar">
          <div className="mb-3 text-xs text-muted-foreground flex gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Lancement d'enquête</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Clôture prévue</span>
          </div>
          <MiniCalendar events={calendarEvents} title="Planning d'envoi et de clôture" />
        </TabsContent>
      </Tabs>


      {/* Multi-step create/edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Modifier l'enquête" : "Nouvelle enquête"}</DialogTitle>
            <div className="flex items-center gap-2 pt-2 text-xs">
              {[1, 2, 3, 4].map((s) => (
                <span key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-[color:var(--gold)]" : "bg-muted"}`} />
              ))}
            </div>
            <div className="text-xs text-muted-foreground pt-1">Étape {step} sur 4 — {["Infos générales", "Base destinataires", "Questionnaire (IA)", "Planification"][step - 1]}</div>
          </DialogHeader>
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1"><Label>Nom de l'enquête</Label><Input value={editing.nom} onChange={(e) => setEditing({ ...editing, nom: e.target.value })} placeholder="Ex: Satisfaction B2B Q1 2026" /></div>
              <div className="col-span-2 space-y-1"><Label>Client</Label><Input value={editing.client} onChange={(e) => setEditing({ ...editing, client: e.target.value })} placeholder="Ex: OCP Group" /></div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as Enquete["type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Statut initial</Label>
                <Select value={editing.statut} onValueChange={(v) => setEditing({ ...editing, statut: v as Enquete["statut"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <div className="space-y-1"><Label>Nombre de destinataires</Label><Input type="number" value={editing.envoyees} onChange={(e) => setEditing({ ...editing, envoyees: Number(e.target.value) })} /></div>
              <div className="rounded-lg border-2 border-dashed border-[color:var(--gold)]/40 bg-[color:var(--gold)]/5 p-6 text-center text-sm">
                <div className="text-2xl mb-2">📎</div>
                <div className="font-medium">Glissez votre base CSV / Excel</div>
                <div className="text-xs text-muted-foreground mt-1">Colonnes attendues : Nom, Email, Entreprise, Fonction</div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <div>
                <Label>Modèle de questionnaire</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {QUESTIONNAIRES_TYPES.map((q) => (
                    <button key={q.id} type="button" onClick={() => setSelectedTemplate(q.id)} className={cn("text-left border rounded-lg p-3 transition-all", selectedTemplate === q.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50")}>
                      <div className="text-sm font-medium">{q.nom}</div>
                      <div className="text-[11px] text-muted-foreground">{q.questions} questions · {q.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border p-3 bg-gradient-to-br from-[color:var(--gold)]/10 to-transparent border-[color:var(--gold)]/25">
                <div className="flex items-center gap-2 mb-2">
                  <Wand2 className="h-4 w-4 text-[color:var(--gold)]" />
                  <div className="font-semibold text-sm">Ou générer avec l'IA</div>
                </div>
                <Textarea rows={2} value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Ex: enquête de satisfaction post-mission d'audit RH, 8 questions courtes, ton professionnel" />
                <Button size="sm" onClick={generateWithAI} disabled={aiLoading} className="mt-2 bg-primary text-primary-foreground">
                  <Sparkles className={cn("h-3.5 w-3.5 mr-1", aiLoading && "animate-spin")} /> {aiLoading ? "Génération..." : "Générer le questionnaire"}
                </Button>
                {aiQuestions.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {aiQuestions.map((q, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm bg-background rounded-md border p-2">
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded px-1.5 py-0.5 shrink-0 mt-0.5">Q{i + 1}</span>
                        <input className="flex-1 bg-transparent focus:outline-none" defaultValue={q} />
                        <button className="text-muted-foreground hover:text-destructive" onClick={() => setAiQuestions(aiQuestions.filter((_, j) => j !== i))}><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                    <Button size="sm" variant="ghost" onClick={() => setAiQuestions([...aiQuestions, "Nouvelle question..."])}><Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une question</Button>
                  </div>
                )}
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Date d'envoi</Label><Input type="date" value={editing.dateLancement} onChange={(e) => setEditing({ ...editing, dateLancement: e.target.value })} /></div>
                <div className="space-y-1"><Label>Heure d'envoi</Label><Input type="time" value={planTime} onChange={(e) => setPlanTime(e.target.value)} /></div>
                <div className="space-y-1"><Label>Date de clôture</Label><Input type="date" value={editing.dateCloture} onChange={(e) => setEditing({ ...editing, dateCloture: e.target.value })} /></div>
                <div className="space-y-1"><Label>Fréquence de relance</Label>
                  <Select defaultValue="3j">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1j">Chaque jour</SelectItem><SelectItem value="3j">Tous les 3 jours</SelectItem><SelectItem value="7j">Hebdomadaire</SelectItem><SelectItem value="none">Pas de relance</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="rounded-lg border p-3 bg-muted/30 text-sm">
                <div className="font-medium mb-1">Récapitulatif</div>
                <div className="text-xs text-muted-foreground">
                  L'agent enverra <b>{editing.envoyees}</b> invitations par email et WhatsApp le <b>{editing.dateLancement}</b> à <b>{planTime}</b>, relancera les non-répondants jusqu'au <b>{editing.dateCloture}</b>, puis générera la synthèse.
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="justify-between">
            <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : setOpen(false)}>
              {step > 1 ? "Précédent" : "Annuler"}
            </Button>
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} className="bg-primary text-primary-foreground">Suivant</Button>
            ) : (

              <Button onClick={save} className="bg-primary text-primary-foreground">Enregistrer</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Drawer */}
      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
          {detail && (
            <>
              <SheetHeader className="border-b pb-4">
                <SheetTitle className="text-xl">{detail.nom}</SheetTitle>
                <div className="text-sm text-muted-foreground">{detail.client} · {detail.type}</div>
                <div className="flex gap-2 mt-2"><StatusBadge status={detail.statut} dot /></div>
              </SheetHeader>
              <div className="py-4 space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-4">
                    <div className="text-xs text-muted-foreground">Taux de réponse</div>
                    <div className="text-3xl font-bold mt-1 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]"><CountUp value={Math.round((detail.reponses / detail.envoyees) * 100)} />%</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-xs text-muted-foreground">Réponses</div>
                    <div className="text-3xl font-bold mt-1"><CountUp value={detail.reponses} /> <span className="text-sm text-muted-foreground">/ {detail.envoyees}</span></div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-xs text-muted-foreground">NPS estimé</div>
                    <div className="text-3xl font-bold mt-1">+{20 + (detail.reponses % 50)}</div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Card className="p-3">
                    <div className="text-sm font-semibold mb-2">Distribution des réponses</div>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={destData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.25} vertical={false} />
                          <XAxis dataKey="note" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                          <Bar dataKey="n" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-sm font-semibold mb-2">Satisfaction globale</div>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={satisfaction} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                            {satisfaction.map((s, i) => <Cell key={i} fill={s.fill} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Destinataires ({detail.destinataires.length})</h4>
                  <Button size="sm" onClick={() => relancerNonRepondants(detail)} className="bg-primary text-primary-foreground">
                    <Send className="h-4 w-4 mr-2" /> Relancer les non-répondants
                  </Button>
                </div>
                <Card className="p-0 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr className="text-left">
                        <th className="p-2 font-medium">Nom</th>
                        <th className="p-2 font-medium">Email</th>
                        <th className="p-2 font-medium">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {destSlice.map((d: EnqueteDest) => (
                        <tr key={d.id} className="border-t">
                          <td className="p-2">{d.nom}</td>
                          <td className="p-2 text-muted-foreground text-xs">{d.email}</td>
                          <td className="p-2"><StatusBadge status={d.statut} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between p-2 border-t text-xs">
                    <span className="text-muted-foreground">Page {destPage} / {destTotalPages}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" disabled={destPage === 1} onClick={() => setDestPage(destPage - 1)}><ChevronLeft className="h-3 w-3" /></Button>
                      <Button size="icon" variant="outline" className="h-7 w-7" disabled={destPage === destTotalPages} onClick={() => setDestPage(destPage + 1)}><ChevronRight className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </Card>

                {detail.relances.length > 0 && (
                  <section>
                    <h4 className="text-sm font-semibold mb-2">Historique des relances</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {detail.relances.map((r, i) => (
                        <li key={i}>• {r.at} — {r.nb} destinataires relancés</li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Supprimer cette enquête ?"
        description="Toutes les réponses collectées seront perdues."
        destructive
        confirmLabel="Supprimer"
        onConfirm={() => { if (confirmDel) { enquetesStore.remove(confirmDel.id); toast.success("Enquête supprimée"); } setConfirmDel(null); }}
      />
    </AppShell>
  );
}
