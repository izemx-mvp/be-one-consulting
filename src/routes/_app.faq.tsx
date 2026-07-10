import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, Copy, Briefcase, Lightbulb, GraduationCap, Receipt, Info, Compass, HelpCircle, FileText, UploadCloud, Linkedin, Facebook, Instagram, Youtube, Globe, Music2, Package, Clock, CheckCircle2, DollarSign, ExternalLink } from "lucide-react";
import { FAQ_CATEGORIES, faqStore, uid, useStore, documentsStore, socialStore, servicesStore, type FaqItem, type KbDocument, type SocialProfile, type Service } from "@/lib/mock-data";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/faq")({
  head: () => ({ meta: [{ title: "Base de connaissance — Be One Consulting" }] }),
  component: Page,
});

const catIcon: Record<string, React.ElementType> = {
  "Recrutement": Briefcase,
  "Conseil & Stratégie": Lightbulb,
  "Formation": GraduationCap,
  "Facturation": Receipt,
  "Général": Info,
  "Missions & Méthodologie": Compass,
};

function highlight(text: string, needle: string) {
  if (!needle) return text;
  const parts = text.split(new RegExp(`(${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return parts.map((p, i) => p.toLowerCase() === needle.toLowerCase() ? <mark key={i} className="bg-[color:var(--gold)]/40 rounded px-0.5">{p}</mark> : <span key={i}>{p}</span>);
}

function Page() {
  return (
    <AppShell title="Base de connaissance" subtitle="Contenu structuré alimentant l'agent de service client — FAQ, documents, réseaux sociaux et catalogue de services">
      <Tabs defaultValue="faq">
        <TabsList className="mb-4">
          <TabsTrigger value="faq"><HelpCircle className="h-4 w-4 mr-2" /> FAQ</TabsTrigger>
          <TabsTrigger value="docs"><FileText className="h-4 w-4 mr-2" /> Documents</TabsTrigger>
          <TabsTrigger value="social"><Globe className="h-4 w-4 mr-2" /> Réseaux sociaux</TabsTrigger>
          <TabsTrigger value="services"><Package className="h-4 w-4 mr-2" /> Services</TabsTrigger>
        </TabsList>
        <TabsContent value="faq"><FaqTab /></TabsContent>
        <TabsContent value="docs"><DocsTab /></TabsContent>
        <TabsContent value="social"><SocialTab /></TabsContent>
        <TabsContent value="services"><ServicesTab /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

// ------------- FAQ TAB -------------
const PAGE_SIZE = 8;
function emptyFaq(): FaqItem {
  return { id: "", categorie: FAQ_CATEGORIES[0], question: "", reponse: "", tags: [], actif: true, usage: 0 };
}
function FaqTab() {
  const rows = useStore(faqStore);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FaqItem>(emptyFaq());
  const [tagsInput, setTagsInput] = useState("");
  const [confirmDel, setConfirmDel] = useState<FaqItem | null>(null);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return rows.filter((r) =>
      (cat === "all" || r.categorie === cat) &&
      (!q || r.question.toLowerCase().includes(needle) || r.reponse.toLowerCase().includes(needle) || r.tags.some((t) => t.toLowerCase().includes(needle))),
    );
  }, [rows, q, cat]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const save = () => {
    if (!editing.question || !editing.reponse) { toast.error("Question et réponse requises"); return; }
    const tags = tagsInput.split(",").map((s) => s.trim()).filter(Boolean);
    const item = { ...editing, tags: tags.length ? tags : editing.tags };
    if (editing.id) { faqStore.update(editing.id, item); toast.success("Q/R mise à jour"); }
    else { faqStore.add({ ...item, id: uid(), usage: 0 }); toast.success("Q/R ajoutée"); }
    setOpen(false);
  };

  const openEdit = (f: FaqItem) => { setEditing(f); setTagsInput(f.tags.join(", ")); setOpen(true); };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      <aside>
        <Card className="p-3">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Catégories</div>
          <div className="space-y-0.5">
            <button onClick={() => { setCat("all"); setPage(1); }} className={cn("w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors", cat === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
              <span className="inline-flex items-center gap-2"><HelpCircle className="h-4 w-4" /> Toutes</span>
              <span className="text-xs opacity-70 tabular-nums">{rows.length}</span>
            </button>
            {FAQ_CATEGORIES.map((c) => {
              const n = rows.filter((r) => r.categorie === c).length;
              const Icon = catIcon[c] ?? HelpCircle;
              return (
                <button key={c} onClick={() => { setCat(c); setPage(1); }} className={cn("w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors", cat === c ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
                  <span className="inline-flex items-center gap-2 truncate"><Icon className="h-4 w-4 shrink-0" /> <span className="truncate">{c}</span></span>
                  <span className="text-xs opacity-70 tabular-nums">{n}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </aside>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Rechercher une question, un mot-clé, un tag..." className="pl-9" />
          </div>
          {q && <span className="text-xs text-muted-foreground">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>}
          <Button onClick={() => { setEditing(emptyFaq()); setTagsInput(""); setOpen(true); }} className="ml-auto bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1" /> Nouvelle Q/R
          </Button>
        </div>
        {pageItems.length === 0 ? (
          <Card className="p-16 text-center text-muted-foreground">
            <HelpCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
            Aucun résultat pour ces critères.
          </Card>
        ) : (
          <Card className="p-2">
            <Accordion type="single" collapsible className="w-full">
              {pageItems.map((r) => (
                <AccordionItem key={r.id} value={r.id} className="group">
                  <AccordionTrigger className="hover:no-underline px-3 py-3">
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wide text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)] font-semibold">{r.categorie}</span>
                        {!r.actif && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Inactif</span>}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Utilisée {r.usage}× ce mois</span>
                      </div>
                      <div className="font-medium mt-0.5">{highlight(r.question, q)}</div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{highlight(r.reponse, q)}</p>
                    {r.tags.length > 0 && <div className="flex flex-wrap gap-1 mt-3">{r.tags.map((t) => <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary">#{t}</span>)}</div>}
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5 mr-1" /> Modifier</Button>
                      <Button size="sm" variant="outline" onClick={() => { faqStore.add({ ...r, id: uid(), question: `${r.question} (copie)`, usage: 0 }); toast.success("Q/R dupliquée"); }}><Copy className="h-3.5 w-3.5 mr-1" /> Dupliquer</Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => setConfirmDel(r)}><Trash2 className="h-3.5 w-3.5 mr-1" /> Supprimer</Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{filtered.length} article{filtered.length > 1 ? "s" : ""} · Page {current} / {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={current === 1}><ChevronLeft className="h-4 w-4" /></Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <Button key={n} size="sm" variant={n === current ? "default" : "outline"} onClick={() => setPage(n)} className={cn("min-w-9", n === current && "bg-primary text-primary-foreground")}>{n}</Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={current === totalPages}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing.id ? "Modifier la Q/R" : "Nouvelle question / réponse"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Catégorie</Label>
              <Select value={editing.categorie} onValueChange={(v) => setEditing({ ...editing, categorie: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FAQ_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Question</Label><Input value={editing.question} onChange={(e) => setEditing({ ...editing, question: e.target.value })} /></div>
            <div className="space-y-1"><Label>Réponse</Label><Textarea rows={5} value={editing.reponse} onChange={(e) => setEditing({ ...editing, reponse: e.target.value })} /></div>
            <div className="space-y-1"><Label>Tags (séparés par virgules)</Label><Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="ex: candidature, délai" /></div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div><div className="text-sm font-medium">Actif</div><div className="text-xs text-muted-foreground">L'agent utilisera cette Q/R si activée.</div></div>
              <Switch checked={editing.actif} onCheckedChange={(v) => setEditing({ ...editing, actif: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} className="bg-primary text-primary-foreground">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)} title="Supprimer cette Q/R ?" destructive confirmLabel="Supprimer" onConfirm={() => { if (confirmDel) { faqStore.remove(confirmDel.id); toast.success("Q/R supprimée"); } setConfirmDel(null); }} />
    </div>
  );
}

// ------------- DOCUMENTS TAB -------------
const docCategories = ["Commercial", "Méthodologie", "Tarification", "Formation", "Juridique", "Autre"];
function emptyDoc(): KbDocument {
  return { id: "", nom: "", type: "PDF", taille: "0 Ko", categorie: docCategories[0], date: new Date().toISOString().slice(0, 10), tags: [] };
}

function DocDropZone({ onFile }: { onFile: (f: File) => void }) {
  const [over, setOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const handleFile = (f: File) => {
    setFileName(f.name);
    setProgress(0);
    onFile(f);
    let p = 0;
    const t = setInterval(() => {
      p += 12 + Math.random() * 18;
      if (p >= 100) { p = 100; clearInterval(t); }
      setProgress(Math.round(p));
    }, 120);
  };
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
      className={cn(
        "col-span-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
        over ? "border-[color:var(--gold)] bg-[color:var(--gold)]/15" : "border-[color:var(--gold)]/40 bg-[color:var(--gold)]/5 hover:bg-[color:var(--gold)]/10",
      )}
      onClick={() => document.getElementById("kb-doc-input")?.click()}
    >
      <input id="kb-doc-input" type="file" accept=".pdf,.docx,.xlsx,.pptx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      <UploadCloud className="h-8 w-8 mx-auto mb-2 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]" />
      <div className="text-sm font-semibold">{fileName ?? "Glissez ici votre fichier ou cliquez pour parcourir"}</div>
      <div className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX ou PPTX — jusqu'à 20 Mo</div>
      {progress !== null && (
        <div className="mt-3 max-w-xs mx-auto">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-[color:var(--gold)] transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 tabular-nums">{progress}% {progress === 100 && "· prêt à importer"}</div>
        </div>
      )}
    </div>
  );
}

function DocsTab() {
  const rows = useStore(documentsStore);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<KbDocument>(emptyDoc());
  const [tagsInput, setTagsInput] = useState("");
  const [confirmDel, setConfirmDel] = useState<KbDocument | null>(null);

  const filtered = rows.filter((r) => (cat === "all" || r.categorie === cat) && (!q || r.nom.toLowerCase().includes(q.toLowerCase()) || r.tags.some((t) => t.toLowerCase().includes(q.toLowerCase()))));

  const save = () => {
    if (!editing.nom) { toast.error("Nom du document requis"); return; }
    const tags = tagsInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (editing.id) { documentsStore.update(editing.id, { ...editing, tags }); toast.success("Document mis à jour"); }
    else { documentsStore.add({ ...editing, id: uid(), tags }); toast.success("Document ajouté"); }
    setOpen(false);
  };

  const openEdit = (d: KbDocument) => { setEditing(d); setTagsInput(d.tags.join(", ")); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un document, un tag..." className="pl-9" />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Toutes catégories</SelectItem>{docCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Button onClick={() => { setEditing(emptyDoc()); setTagsInput(""); setOpen(true); }} className="ml-auto btn-premium hover:[&]:btn-premium-hover"><UploadCloud className="h-4 w-4 mr-1.5" /> Nouveau document</Button>
      </div>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="p-3 font-medium">Document</th>
              <th className="p-3 font-medium">Catégorie</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Taille</th>
              <th className="p-3 font-medium">Ajouté le</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-9 w-9 rounded-lg grid place-items-center text-[10px] font-bold text-white", d.type === "PDF" && "bg-red-500", d.type === "DOCX" && "bg-blue-500", d.type === "XLSX" && "bg-emerald-600", d.type === "PPTX" && "bg-orange-500")}>{d.type}</div>
                    <div>
                      <div className="font-medium">{d.nom}</div>
                      <div className="flex gap-1 mt-0.5 flex-wrap">{d.tags.map((t) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">#{t}</span>)}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{d.categorie}</span></td>
                <td className="p-3 text-muted-foreground">{d.type}</td>
                <td className="p-3 text-muted-foreground">{d.taille}</td>
                <td className="p-3 text-muted-foreground">{d.date}</td>
                <td className="p-3 text-right">
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setConfirmDel(d)}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-muted-foreground"><FileText className="h-10 w-10 mx-auto mb-2 opacity-40" /> Aucun document.</td></tr>}
          </tbody>
        </table>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg p-0">
          <div className="bg-gradient-to-r from-primary via-primary/90 to-[color:var(--gold)]/70 text-primary-foreground px-6 py-4 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><UploadCloud className="h-5 w-5" /> Nouveau document</DialogTitle>
            </DialogHeader>
          </div>
          <div className="px-6 py-4 grid grid-cols-2 gap-3">
            <DocDropZone
              onFile={(f) => {
                const ext = f.name.split(".").pop()?.toUpperCase();
                const type = (["PDF", "DOCX", "XLSX", "PPTX"].includes(ext ?? "") ? ext : "PDF") as KbDocument["type"];
                setEditing((prev) => ({ ...prev, nom: prev.nom || f.name, type, taille: `${(f.size / 1024).toFixed(0)} Ko` }));
              }}
            />
            <div className="col-span-2 space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nom du document</Label><Input value={editing.nom} onChange={(e) => setEditing({ ...editing, nom: e.target.value })} placeholder="Ex: Plaquette commerciale 2026.pdf" className="h-11" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</Label><Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as KbDocument["type"] })}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PDF">PDF</SelectItem><SelectItem value="DOCX">DOCX</SelectItem><SelectItem value="XLSX">XLSX</SelectItem><SelectItem value="PPTX">PPTX</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Catégorie</Label><Select value={editing.categorie} onValueChange={(v) => setEditing({ ...editing, categorie: v })}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{docCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags (séparés par virgules)</Label><Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="ex: plaquette, présentation" className="h-11" /></div>
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-muted/30"><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={save} className="btn-premium hover:[&]:btn-premium-hover">Importer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)} title="Supprimer ce document ?" destructive confirmLabel="Supprimer" onConfirm={() => { if (confirmDel) { documentsStore.remove(confirmDel.id); toast.success("Document supprimé"); } setConfirmDel(null); }} />
    </div>
  );
}

// ------------- SOCIAL TAB -------------
const socialIcon: Record<SocialProfile["reseau"], React.ElementType> = { LinkedIn: Linkedin, Facebook, Instagram, YouTube: Youtube, TikTok: Music2, "Site web": Globe };
const socialColor: Record<SocialProfile["reseau"], string> = {
  LinkedIn: "from-sky-500 to-sky-700",
  Facebook: "from-blue-500 to-blue-700",
  Instagram: "from-pink-500 via-rose-500 to-orange-500",
  YouTube: "from-red-500 to-red-700",
  TikTok: "from-slate-800 to-black",
  "Site web": "from-primary to-primary/70",
};
function emptySocial(): SocialProfile {
  return { id: "", reseau: "LinkedIn", handle: "", url: "", abonnes: 0, engagement: 0, actif: true, description: "" };
}
function SocialTab() {
  const rows = useStore(socialStore);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SocialProfile>(emptySocial());
  const [confirmDel, setConfirmDel] = useState<SocialProfile | null>(null);

  const save = () => {
    if (!editing.handle) { toast.error("Handle requis"); return; }
    if (editing.id) { socialStore.update(editing.id, editing); toast.success("Profil mis à jour"); }
    else { socialStore.add({ ...editing, id: uid() }); toast.success("Profil ajouté"); }
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-semibold text-sm">Liens des réseaux sociaux</div>
          <div className="text-xs text-muted-foreground">Uniquement les URL officielles utilisées par l'agent Communication.</div>
        </div>
        <Button onClick={() => { setEditing(emptySocial()); setOpen(true); }} className="btn-premium hover:[&]:btn-premium-hover"><Plus className="h-4 w-4 mr-1" /> Ajouter un lien</Button>
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="divide-y">
          {rows.map((s) => {
            const Icon = socialIcon[s.reseau];
            return (
              <div key={s.id} className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors">
                <div className={cn("h-11 w-11 rounded-xl grid place-items-center text-white bg-gradient-to-br shrink-0", socialColor[s.reseau])}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium flex items-center gap-2">{s.reseau} {!s.actif && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Inactif</span>}</div>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 truncate max-w-full">
                    <ExternalLink className="h-3 w-3 shrink-0" /> <span className="truncate">{s.url.replace(/^https?:\/\//, "")}</span>
                  </a>
                </div>
                <Switch checked={s.actif} onCheckedChange={(v) => socialStore.update(s.id, { actif: v })} />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setConfirmDel(s)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            );
          })}
          {rows.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">Aucun lien enregistré.</div>}
        </div>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg p-0">
          <div className="bg-gradient-to-r from-primary/10 via-[color:var(--gold)]/10 to-transparent px-6 py-4 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-[color:var(--gold)]" /> {editing.id ? "Modifier le lien" : "Nouveau lien réseau social"}</DialogTitle>
            </DialogHeader>
          </div>
          <div className="px-6 py-4 grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <Label>Réseau</Label>
              <Select value={editing.reseau} onValueChange={(v) => setEditing({ ...editing, reseau: v as SocialProfile["reseau"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["LinkedIn", "Facebook", "Instagram", "YouTube", "TikTok", "Site web"] as SocialProfile["reseau"][]).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>URL complète</Label><Input value={editing.url} onChange={(e) => setEditing({ ...editing, url: e.target.value, handle: editing.handle || e.target.value.split("/").pop() || "" })} placeholder="https://www.linkedin.com/company/beone-consulting" /></div>
            <div className="flex items-center justify-between rounded-lg border p-3"><div><div className="text-sm font-medium">Actif</div><div className="text-xs text-muted-foreground">Utilisé par les agents.</div></div><Switch checked={editing.actif} onCheckedChange={(v) => setEditing({ ...editing, actif: v })} /></div>
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-muted/30"><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={save} className="btn-premium hover:[&]:btn-premium-hover">Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)} title="Supprimer ce lien ?" destructive confirmLabel="Supprimer" onConfirm={() => { if (confirmDel) { socialStore.remove(confirmDel.id); toast.success("Lien supprimé"); } setConfirmDel(null); }} />
    </div>
  );
}


// ------------- SERVICES TAB -------------
const familles: Service["famille"][] = ["Conseil", "Recrutement", "Formation", "Assessment", "Enquêtes"];
const familleColor: Record<Service["famille"], string> = {
  Conseil: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  Recrutement: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  Formation: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
  Assessment: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  "Enquêtes": "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
};
function emptyService(): Service {
  return { id: "", nom: "", famille: "Conseil", description: "", duree: "", livrables: [], tarifIndicatif: "", actif: true };
}
function ServicesTab() {
  const rows = useStore(servicesStore);
  const [q, setQ] = useState("");
  const [famille, setFamille] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service>(emptyService());
  const [livrablesInput, setLivrablesInput] = useState("");
  const [confirmDel, setConfirmDel] = useState<Service | null>(null);

  const filtered = rows.filter((r) => (famille === "all" || r.famille === famille) && (!q || r.nom.toLowerCase().includes(q.toLowerCase()) || r.description.toLowerCase().includes(q.toLowerCase())));

  const save = () => {
    if (!editing.nom) { toast.error("Nom du service requis"); return; }
    const livrables = livrablesInput.split("\n").map((s) => s.trim()).filter(Boolean);
    if (editing.id) { servicesStore.update(editing.id, { ...editing, livrables }); toast.success("Service mis à jour"); }
    else { servicesStore.add({ ...editing, id: uid(), livrables }); toast.success("Service ajouté"); }
    setOpen(false);
  };

  const openEdit = (s: Service) => { setEditing(s); setLivrablesInput(s.livrables.join("\n")); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un service..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setFamille("all")} className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors", famille === "all" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>Toutes</button>
          {familles.map((f) => (
            <button key={f} onClick={() => setFamille(f)} className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors", famille === f ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>{f}</button>
          ))}
        </div>
        <Button onClick={() => { setEditing(emptyService()); setLivrablesInput(""); setOpen(true); }} className="ml-auto bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Nouveau service</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <Card key={s.id} className="p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all fade-up flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className={cn("text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border font-semibold", familleColor[s.famille])}>{s.famille}</span>
              {!s.actif && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Inactif</span>}
            </div>
            <h3 className="font-semibold text-base leading-tight">{s.nom}</h3>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{s.description}</p>
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {s.duree}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><DollarSign className="h-3.5 w-3.5" /> {s.tarifIndicatif}</div>
            </div>
            {s.livrables.length > 0 && (
              <div className="mt-3 pt-3 border-t space-y-1">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Livrables</div>
                {s.livrables.slice(0, 3).map((l, i) => (
                  <div key={i} className="text-xs flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" /> {l}</div>
                ))}
              </div>
            )}
            <div className="mt-4 flex gap-1.5">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5 mr-1" /> Modifier</Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setConfirmDel(s)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing.id ? "Modifier le service" : "Nouveau service"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label>Nom</Label><Input value={editing.nom} onChange={(e) => setEditing({ ...editing, nom: e.target.value })} /></div>
            <div className="space-y-1"><Label>Famille</Label><Select value={editing.famille} onValueChange={(v) => setEditing({ ...editing, famille: v as Service["famille"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{familles.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Durée</Label><Input value={editing.duree} onChange={(e) => setEditing({ ...editing, duree: e.target.value })} placeholder="Ex: 6 à 10 semaines" /></div>
            <div className="col-span-2 space-y-1"><Label>Description</Label><Textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Livrables (un par ligne)</Label><Textarea rows={4} value={livrablesInput} onChange={(e) => setLivrablesInput(e.target.value)} placeholder="Rapport de diagnostic&#10;Plan d'action&#10;Restitution CoDir" /></div>
            <div className="col-span-2 space-y-1"><Label>Tarif indicatif</Label><Input value={editing.tarifIndicatif} onChange={(e) => setEditing({ ...editing, tarifIndicatif: e.target.value })} placeholder="Ex: 150-400k MAD" /></div>
            <div className="col-span-2 flex items-center justify-between rounded-lg border p-3"><div><div className="text-sm font-medium">Actif</div><div className="text-xs text-muted-foreground">Service proposé au catalogue.</div></div><Switch checked={editing.actif} onCheckedChange={(v) => setEditing({ ...editing, actif: v })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={save} className="bg-primary text-primary-foreground">Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)} title="Supprimer ce service ?" destructive confirmLabel="Supprimer" onConfirm={() => { if (confirmDel) { servicesStore.remove(confirmDel.id); toast.success("Service supprimé"); } setConfirmDel(null); }} />
    </div>
  );
}
