import { useEffect, useMemo, useState } from "react";
import { Clapperboard, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  bakeBlock as bakeBlockApi,
  deleteBlock as deleteBlockApi,
  durationsForModel,
  modelsForDuration,
  updateBlock as updateBlockApi,
  type GenerationModel,
  type TemplateBlock,
} from "@/lib/api";

const FALLBACK_RESOLUTIONS = ["480p", "720p", "1080p"];
const FALLBACK_ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4"];

interface Props {
  templateId: string;
  /** Display names for the template's avatar slots, in slot order (length 1-2). */
  avatarLabels: string[];
  /** Number of video tracks available (for the track picker). */
  trackCount: number;
  models: GenerationModel[];
  block: TemplateBlock;
  onSaved: (block: TemplateBlock) => void;
  onDeleted: (id: string) => void;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-md border border-input px-3 py-2 text-sm">
      <span className="font-medium">{label}</span>
      <input type="checkbox" className="h-4 w-4 accent-primary" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function BlockInspector({
  templateId,
  avatarLabels,
  trackCount,
  models,
  block,
  onSaved,
  onDeleted,
}: Props) {
  const [prompt, setPrompt] = useState(block.prompt);
  const [model, setModel] = useState(block.model);
  const [duration, setDuration] = useState(
    block.duration ?? Math.max(1, Math.round(block.endSec - block.startSec)),
  );
  const [track, setTrack] = useState(block.track);
  const [resolution, setResolution] = useState(block.resolution ?? "");
  const [aspectRatio, setAspectRatio] = useState(block.aspectRatio ?? "");
  const [faceSwapStart, setFaceSwapStart] = useState(block.faceSwapStart);
  const [faceSwapEnd, setFaceSwapEnd] = useState(block.faceSwapEnd);
  const [avatarSlot, setAvatarSlot] = useState(block.avatarSlot);
  const [startImage, setStartImage] = useState<File | null>(null);
  const [endImage, setEndImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [baking, setBaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form whenever a different block is selected.
  useEffect(() => {
    setPrompt(block.prompt);
    setModel(block.model);
    setDuration(block.duration ?? Math.max(1, Math.round(block.endSec - block.startSec)));
    setTrack(block.track);
    setResolution(block.resolution ?? "");
    setAspectRatio(block.aspectRatio ?? "");
    setFaceSwapStart(block.faceSwapStart);
    setFaceSwapEnd(block.faceSwapEnd);
    setAvatarSlot(block.avatarSlot);
    setStartImage(null);
    setEndImage(null);
    setError(null);
  }, [block]);

  const selectedModel = useMemo(() => models.find((m) => m.id === model), [models, model]);
  const resolutions = selectedModel?.supported_resolutions?.length
    ? selectedModel.supported_resolutions
    : FALLBACK_RESOLUTIONS;
  const aspectRatios = selectedModel?.supported_aspect_ratios?.length
    ? selectedModel.supported_aspect_ratios
    : FALLBACK_ASPECT_RATIOS;

  // Duration ⇄ model constraint (spec 09): only offer durations the model supports,
  // and only list models that support the chosen duration.
  const availableModels = useMemo(() => modelsForDuration(models, duration), [models, duration]);
  const durationOptions = durationsForModel(selectedModel);

  function handleModelChange(id: string) {
    setModel(id);
    const ds = durationsForModel(models.find((m) => m.id === id));
    if (!ds.includes(duration)) setDuration(ds[0] ?? duration);
  }
  function handleDurationChange(value: string) {
    const d = Number(value);
    setDuration(d);
    if (model && !modelsForDuration(models, d).some((m) => m.id === model)) {
      setModel(modelsForDuration(models, d)[0]?.id ?? "");
    }
  }

  const safeSlot = Math.min(avatarSlot, Math.max(0, avatarLabels.length - 1));
  const avatarName = (i: number) => `Avatar ${i + 1}${avatarLabels[i] ? ` — ${avatarLabels[i]}` : ""}`;

  /** Persist the current form to the server. Returns the updated block, or null on error. */
  async function persist(): Promise<TemplateBlock | null> {
    if (!prompt.trim() || !model) {
      setError("Prompt and model are required.");
      return null;
    }
    const form = new FormData();
    form.set("startSec", String(block.startSec));
    form.set("duration", String(duration));
    form.set("track", String(track));
    form.set("prompt", prompt);
    form.set("model", model);
    if (resolution) form.set("resolution", resolution);
    if (aspectRatio) form.set("aspectRatio", aspectRatio);
    form.set("faceSwapStart", String(faceSwapStart));
    form.set("faceSwapEnd", String(faceSwapEnd));
    form.set("avatarSlot", String(safeSlot));
    if (startImage) form.set("startImage", startImage);
    if (endImage) form.set("endImage", endImage);
    const updated = await updateBlockApi(templateId, block.id, form);
    onSaved(updated);
    return updated;
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await persist();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save block");
    } finally {
      setSaving(false);
    }
  }

  // Save the current edits, then generate this single clip so it can be previewed
  // on the timeline.
  async function handleBake() {
    setError(null);
    setBaking(true);
    try {
      const saved = await persist();
      if (!saved) return;
      const baked = await bakeBlockApi(templateId, block.id);
      onSaved(baked);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to bake block");
    } finally {
      setBaking(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this video block?")) return;
    await deleteBlockApi(templateId, block.id).catch(() => {});
    onDeleted(block.id);
  }

  // Un-crop: use the whole generated clip again.
  async function handleResetCrop() {
    const form = new FormData();
    form.set("cropStart", "0");
    form.set("cropEnd", String(duration));
    try {
      onSaved(await updateBlockApi(templateId, block.id, form));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset crop");
    }
  }

  const usedLen = block.endSec - block.startSec;
  const cropped = block.cropStart > 0.001 || usedLen < duration - 0.001;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Video block</h3>
        <Button variant="ghost" size="icon" onClick={handleDelete} title="Delete block">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="block-prompt">Prompt</Label>
        <Textarea id="block-prompt" rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Model</Label>
        <Select value={model} onValueChange={handleModelChange}>
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
        <p className="text-xs text-muted-foreground">Showing models that support {duration}s clips.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Duration</Label>
          <Select value={String(duration)} onValueChange={handleDurationChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {durationOptions.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d}s
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Track</Label>
          <Select value={String(track)} onValueChange={(v) => setTrack(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: Math.max(trackCount, track + 1) }, (_, i) => (
                <SelectItem key={i} value={String(i)}>
                  Track {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

      <div className="flex flex-col gap-1.5 rounded-md border border-input px-3 py-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            {cropped ? (
              <>
                Using {(usedLen).toFixed(1)}s of the {duration}s clip (cropped)
              </>
            ) : (
              <>Full clip · {duration}s</>
            )}
          </span>
          {cropped && (
            <button
              type="button"
              onClick={handleResetCrop}
              className="font-medium text-primary hover:underline"
            >
              Reset crop
            </button>
          )}
        </div>
        <span className="text-muted-foreground">
          Drag the clip&apos;s edges on the timeline to crop it (the full clip is always kept).
        </span>
        {block.linkGroupId && (
          <span className="text-amber-500">
            Linked copy — editing or baking this clip updates all its copies.
          </span>
        )}
      </div>

      {/* Reference avatar — used as the reference image, and as the face-swap source below. */}
      <div className="flex flex-col gap-1.5">
        <Label>Reference avatar</Label>
        <Select value={String(safeSlot)} onValueChange={(v) => setAvatarSlot(Number(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {avatarLabels.map((_, i) => (
              <SelectItem key={i} value={String(i)}>
                {avatarName(i)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          This avatar is used as the reference image for the clip (and the face-swap source below).
        </p>
      </div>

      <FileField
        label="Start frame (base image)"
        hint={block.startImageUrl ? "Replace the current start frame" : "Optional first frame"}
        file={startImage}
        onChange={setStartImage}
      />
      {block.startImageUrl && !startImage && (
        <img src={block.startImageUrl} alt="start frame" className="h-20 w-auto rounded-md object-cover" />
      )}
      <FileField
        label="End frame (base image)"
        hint={block.endImageUrl ? "Replace the current end frame" : "Optional last frame"}
        file={endImage}
        onChange={setEndImage}
      />
      {block.endImageUrl && !endImage && (
        <img src={block.endImageUrl} alt="end frame" className="h-20 w-auto rounded-md object-cover" />
      )}

      <div className="flex flex-col gap-2">
        <Toggle
          checked={faceSwapStart}
          onChange={setFaceSwapStart}
          label={`Face-swap start frame with ${avatarName(safeSlot)}`}
        />
        <Toggle
          checked={faceSwapEnd}
          onChange={setFaceSwapEnd}
          label={`Face-swap end frame with ${avatarName(safeSlot)}`}
        />
      </div>

      {block.videoUrl && (
        <p className="text-xs text-emerald-500">
          This clip is baked — it plays in the preview monitor.
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving || baking} variant="secondary" className="flex-1">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            "Save block"
          )}
        </Button>
        <Button onClick={handleBake} disabled={saving || baking} className="flex-1" title="Generate this clip">
          {baking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Baking…
            </>
          ) : (
            <>
              <Clapperboard className="h-4 w-4" /> {block.videoUrl ? "Re-bake" : "Bake"}
            </>
          )}
        </Button>
      </div>
      {baking && (
        <p className="text-xs text-muted-foreground">
          Generating this clip — this can take a few minutes.
        </p>
      )}
    </div>
  );
}
