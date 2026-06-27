import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileField } from "@/components/FileField";
import { createAvatar, type Avatar } from "@/lib/api";

interface Props {
  onCreated: (avatar: Avatar) => void;
}

export function AvatarForm({ onCreated }: Props) {
  const [name, setName] = useState("");
  const [photo1, setPhoto1] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !photo1) {
      setError("A name and at least one photo are required.");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("name", name);
      form.append("images", photo1);
      if (photo2) form.append("images", photo2);
      const avatar = await createAvatar(form);
      onCreated(avatar);
      setName("");
      setPhoto1(null);
      setPhoto2(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create avatar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-xl gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="avatar-name">Avatar name</Label>
        <Input
          id="avatar-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Me, on stage"
        />
      </div>
      <FileField
        label="Photo 1 (required)"
        hint="A clear, front-facing photo of the person"
        file={photo1}
        onChange={setPhoto1}
      />
      <FileField
        label="Photo 2 (optional)"
        hint="A second angle helps consistency"
        file={photo2}
        onChange={setPhoto2}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Creating…
          </>
        ) : (
          "Create avatar"
        )}
      </Button>
    </form>
  );
}
