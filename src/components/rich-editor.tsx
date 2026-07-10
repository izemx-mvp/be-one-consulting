import { useEffect, useRef } from "react";
import { Bold, Italic, Heading2, List, ListOrdered, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RichEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value]);
  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };
  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <div className="flex items-center gap-1 border-b p-1 bg-muted/50">
        <Button type="button" size="icon" variant="ghost" onClick={() => exec("bold")}><Bold className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => exec("italic")}><Italic className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => exec("formatBlock", "H2")}><Heading2 className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => exec("insertUnorderedList")}><List className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => exec("insertOrderedList")}><ListOrdered className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => { const u = prompt("URL du lien ?"); if (u) exec("createLink", u); }}><Link2 className="h-4 w-4" /></Button>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="p-4 min-h-[220px] prose prose-sm dark:prose-invert max-w-none focus:outline-none [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-[color:var(--gold-foreground)] [&_a]:underline"
        suppressContentEditableWarning
      />
    </div>
  );
}
