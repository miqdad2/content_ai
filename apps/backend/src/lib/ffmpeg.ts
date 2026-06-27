import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Run ffmpeg with the given args, rejecting on a non-zero exit code. */
function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", ["-y", ...args], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    proc.on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        reject(new Error("ffmpeg is not installed or not on PATH (required to stitch template videos)."));
      } else {
        reject(err);
      }
    });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-2000)}`));
    });
  });
}

export interface StitchOptions {
  /** Output width in pixels (clips are scaled + padded to fit). Defaults to 1280. */
  width?: number;
  /** Output height in pixels. Defaults to 720. */
  height?: number;
  /** Output frame rate. Defaults to 30. */
  fps?: number;
}

/**
 * One slice of the output timeline: either a trimmed portion of a clip
 * (`clip` = index into the clips array, taken from `inPoint` for `length`
 * seconds) or a black gap (`clip` = null).
 */
export interface TimelineSegment {
  clip: number | null;
  inPoint: number;
  length: number;
}

/**
 * Compose an ordered list of timeline segments into a single mp4. Each segment
 * is a trimmed slice of one clip (or a black gap), normalised to a common size,
 * concatenated in order, with a single base audio track overlaid across the
 * whole thing (padded with silence / trimmed to match the video length).
 *
 * Segments that reuse the same clip each get their own decode input, so a clip
 * can appear in multiple non-adjacent slices (e.g. when an overlay hides its
 * middle).
 */
export async function stitchTimeline(
  clips: Buffer[],
  segments: TimelineSegment[],
  audio: Buffer | null,
  opts: StitchOptions = {},
): Promise<Buffer> {
  if (segments.length === 0) throw new Error("Cannot stitch zero segments.");

  const width = opts.width ?? 1280;
  const height = opts.height ?? 720;
  const fps = opts.fps ?? 30;

  const dir = await mkdtemp(join(tmpdir(), "tpl-stitch-"));
  try {
    const clipPaths: string[] = [];
    for (let i = 0; i < clips.length; i++) {
      const p = join(dir, `clip-${i}.mp4`);
      await writeFile(p, clips[i]!);
      clipPaths.push(p);
    }
    let audioPath: string | null = null;
    if (audio) {
      audioPath = join(dir, "audio.bin");
      await writeFile(audioPath, audio);
    }

    const scale = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps},format=yuv420p`;

    // One decode input per clip-backed segment (lets a clip recur in several slices).
    const inputArgs: string[] = [];
    const parts: string[] = [];
    const labels: string[] = [];
    let inputIdx = 0;
    segments.forEach((seg, k) => {
      const label = `seg${k}`;
      labels.push(`[${label}]`);
      if (seg.clip == null) {
        parts.push(
          `color=c=black:s=${width}x${height}:r=${fps}:d=${seg.length},format=yuv420p,setsar=1[${label}]`,
        );
      } else {
        inputArgs.push("-i", clipPaths[seg.clip]!);
        parts.push(
          `[${inputIdx}:v]trim=start=${seg.inPoint}:duration=${seg.length},setpts=PTS-STARTPTS,${scale}[${label}]`,
        );
        inputIdx++;
      }
    });
    parts.push(`${labels.join("")}concat=n=${segments.length}:v=1:a=0[outv]`);

    if (audioPath) inputArgs.push("-i", audioPath);

    const mapArgs: string[] = ["-map", "[outv]"];
    if (audioPath) {
      parts.push(`[${inputIdx}:a]apad[outa]`);
      mapArgs.push("-map", "[outa]", "-shortest", "-c:a", "aac", "-b:a", "192k");
    }

    const outPath = join(dir, "out.mp4");
    await runFfmpeg([
      ...inputArgs,
      "-filter_complex",
      parts.join(";"),
      ...mapArgs,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outPath,
    ]);

    return await readFile(outPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Extract a single JPEG thumbnail frame from a video buffer. */
export async function generateThumbnail(video: Buffer, atSeconds = 1): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "tpl-thumb-"));
  try {
    const inPath = join(dir, "in.mp4");
    const outPath = join(dir, "thumb.jpg");
    await writeFile(inPath, video);
    try {
      await runFfmpeg(["-ss", String(atSeconds), "-i", inPath, "-frames:v", "1", "-q:v", "3", outPath]);
    } catch {
      // Video may be shorter than `atSeconds`; fall back to the very first frame.
      await runFfmpeg(["-i", inPath, "-frames:v", "1", "-q:v", "3", outPath]);
    }
    return await readFile(outPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
