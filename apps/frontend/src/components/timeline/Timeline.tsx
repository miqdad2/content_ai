import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, Clapperboard, Film, Link2, Pause, Play, Plus, Scissors, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TemplateBlock } from "@/lib/api";

const PPS = 48; // pixels per second
const MIN_BLOCK = 1; // seconds
const LANE_H = 76; // px per video track lane
const TRACK_LABEL_W = 96; // px, width of the left label gutter
const SNAP_PX = 8; // magnet distance (px) for snapping to the playhead marker

export function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/** Whether a block only uses part of its generated clip (cropped/trimmed). */
function isCropped(b: TemplateBlock): boolean {
  const duration = b.duration ?? b.endSec - b.startSec;
  return b.cropStart > 0.001 || (b.cropEnd != null && b.cropEnd < duration - 0.001);
}

/** Topmost block (highest track, then latest start) covering time `t`. */
function topBlockAt(blocks: TemplateBlock[], t: number): TemplateBlock | null {
  let best: TemplateBlock | null = null;
  for (const b of blocks) {
    if (t >= b.startSec && t < b.endSec) {
      if (!best || b.track > best.track || (b.track === best.track && b.startSec >= best.startSec)) {
        best = b;
      }
    }
  }
  return best;
}

/** Partial timeline geometry update for a block (move / crop). */
export interface BlockPatch {
  startSec?: number;
  endSec?: number;
  track?: number;
  cropStart?: number;
  cropEnd?: number;
}

interface Props {
  durationSec: number;
  audioUrl: string | null;
  blocks: TemplateBlock[];
  trackCount: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddTrack: () => void;
  onCreateBlock: (startSec: number, endSec: number, track: number) => void;
  /** Live update during drag (local only). */
  onChangeBlock: (id: string, patch: BlockPatch) => void;
  /** Persist after drag completes. */
  onCommitBlock: (id: string, patch: BlockPatch) => void;
  /** Right-click on a block (id) or the empty track area (null). */
  onContextMenu: (blockId: string | null, e: React.MouseEvent) => void;
}

type DragState =
  | {
      mode: "move";
      id: string;
      startX: number;
      origStart: number;
      origEnd: number;
      origTrack: number;
      last: { start: number; end: number; track: number };
    }
  | {
      mode: "crop-l" | "crop-r";
      id: string;
      startX: number;
      track: number;
      origStart: number;
      origCropStart: number;
      origCropEnd: number;
      duration: number;
      last: { start: number; end: number; cropStart: number; cropEnd: number };
    }
  | { mode: "create"; startSec: number; track: number; last: { start: number; end: number } }
  | null;

export function Timeline({
  durationSec,
  audioUrl,
  blocks,
  trackCount,
  selectedId,
  onSelect,
  onAddTrack,
  onCreateBlock,
  onChangeBlock,
  onCommitBlock,
  onContextMenu,
}: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState>(null);
  const [createPreview, setCreatePreview] = useState<{ start: number; end: number; track: number } | null>(null);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const monitorVideoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const playheadRef = useRef(0);
  // Id of the block currently dragged into a colliding spot (rendered red), and
  // whether the in-progress create preview collides.
  const [invalidId, setInvalidId] = useState<string | null>(null);
  const [previewInvalid, setPreviewInvalid] = useState(false);

  // Latest blocks, read by collision checks inside drag listeners (avoids stale closures).
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  // Latest callback props + track count, read by the (stable) drag listeners so a
  // re-render never detaches an in-progress drag.
  const propsRef = useRef({ onChangeBlock, onCommitBlock, onCreateBlock });
  propsRef.current = { onChangeBlock, onCommitBlock, onCreateBlock };
  const tracksRef = useRef(1);

  /** True if [start,end) on `track` overlaps another block on the same track. */
  const collides = useCallback(
    (start: number, end: number, track: number, exceptId?: string) =>
      blocksRef.current.some(
        (b) =>
          b.id !== exceptId &&
          b.track === track &&
          start < b.endSec - 1e-3 &&
          end > b.startSec + 1e-3,
      ),
    [],
  );

  const tracks = Math.max(trackCount, 1, ...blocks.map((b) => b.track + 1));
  tracksRef.current = tracks;
  const totalSec = Math.max(durationSec, ...blocks.map((b) => b.endSec), 10);
  const width = totalSec * PPS;
  const areaHeight = tracks * LANE_H;
  const laneTop = (track: number) => (tracks - 1 - track) * LANE_H; // track 0 at bottom

  /** Pixel x → seconds (precise, no quantization). */
  const xToSecRaw = useCallback((clientX: number) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.max(0, (clientX - rect.left) / PPS);
  }, []);
  /** Snap a precise time to the playhead marker if close, else to a fine 0.1s grid. */
  const snapSec = useCallback((sec: number) => {
    const ph = playheadRef.current;
    if (Math.abs(sec - ph) * PPS <= SNAP_PX) return Math.max(0, ph);
    return Math.max(0, Math.round(sec * 10) / 10);
  }, []);
  const yToTrack = useCallback((clientY: number) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const t = tracksRef.current;
    const laneFromTop = Math.floor((clientY - rect.top) / LANE_H);
    return Math.min(Math.max(0, t - 1 - laneFromTop), t - 1);
  }, []);

  // ---- Playback / preview ----
  const stopRaf = () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };
  const pause = useCallback(() => {
    setPlaying(false);
    stopRaf();
    audioRef.current?.pause();
  }, []);

  const tick = useCallback(
    (ts: number) => {
      let next: number;
      if (audioRef.current && audioUrl) {
        next = audioRef.current.currentTime;
      } else {
        const dt = (ts - lastTsRef.current) / 1000;
        lastTsRef.current = ts;
        next = playheadRef.current + dt;
      }
      playheadRef.current = next;
      setPlayhead(next);
      if (next >= totalSec) {
        playheadRef.current = totalSec;
        setPlayhead(totalSec);
        setPlaying(false);
        stopRaf();
        audioRef.current?.pause();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [audioUrl, totalSec],
  );

  useEffect(() => {
    playheadRef.current = playhead;
  }, [playhead]);

  const play = useCallback(() => {
    if (playheadRef.current >= totalSec) {
      playheadRef.current = 0;
      setPlayhead(0);
    }
    setPlaying(true);
    lastTsRef.current = performance.now();
    if (audioRef.current && audioUrl) {
      audioRef.current.currentTime = playheadRef.current;
      void audioRef.current.play().catch(() => {});
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [audioUrl, tick, totalSec]);

  useEffect(() => stopRaf, []);

  const seekTo = useCallback(
    (sec: number) => {
      const clamped = Math.min(Math.max(0, sec), totalSec);
      playheadRef.current = clamped;
      setPlayhead(clamped);
      if (audioRef.current) audioRef.current.currentTime = clamped;
    },
    [totalSec],
  );

  // ---- Drag (create / move / crop). Handlers are STABLE (read latest via refs)
  // so re-renders during a drag never detach the window listeners.
  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const { onChangeBlock: change } = propsRef.current;

      if (drag.mode === "create") {
        const sec = snapSec(xToSecRaw(e.clientX));
        const start = Math.min(drag.startSec, sec);
        const end = Math.max(drag.startSec, sec);
        drag.last = { start, end };
        setCreatePreview({ start, end, track: drag.track });
        setPreviewInvalid(collides(start, end, drag.track));
        return;
      }

      const dRaw = xToSecRaw(e.clientX) - xToSecRaw(drag.startX);

      if (drag.mode === "crop-r") {
        // Move the out-point edge; snap it (timeline-space), then derive cropEnd.
        const origEnd = drag.origStart + (drag.origCropEnd - drag.origCropStart);
        const maxEnd = drag.origStart + (drag.duration - drag.origCropStart);
        const end = Math.min(Math.max(drag.origStart + MIN_BLOCK, snapSec(origEnd + dRaw)), maxEnd);
        const cropEnd = drag.origCropStart + (end - drag.origStart);
        drag.last = { start: drag.origStart, end, cropStart: drag.origCropStart, cropEnd };
        setInvalidId(collides(drag.origStart, end, drag.track, drag.id) ? drag.id : null);
        change(drag.id, { endSec: end, cropEnd });
        return;
      }
      if (drag.mode === "crop-l") {
        // Move the in-point edge; the right edge (origEnd) stays put.
        const origEnd = drag.origStart + (drag.origCropEnd - drag.origCropStart);
        const minStart = Math.max(0, drag.origStart - drag.origCropStart); // cropStart >= 0
        const start = Math.min(Math.max(minStart, snapSec(drag.origStart + dRaw)), origEnd - MIN_BLOCK);
        const cropStart = drag.origCropStart + (start - drag.origStart);
        drag.last = { start, end: origEnd, cropStart, cropEnd: drag.origCropEnd };
        setInvalidId(collides(start, origEnd, drag.track, drag.id) ? drag.id : null);
        change(drag.id, { startSec: start, cropStart });
        return;
      }

      if (drag.mode === "move") {
        const span = drag.origEnd - drag.origStart;
        const newStart = Math.max(0, snapSec(drag.origStart + dRaw));
        const track = yToTrack(e.clientY);
        drag.last = { start: newStart, end: newStart + span, track };
        setInvalidId(collides(newStart, newStart + span, track, drag.id) ? drag.id : null);
        change(drag.id, { startSec: newStart, endSec: newStart + span, track });
      }
    },
    [collides, snapSec, xToSecRaw, yToTrack],
  );

  const onPointerUp = useCallback(() => {
    const drag = dragRef.current;
    const { onChangeBlock: change, onCommitBlock: commit, onCreateBlock: create } = propsRef.current;
    if (drag) {
      if (drag.mode === "create") {
        const p = drag.last;
        if (p && p.end - p.start >= MIN_BLOCK && !collides(p.start, p.end, drag.track)) {
          create(p.start, p.end, drag.track);
        }
        setCreatePreview(null);
        setPreviewInvalid(false);
      } else if (drag.mode === "move") {
        const { start, end, track } = drag.last;
        if (collides(start, end, track, drag.id)) {
          change(drag.id, { startSec: drag.origStart, endSec: drag.origEnd, track: drag.origTrack });
        } else {
          commit(drag.id, { startSec: start, track });
        }
        setInvalidId(null);
      } else {
        const { start, end, cropStart, cropEnd } = drag.last;
        if (collides(start, end, drag.track, drag.id)) {
          change(drag.id, {
            startSec: drag.origStart,
            endSec: drag.origStart + (drag.origCropEnd - drag.origCropStart),
            cropStart: drag.origCropStart,
            cropEnd: drag.origCropEnd,
          });
        } else {
          commit(drag.id, { startSec: start, cropStart, cropEnd });
        }
        setInvalidId(null);
      }
    }
    dragRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [collides, onPointerMove]);

  function beginDrag(state: DragState) {
    dragRef.current = state;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  // Detach listeners only on unmount (handlers are stable, so this never runs mid-drag).
  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  function handleAreaPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return; // left-click only (right-click opens the context menu)
    if (e.target !== e.currentTarget) return; // only empty space starts a create
    onSelect(null);
    const startSec = snapSec(xToSecRaw(e.clientX));
    const track = yToTrack(e.clientY);
    setCreatePreview({ start: startSec, end: startSec, track });
    beginDrag({ mode: "create", startSec, track, last: { start: startSec, end: startSec } });
  }

  function beginCrop(e: React.PointerEvent, b: TemplateBlock, mode: "crop-l" | "crop-r") {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect(b.id);
    const duration = b.duration ?? Math.round(b.endSec - b.startSec);
    const origCropStart = b.cropStart ?? 0;
    const origCropEnd = b.cropEnd ?? duration;
    beginDrag({
      mode,
      id: b.id,
      startX: e.clientX,
      track: b.track,
      origStart: b.startSec,
      origCropStart,
      origCropEnd,
      duration,
      last: { start: b.startSec, end: b.endSec, cropStart: origCropStart, cropEnd: origCropEnd },
    });
  }

  // ---- Monitor (topmost block under the playhead) ----
  const activeBlock = topBlockAt(blocks, playhead);
  let monitorImg: string | null = null;
  if (activeBlock) {
    const progress = (playhead - activeBlock.startSec) / Math.max(0.001, activeBlock.endSec - activeBlock.startSec);
    monitorImg =
      progress < 0.5
        ? activeBlock.startImageUrl ?? activeBlock.endImageUrl
        : activeBlock.endImageUrl ?? activeBlock.startImageUrl;
  }

  useEffect(() => {
    const v = monitorVideoRef.current;
    if (!v || !activeBlock?.videoUrl) return;
    // Map the playhead into clip time using the block's crop in-point.
    const offset = (activeBlock.cropStart ?? 0) + Math.max(0, playhead - activeBlock.startSec);
    if (Number.isFinite(offset) && Math.abs(v.currentTime - offset) > 0.3) {
      try {
        v.currentTime = offset;
      } catch {
        /* seeking before metadata is loaded */
      }
    }
    const dur = v.duration || Infinity;
    if (playing && v.paused && offset < dur - 0.05) void v.play().catch(() => {});
    if (!playing && !v.paused) v.pause();
  }, [playhead, playing, activeBlock?.id, activeBlock?.videoUrl, activeBlock?.startSec, activeBlock?.cropStart]);

  const ticks: number[] = [];
  for (let t = 0; t <= totalSec; t += 5) ticks.push(t);

  // Tracks rendered top (highest index) → bottom (track 0) like an NLE.
  const laneOrder = Array.from({ length: tracks }, (_, i) => tracks - 1 - i);

  return (
    <div className="flex flex-col gap-3">
      {/* Program monitor */}
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-lg border bg-black">
        <div className="relative flex aspect-video items-center justify-center">
          {activeBlock?.videoUrl ? (
            <video
              key={activeBlock.id}
              ref={monitorVideoRef}
              src={activeBlock.videoUrl}
              muted
              playsInline
              className="h-full w-full object-contain"
            />
          ) : monitorImg ? (
            <img src={monitorImg} alt="" className="h-full w-full object-contain" />
          ) : activeBlock ? (
            <div className="px-6 text-center text-sm text-white/70">
              <Film className="mx-auto mb-2 h-6 w-6" />
              No preview yet — “Bake” this clip to generate it, or set a start frame.
            </div>
          ) : (
            <div className="text-sm text-white/40">No clip at the playhead</div>
          )}
          {activeBlock && (
            <div className="absolute inset-x-0 bottom-0 line-clamp-2 bg-black/60 px-3 py-1.5 text-xs text-white">
              {activeBlock.prompt || "Untitled clip"}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-white/10 bg-neutral-900 px-3 py-2 text-white">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => (playing ? pause() : play())}
            title={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => {
              pause();
              seekTo(0);
            }}
            title="Stop"
          >
            <Square className="h-4 w-4" />
          </Button>
          <span className="font-mono text-xs tabular-nums text-white/80">
            {formatTime(playhead)} / {formatTime(totalSec)}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <div style={{ minWidth: width + TRACK_LABEL_W }}>
          {/* Ruler */}
          <div className="flex border-b bg-muted/40">
            <div style={{ width: TRACK_LABEL_W }} className="shrink-0 border-r px-2 py-1 text-xs text-muted-foreground">
              Timeline
            </div>
            <div className="relative h-7 cursor-pointer" style={{ width }} onClick={(e) => seekTo(xToSecRaw(e.clientX))}>
              {ticks.map((t) => (
                <div key={t} className="absolute top-0 h-full border-l border-border/60" style={{ left: t * PPS }}>
                  <span className="ml-1 text-[10px] text-muted-foreground">{formatTime(t)}</span>
                </div>
              ))}
              <div className="absolute top-0 z-20 h-full w-0.5 bg-destructive" style={{ left: playhead * PPS }} />
            </div>
          </div>

          {/* Video tracks */}
          <div className="flex border-b">
            <div style={{ width: TRACK_LABEL_W }} className="shrink-0 border-r">
              {laneOrder.map((track) => (
                <div
                  key={track}
                  style={{ height: LANE_H }}
                  className="flex items-center gap-1.5 border-b px-2 text-xs font-medium text-muted-foreground last:border-b-0"
                >
                  <Film className="h-3.5 w-3.5" /> V{track + 1}
                </div>
              ))}
            </div>
            <div
              ref={areaRef}
              className="relative select-none bg-[repeating-linear-gradient(90deg,transparent,transparent_47px,var(--color-border)_47px,var(--color-border)_48px)]"
              style={{ width, height: areaHeight }}
              onPointerDown={handleAreaPointerDown}
              onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(null, e);
              }}
            >
              {/* lane separators */}
              {laneOrder.map((track, i) => (
                <div
                  key={track}
                  className="pointer-events-none absolute left-0 right-0 border-b border-border/70"
                  style={{ top: i * LANE_H, height: LANE_H }}
                />
              ))}

              {blocks.map((b) => (
                <div
                  key={b.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(b.id);
                    onContextMenu(b.id, e);
                  }}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return; // left-click only
                    e.stopPropagation();
                    onSelect(b.id);
                    beginDrag({
                      mode: "move",
                      id: b.id,
                      startX: e.clientX,
                      origStart: b.startSec,
                      origEnd: b.endSec,
                      origTrack: b.track,
                      last: { start: b.startSec, end: b.endSec, track: b.track },
                    });
                  }}
                  className={cn(
                    "absolute flex cursor-grab flex-col justify-between overflow-hidden rounded-md border px-2 py-1 text-xs active:cursor-grabbing",
                    invalidId === b.id
                      ? "border-destructive bg-destructive/20 ring-2 ring-destructive"
                      : selectedId === b.id
                        ? "border-primary bg-primary/20 ring-2 ring-primary"
                        : "border-blue-500/40 bg-blue-500/15 hover:bg-blue-500/25",
                  )}
                  style={{
                    left: b.startSec * PPS,
                    width: Math.max(2, (b.endSec - b.startSec) * PPS),
                    top: laneTop(b.track) + 6,
                    height: LANE_H - 12,
                  }}
                >
                  <span className="pointer-events-none flex items-start gap-1 font-medium">
                    {b.videoUrl && <Clapperboard className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />}
                    {b.linkGroupId && <Link2 className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />}
                    {isCropped(b) && <Scissors className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />}
                    <span className="line-clamp-2">{b.prompt || "Untitled clip"}</span>
                  </span>
                  <span className="pointer-events-none text-[10px] text-muted-foreground">
                    {(b.endSec - b.startSec).toFixed(1)}s
                    {isCropped(b) && ` of ${b.duration ?? Math.round(b.endSec - b.startSec)}s`}
                  </span>
                  {/* Crop (trim) handles */}
                  <div
                    className="absolute left-0 top-0 h-full w-2 cursor-ew-resize bg-foreground/20 hover:bg-foreground/40"
                    onPointerDown={(e) => beginCrop(e, b, "crop-l")}
                  />
                  <div
                    className="absolute right-0 top-0 h-full w-2 cursor-ew-resize bg-foreground/20 hover:bg-foreground/40"
                    onPointerDown={(e) => beginCrop(e, b, "crop-r")}
                  />
                </div>
              ))}

              {createPreview && (
                <div
                  className={cn(
                    "pointer-events-none absolute rounded-md border-2 border-dashed",
                    previewInvalid ? "border-destructive bg-destructive/10" : "border-primary bg-primary/10",
                  )}
                  style={{
                    left: createPreview.start * PPS,
                    width: Math.max(2, (createPreview.end - createPreview.start) * PPS),
                    top: laneTop(createPreview.track) + 6,
                    height: LANE_H - 12,
                  }}
                />
              )}

              <div className="pointer-events-none absolute top-0 z-10 h-full w-0.5 bg-destructive/80" style={{ left: playhead * PPS }} />
            </div>
          </div>

          {/* Audio track */}
          <div className="flex">
            <div
              style={{ width: TRACK_LABEL_W }}
              className="flex shrink-0 items-center gap-1.5 border-r px-2 py-2 text-xs font-medium text-muted-foreground"
            >
              <AudioLines className="h-3.5 w-3.5" /> Audio
            </div>
            <div className="relative h-12 bg-muted/20" style={{ width }}>
              {audioUrl ? (
                <div className="absolute inset-y-1.5 left-0 right-0 flex items-center gap-px overflow-hidden rounded-md bg-emerald-500/20 px-1">
                  {Array.from({ length: Math.floor(width / 4) }).map((_, i) => (
                    <span
                      key={i}
                      className="w-px shrink-0 bg-emerald-500/60"
                      style={{ height: `${30 + Math.abs(Math.sin(i * 0.7)) * 50}%` }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center px-3 text-xs text-muted-foreground">
                  No audio track — add one in template settings.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={onAddTrack}>
          <Plus className="h-4 w-4" /> Add video track
        </Button>
        <p className="text-xs text-muted-foreground">
          Drag on empty space to add a clip · drag a clip to move it · drag its edges to crop (the
          full clip is kept; only the cropped part is used). Clips can&apos;t overlap on the same
          track; across tracks, the higher track plays on top.
        </p>
      </div>

      {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" onEnded={pause} />}
    </div>
  );
}
