import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warn" | "info" | "danger" | "muted" | "gold";

const tones: Record<Tone, string> = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  warn: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  info: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  danger: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  muted: "bg-muted text-muted-foreground",
  gold: "bg-[color:var(--gold)]/20 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const map: Record<string, Tone> = {
    "Nouveau": "info",
    "En cours": "warn",
    "Traité": "success",
    "Redirigé": "muted",
    "Présélectionné": "info",
    "Entretien": "warn",
    "Rejeté": "danger",
    "Recruté": "success",
    "Terminé": "success",
    "En attente de relance": "warn",
    "Envoyé": "success",
    "Programmé": "info",
    "Non envoyé": "danger",
    "Brouillon": "muted",
    "En attente de validation": "warn",
    "Publié": "success",
  };
  const tone = map[status] ?? "default";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>
      {status}
    </span>
  );
}
