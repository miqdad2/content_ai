import { useEffect, useMemo, useState } from "react";
import { Loader2, Volume2, VolumeX } from "lucide-react";
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
import { FileField } from "@/components/FileField";
import {
  ALLOWED_DURATIONS,
  createVideo,
  fetchModels,
  modelsForDuration,
  type Video,
  type VideoModel,
} from "@/lib/api";

const FALLBACK_RESOLUTIONS = ["480p", "720p", "1080p"];
const FALLBACK_ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4"];

interface Props {
  onCreated: (video: Video) => void;
}

export function TextToVideoForm({ onCreated }: Props) {
  const [models, setModels] = useState<VideoModel[]>([]);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const [model, setModel] = useState("");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("");
  const [resolution, setResolution] = useState("");
  const [aspectRatio, setAspectRatio] = useState("");
  const [generateAudio, setGenerateAudio] = useState(true);
  const [startFrame, setStartFrame] = useState<File | null>(null);
  const [endFrame, setEndFrame] = useState<File | null>(null);
  const [referenceFrames, setReferenceFrames] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModels()
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

  // Only show models that support the chosen duration (spec 09).
  const availableModels = useMemo(
    () => modelsForDuration(models, duration ? Number(duration) : null),
    [models, duration],
  );

  // When the duration changes, drop the selected model if it can't do it.
  function handleDurationChange(value: string) {
    setDuration(value);
    const allowed = modelsForDuration(models, value ? Number(value) : null);
    if (model && !allowed.some((m) => m.id === model)) {
      setModel(allowed[0]?.id ?? "");
    }
  }

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
      if (duration) form.set("duration", duration);
      if (resolution) form.set("resolution", resolution);
      if (aspectRatio) form.set("aspectRatio", aspectRatio);
      form.set("generateAudio", String(generateAudio));
      if (startFrame) form.set("startFrame", startFrame);
      if (endFrame) form.set("endFrame", endFrame);
      referenceFrames.forEach((f) => form.append("referenceFrames", f));

      const video = await createVideo(form);
      onCreated(video);
      setPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate video");
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
                {availableModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {duration && (
            <p className="text-xs text-muted-foreground">
              Showing models that support {duration}s clips.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            rows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A golden retriever playing fetch on a sunny beach with waves crashing…"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Duration</Label>
            <Select value={duration || "auto"} onValueChange={(v) => handleDurationChange(v === "auto" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="auto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                {ALLOWED_DURATIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d}s
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

        <label
          htmlFor="generateAudio"
          className="flex cursor-pointer items-center justify-between rounded-md border border-input px-3 py-2"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            {generateAudio ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
            Generate audio
          </span>
          <input
            id="generateAudio"
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={generateAudio}
            onChange={(e) => setGenerateAudio(e.target.checked)}
          />
        </label>
      </div>

      <div className="flex flex-col gap-4">
        <FileField
          label="Start frame (optional)"
          hint="First frame for image-to-video"
          file={startFrame}
          onChange={setStartFrame}
        />
        <FileField
          label="End frame (optional)"
          hint="Last frame for image-to-video"
          file={endFrame}
          onChange={setEndFrame}
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="references">Reference frames (optional)</Label>
          <Input
            id="references"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setReferenceFrames(Array.from(e.target.files ?? []))}
          />
          {referenceFrames.length > 0 && (
            <p className="text-xs text-muted-foreground">{referenceFrames.length} image(s) selected</p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={submitting} className="mt-auto">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating… this can take a few minutes
            </>
          ) : (
            "Generate video"
          )}
        </Button>
      </div>
    </form>
  );
}
