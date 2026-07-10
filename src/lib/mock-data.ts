import { useSyncExternalStore } from "react";

// Generic in-memory store with subscriptions, so tables reflect CRUD instantly.
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
export type Demande = {
  id: string; nom: string; entreprise: string;
  type: "Conseil" | "Recrutement" | "Formation" | "Enquête" | "Assessment";
  date: string; statut: "Nouveau" | "En cours" | "Traité" | "Redirigé";
  email: string; telephone: string; message: string;
};

export type Candidat = {
  id: string; nom: string; poste: string;
  source: "LinkedIn" | "Facebook" | "Instagram";
  score: number;
  statut: "Nouveau" | "Présélectionné" | "Entretien" | "Rejeté" | "Recruté";
  email: string; telephone: string;
};

export type Enquete = {
  id: string; client: string;
  type: "Enquête satisfaction" | "Étude de marché" | "Audit organisationnel";
  envoyees: number; reponses: number; dateLancement: string;
  statut: "En cours" | "Terminé" | "En attente de relance";
};

export type RendezVous = {
  id: string; contact: string; typeRdv: string; dateHeure: string;
  canal: "WhatsApp"; statutRappel: "Envoyé" | "Programmé" | "Non envoyé";
  notes: string;
};

export type Article = {
  id: string; titre: string; thematique: string;
  auteur: "IA" | "Manuel"; contenu: string;
  statut: "Brouillon" | "En attente de validation" | "Publié";
  date: string;
};

export type FaqItem = {
  id: string; categorie: string; question: string; reponse: string;
};

// ---------- Mock seeds ----------
const entreprises = ["OCP Group", "Attijariwafa Bank", "Maroc Telecom", "BMCE Bank", "Royal Air Maroc", "Cosumar", "Lydec", "Managem", "CIH Bank", "Marsa Maroc", "Marjane", "Label'Vie", "Wafa Assurance", "Inwi", "Renault Maroc"];
const noms = ["Yassine El Amrani", "Salma Bennani", "Karim Ouazzani", "Nadia Alaoui", "Mehdi Tazi", "Imane Fassi", "Omar Benjelloun", "Sara Chraibi", "Hicham Berrada", "Leila Kettani", "Reda Sqalli", "Amina Bouchentouf", "Anas Idrissi", "Ghita Lahlou", "Youssef Berrada", "Rania Ziani", "Hamza El Khatib", "Meryem Naciri", "Adil Rachidi", "Sofia Amrani"];

const typesD: Demande["type"][] = ["Conseil", "Recrutement", "Formation", "Enquête", "Assessment"];
const statutsD: Demande["statut"][] = ["Nouveau", "En cours", "Traité", "Redirigé"];
const postes = ["Directeur RH", "Consultant Senior", "Chargé de recrutement", "Chef de projet", "Business Analyst", "Responsable formation", "Talent Manager", "Data Analyst", "Coach en transformation", "Directeur commercial"];

function d(days: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() - days);
  return dt.toISOString().slice(0, 10);
}

const seedDemandes: Demande[] = Array.from({ length: 22 }, (_, i) => ({
  id: uid(),
  nom: noms[i % noms.length],
  entreprise: entreprises[i % entreprises.length],
  type: typesD[i % typesD.length],
  date: d(i * 2),
  statut: statutsD[i % statutsD.length],
  email: `contact${i + 1}@${entreprises[i % entreprises.length].toLowerCase().replace(/[^a-z]/g, "")}.ma`,
  telephone: `+2126${String(10000000 + i * 12345).slice(0, 8)}`,
  message: "Demande d'accompagnement dans un projet de transformation RH.",
}));

const sources: Candidat["source"][] = ["LinkedIn", "Facebook", "Instagram"];
const statutsC: Candidat["statut"][] = ["Nouveau", "Présélectionné", "Entretien", "Rejeté", "Recruté"];
const seedCandidats: Candidat[] = Array.from({ length: 24 }, (_, i) => ({
  id: uid(),
  nom: noms[(i + 3) % noms.length],
  poste: postes[i % postes.length],
  source: sources[i % sources.length],
  score: 50 + ((i * 7) % 50),
  statut: statutsC[i % statutsC.length],
  email: `candidat${i + 1}@gmail.com`,
  telephone: `+2126${String(20000000 + i * 33333).slice(0, 8)}`,
}));

const typesE: Enquete["type"][] = ["Enquête satisfaction", "Étude de marché", "Audit organisationnel"];
const statutsE: Enquete["statut"][] = ["En cours", "Terminé", "En attente de relance"];
const seedEnquetes: Enquete[] = Array.from({ length: 18 }, (_, i) => {
  const envoyees = 50 + i * 15;
  return {
    id: uid(),
    client: entreprises[i % entreprises.length],
    type: typesE[i % typesE.length],
    envoyees,
    reponses: Math.floor(envoyees * (0.3 + ((i % 5) * 0.1))),
    dateLancement: d(i * 5),
    statut: statutsE[i % statutsE.length],
  };
});

const typesR = ["Entretien candidat", "Réunion client", "Kick-off projet", "Restitution audit", "Point suivi"];
const statutsR: RendezVous["statutRappel"][] = ["Envoyé", "Programmé", "Non envoyé"];
const seedRdv: RendezVous[] = Array.from({ length: 20 }, (_, i) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + (i - 5));
  dt.setHours(9 + (i % 8), (i * 15) % 60);
  return {
    id: uid(),
    contact: noms[i % noms.length],
    typeRdv: typesR[i % typesR.length],
    dateHeure: dt.toISOString().slice(0, 16),
    canal: "WhatsApp",
    statutRappel: statutsR[i % statutsR.length],
    notes: "Confirmer la présence 24h avant.",
  };
});

const thematiques = ["Ressources Humaines", "Recrutement", "Transformation", "Leadership", "Formation", "Business Performance"];
const statutsA: Article["statut"][] = ["Brouillon", "En attente de validation", "Publié"];
const titresA = [
  "5 tendances RH à surveiller au Maroc en 2026",
  "Comment structurer un plan de succession",
  "Attirer les talents de la Gen Z",
  "L'IA au service du recrutement",
  "Réussir sa transformation digitale RH",
  "Marque employeur : les fondamentaux",
  "Onboarding : les 30 premiers jours",
  "Mesurer l'engagement collaborateur",
  "Diversité et inclusion en entreprise",
  "Développer le leadership de proximité",
  "Refonte des processus RH : par où commencer",
  "Formation continue : ROI et bonnes pratiques",
  "Piloter la performance individuelle",
  "Repenser l'expérience collaborateur",
  "Guide de l'audit organisationnel",
  "Négocier un package d'embauche",
  "Gérer les talents à haut potentiel",
  "Culture d'entreprise et fusion-acquisition",
];
const seedArticles: Article[] = titresA.map((t, i) => ({
  id: uid(),
  titre: t,
  thematique: thematiques[i % thematiques.length],
  auteur: i % 2 === 0 ? "IA" : "Manuel",
  contenu: `${t}\n\nDans cet article, nous explorons les enjeux clés pour les DRH marocains et proposons des recommandations concrètes issues de nos missions terrain.`,
  statut: statutsA[i % statutsA.length],
  date: d(i * 3),
}));

const categoriesFaq = ["Recrutement", "Conseil & Stratégie", "Formation", "Facturation", "Général"];
const faqSeed: Array<Omit<FaqItem, "id">> = [
  { categorie: "Recrutement", question: "Comment déposer ma candidature ?", reponse: "Rendez-vous sur notre page Carrières, sélectionnez le poste qui vous intéresse et téléchargez votre CV. Notre équipe revient vers vous sous 5 jours ouvrés." },
  { categorie: "Recrutement", question: "Quels types de postes recrutez-vous ?", reponse: "Nous recrutons principalement des profils cadres et cadres supérieurs pour nos clients : DRH, consultants, chefs de projet, directeurs commerciaux." },
  { categorie: "Recrutement", question: "Puis-je faire une candidature spontanée ?", reponse: "Oui. Envoyez CV et lettre à recrutement@beone-consulting.com en précisant votre domaine d'expertise." },
  { categorie: "Conseil & Stratégie", question: "Quels sont vos délais pour un audit organisationnel ?", reponse: "Un audit organisationnel dure en moyenne 6 à 10 semaines selon la taille de l'entreprise et le périmètre défini avec le client." },
  { categorie: "Conseil & Stratégie", question: "Comment fonctionne l'accompagnement en transformation RH ?", reponse: "Nous procédons en 4 phases : diagnostic, cadrage stratégique, mise en œuvre opérationnelle et ancrage. Chaque phase est jalonnée avec le comité de pilotage." },
  { categorie: "Conseil & Stratégie", question: "Intervenez-vous en dehors de Casablanca ?", reponse: "Oui, nous intervenons dans tout le Maroc et en Afrique francophone (Sénégal, Côte d'Ivoire, Tunisie)." },
  { categorie: "Formation", question: "Vos formations sont-elles certifiantes ?", reponse: "Nous proposons des parcours certifiants en leadership, management de projet et transformation RH, en partenariat avec des organismes reconnus." },
  { categorie: "Formation", question: "Peut-on organiser une formation intra-entreprise ?", reponse: "Oui, la majorité de nos programmes est déclinable en intra, sur mesure selon vos enjeux et votre culture." },
  { categorie: "Formation", question: "Les formations sont-elles éligibles CSF ?", reponse: "Oui, la plupart de nos formations sont éligibles au remboursement CSF via l'OFPPT." },
  { categorie: "Facturation", question: "Quels moyens de paiement acceptez-vous ?", reponse: "Virement bancaire, chèque et prélèvement. Nos factures sont émises en dirhams (MAD)." },
  { categorie: "Facturation", question: "Quels sont vos délais de règlement ?", reponse: "Nos conditions standard sont à 30 jours nets fin de mois, sauf accord contractuel spécifique." },
  { categorie: "Général", question: "Où se trouve votre bureau ?", reponse: "Notre siège est à Casablanca, quartier Sidi Maârouf. Un espace de travail est également disponible sur rendez-vous à Rabat." },
  { categorie: "Général", question: "Comment prendre rendez-vous avec un consultant ?", reponse: "Contactez-nous via le formulaire du site ou par WhatsApp au +212 6 00 00 00 00. Un rappel est planifié sous 48h." },
  { categorie: "Général", question: "Qui est Fatima Zahra Abbadi ?", reponse: "Fondatrice de Be One Consulting, Fatima Zahra Abbadi accompagne depuis plus de 15 ans les entreprises marocaines dans leurs projets RH et de performance." },
  { categorie: "Général", question: "Quelles sont vos références clients ?", reponse: "Nous collaborons avec de grandes entreprises marocaines dans la banque, l'assurance, l'industrie, la distribution et les télécoms. Références détaillées sur demande." },
];
const seedFaq: FaqItem[] = faqSeed.map((f) => ({ id: uid(), ...f }));

export const demandesStore = createStore<Demande>(seedDemandes);
export const candidatsStore = createStore<Candidat>(seedCandidats);
export const enquetesStore = createStore<Enquete>(seedEnquetes);
export const rdvStore = createStore<RendezVous>(seedRdv);
export const articlesStore = createStore<Article>(seedArticles);
export const faqStore = createStore<FaqItem>(seedFaq);

export const FAQ_CATEGORIES = categoriesFaq;
export const THEMATIQUES = thematiques;
