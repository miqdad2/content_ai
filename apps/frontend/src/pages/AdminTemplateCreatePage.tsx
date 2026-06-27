import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ClipboardPaste, Copy, Loader2, Rocket, Trash2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useMe } from "@/lib/useMe";
import {
  ALLOWED_DURATIONS,
  copyBlock as copyBlockApi,
  createBlock as createBlockApi,
  deleteBlock as deleteBlockApi,
  exportTemplate as exportTemplateApi,
  fetchAdminTemplate,
  fetchAdminTemplates,
  fetchAvatars,
  fetchModels,
  modelsForDuration,
  updateBlock as updateBlockApi,
  type Avatar,
  type GenerationModel,
  type Template,
  type TemplateBlock,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { SignedOut } from "@/components/SignedOut";
import { Timeline, type BlockPatch } from "@/components/timeline/Timeline";
import { BlockInspector } from "@/components/timeline/BlockInspector";
import { TemplateSetupForm } from "@/components/timeline/TemplateSetupForm";

/** Snap a dragged span to the nearest allowed clip duration. */
function nearestDuration(span: number): number {
  return ALLOWED_DURATIONS.reduce((best, d) =>
    Math.abs(d - span) < Math.abs(best - span) ? d : best,
  );
}

export function AdminTemplateCreatePage() {
  const { data: session, isPending } = useSession();
  const { me, loading: meLoading } = useMe();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [current, setCurrent] = useState<Template | null>(null);
  const [blocks, setBlocks] = useState<TemplateBlock[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [models, setModels] = useState<GenerationModel[]>([]);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [trackCount, setTrackCount] = useState(1);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  // Copy/paste clipboard (id of the block to clone) + latest blocks for handlers.
  const [clipboardId, setClipboardId] = useState<string | null>(null);
  const blocksRef = useRef<TemplateBlock[]>([]);
  blocksRef.current = blocks;
  // Right-click context menu (position + the block under the cursor, if any).
  const [menu, setMenu] = useState<{ x: number; y: number; blockId: string | null } | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    fetchAdminTemplates().then(setTemplates).catch(() => {});
    fetchModels().then(setModels).catch(() => {});
    fetchAvatars().then(setAvatars).catch(() => {});
  }, [session?.user]);

  const openTemplate = useCallback(async (id: string) => {
    const full = await fetchAdminTemplate(id);
    const loaded = (full.blocks ?? []).slice().sort((a, b) => a.startSec - b.startSec);
    setCurrent(full);
    setBlocks(loaded);
    setTrackCount(Math.max(1, ...loaded.map((b) => b.track + 1)));
    setSelectedId(null);
    setExportError(null);
  }, []);

  const selected = blocks.find((b) => b.id === selectedId) ?? null;
  // Names for the template's avatar slots (falls back to a generic label).
  const avatarLabels = (current?.avatarIds ?? []).map(
    (id, i) => avatars.find((a) => a.id === id)?.name ?? `Avatar ${i + 1}`,
  );

  async function handleCreateBlock(startSec: number, endSec: number, track: number) {
    if (!current) return;
    if (models.length === 0) {
      setExportError("Video models are still loading — try again in a moment.");
      return;
    }
    // Footprint = generated duration: snap the dragged span to an allowed length
    // and pick a model that can generate it.
    const duration = nearestDuration(endSec - startSec);
    const model = (modelsForDuration(models, duration)[0] ?? models[0]!).id;
    const form = new FormData();
    form.set("prompt", "New clip");
    form.set("model", model);
    form.set("startSec", String(startSec));
    form.set("duration", String(duration));
    form.set("track", String(track));
    form.set("order", String(blocks.length));
    try {
      const block = await createBlockApi(current.id, form);
      setBlocks((prev) => [...prev, block].sort((a, b) => a.startSec - b.startSec));
      setTrackCount((c) => Math.max(c, track + 1));
      setSelectedId(block.id);
    } catch {
      /* ignore */
    }
  }

  function handleChangeBlock(id: string, patch: BlockPatch) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  async function handleCommitBlock(id: string, patch: BlockPatch) {
    if (!current) return;
    const form = new FormData();
    for (const [k, v] of Object.entries(patch)) {
      if (v !== undefined) form.set(k, String(v));
    }
    try {
      const updated = await updateBlockApi(current.id, id, form);
      setBlocks((prev) => prev.map((b) => (b.id === id ? updated : b)).sort((a, b) => a.startSec - b.startSec));
      if (patch.track !== undefined) setTrackCount((c) => Math.max(c, patch.track! + 1));
    } catch {
      /* ignore */
    }
  }

  /** Re-fetch blocks so linked siblings reflect a propagated edit/bake. */
  const refreshBlocks = useCallback(async () => {
    if (!current) return;
    const full = await fetchAdminTemplate(current.id);
    const loaded = (full.blocks ?? []).slice().sort((a, b) => a.startSec - b.startSec);
    setBlocks(loaded);
    setTrackCount((c) => Math.max(c, 1, ...loaded.map((b) => b.track + 1)));
  }, [current]);

  function handleBlockSaved(updated: TemplateBlock) {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)).sort((a, b) => a.startSec - b.startSec));
    // Linked copies were updated server-side too — pull them in.
    if (updated.linkGroupId) void refreshBlocks();
  }

  function handleBlockDeleted(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }

  async function handleDeleteBlock(id: string) {
    if (!current) return;
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
    await deleteBlockApi(current.id, id).catch(() => {});
  }

  const handleCopy = useCallback(() => {
    if (selectedId) setClipboardId(selectedId);
  }, [selectedId]);

  // Paste a linked copy of the clipboard block at the end of the timeline, on the
  // source's track (always collision-free there). Linked copies share content.
  const handlePaste = useCallback(async () => {
    if (!current || !clipboardId) return;
    const source = blocksRef.current.find((b) => b.id === clipboardId);
    if (!source) return;
    const startSec = Math.max(0, ...blocksRef.current.map((b) => b.endSec));
    try {
      const { block, source: updatedSource } = await copyBlockApi(
        current.id,
        source.id,
        startSec,
        source.track,
      );
      setBlocks((prev) =>
        [...prev.map((b) => (b.id === updatedSource.id ? updatedSource : b)), block].sort(
          (a, b) => a.startSec - b.startSec,
        ),
      );
      setTrackCount((c) => Math.max(c, block.track + 1));
      setSelectedId(block.id);
    } catch {
      /* ignore */
    }
  }, [current, clipboardId]);

  // Premiere-style Cmd/Ctrl+C / +V (ignored while typing in a field).
  useEffect(() => {
    if (!current) return;
    function onKey(e: KeyboardEvent) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      if (key === "c") handleCopy();
      else if (key === "v") {
        e.preventDefault();
        void handlePaste();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, handleCopy, handlePaste]);

  async function handleExport() {
    if (!current) return;
    setExportError(null);
    if (blocks.length === 0) {
      setExportError("Add at least one video block first.");
      return;
    }
    setExporting(true);
    try {
      const updated = await exportTemplateApi(current.id);
      setCurrent(updated);
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  if (isPending || meLoading) return null;
  if (!session?.user) return <SignedOut />;
  if (!me?.isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Admin access required</h1>
        <p className="mt-2 text-muted-foreground">
          This area is only available to administrators.
        </p>
      </div>
    );
  }

  // Template picker / creation view.
  if (!current) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Template creator</h1>
        <div className="grid gap-8 md:grid-cols-2">
          <TemplateSetupForm
            onCreated={(t) => {
              setTemplates((prev) => [t, ...prev]);
              openTemplate(t.id);
            }}
          />
          <div>
            <h2 className="mb-3 text-lg font-medium">Continue editing</h2>
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No templates yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {templates.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => openTemplate(t.id)}
                      className="flex w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <span className="font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.published ? "published" : "draft"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Editor view.
  const duration = current.durationSec ?? 60;
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setCurrent(null)} title="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{current.name}</h1>
            <p className="text-xs text-muted-foreground">
              {current.avatarSlots} avatar slot(s) · {blocks.length} block(s) ·{" "}
              {current.published ? "published" : "draft"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} disabled={!selectedId} title="Copy clip (⌘/Ctrl+C)">
            <Copy className="h-4 w-4" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={() => void handlePaste()} disabled={!clipboardId} title="Paste linked copy (⌘/Ctrl+V)">
            <ClipboardPaste className="h-4 w-4" /> Paste
          </Button>
        </div>
      </div>

      <p className="mb-2 text-sm text-muted-foreground">
        Drag on empty space to create a clip. Drag a clip to move it (across tracks too). A clip&apos;s
        length is its generated duration — set it (and the model) in the inspector. Where clips
        overlap, the higher track plays on top.
      </p>

      <Timeline
        durationSec={duration}
        audioUrl={current.audioUrl}
        blocks={blocks}
        trackCount={trackCount}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAddTrack={() => setTrackCount((c) => c + 1)}
        onCreateBlock={handleCreateBlock}
        onChangeBlock={handleChangeBlock}
        onCommitBlock={handleCommitBlock}
        onContextMenu={(blockId, e) => setMenu({ x: e.clientX, y: e.clientY, blockId })}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Export panel */}
        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-medium">
            <Rocket className="h-4 w-4" /> Test &amp; export
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Renders the whole template with this template&apos;s avatar(s) so you can preview it.
            Exporting publishes the template (and its thumbnail) for users.
          </p>
          <div className="flex flex-col gap-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Avatars: </span>
              {avatarLabels.length > 0 ? (
                avatarLabels.map((name, i) => (
                  <span key={i} className="font-medium">
                    {i > 0 ? ", " : ""}
                    {name}
                  </span>
                ))
              ) : (
                <span className="text-destructive">none assigned</span>
              )}
            </div>
            {exportError && <p className="text-sm text-destructive">{exportError}</p>}
            <Button onClick={handleExport} disabled={exporting} className="w-fit">
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Rendering… this can take several
                  minutes
                </>
              ) : (
                "Render & export"
              )}
            </Button>
          </div>

          {current.previewVideoUrl && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-medium">Latest export</h3>
              <video src={current.previewVideoUrl} controls className="w-full rounded-md" />
            </div>
          )}
        </div>

        {/* Inspector */}
        <div className="rounded-lg border bg-card p-5">
          {selected ? (
            <BlockInspector
              templateId={current.id}
              avatarLabels={avatarLabels}
              trackCount={trackCount}
              models={models}
              block={selected}
              onSaved={handleBlockSaved}
              onDeleted={handleBlockDeleted}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a video block on the timeline to edit it.
            </p>
          )}
        </div>
      </div>

      {menu && (
        <>
          {/* click-away / right-click-away closes the menu */}
          <div
            className="fixed inset-0 z-50"
            onPointerDown={() => setMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenu(null);
            }}
          />
          <div
            className="fixed z-50 min-w-36 overflow-hidden rounded-md border bg-popover p-1 text-sm shadow-md"
            style={{ left: menu.x, top: menu.y }}
          >
            <button
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent disabled:opacity-50"
              disabled={!menu.blockId}
              onClick={() => {
                setClipboardId(menu.blockId);
                setMenu(null);
              }}
            >
              <Copy className="h-4 w-4" /> Copy
            </button>
            <button
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent disabled:opacity-50"
              disabled={!clipboardId}
              onClick={() => {
                void handlePaste();
                setMenu(null);
              }}
            >
              <ClipboardPaste className="h-4 w-4" /> Paste
            </button>
            <button
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-destructive hover:bg-accent disabled:opacity-50"
              disabled={!menu.blockId}
              onClick={() => {
                if (menu.blockId) void handleDeleteBlock(menu.blockId);
                setMenu(null);
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
