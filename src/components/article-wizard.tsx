import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, FileText, ChevronLeft, ChevronRight, Save, Send, Clock, Wand2, ImageIcon, Hash } from "lucide-react";
import { articlesStore, ARTICLE_IMAGES, editorialConfigStore, cmConfigStore, uid, useStore, type Article } from "@/lib/mock-data";
import { RichEditor } from "@/components/rich-editor";
import { ScheduleDialog } from "@/components/schedule-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { burstConfetti } from "@/lib/confetti";

const LANGUES = ["Français", "English", "العربية", "Español"];
const TONS = ["Professionnel", "Pédagogique", "Inspirationnel", "Analytique", "Expert"];
const LENGTHS = ["Court (400-600 mots)", "Moyen (700-1200)", "Long (1500+)"];

function emptyArticle(theme: string): Article {
  return { id: "", titre: "", thematique: theme, auteur: "IA", contenu: "", extrait: "", statut: "Brouillon", date: new Date().toISOString().slice(0, 10), tags: [], heure: "09:00" };
}

export function ArticleWizard({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing?: Article | null }) {
  const editorial = useStore(editorialConfigStore)[0];
  const websiteCfg = useStore(cmConfigStore).find((c) => c.platform === "Website");
  const [step, setStep] = useState(1);
  const [article, setArticle] = useState<Article>(emptyArticle(editorial?.thematiques[0] ?? "Général"));
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Step 1 inputs
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [langue, setLangue] = useState<string>((websiteCfg?.settings.langue as string) ?? "Français");
  const [ton, setTon] = useState<string>((websiteCfg?.settings.ton as string) ?? "Professionnel");
  const [longueur, setLongueur] = useState<string>((websiteCfg?.settings.longueur as string) ?? "Moyen (700-1200)");
  const [coverRef, setCoverRef] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep(1); setGenerating(false);
    if (editing) {
      setArticle(editing);
      setDescription(editing.extrait ?? "");
      setKeywords(editing.tags.join(", "));
    } else {
      setArticle(emptyArticle(editorial?.thematiques[0] ?? "Général"));
      setDescription(""); setKeywords(""); setCoverRef("");
    }
  }, [open, editing, editorial]);

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      const kw = keywords.split(",").map((s) => s.trim()).filter(Boolean);
      const title = description.split(/[.!?]/)[0]?.slice(0, 90) || "Article généré par l'IA";
      const cover = ARTICLE_IMAGES[Math.floor(Math.random() * ARTICLE_IMAGES.length)];
      const contenu = `<h2>${title}</h2>
<p><em>Généré automatiquement à partir de votre brief — ${ton.toLowerCase()}, ${longueur.toLowerCase()}.</em></p>
<p>${description || "Introduction générée par l'IA à partir de vos éléments de brief."}</p>
<h2>Contexte</h2>
<p>Ce sujet s'inscrit dans une actualité marquée par la transformation continue des pratiques RH et managériales au Maroc. Les organisations doivent conjuguer performance, engagement et bien-être.</p>
<h2>Points clés</h2>
<ul>
  <li>${kw[0] ?? "Impact stratégique"} : levier de différenciation majeur pour les DRH.</li>
  <li>${kw[1] ?? "Mise en œuvre"} : approche progressive, mesurable, alignée sur la culture.</li>
  <li>${kw[2] ?? "ROI"} : indicateurs concrets à suivre trimestriellement.</li>
</ul>
<h2>Recommandations Be One Consulting</h2>
<p>Nous accompagnons nos clients dans le cadrage, le déploiement et la mesure d'impact avec une combinaison unique de conseil, d'expertise humaine et d'outils IA propriétaires.</p>
${(websiteCfg?.settings.includeConclusion as boolean) !== false ? "<h2>Conclusion</h2><p>La réussite dépend avant tout de la capacité à embarquer les équipes autour d'une vision claire. Contactez-nous pour cadrer votre projet.</p>" : ""}
${(websiteCfg?.settings.includeFaq as boolean) ? "<h2>FAQ</h2><ul><li><b>Quels sont les prérequis ?</b> Une gouvernance sponsorisée et des KPI définis.</li><li><b>Combien de temps ?</b> Entre 3 et 6 mois pour un pilote impactant.</li></ul>" : ""}`;
      const seoTitle = (websiteCfg?.settings.generateSeoTitle as boolean) !== false ? `${title} — Be One Consulting` : "";
      const seoDescription = (websiteCfg?.settings.generateSeoDescription as boolean) !== false ? `${description.slice(0, 150)}${description.length > 150 ? "…" : ""}` : "";
      const tags = (websiteCfg?.settings.generateTags as boolean) !== false && kw.length === 0
        ? ["RH", "Leadership", "Maroc"] : kw;
      setArticle((a) => ({
        ...a,
        titre: title,
        contenu,
        extrait: description,
        tags,
        cover: (websiteCfg?.settings.generateCover as boolean) !== false ? cover : a.cover,
        seoTitle,
        seoDescription,
      }));
      setGenerating(false);
      setStep(2);
      toast.success("Article généré par l'IA");
    }, 1100);
  };

  const save = (statut: Article["statut"], date?: string, heure?: string) => {
    if (!article.titre) { toast.error("Titre requis"); return; }
    const item = { ...article, statut, date: date ?? article.date, heure: heure ?? article.heure };
    if (editing?.id) { articlesStore.update(editing.id, item); toast.success("Article mis à jour"); }
    else {
      articlesStore.add({ ...item, id: uid() });
      if (statut === "Publié") { burstConfetti(); toast.success("Article publié !"); }
      else if (statut === "Planifié") toast.success(`Article planifié pour le ${item.date} à ${item.heure}`);
      else toast.success("Brouillon enregistré");
    }
    onOpenChange(false);
  };

  const stepLabels = ["Génération IA", "Aperçu & édition", "Publication"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto scroll-fancy p-0">
        <div className="bg-gradient-to-r from-primary via-primary/90 to-[color:var(--gold)]/70 text-primary-foreground px-6 py-5 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5" /> {editing ? "Modifier l'article" : "Nouvel article"} — Community Manager AI</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-1.5 pt-3">
            {[1, 2, 3].map((s) => <span key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors", s <= step ? "bg-[color:var(--gold)]" : "bg-white/25")} />)}
          </div>
          <div className="text-xs text-primary-foreground/80 pt-2 font-medium">Étape {step} / 3 — {stepLabels[step - 1]}</div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-xl border p-3 bg-gradient-to-br from-[color:var(--gold)]/10 to-transparent border-[color:var(--gold)]/25 text-xs text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[color:var(--gold)]" /> Paramètres IA hérités de la configuration <b className="text-foreground">Website</b>. Vous pouvez les ajuster ponctuellement ci-dessous.
              </div>
              <div className="space-y-1"><Label>Description / brief</Label><Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez le sujet, l'angle, la promesse au lecteur..." /></div>
              <div className="space-y-1"><Label className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Mots-clés (virgules)</Label><Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Leadership, RH, Maroc" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label>Langue</Label>
                  <Select value={langue} onValueChange={setLangue}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LANGUES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-1"><Label>Ton</Label>
                  <Select value={ton} onValueChange={setTon}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-1"><Label>Longueur</Label>
                  <Select value={longueur} onValueChange={setLongueur}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LENGTHS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Thématique</Label>
                  <Select value={article.thematique} onValueChange={(v) => setArticle({ ...article, thematique: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{editorial?.thematiques.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-1"><Label>Référence image de couverture (optionnel)</Label><Input value={coverRef} onChange={(e) => setCoverRef(e.target.value)} placeholder="URL ou description" /></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-xl border p-3 bg-gradient-to-br from-[color:var(--gold)]/10 to-transparent border-[color:var(--gold)]/25 text-xs text-muted-foreground flex items-center gap-2"><Sparkles className="h-4 w-4 text-[color:var(--gold)]" /> Aperçu généré par l'IA. Éditez librement chaque champ.</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2"><Label>Titre</Label><Input value={article.titre} onChange={(e) => setArticle({ ...article, titre: e.target.value })} /></div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Image de couverture</div>
                {article.cover && <img src={article.cover} alt="" className="w-full h-48 object-cover rounded-lg mb-2" />}
                <div className="grid grid-cols-6 gap-2">
                  {ARTICLE_IMAGES.slice(0, 6).map((src, i) => (
                    <button key={i} type="button" className={cn("aspect-video rounded-lg overflow-hidden border-2 transition-all", article.cover === src ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-primary/60")} onClick={() => setArticle({ ...article, cover: src })}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Contenu</div>
                <RichEditor value={article.contenu} onChange={(v) => setArticle({ ...article, contenu: v })} />
              </div>
              <div className="space-y-1"><Label>Tags (virgules)</Label><Input value={article.tags.join(", ")} onChange={(e) => setArticle({ ...article, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></div>
              <div className="grid grid-cols-1 gap-3 rounded-xl border p-4 bg-muted/30">
                <div className="text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-[color:var(--gold)]" /> SEO</div>
                <div className="space-y-1"><Label>Titre SEO</Label><Input value={article.seoTitle ?? ""} onChange={(e) => setArticle({ ...article, seoTitle: e.target.value })} /></div>
                <div className="space-y-1"><Label>Meta description</Label><Textarea rows={2} value={article.seoDescription ?? ""} onChange={(e) => setArticle({ ...article, seoDescription: e.target.value })} /></div>
              </div>
              <Button size="sm" variant="outline" onClick={generate}><Wand2 className="h-3.5 w-3.5 mr-1.5" /> Régénérer</Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border overflow-hidden">
                {article.cover && <img src={article.cover} alt="" className="w-full h-40 object-cover" />}
                <div className="p-4">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{article.thematique}</div>
                  <div className="font-semibold text-lg">{article.titre}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.extrait || article.seoDescription}</div>
                </div>
              </div>
              <div className="rounded-xl border p-4 bg-muted/30 space-y-1 text-xs text-muted-foreground">
                <div><b className="text-foreground">Statut :</b> {article.statut}</div>
                <div><b className="text-foreground">Tags :</b> {article.tags.join(", ") || "—"}</div>
                <div><b className="text-foreground">SEO :</b> {article.seoTitle || "—"}</div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={() => (step > 1 ? setStep(step - 1) : onOpenChange(false))}>
            <ChevronLeft className="h-4 w-4 mr-1" /> {step > 1 ? "Précédent" : "Annuler"}
          </Button>
          <div className="flex gap-2 flex-wrap justify-end">
            {step === 1 && <Button onClick={generate} disabled={generating || !description} className="btn-premium hover:[&]:btn-premium-hover"><Sparkles className={cn("h-4 w-4 mr-2", generating && "animate-spin")} /> {generating ? "Génération..." : "Générer l'article"}</Button>}
            {step === 2 && (
              <>
                <Button variant="outline" onClick={() => save("Brouillon")}><Save className="h-4 w-4 mr-2" /> Brouillon</Button>
                <Button onClick={() => setStep(3)} className="btn-premium hover:[&]:btn-premium-hover">Suivant <ChevronRight className="h-4 w-4 ml-1" /></Button>
              </>
            )}
            {step === 3 && (
              <>
                <Button variant="outline" onClick={() => save("Brouillon")}><Save className="h-4 w-4 mr-2" /> Brouillon</Button>
                <Button variant="outline" onClick={() => setScheduleOpen(true)}><Clock className="h-4 w-4 mr-2" /> Planifier</Button>
                <Button onClick={() => save("Publié")} className="btn-premium hover:[&]:btn-premium-hover"><Send className="h-4 w-4 mr-2" /> Publier maintenant</Button>
              </>
            )}
          </div>
        </DialogFooter>

        <ScheduleDialog open={scheduleOpen} onOpenChange={setScheduleOpen} initialDate={article.date} initialTime={article.heure} onConfirm={({ date, time }) => save("Planifié", date, time)} />
      </DialogContent>
    </Dialog>
  );
}
