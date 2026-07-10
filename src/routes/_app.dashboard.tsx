import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { useStore, demandesStore, candidatsStore, enquetesStore, rdvStore, articlesStore } from "@/lib/mock-data";
import { Inbox, Users, ClipboardList, Newspaper, CalendarClock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — Be One Consulting" }] }),
  component: Dashboard,
});

const demandesParMois = [
  { mois: "Jan", demandes: 12 }, { mois: "Fév", demandes: 18 },
  { mois: "Mar", demandes: 22 }, { mois: "Avr", demandes: 15 },
  { mois: "Mai", demandes: 28 }, { mois: "Juin", demandes: 33 },
  { mois: "Juil", demandes: 25 }, { mois: "Août", demandes: 19 },
  { mois: "Sep", demandes: 31 }, { mois: "Oct", demandes: 38 },
  { mois: "Nov", demandes: 42 }, { mois: "Déc", demandes: 29 },
];

const candidaturesParPoste = [
  { poste: "DRH", candidats: 18 },
  { poste: "Consultant", candidats: 32 },
  { poste: "Recruteur", candidats: 14 },
  { poste: "Chef projet", candidats: 21 },
  { poste: "Analyst", candidats: 11 },
  { poste: "Coach", candidats: 9 },
];

const activity = [
  { texte: "Nouvelle demande de OCP Group — Audit organisationnel", quand: "Il y a 12 min" },
  { texte: "Salma Bennani est passée au statut « Entretien »", quand: "Il y a 1 h" },
  { texte: "Article « 5 tendances RH 2026 » en attente de validation", quand: "Il y a 3 h" },
  { texte: "Enquête satisfaction Attijariwafa clôturée (72 % de réponses)", quand: "Hier" },
  { texte: "Rendez-vous WhatsApp programmé avec Karim Ouazzani", quand: "Hier" },
  { texte: "Nouveau candidat via LinkedIn : Nadia Alaoui", quand: "Il y a 2 jours" },
];

function Kpi({ icon: Icon, label, value, tint }: { icon: React.ElementType; label: string; value: number | string; tint: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className={`h-11 w-11 rounded-lg grid place-items-center ${tint}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function Dashboard() {
  const demandes = useStore(demandesStore);
  const candidats = useStore(candidatsStore);
  const enquetes = useStore(enquetesStore);
  const rdv = useStore(rdvStore);
  const articles = useStore(articlesStore);

  const enCours = candidats.filter((c) => ["Nouveau", "Présélectionné", "Entretien"].includes(c.statut)).length;
  const enquetesActives = enquetes.filter((e) => e.statut !== "Terminé").length;
  const articlesAttente = articles.filter((a) => a.statut === "En attente de validation").length;
  const rdvSemaine = rdv.filter((r) => {
    const dt = new Date(r.dateHeure);
    const now = new Date();
    const diff = (dt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= -7 && diff <= 7;
  }).length;

  return (
    <AppShell title="Tableau de bord" subtitle="Vue d'ensemble de l'activité Be One Consulting">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi icon={Inbox} label="Demandes reçues" value={128} tint="bg-sky-100 text-sky-700" />
        <Kpi icon={Users} label="Candidats en traitement" value={enCours + 40} tint="bg-emerald-100 text-emerald-700" />
        <Kpi icon={ClipboardList} label="Enquêtes actives" value={enquetesActives} tint="bg-amber-100 text-amber-800" />
        <Kpi icon={Newspaper} label="Articles à valider" value={articlesAttente} tint="bg-rose-100 text-rose-700" />
        <Kpi icon={CalendarClock} label="Rendez-vous cette semaine" value={rdvSemaine} tint="bg-violet-100 text-violet-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="font-semibold">Demandes clients par mois</h3>
            <span className="text-xs text-muted-foreground">2026</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demandesParMois}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="mois" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="demandes" stroke="var(--color-chart-1)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Candidatures par poste</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={candidaturesParPoste}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="poste" fontSize={11} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="candidats" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5 mt-6">
        <h3 className="font-semibold mb-4">Activité récente</h3>
        <ul className="divide-y">
          {activity.map((a, i) => (
            <li key={i} className="py-3 flex items-center justify-between text-sm">
              <span>{a.texte}</span>
              <span className="text-xs text-muted-foreground">{a.quand}</span>
            </li>
          ))}
        </ul>
      </Card>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Be One Consulting — Premier partenaire marocain en solutions Ressources Humaines & Business Performance.
        <br />
        Total actuel · {demandes.length} demandes · {candidats.length} candidats · {enquetes.length} enquêtes · {articles.length} articles.
      </p>
    </AppShell>
  );
}
