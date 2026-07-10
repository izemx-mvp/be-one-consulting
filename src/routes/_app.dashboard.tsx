import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/count-up";
import { useStore, demandesStore, candidatsStore, enquetesStore, rdvStore, articlesStore, activityStore } from "@/lib/mock-data";
import { Inbox, Users, ClipboardList, Newspaper, CalendarClock, TrendingUp, TrendingDown, Percent, CheckCircle2, Circle, Sparkles, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — Be One Consulting" }] }),
  component: Dashboard,
});

const demandesParMois = [
  { mois: "Juil", n: 18 }, { mois: "Août", n: 22 },
  { mois: "Sep", n: 31 }, { mois: "Oct", n: 38 },
  { mois: "Nov", n: 42 }, { mois: "Déc", n: 29 },
];
const candidaturesParMois = [
  { mois: "Juil", n: 24 }, { mois: "Août", n: 31 },
  { mois: "Sep", n: 42 }, { mois: "Oct", n: 51 },
  { mois: "Nov", n: 58 }, { mois: "Déc", n: 47 },
];
const repartitionTypes = [
  { name: "Conseil", value: 34 },
  { name: "Recrutement", value: 42 },
  { name: "Formation", value: 18 },
  { name: "Enquête", value: 22 },
  { name: "Assessment", value: 12 },
];
const pieColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Kpi({ icon: Icon, label, value, trend, trendUp, tint }: { icon: React.ElementType; label: string; value: number; trend: string; trendUp: boolean; tint: string; suffix?: string }) {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow fade-up">
      <div className="flex items-start justify-between">
        <div className={`h-11 w-11 rounded-xl grid place-items-center ${tint}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${trendUp ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"}`}>
          {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {trend}
        </span>
      </div>
      <div className="mt-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-3xl font-bold mt-1 tabular-nums"><CountUp value={value} /></div>
      </div>
    </Card>
  );
}

function KpiPct({ icon: Icon, label, value, trend, trendUp, tint }: { icon: React.ElementType; label: string; value: number; trend: string; trendUp: boolean; tint: string }) {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow fade-up">
      <div className="flex items-start justify-between">
        <div className={`h-11 w-11 rounded-xl grid place-items-center ${tint}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${trendUp ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"}`}>
          {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {trend}
        </span>
      </div>
      <div className="mt-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-3xl font-bold mt-1 tabular-nums"><CountUp value={value} />%</div>
      </div>
    </Card>
  );
}

const activityIcons: Record<string, React.ElementType> = {
  demande: Inbox, candidat: Users, article: Newspaper, enquete: ClipboardList, rdv: CalendarClock,
};

function Dashboard() {
  const demandes = useStore(demandesStore);
  const candidats = useStore(candidatsStore);
  const enquetes = useStore(enquetesStore);
  const rdv = useStore(rdvStore);
  const articles = useStore(articlesStore);
  const activities = useStore(activityStore);

  const enCours = candidats.filter((c) => ["Nouveau", "Présélectionné", "Entretien", "Offre"].includes(c.statut)).length;
  const enquetesActives = enquetes.filter((e) => e.statut !== "Terminé" && e.statut !== "Brouillon").length;
  const articlesAttente = articles.filter((a) => a.statut === "Brouillon");
  const candidatsAttente = candidats.filter((c) => c.statut === "Nouveau").slice(0, 3);
  const rdvSemaine = rdv.filter((r) => {
    const dt = new Date(r.dateHeure);
    const diff = (dt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;
  const tauxReponses = Math.round((enquetes.reduce((s, e) => s + e.reponses, 0) / Math.max(1, enquetes.reduce((s, e) => s + e.envoyees, 0))) * 100);

  return (
    <AppShell title="Tableau de bord" subtitle="Vue d'ensemble de l'activité Be One Consulting">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi icon={Inbox} label="Demandes reçues" value={128} trend="+12%" trendUp tint="bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300" />
        <Kpi icon={Users} label="Candidats en traitement" value={enCours + 40} trend="+8%" trendUp tint="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" />
        <Kpi icon={ClipboardList} label="Enquêtes actives" value={enquetesActives} trend="+3" trendUp tint="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" />
        <Kpi icon={Newspaper} label="Articles à valider" value={articlesAttente.length} trend="-1" trendUp={false} tint="bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" />
        <Kpi icon={CalendarClock} label="RDV cette semaine" value={rdvSemaine} trend="+2" trendUp tint="bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300" />
        <KpiPct icon={Percent} label="Taux de réponse enquêtes" value={tauxReponses} trend="+5 pts" trendUp tint="bg-[color:var(--gold)]/20 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="p-5 lg:col-span-2 fade-up">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h3 className="font-semibold">Demandes clients par mois</h3>
              <p className="text-xs text-muted-foreground mt-0.5">6 derniers mois — tendance à la hausse.</p>
            </div>
            <span className="text-xs text-muted-foreground">2026</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demandesParMois}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} vertical={false} />
                <XAxis dataKey="mois" fontSize={12} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis fontSize={12} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="n" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 fade-up">
          <h3 className="font-semibold mb-1">Répartition des demandes</h3>
          <p className="text-xs text-muted-foreground mb-3">Par type de prestation.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={repartitionTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {repartitionTypes.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card className="p-5 lg:col-span-2 fade-up">
          <h3 className="font-semibold mb-1">Évolution des candidatures</h3>
          <p className="text-xs text-muted-foreground mb-3">Candidats reçus, tous canaux confondus.</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={candidaturesParMois}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} vertical={false} />
                <XAxis dataKey="mois" fontSize={12} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis fontSize={12} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="n" stroke="var(--chart-2)" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 fade-up">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[color:var(--gold)]" />
                Tâches à valider
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Vos actions prioritaires.</p>
            </div>
          </div>
          <div className="space-y-2">
            {articlesAttente.slice(0, 2).map((a) => (
              <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/40 transition-colors">
                <Newspaper className="h-4 w-4 text-amber-600" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.titre}</div>
                  <div className="text-[11px] text-muted-foreground">Article IA · en attente</div>
                </div>
                <Link to="/articles"><Button size="sm" variant="outline" className="h-7">Valider</Button></Link>
              </div>
            ))}
            {candidatsAttente.map((c) => (
              <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/40 transition-colors">
                <Users className="h-4 w-4 text-sky-600" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{c.nom}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{c.poste} · à qualifier</div>
                </div>
                <Link to="/recrutement"><Button size="sm" variant="outline" className="h-7">Voir</Button></Link>
              </div>
            ))}
            {articlesAttente.length === 0 && candidatsAttente.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                Tout est à jour !
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5 mt-4 fade-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Activité récente</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Derniers événements sur la plateforme.</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => toast.info("Historique complet à venir")}>
            Voir tout <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <ul className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
          {activities.map((a) => {
            const Icon = activityIcons[a.type] ?? Circle;
            return (
              <li key={a.id} className="relative">
                <span className="absolute -left-6 top-0.5 h-5 w-5 rounded-full bg-background border-2 border-[color:var(--gold)] grid place-items-center">
                  <Icon className="h-2.5 w-2.5 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]" />
                </span>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm">{a.texte}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{a.at}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <p className="text-xs text-muted-foreground mt-8 text-center">
        Be One Consulting — Premier partenaire marocain en solutions Ressources Humaines & Business Performance.
      </p>
    </AppShell>
  );
}
