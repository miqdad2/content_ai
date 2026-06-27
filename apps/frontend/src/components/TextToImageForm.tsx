import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createImage, fetchImageModels, type GenerationModel, type Image } from "@/lib/api";

const FALLBACK_RESOLUTIONS = ["512", "1K", "2K", "4K"];
const FALLBACK_ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];

interface Props {
  onCreated: (image: Image) => void;
}

export function TextToImageForm({ onCreated }: Props) {
  const [models, setModels] = useState<GenerationModel[]>([]);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const [model, setModel] = useState("");
  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState("");
  const [aspectRatio, setAspectRatio] = useState("");
  const [referenceImages, setReferenceImages] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchImageModels()
      .then((m) => {
        setModels(m);
        if (m[0]) setModel(m[0].id);
      })
      .catch((err) => setModelsError(err.message));
  }, []);

  const selectedModel = useMemo(() => models.find((m) => m.id === model), [models, model]);
  const resolutions = selectedModel?.supported_resolutions?.length
    ? selectedModel.supported_resolutions
    : FALLBACK_RESOLUTIONS;
  const aspectRatios = selectedModel?.supported_aspect_ratios?.length
    ? selectedModel.supported_aspect_ratios
    : FALLBACK_ASPECT_RATIOS;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!model || !prompt.trim()) {
      setError("Model and prompt are required.");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("model", model);
      form.set("prompt", prompt);
      if (resolution) form.set("resolution", resolution);
      if (aspectRatio) form.set("aspectRatio", aspectRatio);
      referenceImages.forEach((f) => form.append("referenceImages", f));

      const image = await createImage(form);
      onCreated(image);
      setPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Model</Label>
          {modelsError ? (
            <p className="text-sm text-destructive">{modelsError}</p>
          ) : (
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="image-prompt">Prompt</Label>
          <Textarea
            id="image-prompt"
            rows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A red panda astronaut floating in space, studio lighting…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Resolution</Label>
            <Select value={resolution} onValueChange={setResolution}>
              <SelectTrigger>
                <SelectValue placeholder="auto" />
              </SelectTrigger>
              <SelectContent>
                {resolutions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Aspect ratio</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger>
                <SelectValue placeholder="auto" />
              </SelectTrigger>
              <SelectContent>
                {aspectRatios.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="image-references">Reference images (optional)</Label>
          <Input
            id="image-references"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setReferenceImages(Array.from(e.target.files ?? []))}
          />
          {referenceImages.length > 0 && (
            <p className="text-xs text-muted-foreground">{referenceImages.length} image(s) selected</p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={submitting} className="mt-auto">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating…
            </>
          ) : (
            "Generate image"
          )}
        </Button>
      </div>
    </form>
  );
}
