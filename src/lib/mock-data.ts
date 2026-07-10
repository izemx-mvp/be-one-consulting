import { useSyncExternalStore } from "react";

export function createStore<T extends { id: string }>(initial: T[]) {
  let items: T[] = initial;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    all: () => items,
    add: (item: T) => { items = [item, ...items]; emit(); },
    update: (id: string, patch: Partial<T>) => {
      items = items.map((i) => (i.id === id ? { ...i, ...patch } : i));
      emit();
    },
    remove: (id: string) => { items = items.filter((i) => i.id !== id); emit(); },
    subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

export function useStore<T extends { id: string }>(store: ReturnType<typeof createStore<T>>) {
  return useSyncExternalStore(store.subscribe, store.all, store.all);
}

export function uid() { return Math.random().toString(36).slice(2, 10); }

// ---------- Types ----------
export type DemandeType = "Conseil" | "Recrutement" | "Formation" | "Enquête" | "Assessment" | "Bilan de compétences";
export type Demande = {
  id: string; nom: string; entreprise: string;
  type: DemandeType;
  canal: "Site web" | "WhatsApp" | "Email";
  date: string;
  statut: "Nouveau" | "En cours de qualification" | "Traité" | "Redirigé";
  priorite: "Haute" | "Moyenne" | "Basse";
  email: string; telephone: string; message: string;
  budget?: string; delai?: string; posteRecherche?: string;
  notes?: string;
  chatLog: { from: "agent" | "client"; text: string; at: string }[];
};

export type Candidat = {
  id: string; nom: string; poste: string;
  source: "LinkedIn" | "Facebook" | "Instagram";
  score: number;
  scoreAdequation: number; scoreExperience: number; scoreSoftSkills: number;
  experience: number;
  competences: string[];
  statut: "Nouveau" | "Présélectionné" | "Entretien" | "Offre" | "Recruté" | "Rejeté";
  email: string; telephone: string;
  date: string;
  resume: string;
};

export type EnqueteDest = { id: string; nom: string; email: string; statut: "Envoyé" | "Ouvert" | "Répondu" | "Relancé" | "Non répondu" };
export type Enquete = {
  id: string; nom: string; client: string;
  type: "Enquête satisfaction" | "Étude de marché" | "Audit organisationnel";
  envoyees: number; reponses: number;
  dateLancement: string; dateCloture: string;
  statut: "Brouillon" | "En cours" | "Relance en cours" | "Terminé";
  destinataires: EnqueteDest[];
  relances: { at: string; nb: number }[];
};

export type RendezVous = {
  id: string; contact: string; typeRdv: "Entretien candidat" | "RDV client" | "Restitution mission" | "Kick-off projet" | "Point suivi";
  dateHeure: string; canal: "WhatsApp";
  delaiRappel: "15min" | "30min" | "1h" | "1j";
  statutRappel: "Programmé" | "Envoyé" | "Non envoyé" | "Confirmé";
  consultant: string;
  notes: string;
  historique: { at: string; msg: string }[];
  auto: boolean;
};

export type Article = {
  id: string; titre: string; thematique: string;
  auteur: "IA" | "Manuel"; contenu: string;
  statut: "Brouillon" | "En attente de validation" | "Publié";
  date: string;
  extrait: string;
};

export type FaqItem = {
  id: string; categorie: string; question: string; reponse: string;
  tags: string[]; actif: boolean; usage: number;
};

export type Notification = {
  id: string; titre: string; type: "info" | "success" | "warn"; at: string; lu: boolean;
};

export type Activity = {
  id: string; texte: string; type: "demande" | "candidat" | "article" | "enquete" | "rdv"; at: string;
};

// ---------- Data ----------
const entreprises = ["OCP Group", "Attijariwafa Bank", "Maroc Telecom", "BMCE Bank", "Royal Air Maroc", "Cosumar", "Lydec", "Managem", "CIH Bank", "Marsa Maroc", "Marjane Holding", "Label'Vie", "Wafa Assurance", "Inwi", "Renault Maroc", "Centrale Danone", "Lesieur Cristal", "Holmarcom", "CNSS", "CFG Bank"];
const noms = ["Yassine El Amrani", "Salma Bennani", "Karim Ouazzani", "Nadia Alaoui", "Mehdi Tazi", "Imane Fassi", "Omar Benjelloun", "Sara Chraibi", "Hicham Berrada", "Leila Kettani", "Reda Sqalli", "Amina Bouchentouf", "Anas Idrissi", "Ghita Lahlou", "Youssef Berrada", "Rania Ziani", "Hamza El Khatib", "Meryem Naciri", "Adil Rachidi", "Sofia Amrani", "Nabil Cherkaoui", "Zineb Mansouri", "Tarik Benhima", "Houda Filali", "Amine Slaoui", "Loubna Radi", "Marouane Hassani", "Kenza Alami", "Rachid Boukili", "Fatima Tounsi"];
const consultants = ["F.Z. Abbadi", "M. Bennis", "K. Hilali"];

function d(days: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() - days);
  return dt.toISOString().slice(0, 10);
}
function iso(days: number, hours = 10, minutes = 0) {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  dt.setHours(hours, minutes);
  return dt.toISOString().slice(0, 16);
}

const typesD: DemandeType[] = ["Conseil", "Recrutement", "Formation", "Enquête", "Assessment", "Bilan de compétences"];
const canauxD: Demande["canal"][] = ["Site web", "WhatsApp", "Email"];
const statutsD: Demande["statut"][] = ["Nouveau", "En cours de qualification", "Redirigé", "Traité"];
const priorites: Demande["priorite"][] = ["Haute", "Moyenne", "Basse"];
const postes = ["Directeur RH", "Contrôleur de gestion", "Chargé de recrutement", "Chef de projet SI", "Business Analyst", "Responsable formation", "Talent Manager", "Data Analyst", "Coach en transformation", "Directeur commercial", "Manager marketing", "Ingénieur QHSE", "Consultant Senior", "Responsable ADV", "Chef de produit"];

const seedDemandes: Demande[] = Array.from({ length: 26 }, (_, i) => {
  const type = typesD[i % typesD.length];
  const nom = noms[i % noms.length];
  const ent = entreprises[i % entreprises.length];
  return {
    id: uid(),
    nom, entreprise: ent,
    type,
    canal: canauxD[i % canauxD.length],
    date: d(Math.floor(i * 2.3)),
    statut: statutsD[i % statutsD.length],
    priorite: priorites[i % priorites.length],
    email: `contact${i + 1}@${ent.toLowerCase().replace(/[^a-z]/g, "")}.ma`,
    telephone: `+2126${String(10000000 + i * 12345).slice(0, 8)}`,
    message: type === "Recrutement"
      ? "Nous recherchons un profil expérimenté pour renforcer notre équipe."
      : type === "Enquête"
        ? "Nous souhaitons lancer une enquête de satisfaction auprès de nos clients B2B."
        : "Nous cherchons un accompagnement pour un projet de transformation.",
    budget: type === "Recrutement" ? "25-40k MAD/mois" : type === "Enquête" ? "80-150k MAD" : "à discuter",
    delai: ["Sous 15 jours", "1 mois", "Trimestre en cours", "6 mois"][i % 4],
    posteRecherche: type === "Recrutement" ? postes[i % postes.length] : undefined,
    notes: "",
    chatLog: [
      { from: "client", text: "Bonjour, je souhaite en savoir plus sur vos services.", at: `${d(Math.floor(i * 2.3))} 09:12` },
      { from: "agent", text: "Bonjour, bienvenue chez Be One Consulting. Pouvez-vous préciser le type de prestation qui vous intéresse ?", at: `${d(Math.floor(i * 2.3))} 09:13` },
      { from: "client", text: `Nous cherchons plutôt du ${type.toLowerCase()}.`, at: `${d(Math.floor(i * 2.3))} 09:15` },
      { from: "agent", text: "Parfait. Quel est votre horizon de démarrage et un ordre de budget ?", at: `${d(Math.floor(i * 2.3))} 09:16` },
    ],
  };
});

const sources: Candidat["source"][] = ["LinkedIn", "Facebook", "Instagram"];
const statutsC: Candidat["statut"][] = ["Nouveau", "Présélectionné", "Entretien", "Offre", "Recruté", "Rejeté"];
const competencesPool = ["Leadership", "Gestion de projet", "Excel avancé", "Power BI", "SAP", "Recrutement", "Formation", "Négociation", "Change management", "Coaching", "Anglais courant", "SIRH", "Contrôle de gestion", "Communication", "Vente B2B", "Marketing digital"];

const seedCandidats: Candidat[] = Array.from({ length: 32 }, (_, i) => {
  const sA = 40 + ((i * 11) % 60);
  const sE = 45 + ((i * 17) % 55);
  const sS = 50 + ((i * 13) % 50);
  const p = postes[i % postes.length];
  return {
    id: uid(),
    nom: noms[(i + 4) % noms.length],
    poste: p,
    source: sources[i % sources.length],
    score: Math.round((sA + sE + sS) / 3),
    scoreAdequation: sA, scoreExperience: sE, scoreSoftSkills: sS,
    experience: 2 + (i % 15),
    competences: competencesPool.slice(i % 6, (i % 6) + 4),
    statut: statutsC[i % statutsC.length],
    email: `candidat${i + 1}@gmail.com`,
    telephone: `+2126${String(20000000 + i * 33333).slice(0, 8)}`,
    date: d(i),
    resume: `Professionnel expérimenté au poste de ${p}, avec ${2 + (i % 15)} ans d'expérience dans le secteur. Cherche à évoluer dans une structure à forte culture d'entreprise. Formation ISCAE / ENCG. Maîtrise des outils modernes et bonne gestion d'équipe.`,
  };
});

const typesE: Enquete["type"][] = ["Enquête satisfaction", "Étude de marché", "Audit organisationnel"];
const statutsE: Enquete["statut"][] = ["Brouillon", "En cours", "Relance en cours", "Terminé"];
const nomsEnquetes = ["Satisfaction B2B 2026", "Étude marché télécoms", "Audit organisation DSI", "Baromètre engagement", "Satisfaction retail Q1", "Étude marché banking", "Audit RH industrie", "NPS Clients Corp", "Étude concurrentielle FMCG", "Audit process achats", "Satisfaction post-mission", "Étude packaging", "Baromètre RH Groupe", "Satisfaction Formation", "Audit fonction commerciale", "Étude parcours client"];

const seedEnquetes: Enquete[] = nomsEnquetes.map((nm, i) => {
  const envoyees = 60 + i * 12;
  const reponses = Math.floor(envoyees * (0.3 + ((i % 5) * 0.1)));
  const destinataires: EnqueteDest[] = Array.from({ length: Math.min(envoyees, 30) }, (_, j) => ({
    id: uid(),
    nom: noms[(i + j) % noms.length],
    email: `resp${j}@${entreprises[i % entreprises.length].toLowerCase().replace(/[^a-z]/g, "")}.ma`,
    statut: (["Répondu", "Répondu", "Ouvert", "Envoyé", "Relancé", "Non répondu"] as EnqueteDest["statut"][])[(i + j) % 6],
  }));
  return {
    id: uid(),
    nom: nm,
    client: entreprises[i % entreprises.length],
    type: typesE[i % typesE.length],
    envoyees, reponses,
    dateLancement: d(i * 4),
    dateCloture: d(i * 4 - 30),
    statut: statutsE[i % statutsE.length],
    destinataires,
    relances: i % 3 === 0 ? [{ at: d(i * 2), nb: 12 }] : [],
  };
});

const typesR: RendezVous["typeRdv"][] = ["Entretien candidat", "RDV client", "Restitution mission", "Kick-off projet", "Point suivi"];
const statutsRR: RendezVous["statutRappel"][] = ["Programmé", "Envoyé", "Non envoyé", "Confirmé"];
const delais: RendezVous["delaiRappel"][] = ["15min", "30min", "1h", "1j"];

const seedRdv: RendezVous[] = Array.from({ length: 22 }, (_, i) => ({
  id: uid(),
  contact: noms[i % noms.length],
  typeRdv: typesR[i % typesR.length],
  dateHeure: iso(i - 8, 9 + (i % 8), (i * 15) % 60),
  canal: "WhatsApp",
  delaiRappel: delais[i % delais.length],
  statutRappel: statutsRR[i % statutsRR.length],
  consultant: consultants[i % consultants.length],
  notes: "Confirmer la présence 24h avant.",
  auto: i % 3 !== 0,
  historique: [
    { at: iso(i - 8, 8, 0), msg: "Rappel programmé automatiquement." },
    { at: iso(i - 8, 8, 30), msg: "Message WhatsApp envoyé." },
  ],
}));

const thematiques = ["Ressources Humaines", "Recrutement", "Transformation", "Leadership", "Formation", "Business Performance", "Marque employeur"];
const statutsA: Article["statut"][] = ["Brouillon", "En attente de validation", "Publié"];
const titresA = [
  "5 tendances RH à surveiller au Maroc en 2026",
  "Comment structurer un plan de succession efficace",
  "Attirer et fidéliser les talents de la Gen Z",
  "L'IA au service du recrutement : opportunités & limites",
  "Réussir sa transformation digitale RH",
  "Marque employeur : les fondamentaux au Maroc",
  "Onboarding : sécuriser les 30 premiers jours",
  "Mesurer l'engagement collaborateur en 2026",
  "Diversité et inclusion : passer des mots aux actes",
  "Développer le leadership de proximité",
  "Refonte des processus RH : par où commencer ?",
  "Formation continue : ROI et bonnes pratiques",
  "Piloter la performance individuelle sans démotiver",
  "Repenser l'expérience collaborateur post-Covid",
  "Guide pratique de l'audit organisationnel",
  "Négocier un package d'embauche gagnant-gagnant",
  "Gérer les talents à haut potentiel",
  "Culture d'entreprise en fusion-acquisition",
];
const seedArticles: Article[] = titresA.map((t, i) => ({
  id: uid(),
  titre: t,
  thematique: thematiques[i % thematiques.length],
  auteur: i % 2 === 0 ? "IA" : "Manuel",
  contenu: `<h2>${t}</h2><p>Dans cet article, nous explorons les enjeux clés pour les DRH marocains et proposons des recommandations issues de nos missions terrain.</p><p><b>Contexte.</b> Le marché marocain connaît une accélération sans précédent des mutations organisationnelles. Les entreprises doivent repenser leur approche.</p><ul><li>Diagnostic préalable</li><li>Cadrage stratégique</li><li>Mise en œuvre opérationnelle</li><li>Ancrage et suivi</li></ul><p>Notre expérience montre que <b>la clé du succès</b> réside dans l'accompagnement humain autant que dans la méthode.</p>`,
  extrait: "Les enjeux clés pour les DRH marocains et nos recommandations concrètes issues de nos missions terrain.",
  statut: statutsA[i % statutsA.length],
  date: d(i * 3),
}));

const categoriesFaq = ["Recrutement", "Conseil & Stratégie", "Formation", "Facturation", "Général", "Missions & Méthodologie"];
const faqSeed: Array<Omit<FaqItem, "id" | "usage">> = [
  { categorie: "Recrutement", question: "Comment déposer ma candidature ?", reponse: "Rendez-vous sur notre page Carrières, sélectionnez le poste et téléchargez votre CV. Notre équipe revient vers vous sous 5 jours ouvrés.", tags: ["candidature", "CV"], actif: true },
  { categorie: "Recrutement", question: "Quels types de postes recrutez-vous ?", reponse: "Nous recrutons principalement des profils cadres et cadres supérieurs : DRH, consultants, chefs de projet, directeurs commerciaux.", tags: ["postes", "profils"], actif: true },
  { categorie: "Recrutement", question: "Puis-je faire une candidature spontanée ?", reponse: "Oui. Envoyez CV et lettre à recrutement@beone-consulting.com en précisant votre domaine d'expertise.", tags: ["spontanée"], actif: true },
  { categorie: "Recrutement", question: "Sous quel délai êtes-vous capable de sourcer un profil rare ?", reponse: "Pour un profil cadre supérieur rare, comptez 4 à 6 semaines de sourcing actif via LinkedIn et notre CVthèque.", tags: ["délai", "sourcing"], actif: true },
  { categorie: "Conseil & Stratégie", question: "Quels sont vos délais pour un audit organisationnel ?", reponse: "Un audit organisationnel dure en moyenne 6 à 10 semaines selon la taille de l'entreprise et le périmètre défini.", tags: ["audit", "délai"], actif: true },
  { categorie: "Conseil & Stratégie", question: "Comment fonctionne l'accompagnement en transformation RH ?", reponse: "Nous procédons en 4 phases : diagnostic, cadrage stratégique, mise en œuvre opérationnelle et ancrage. Chaque phase est jalonnée avec le comité de pilotage.", tags: ["transformation"], actif: true },
  { categorie: "Conseil & Stratégie", question: "Intervenez-vous en dehors de Casablanca ?", reponse: "Oui, nous intervenons dans tout le Maroc et en Afrique francophone (Sénégal, Côte d'Ivoire, Tunisie).", tags: ["géographie"], actif: true },
  { categorie: "Formation", question: "Vos formations sont-elles certifiantes ?", reponse: "Nous proposons des parcours certifiants en leadership, management de projet et transformation RH, en partenariat avec des organismes reconnus.", tags: ["certification"], actif: true },
  { categorie: "Formation", question: "Peut-on organiser une formation intra-entreprise ?", reponse: "Oui, la majorité de nos programmes est déclinable en intra, sur mesure selon vos enjeux et votre culture.", tags: ["intra"], actif: true },
  { categorie: "Formation", question: "Les formations sont-elles éligibles CSF ?", reponse: "Oui, la plupart de nos formations sont éligibles au remboursement CSF via l'OFPPT.", tags: ["CSF", "OFPPT"], actif: true },
  { categorie: "Formation", question: "Proposez-vous des formations sur mesure ?", reponse: "Oui, nos ingénieurs pédagogiques co-construisent chaque parcours avec le client à partir d'un diagnostic préalable.", tags: ["sur mesure"], actif: true },
  { categorie: "Facturation", question: "Quels moyens de paiement acceptez-vous ?", reponse: "Virement bancaire, chèque et prélèvement. Nos factures sont émises en dirhams (MAD).", tags: ["paiement"], actif: true },
  { categorie: "Facturation", question: "Quels sont vos délais de règlement ?", reponse: "Nos conditions standard sont à 30 jours nets fin de mois, sauf accord contractuel spécifique.", tags: ["règlement"], actif: true },
  { categorie: "Facturation", question: "Vos tarifs sont-ils négociables ?", reponse: "Nos tarifs sont adaptés au périmètre de la mission. Un devis personnalisé est établi après cadrage.", tags: ["tarifs"], actif: true },
  { categorie: "Général", question: "Où se trouve votre bureau ?", reponse: "Notre siège est à Casablanca, quartier Sidi Maârouf. Un espace de travail est également disponible sur rendez-vous à Rabat.", tags: ["bureau", "adresse"], actif: true },
  { categorie: "Général", question: "Comment prendre rendez-vous avec un consultant ?", reponse: "Contactez-nous via le formulaire du site ou par WhatsApp. Un rappel est planifié sous 48h.", tags: ["RDV"], actif: true },
  { categorie: "Général", question: "Qui est Fatima Zahra Abbadi ?", reponse: "Fondatrice de Be One Consulting, Fatima Zahra Abbadi accompagne depuis plus de 15 ans les entreprises marocaines dans leurs projets RH et de performance.", tags: ["fondatrice"], actif: true },
  { categorie: "Général", question: "Quelles sont vos références clients ?", reponse: "Nous collaborons avec de grandes entreprises marocaines dans la banque, l'assurance, l'industrie, la distribution et les télécoms.", tags: ["références"], actif: true },
  { categorie: "Missions & Méthodologie", question: "Comment se déroule un bilan de compétences ?", reponse: "Le bilan se déroule en 3 phases (préliminaire, investigation, conclusion) sur 24h réparties sur 8 à 12 semaines. Éligible CPF/CSF.", tags: ["bilan"], actif: true },
  { categorie: "Missions & Méthodologie", question: "Comment se déroule une enquête de satisfaction ?", reponse: "Nous concevons le questionnaire avec vous, diffusons via email/WhatsApp, relançons les non-répondants, et livrons un rapport de synthèse.", tags: ["enquête"], actif: true },
  { categorie: "Missions & Méthodologie", question: "Quel est votre process d'assessment ?", reponse: "Nos assessments combinent tests psychométriques validés, mises en situation métier et entretien approfondi. Restitution sous 10 jours.", tags: ["assessment"], actif: true },
];
const seedFaq: FaqItem[] = faqSeed.map((f, i) => ({ id: uid(), usage: 5 + ((i * 17) % 90), ...f }));

const seedNotifications: Notification[] = [
  { id: uid(), titre: "Nouvelle candidature — Contrôleur de gestion", type: "info", at: "il y a 8 min", lu: false },
  { id: uid(), titre: "Article « Tendances RH 2026 » en attente de validation", type: "warn", at: "il y a 42 min", lu: false },
  { id: uid(), titre: "Enquête Attijariwafa clôturée (72% de réponses)", type: "success", at: "il y a 2 h", lu: false },
  { id: uid(), titre: "Rappel WhatsApp envoyé à Mme Benjelloun", type: "info", at: "il y a 3 h", lu: true },
  { id: uid(), titre: "Nouvelle demande OCP Group — Audit organisationnel", type: "info", at: "hier", lu: true },
];

const seedActivity: Activity[] = [
  { id: uid(), texte: "Nouvelle demande OCP Group — Audit organisationnel", type: "demande", at: "il y a 12 min" },
  { id: uid(), texte: "Salma Bennani est passée au statut « Entretien »", type: "candidat", at: "il y a 1 h" },
  { id: uid(), texte: "Article « 5 tendances RH 2026 » en attente de validation", type: "article", at: "il y a 3 h" },
  { id: uid(), texte: "Enquête satisfaction Attijariwafa clôturée (72% de réponses)", type: "enquete", at: "hier" },
  { id: uid(), texte: "Rendez-vous WhatsApp programmé avec Karim Ouazzani", type: "rdv", at: "hier" },
  { id: uid(), texte: "Nouveau candidat via LinkedIn : Nadia Alaoui", type: "candidat", at: "il y a 2 jours" },
];

export const demandesStore = createStore<Demande>(seedDemandes);
export const candidatsStore = createStore<Candidat>(seedCandidats);
export const enquetesStore = createStore<Enquete>(seedEnquetes);
export const rdvStore = createStore<RendezVous>(seedRdv);
export const articlesStore = createStore<Article>(seedArticles);
export const faqStore = createStore<FaqItem>(seedFaq);
export const notificationsStore = createStore<Notification>(seedNotifications);
export const activityStore = createStore<Activity>(seedActivity);

export const FAQ_CATEGORIES = categoriesFaq;
export const THEMATIQUES = thematiques;
export const POSTES = postes;
export const CONSULTANTS = consultants;
export const ENTREPRISES = entreprises;
