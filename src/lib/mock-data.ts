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

export type CandidatCV = { name: string; uploadedAt: string; type: "PDF" | "DOCX" | "Image"; url: string; size: string };
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
  cv?: CandidatCV;
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
  statut: "Brouillon" | "Planifié" | "Publié";
  date: string;
  extrait: string;
  tags: string[];
  heure?: string;
  cover?: string;
  seoTitle?: string;
  seoDescription?: string;
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
    cv: i % 4 === 3 ? undefined : {
      name: `CV_${noms[(i + 4) % noms.length].replace(/\s+/g, "_")}_${p.replace(/\s+/g, "_")}.pdf`,
      uploadedAt: d(i),
      type: (i % 5 === 0 ? "DOCX" : "PDF") as "PDF" | "DOCX",
      url: "#",
      size: `${(180 + (i * 47) % 700)} Ko`,
    },
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
const statutsA: Article["statut"][] = ["Brouillon", "Planifié", "Publié"];
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
const tagsPool = ["RH", "IA", "Leadership", "Culture", "Talents", "Digital", "Performance", "Casablanca", "Afrique", "Innovation", "Management", "Recrutement", "Formation"];
const seedArticles: Article[] = titresA.map((t, i) => ({
  id: uid(),
  titre: t,
  thematique: thematiques[i % thematiques.length],
  auteur: i % 2 === 0 ? "IA" : "Manuel",
  contenu: `<h2>${t}</h2><p>Dans cet article, nous explorons les enjeux clés pour les DRH marocains et proposons des recommandations issues de nos missions terrain.</p><p><b>Contexte.</b> Le marché marocain connaît une accélération sans précédent des mutations organisationnelles. Les entreprises doivent repenser leur approche.</p><ul><li>Diagnostic préalable</li><li>Cadrage stratégique</li><li>Mise en œuvre opérationnelle</li><li>Ancrage et suivi</li></ul><p>Notre expérience montre que <b>la clé du succès</b> réside dans l'accompagnement humain autant que dans la méthode.</p>`,
  extrait: "Les enjeux clés pour les DRH marocains et nos recommandations concrètes issues de nos missions terrain.",
  statut: statutsA[i % statutsA.length],
  date: d(i * 3),
  tags: [tagsPool[i % tagsPool.length], tagsPool[(i + 3) % tagsPool.length], tagsPool[(i + 7) % tagsPool.length]],
  heure: `${9 + (i % 8)}:${((i * 15) % 60).toString().padStart(2, "0")}`,
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

// Editable editorial config (thematiques + topics to avoid)
export type EditorialConfig = { id: string; thematiques: string[]; topicsAvoid: string[] };
export const editorialConfigStore = createStore<EditorialConfig>([
  { id: "editorial", thematiques: [...thematiques], topicsAvoid: ["Politique partisane", "Religion", "Sujets polémiques non-RH", "Comparaisons directes concurrents"] },
]);


// ---------- Head Hunting missions ----------
export type HuntingMission = {
  id: string;
  poste: string;
  entreprise: string;
  seniorite: "Manager" | "Directeur" | "C-level" | "Expert";
  secteur: string;
  localisation: string;
  languages: string[];
  competencesCles: string[];
  entreprisesCibles: string[];
  entreprisesExclues: string[];
  fourchetteRemu: string;
  sources: { linkedin: boolean; facebook: boolean; web: boolean; rekrute?: boolean; indeed?: boolean; reseau?: boolean };
  motsClesLinkedin: string;
  urgence: "Standard" | "Prioritaire" | "Critique";
  statut: "En sourcing" | "En qualification" | "Shortlist" | "Livrée";
  profilsIdentifies: number;
  profilsQualifies: number;
  consultant: string;
  dateOuverture: string;
  echeance: string;
  briefing: string;
  // Extended flexibility fields
  formation?: string;
  ageMin?: number;
  ageMax?: number;
  experienceMin?: number;
  mobilite?: "Aucune" | "Nationale" | "Internationale" | "Négociable";
  disponibilite?: string;
  packageDetails?: string;
  avantages?: string[];
  discretion?: "Publique" | "Confidentielle" | "Ultra-confidentielle";
  livrablesAttendus?: string;
  criteresExclusion?: string;
  notesInternes?: string;
  scoringCriteria?: ScoringCriterion[];
};

export type ScoringCriterion = {
  id: string;
  label: string;
  poids: number; // 0-100
  type: "Compétence" | "Expérience" | "Formation" | "Soft skill" | "Localisation";
};

const seedHunting: HuntingMission[] = [
  { id: uid(), poste: "Directeur Financier", entreprise: "OCP Group", seniorite: "Directeur", secteur: "Industrie / Mines", localisation: "Casablanca", languages: ["Français", "Anglais"], competencesCles: ["IFRS", "M&A", "Reporting groupe", "SAP FI"], entreprisesCibles: ["Managem", "Cosumar", "Lafarge", "Holcim"], entreprisesExclues: ["Attijariwafa"], fourchetteRemu: "80-110k MAD brut/mois", sources: { linkedin: true, facebook: false, web: true }, motsClesLinkedin: "CFO DAF Groupe Maroc IFRS", urgence: "Prioritaire", statut: "En qualification", profilsIdentifies: 47, profilsQualifies: 12, consultant: "F.Z. Abbadi", dateOuverture: d(21), echeance: d(-30), briefing: "Recherche discrète — remplacement stratégique. Profil ayant piloté une fonction Finance dans un groupe multi-sites au Maroc." },
  { id: uid(), poste: "Directrice Marketing Digital", entreprise: "Inwi", seniorite: "Directeur", secteur: "Télécoms", localisation: "Casablanca / Rabat", languages: ["Français", "Anglais", "Arabe"], competencesCles: ["Growth", "Data marketing", "Brand", "Adtech"], entreprisesCibles: ["Orange", "Maroc Telecom", "L'Oréal", "Unilever"], entreprisesExclues: [], fourchetteRemu: "60-90k MAD brut/mois", sources: { linkedin: true, facebook: true, web: true }, motsClesLinkedin: "CMO Marketing Digital Growth Telecom FMCG", urgence: "Standard", statut: "Shortlist", profilsIdentifies: 63, profilsQualifies: 8, consultant: "M. Bennis", dateOuverture: d(35), echeance: d(-15), briefing: "Profil hybride marketing + data. Anglais courant obligatoire." },
  { id: uid(), poste: "CTO", entreprise: "FinTech Casablanca", seniorite: "C-level", secteur: "FinTech", localisation: "Casablanca", languages: ["Français", "Anglais"], competencesCles: ["Architecture cloud", "Scalabilité", "Cybersécurité", "Team building"], entreprisesCibles: ["CashPlus", "M2M", "HPS", "Attijariwafa Tech"], entreprisesExclues: [], fourchetteRemu: "100-140k MAD + BSPCE", sources: { linkedin: true, facebook: false, web: true }, motsClesLinkedin: "CTO VP Engineering FinTech AWS Kubernetes", urgence: "Critique", statut: "En sourcing", profilsIdentifies: 19, profilsQualifies: 3, consultant: "K. Hilali", dateOuverture: d(7), echeance: d(-45), briefing: "Startup en scale-up. Recherche profil ayant scalé une équipe tech de 5 à 40 personnes." },
  { id: uid(), poste: "DRH Groupe", entreprise: "Groupe agroalimentaire", seniorite: "Directeur", secteur: "Agroalimentaire", localisation: "Casablanca", languages: ["Français", "Anglais"], competencesCles: ["Transformation RH", "Négociation sociale", "SIRH", "Change"], entreprisesCibles: ["Centrale Danone", "Lesieur", "Cosumar", "Marjane"], entreprisesExclues: [], fourchetteRemu: "70-95k MAD brut/mois", sources: { linkedin: true, facebook: false, web: true }, motsClesLinkedin: "DRH HR Director Agro Industrie Maroc", urgence: "Standard", statut: "Livrée", profilsIdentifies: 89, profilsQualifies: 15, consultant: "F.Z. Abbadi", dateOuverture: d(60), echeance: d(-20), briefing: "Mission clôturée avec succès — 3 shortlistés, 1 recruté." },
  { id: uid(), poste: "Responsable Business Development Afrique", entreprise: "Cabinet international", seniorite: "Manager", secteur: "Conseil", localisation: "Casablanca (mobilité Afrique)", languages: ["Français", "Anglais"], competencesCles: ["BD B2B", "Afrique francophone", "Grands comptes", "Négociation"], entreprisesCibles: ["EY", "Deloitte", "KPMG", "Mazars"], entreprisesExclues: [], fourchetteRemu: "50-75k MAD + variable", sources: { linkedin: true, facebook: false, web: true }, motsClesLinkedin: "Business Development Manager Afrique Consulting", urgence: "Prioritaire", statut: "En sourcing", profilsIdentifies: 28, profilsQualifies: 6, consultant: "M. Bennis", dateOuverture: d(14), echeance: d(-30), briefing: "Mobilité fréquente Afrique de l'Ouest. Portefeuille clients existant apprécié." },
];

// ---------- Documents (base de connaissance) ----------
export type KbDocument = { id: string; nom: string; type: "PDF" | "DOCX" | "XLSX" | "PPTX"; taille: string; categorie: string; date: string; tags: string[] };
const seedDocs: KbDocument[] = [
  { id: uid(), nom: "Plaquette commerciale Be One 2026.pdf", type: "PDF", taille: "2.4 Mo", categorie: "Commercial", date: d(12), tags: ["plaquette", "présentation"] },
  { id: uid(), nom: "Méthodologie audit organisationnel.docx", type: "DOCX", taille: "845 Ko", categorie: "Méthodologie", date: d(30), tags: ["audit", "process"] },
  { id: uid(), nom: "Grille tarifaire Consulting 2026.xlsx", type: "XLSX", taille: "112 Ko", categorie: "Tarification", date: d(5), tags: ["tarif", "devis"] },
  { id: uid(), nom: "Charte engagements clients.pdf", type: "PDF", taille: "620 Ko", categorie: "Commercial", date: d(45), tags: ["charte", "qualité"] },
  { id: uid(), nom: "Catalogue formations certifiantes.pdf", type: "PDF", taille: "3.1 Mo", categorie: "Formation", date: d(20), tags: ["formation", "CSF"] },
  { id: uid(), nom: "Process bilan de compétences.docx", type: "DOCX", taille: "410 Ko", categorie: "Méthodologie", date: d(60), tags: ["bilan"] },
  { id: uid(), nom: "Kit onboarding nouveaux clients.pptx", type: "PPTX", taille: "5.8 Mo", categorie: "Commercial", date: d(3), tags: ["onboarding"] },
  { id: uid(), nom: "CGV Be One Consulting.pdf", type: "PDF", taille: "180 Ko", categorie: "Juridique", date: d(90), tags: ["CGV", "contrat"] },
];
export const documentsStore = createStore<KbDocument>(seedDocs);

// ---------- Social profiles ----------
export type SocialProfile = { id: string; reseau: "LinkedIn" | "Facebook" | "Instagram" | "YouTube" | "TikTok" | "Site web"; handle: string; url: string; abonnes: number; engagement: number; actif: boolean; description: string };
const seedSocial: SocialProfile[] = [
  { id: uid(), reseau: "LinkedIn", handle: "@beone-consulting", url: "https://linkedin.com/company/beone-consulting", abonnes: 4820, engagement: 6.2, actif: true, description: "Page entreprise officielle — publications hebdomadaires sur les tendances RH & Business Performance." },
  { id: uid(), reseau: "Facebook", handle: "@BeOneConsulting.ma", url: "https://facebook.com/BeOneConsulting.ma", abonnes: 12400, engagement: 3.8, actif: true, description: "Page grand public — offres d'emploi et articles de blog." },
  { id: uid(), reseau: "Instagram", handle: "@beone_consulting", url: "https://instagram.com/beone_consulting", abonnes: 3120, engagement: 5.1, actif: true, description: "Vie du cabinet, événements, marque employeur." },
  { id: uid(), reseau: "YouTube", handle: "Be One Consulting", url: "https://youtube.com/@beoneconsulting", abonnes: 640, engagement: 2.4, actif: true, description: "Interviews d'experts, webinaires enregistrés." },
  { id: uid(), reseau: "Site web", handle: "beone-consulting.com", url: "https://beone-consulting.com", abonnes: 0, engagement: 0, actif: true, description: "Site vitrine — formulaires de contact reliés à l'agent de qualification." },
];
export const socialStore = createStore<SocialProfile>(seedSocial);

// ---------- Services ----------
export type Service = { id: string; nom: string; famille: "Conseil" | "Recrutement" | "Formation" | "Assessment" | "Enquêtes"; description: string; duree: string; livrables: string[]; tarifIndicatif: string; actif: boolean };
const seedServices: Service[] = [
  { id: uid(), nom: "Audit organisationnel", famille: "Conseil", description: "Diagnostic complet de l'organisation, identification des leviers de performance et recommandations concrètes.", duree: "6 à 10 semaines", livrables: ["Rapport de diagnostic", "Plan d'action priorisé", "Restitution CoDir"], tarifIndicatif: "150-400k MAD", actif: true },
  { id: uid(), nom: "Chasse de tête cadres dirigeants", famille: "Recrutement", description: "Sourcing ciblé de profils rares et confidentiels via LinkedIn Recruiter et notre réseau propriétaire.", duree: "6 à 12 semaines", livrables: ["Shortlist 3-5 candidats", "Rapports d'entretien", "Assessment optionnel"], tarifIndicatif: "20-30% du package annuel", actif: true },
  { id: uid(), nom: "Recrutement par annonce", famille: "Recrutement", description: "Publication multicanal, tri, présélection et entretiens de qualification.", duree: "4 à 8 semaines", livrables: ["Shortlist", "CV commentés", "Rapports d'entretien"], tarifIndicatif: "15-20% du package annuel", actif: true },
  { id: uid(), nom: "Bilan de compétences", famille: "Assessment", description: "Accompagnement individuel en 3 phases pour clarifier un projet professionnel. Éligible CPF/CSF.", duree: "8 à 12 semaines (24h)", livrables: ["Document de synthèse", "Plan d'action personnel"], tarifIndicatif: "12-18k MAD / personne", actif: true },
  { id: uid(), nom: "Assessment center", famille: "Assessment", description: "Évaluation de potentiel via tests psychométriques, mises en situation et entretien approfondi.", duree: "1 journée + restitution", livrables: ["Rapport individuel", "Restitution manager"], tarifIndicatif: "8-15k MAD / candidat", actif: true },
  { id: uid(), nom: "Formation Leadership de proximité", famille: "Formation", description: "Parcours certifiant destiné aux managers de terrain — 4 modules de 2 jours.", duree: "8 jours répartis sur 3 mois", livrables: ["Certification", "Support pédagogique", "Coaching individuel 2h"], tarifIndicatif: "12-18k MAD / participant", actif: true },
  { id: uid(), nom: "Enquête de satisfaction client", famille: "Enquêtes", description: "Conception, diffusion, relance et synthèse d'enquêtes NPS / satisfaction B2B.", duree: "3 à 6 semaines", livrables: ["Rapport de synthèse", "Verbatims", "Recommandations"], tarifIndicatif: "50-120k MAD", actif: true },
  { id: uid(), nom: "Étude de marché sectorielle", famille: "Enquêtes", description: "Analyse concurrentielle, cartographie d'acteurs, insights terrain.", duree: "6 à 10 semaines", livrables: ["Rapport 40-80 pages", "Base concurrents", "Restitution"], tarifIndicatif: "180-450k MAD", actif: true },
];
export const servicesStore = createStore<Service>(seedServices);

// ---------- Contact bases for surveys ----------
export type ContactBase = { id: string; nom: string; description: string; nbContacts: number; source: string; derniereMaj: string };
const seedBases: ContactBase[] = [
  { id: uid(), nom: "Clients B2B — Grands comptes", description: "Interlocuteurs décisionnaires des 40 principaux clients Corp.", nbContacts: 187, source: "CRM HubSpot", derniereMaj: d(3) },
  { id: uid(), nom: "Collaborateurs — Groupe complet", description: "Base RH interne, tous sites confondus.", nbContacts: 642, source: "SIRH Talentia", derniereMaj: d(1) },
  { id: uid(), nom: "Candidats vivier 2025-2026", description: "Candidats qualifiés issus des campagnes de sourcing des 12 derniers mois.", nbContacts: 1_284, source: "CVthèque interne", derniereMaj: d(7) },
  { id: uid(), nom: "Anciens participants formations", description: "Participants à nos parcours certifiants leadership et RH.", nbContacts: 356, source: "LMS Be One Academy", derniereMaj: d(14) },
  { id: uid(), nom: "Prospects tièdes — Retail & FMCG", description: "Prospects ayant échangé avec l'équipe commerciale sans décision.", nbContacts: 92, source: "CRM HubSpot", derniereMaj: d(20) },
  { id: uid(), nom: "Écosystème RH Maroc", description: "DRH, DRHA, responsables talent management identifiés au Maroc.", nbContacts: 428, source: "LinkedIn Sales Nav", derniereMaj: d(9) },
];
export const contactBasesStore = createStore<ContactBase>(seedBases);

export const huntingStore = createStore<HuntingMission>(seedHunting);

// ---------- Article cover images (bundled assets) ----------
import articleCover1 from "@/assets/article-cover-1.jpg.asset.json";
import articleCover2 from "@/assets/article-cover-2.jpg.asset.json";
import articleCover3 from "@/assets/article-cover-3.jpg.asset.json";
import articleCover4 from "@/assets/article-cover-4.jpg.asset.json";
import articleCover5 from "@/assets/article-cover-5.jpg.asset.json";
import articleCover6 from "@/assets/article-cover-6.jpg.asset.json";
export const ARTICLE_IMAGES = [
  articleCover1.url,
  articleCover2.url,
  articleCover3.url,
  articleCover4.url,
  articleCover5.url,
  articleCover6.url,
  articleCover1.url,
  articleCover2.url,
  articleCover3.url,
  articleCover4.url,
  articleCover5.url,
  articleCover6.url,
];

// ---------- Demande AI qualification summary ----------
export function demandeResumeIA(d: Demande): { resume: string; infos: { label: string; value: string }[] } {
  const infos = [
    { label: "Type de prestation", value: d.type },
    { label: "Entreprise", value: d.entreprise },
    { label: "Canal d'entrée", value: d.canal },
    { label: "Budget indicatif", value: d.budget ?? "Non communiqué" },
    { label: "Horizon souhaité", value: d.delai ?? "Non précisé" },
    { label: "Décideur identifié", value: d.nom },
  ];
  if (d.posteRecherche) infos.push({ label: "Poste ciblé", value: d.posteRecherche });
  const resume = d.type === "Recrutement"
    ? `${d.nom} (${d.entreprise}) recherche un profil ${d.posteRecherche ?? "à définir"}. Budget ${d.budget ?? "à cadrer"}, démarrage ${d.delai ?? "à confirmer"}. Contact qualifié par l'agent IA — à rediriger vers l'équipe Recrutement.`
    : d.type === "Enquête"
      ? `Demande d'accompagnement pour une ${d.type.toLowerCase()} auprès de la base ${d.entreprise}. Budget estimé ${d.budget ?? "à définir"}. L'agent a identifié un besoin sur ${d.delai ?? "un trimestre"}.`
      : `Demande de ${d.type.toLowerCase()} de ${d.entreprise}. L'agent IA a qualifié le besoin : budget ${d.budget ?? "à définir"}, échéance ${d.delai ?? "flexible"}. Priorité ${d.priorite}.`;
  return { resume, infos };
}

// ---------- User management & permissions ----------
export const MODULES = ["dashboard", "demandes", "recrutement", "enquetes", "articles", "faq", "assistant", "utilisateurs"] as const;
export type ModuleKey = typeof MODULES[number];
export type CrudPerm = { read: boolean; create: boolean; update: boolean; delete: boolean };
export type Permissions = Record<ModuleKey, CrudPerm>;

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Tableau de bord",
  demandes: "Qualification AI",
  recrutement: "Recrutement AI",
  enquetes: "Enquêtes AI",
  articles: "Community Manager AI",
  faq: "Service Client AI",
  assistant: "Assistant AI",
  utilisateurs: "Utilisateurs",
};

export function allPerms(v: boolean): Permissions {
  return MODULES.reduce((acc, m) => {
    acc[m] = { read: v, create: v, update: v, delete: v };
    return acc;
  }, {} as Permissions);
}

export type Role = "Admin" | "Collaborateur";
export type AppUser = {
  id: string; nom: string; email: string; role: Role;
  fonction: string; actif: boolean; dateAjout: string;
  permissions: Permissions;
};

const seedUsers: AppUser[] = [
  { id: uid(), nom: "Fatima Zahra Abbadi", email: "admin@beone-consulting.com", role: "Admin", fonction: "Directrice Générale", actif: true, dateAjout: d(180), permissions: allPerms(true) },
  { id: uid(), nom: "Meriem Bennis", email: "m.bennis@beone-consulting.com", role: "Collaborateur", fonction: "Consultante Senior Recrutement", actif: true, dateAjout: d(90), permissions: { ...allPerms(false), dashboard: { read: true, create: false, update: false, delete: false }, assistant: { read: true, create: true, update: true, delete: true }, recrutement: allPerms(true).recrutement, demandes: { read: true, create: false, update: true, delete: false } } },
  { id: uid(), nom: "Karim Hilali", email: "k.hilali@beone-consulting.com", role: "Collaborateur", fonction: "Chef de projet Conseil", actif: true, dateAjout: d(45), permissions: { ...allPerms(false), dashboard: { read: true, create: false, update: false, delete: false }, assistant: { read: true, create: true, update: true, delete: true }, enquetes: allPerms(true).enquetes, demandes: { read: true, create: false, update: true, delete: false } } },
  { id: uid(), nom: "Sara Chraibi", email: "s.chraibi@beone-consulting.com", role: "Collaborateur", fonction: "Community Manager", actif: true, dateAjout: d(30), permissions: { ...allPerms(false), dashboard: { read: true, create: false, update: false, delete: false }, assistant: { read: true, create: true, update: true, delete: true }, articles: allPerms(true).articles, faq: { read: true, create: true, update: true, delete: false } } },
  { id: uid(), nom: "Anas Idrissi", email: "a.idrissi@beone-consulting.com", role: "Collaborateur", fonction: "Chargé service client", actif: false, dateAjout: d(15), permissions: { ...allPerms(false), dashboard: { read: true, create: false, update: false, delete: false }, assistant: { read: true, create: true, update: true, delete: true }, faq: allPerms(true).faq, demandes: { read: true, create: false, update: false, delete: false } } },
];
export const usersStore = createStore<AppUser>(seedUsers);

// Current logged-in user id (for permission gating in UI). Defaults to the admin.
let currentUserId: string = seedUsers[0].id;
const currentUserListeners = new Set<() => void>();
export const currentUser = {
  get: () => currentUserId,
  set: (id: string) => { currentUserId = id; currentUserListeners.forEach((l) => l()); },
  subscribe: (fn: () => void) => { currentUserListeners.add(fn); return () => currentUserListeners.delete(fn); },
};

// ---------- Evaluation criteria (used by Head Hunting for AI scoring) ----------
export type EvaluationCriterion = { id: string; nom: string; description: string; poids: number; requis: boolean };
export const DEFAULT_EVAL_CRITERIA: EvaluationCriterion[] = [
  { id: uid(), nom: "Adéquation au poste", description: "Correspondance avec la description de poste et le contexte.", poids: 35, requis: true },
  { id: uid(), nom: "Expérience sectorielle", description: "Années d'expérience dans un secteur comparable.", poids: 25, requis: true },
  { id: uid(), nom: "Soft skills", description: "Leadership, communication, capacité d'influence.", poids: 20, requis: false },
  { id: uid(), nom: "Formation & langues", description: "Diplôme, école, maîtrise linguistique.", poids: 20, requis: false },
];


// ---------- Community Manager: Social Posts ----------
export type SocialPlatform = "LinkedIn" | "Facebook" | "Instagram" | "YouTube";
export type PostMedia = { id: string; kind: "image" | "video"; url: string; alt?: string; description?: string; reference?: string; prompt?: string };
export type PostPlatformConfig = Record<string, string | number>;
export type SocialPost = {
  id: string;
  titre: string;
  caption: string;
  hashtags: string[];
  media: PostMedia[];
  platforms: SocialPlatform[];
  platformConfig: Partial<Record<SocialPlatform, PostPlatformConfig>>;
  statut: "Brouillon" | "Planifié" | "Publié";
  date: string;
  heure?: string;
  auteur: "IA" | "Manuel";
  langue: string;
  ton: string;
  aiParams?: Record<string, string | number>;
};

import postImage1 from "@/assets/post-1.jpg.asset.json";
import postImage2 from "@/assets/post-2.jpg.asset.json";
import postImage3 from "@/assets/post-3.jpg.asset.json";
import postImage4 from "@/assets/post-4.jpg.asset.json";
const POST_IMAGES = [postImage1.url, postImage2.url, postImage3.url, postImage4.url];
const seedPosts: SocialPost[] = [
  { id: uid(), titre: "Lancement programme leadership", caption: "Fiers de lancer notre nouveau programme Leadership de proximité 🚀 8 jours pour transformer vos managers.", hashtags: ["#Leadership", "#RH", "#Maroc"], media: [{ id: uid(), kind: "image", url: POST_IMAGES[0] }], platforms: ["LinkedIn", "Facebook"], platformConfig: { LinkedIn: { tone: "Professionnel", cta: "En savoir plus", paragraphes: "Court" }, Facebook: { style: "Storytelling", cta: "Contactez-nous" } }, statut: "Publié", date: d(2), heure: "10:00", auteur: "IA", langue: "Français", ton: "Professionnel" },
  { id: uid(), titre: "Coulisses de notre équipe", caption: "Retour en images sur notre séminaire annuel — merci à toute l'équipe Be One ! ✨", hashtags: ["#TeamSpirit", "#BeOne", "#Consulting"], media: [{ id: uid(), kind: "image", url: POST_IMAGES[1] }, { id: uid(), kind: "image", url: POST_IMAGES[2] }], platforms: ["Instagram", "Facebook"], platformConfig: { Instagram: { captionLength: 120, emojiDensity: "Élevée", hashtagCount: 12 }, Facebook: { style: "Conversationnel" } }, statut: "Planifié", date: d(-3), heure: "18:30", auteur: "Manuel", langue: "Français", ton: "Chaleureux" },
  { id: uid(), titre: "Webinaire transformation RH", caption: "Rejoignez notre webinaire exclusif sur la transformation RH — inscription ouverte !", hashtags: ["#Webinaire", "#TransformationRH"], media: [{ id: uid(), kind: "image", url: POST_IMAGES[3] }], platforms: ["LinkedIn", "YouTube"], platformConfig: { LinkedIn: { tone: "Expert", cta: "S'inscrire" }, YouTube: { titre: "Webinaire — Transformation RH 2026", description: "Session complète", tags: "RH,transformation,2026", thumbnailPrompt: "Podium moderne, éclairage doré" } }, statut: "Brouillon", date: d(0), auteur: "IA", langue: "Français", ton: "Expert" },
];
export const postsStore = createStore<SocialPost>(seedPosts);

export const PLATFORM_META: Record<SocialPlatform, { color: string; bg: string }> = {
  LinkedIn: { color: "text-sky-700 dark:text-sky-300", bg: "bg-sky-500/15 border-sky-500/30" },
  Facebook: { color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-500/15 border-blue-500/30" },
  Instagram: { color: "text-pink-700 dark:text-pink-300", bg: "bg-pink-500/15 border-pink-500/30" },
  YouTube: { color: "text-red-700 dark:text-red-300", bg: "bg-red-500/15 border-red-500/30" },
};

// ---------- Assistant AI: meetings & reminders ----------
export type MeetingProvider = "Google Meet" | "Zoom" | "Microsoft Teams";
export type Meeting = {
  id: string;
  titre: string;
  description: string;
  participants: string[];
  dateHeure: string; // ISO local minute
  duree: number; // minutes
  provider: MeetingProvider;
  meetingLink: string;
  notes: string;
  attachments: string[];
  reminderStatus: "Programmé" | "Envoyé" | "Confirmé" | "Manqué";
  reminders: string[]; // ["5min", "1h", "1j"]
  importance: "Normale" | "Haute" | "Critique";
  source: "Manuel" | "Email" | "WhatsApp";
};

function isoMin(days: number, h: number, m: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  dt.setHours(h, m, 0, 0);
  return dt.toISOString().slice(0, 16);
}

const seedMeetings: Meeting[] = [
  { id: uid(), titre: "Kick-off mission OCP", description: "Cadrage et validation du planning de la mission audit organisationnel.", participants: ["F.Z. Abbadi", "Karim Hilali", "S. Bennani (OCP)"], dateHeure: isoMin(0, 14, 0), duree: 60, provider: "Microsoft Teams", meetingLink: "https://teams.microsoft.com/l/meetup-join/xyz", notes: "Préparer la présentation cadrage.", attachments: ["Cadrage_OCP.pdf"], reminderStatus: "Programmé", reminders: ["30min", "1h"], importance: "Haute", source: "Email" },
  { id: uid(), titre: "Entretien candidat DRH Cosumar", description: "Second entretien candidate présélectionnée.", participants: ["M. Bennis", "N. Alaoui"], dateHeure: isoMin(1, 10, 30), duree: 45, provider: "Google Meet", meetingLink: "https://meet.google.com/abc-defg-hij", notes: "Focus sur la conduite de changement.", attachments: [], reminderStatus: "Programmé", reminders: ["15min"], importance: "Normale", source: "Manuel" },
  { id: uid(), titre: "Restitution enquête satisfaction", description: "Restitution des résultats au comité de pilotage.", participants: ["F.Z. Abbadi", "K. Hilali", "Comité OCP"], dateHeure: isoMin(2, 15, 0), duree: 90, provider: "Zoom", meetingLink: "https://zoom.us/j/1234567890", notes: "Slides V3 à envoyer 24h avant.", attachments: ["Rapport_enquete_v3.pdf"], reminderStatus: "Programmé", reminders: ["1j", "1h"], importance: "Critique", source: "WhatsApp" },
  { id: uid(), titre: "Point suivi hebdo équipe", description: "Point d'équipe hebdomadaire.", participants: ["Toute l'équipe"], dateHeure: isoMin(-1, 9, 0), duree: 30, provider: "Google Meet", meetingLink: "https://meet.google.com/team-weekly", notes: "", attachments: [], reminderStatus: "Manqué", reminders: ["10min"], importance: "Normale", source: "Manuel" },
  { id: uid(), titre: "RDV client Attijariwafa", description: "Présentation de la proposition commerciale.", participants: ["F.Z. Abbadi", "Client Attijariwafa"], dateHeure: isoMin(3, 11, 0), duree: 60, provider: "Microsoft Teams", meetingLink: "https://teams.microsoft.com/l/attijari", notes: "Vérifier la disponibilité de la salle.", attachments: ["Proposition_v2.pdf"], reminderStatus: "Confirmé", reminders: ["1j", "1h", "15min"], importance: "Haute", source: "Email" },
  // Duplicate detector demo
  { id: uid(), titre: "RDV client Attijariwafa", description: "Doublon à supprimer.", participants: ["F.Z. Abbadi"], dateHeure: isoMin(3, 11, 0), duree: 60, provider: "Zoom", meetingLink: "https://zoom.us/dup", notes: "", attachments: [], reminderStatus: "Programmé", reminders: ["1h"], importance: "Normale", source: "Manuel" },
];
export const meetingsStore = createStore<Meeting>(seedMeetings);

export type AssistantConfig = {
  id: string;
  langue: "Français" | "English" | "العربية";
  timings: string[];
  provider: MeetingProvider;
  notifyAll: boolean;
  whatsappDelivery: boolean;
  autoFromEmail: boolean;
  autoFromWhatsapp: boolean;
};
export const assistantConfigStore = createStore<AssistantConfig>([
  { id: "assistant", langue: "Français", timings: ["10min", "1h", "1j"], provider: "Google Meet", notifyAll: true, whatsappDelivery: true, autoFromEmail: true, autoFromWhatsapp: true },
]);


// ---------- Community Manager: per-platform AI configuration ----------
export type CmPlatform = "Website" | "Facebook" | "Instagram" | "LinkedIn" | "YouTube";
export type CmPlatformConfig = { id: string; platform: CmPlatform; settings: Record<string, string | number | boolean> };

const defaultCmConfigs: CmPlatformConfig[] = [
  { id: "cm-website", platform: "Website", settings: {
    langue: "Français", ton: "Professionnel", longueur: "Moyen (700-1200)", seoLevel: "Élevé",
    keywordDensity: 2, audience: "DRH & dirigeants", style: "Éditorial", cta: "Contactez-nous",
    auteur: "IA", categorie: "RH & Management", creativite: 60,
    includeConclusion: true, includeFaq: false, generateSeoTitle: true, generateSeoDescription: true,
    generateTags: true, generateCover: true,
  } },
  { id: "cm-facebook", platform: "Facebook", settings: {
    captionLength: 220, emojiUsage: "Moyenne", hashtagCount: 4, ctaStyle: "Interrogatif",
    tone: "Conversationnel", storytellingLevel: "Moyen",
  } },
  { id: "cm-instagram", platform: "Instagram", settings: {
    captionLength: 150, hashtagCount: 15, emojiDensity: "Élevée", tone: "Chaleureux",
    cta: "Lien en bio", imageFirst: true,
  } },
  { id: "cm-linkedin", platform: "LinkedIn", settings: {
    tone: "Professionnel", paragraphs: "Court (1-2 lignes)", cta: "En savoir plus",
    hashtagStrategy: "3-5 ciblés", audience: "Cadres & décideurs",
  } },
  { id: "cm-youtube", platform: "YouTube", settings: {
    titleStyle: "Accrocheur", descriptionLength: "Long", tags: "RH, formation, leadership",
    thumbnailPrompt: "Style corporate premium éclairage doré", ctaPlacement: "Début & fin",
  } },
];
export const cmConfigStore = createStore<CmPlatformConfig>(defaultCmConfigs);

// ---------- Community Manager: AI Post Ideas ----------
export type PostIdea = {
  id: string; titre: string; description: string; suggestedCaption: string;
  mediaConcept: string; hashtags: string[]; platforms: SocialPlatform[];
  suggestedDate: string; saved?: boolean;
};
const seedIdeas: PostIdea[] = [
  { id: uid(), titre: "5 signaux d'un manager en burnout", description: "Sensibiliser les DRH aux signaux faibles du burnout managérial.", suggestedCaption: "Reconnaissez-vous ces 5 signaux d'alerte chez vos managers ? Un thread pour agir avant qu'il ne soit trop tard 🧠", mediaConcept: "Carousel de 5 slides infographiques, palette sobre.", hashtags: ["#Burnout", "#Management", "#RH"], platforms: ["LinkedIn", "Instagram"], suggestedDate: d(-3) },
  { id: uid(), titre: "Coulisses — préparation d'un assessment", description: "Behind-the-scenes de notre process assessment center.", suggestedCaption: "Ce que vous ne voyez pas d'un assessment center chez Be One ✨", mediaConcept: "Reel 30s ambiance workshop, coupes rapides.", hashtags: ["#BeOne", "#Assessment", "#Coulisses"], platforms: ["Instagram", "Facebook"], suggestedDate: d(-5) },
  { id: uid(), titre: "Étude — Rémunération 2026 au Maroc", description: "Chiffres clés de l'étude rémunération marché marocain.", suggestedCaption: "Notre étude Rémunération 2026 est disponible : découvrez les tendances par secteur au Maroc 📊", mediaConcept: "Image cover + graphique barres.", hashtags: ["#Remuneration", "#Maroc", "#Etude"], platforms: ["LinkedIn"], suggestedDate: d(-7) },
  { id: uid(), titre: "Interview — Directeur Talent Cosumar", description: "Format vidéo interview client sur la transformation RH.", suggestedCaption: "« La donnée RH n'est utile que si elle sert la décision. » Rencontre avec le Directeur Talent de Cosumar 🎥", mediaConcept: "Vidéo interview 2min + miniature portrait.", hashtags: ["#Interview", "#TalentManagement"], platforms: ["YouTube", "LinkedIn"], suggestedDate: d(-10) },
  { id: uid(), titre: "Webinaire : réussir l'onboarding hybride", description: "Promotion du webinaire onboarding hybride.", suggestedCaption: "Save the date : notre webinaire onboarding hybride, jeudi prochain à 14h — inscription gratuite.", mediaConcept: "Visuel événementiel + compte à rebours.", hashtags: ["#Webinaire", "#Onboarding"], platforms: ["LinkedIn", "Facebook"], suggestedDate: d(-2) },
  { id: uid(), titre: "Chiffres clés — engagement collaborateur", description: "Micro-carousel data sur l'engagement.", suggestedCaption: "Seulement 21% des collaborateurs se disent engagés au travail. Voici ce que la data nous apprend 👇", mediaConcept: "Carousel data 4 slides.", hashtags: ["#Engagement", "#DataRH"], platforms: ["LinkedIn", "Instagram"], suggestedDate: d(-4) },
];
export const postIdeasStore = createStore<PostIdea>(seedIdeas);

// ---------- Community Manager: AI Article Ideas ----------
export type ArticleIdea = {
  id: string; titre: string; description: string; suggestedExtrait: string;
  angle: string; keywords: string[]; thematique: string; longueur: string;
  suggestedDate: string; saved?: boolean;
};
const seedArticleIdeas: ArticleIdea[] = [
  { id: uid(), titre: "Leadership de proximité : le nouveau standard managérial", description: "Article de fond sur l'évolution du rôle du manager de proximité au Maroc.", suggestedExtrait: "Comment les managers de proximité deviennent le pivot silencieux de la performance et de l'engagement en 2026.", angle: "Analytique — décryptage tendances + cas terrain marocains.", keywords: ["Leadership", "Management", "Proximité", "Maroc"], thematique: "Leadership", longueur: "Long (1500+)", suggestedDate: d(-2) },
  { id: uid(), titre: "IA et RH : 7 usages concrets déjà déployés chez nos clients", description: "Tour d'horizon des cas d'usage IA en RH au Maroc.", suggestedExtrait: "De la présélection CV à la prédiction du turnover, l'IA n'est plus un buzzword — voici 7 usages concrets.", angle: "Retour d'expérience — cas clients anonymisés.", keywords: ["IA", "RH", "Automatisation", "Analytics"], thematique: "Innovation RH", longueur: "Moyen (700-1200)", suggestedDate: d(-4) },
  { id: uid(), titre: "Rémunération 2026 : les nouvelles règles du jeu", description: "Décryptage de l'étude annuelle rémunération Be One.", suggestedExtrait: "Inflation, guerre des talents, transparence salariale : comment ajuster votre politique de rémunération.", angle: "Étude chiffrée — extraits de notre étude marché.", keywords: ["Rémunération", "Benchmark", "Maroc", "Talents"], thematique: "Compensation & Benefits", longueur: "Long (1500+)", suggestedDate: d(-6) },
  { id: uid(), titre: "Onboarding hybride : le guide en 30 jours", description: "Guide pratique onboarding hybride.", suggestedExtrait: "Un plan jour par jour pour transformer les 30 premiers jours en levier de fidélisation.", angle: "Pédagogique — guide actionnable étape par étape.", keywords: ["Onboarding", "Hybride", "Expérience collaborateur"], thematique: "Expérience collaborateur", longueur: "Moyen (700-1200)", suggestedDate: d(-3) },
  { id: uid(), titre: "Prévenir le burnout managérial : 5 signaux à ne pas ignorer", description: "Article sensibilisation burnout des managers.", suggestedExtrait: "Reconnaître les signaux faibles chez vos managers avant qu'il ne soit trop tard.", angle: "Inspirationnel — témoignages + recommandations.", keywords: ["Burnout", "Bien-être", "Management"], thematique: "Bien-être au travail", longueur: "Moyen (700-1200)", suggestedDate: d(-5) },
  { id: uid(), titre: "Marque employeur : ce que la génération Z attend vraiment", description: "Étude comportementale Gen Z au travail.", suggestedExtrait: "Sens, flexibilité, apprentissage : les 3 piliers non-négociables de la Gen Z marocaine.", angle: "Analytique — data étude + verbatims.", keywords: ["Marque employeur", "Gen Z", "Attractivité"], thematique: "Marque employeur", longueur: "Long (1500+)", suggestedDate: d(-8) },
];
export const articleIdeasStore = createStore<ArticleIdea>(seedArticleIdeas);
