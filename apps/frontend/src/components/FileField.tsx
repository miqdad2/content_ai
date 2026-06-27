import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  label: string;
  hint: string;
  file: File | null;
  onChange: (f: File | null) => void;
}

/** Single-image file picker with a label and a hint/filename line. Reused across forms. */
export function FileField({ label, hint, file, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
      <p className="text-xs text-muted-foreground">{file ? file.name : hint}</p>
    </div>
  );
}
