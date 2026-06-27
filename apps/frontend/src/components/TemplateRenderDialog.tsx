import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchAvatars,
  renderTemplate as renderTemplateApi,
  type Avatar,
  type Template,
  type TemplateRender,
} from "@/lib/api";

interface Props {
  template: Template;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRendered: (render: TemplateRender) => void;
}

export function TemplateRenderDialog({ template, open, onOpenChange, onRendered }: Props) {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    fetchAvatars()
      .then(setAvatars)
      .catch((err) => setError(err.message));
  }, [open]);

  const slots = Array.from({ length: template.avatarSlots }, (_, i) => i);

  function setSlot(i: number, avatarId: string) {
    setSelected((prev) => {
      const next = [...prev];
      next[i] = avatarId;
      return next;
    });
  }

  async function handleGenerate() {
    setError(null);
    const ids = slots.map((i) => selected[i]);
    if (ids.some((id) => !id)) {
      setError(`Pick an avatar for each of the ${template.avatarSlots} slot(s).`);
      return;
    }
    setSubmitting(true);
    try {
      const render = await renderTemplateApi(template.id, ids as string[]);
      onRendered(render);
      onOpenChange(false);
      setSelected([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate video");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate “{template.name}”</DialogTitle>
          <DialogDescription>
            Choose {template.avatarSlots === 1 ? "an avatar" : `${template.avatarSlots} avatars`} to
            star in your version of this video.
          </DialogDescription>
        </DialogHeader>

        {avatars.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You don&apos;t have any avatars yet. Create one on the Avatar page first.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {slots.map((i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Label>Avatar {template.avatarSlots > 1 ? i + 1 : ""}</Label>
                <Select value={selected[i] ?? ""} onValueChange={(v) => setSlot(i, v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an avatar" />
                  </SelectTrigger>
                  <SelectContent>
                    {avatars.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleGenerate} disabled={submitting || avatars.length === 0}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating… this can take several minutes
            </>
          ) : (
            "Generate my video"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
