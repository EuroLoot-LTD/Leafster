import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
function binary(name: "ffmpeg" | "ffprobe") {
  const configured =
    process.env[name === "ffmpeg" ? "FFMPEG_PATH" : "FFPROBE_PATH"];
  if (configured) return configured;
  try {
    const dir = path.dirname(require.resolve(`${name}-static/package.json`));
    return name === "ffmpeg"
      ? path.join(dir, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg")
      : path.join(
          dir,
          "bin",
          process.platform,
          process.arch,
          process.platform === "win32" ? "ffprobe.exe" : "ffprobe",
        );
  } catch {
    return name;
  }
}
export const ffmpegPath = binary("ffmpeg");
export const ffprobePath = binary("ffprobe");
export function run(
  binary: string,
  args: string[],
  timeoutMs = 120000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: { PATH: process.env.PATH },
    });
    let out = "",
      err = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Media processing timed out."));
    }, timeoutMs);
    child.stdout.on("data", (d) => {
      if (out.length < 100000) out += d;
    });
    child.stderr.on("data", (d) => {
      if (err.length < 50000) err += d;
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      code === 0
        ? resolve(out)
        : reject(
            new Error("The file could not be decoded as supported media."),
          );
    });
  });
}
export async function probe(file: string) {
  const result = JSON.parse(
    await run(
      ffprobePath,
      [
        "-v",
        "error",
        "-protocol_whitelist",
        "file,pipe",
        "-show_format",
        "-show_streams",
        "-of",
        "json",
        file,
      ],
      15000,
    ),
  );
  const video = result.streams?.find((s: any) => s.codec_type === "video");
  if (
    !video ||
    !Number.isFinite(Number(result.format?.duration)) ||
    Number(result.format.duration) <= 0 ||
    video.width > 7680 ||
    video.height > 4320
  )
    throw Object.assign(
      new Error("A valid video with supported dimensions is required."),
      { status: 400 },
    );
  return {
    duration: Number(result.format.duration),
    width: video.width,
    height: video.height,
  };
}
export function validateMagic(file: string, image = false) {
  const fd = fs.openSync(file, "r");
  const data = Buffer.alloc(32);
  fs.readSync(fd, data);
  fs.closeSync(fd);
  const mp4 = data.toString("ascii", 4, 8) === "ftyp";
  const webm = data
    .subarray(0, 4)
    .equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  const png = data
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  if (image ? !(png || jpeg) : !(mp4 || webm))
    throw Object.assign(
      new Error(
        image
          ? "Use a JPEG or PNG image."
          : "Use a valid MP4, MOV or WebM video.",
      ),
      { status: 400 },
    );
}
export async function transcode(source: string, dest: string, thumb: string) {
  const info = await probe(source);
  if (info.duration > 1800)
    throw new Error("Videos are limited to 30 minutes in staging.");
  await run(
    ffmpegPath,
    [
      "-nostdin",
      "-y",
      "-v",
      "error",
      "-protocol_whitelist",
      "file,pipe",
      "-i",
      source,
      "-map",
      "0:v:0",
      "-map",
      "0:a:0?",
      "-vf",
      "scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "25",
      "-threads",
      "2",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      "-map_metadata",
      "-1",
      "-fs",
      "157286400",
      dest,
    ],
    300000,
  );
  const output = await probe(dest);
  if (
    Math.abs(output.duration - info.duration) >
    Math.max(0.75, info.duration * 0.005)
  )
    throw new Error(
      "Processing reached the staging output limit. Upload a shorter or smaller original video.",
    );
  await run(
    ffmpegPath,
    [
      "-nostdin",
      "-y",
      "-v",
      "error",
      "-protocol_whitelist",
      "file,pipe",
      "-ss",
      String(Math.min(1, info.duration / 2)),
      "-i",
      dest,
      "-frames:v",
      "1",
      "-vf",
      "scale=640:-2",
      "-map_metadata",
      "-1",
      thumb,
    ],
    20000,
  );
  return { ...info, bytes: fs.statSync(dest).size + fs.statSync(thumb).size };
}
export async function sanitizeImage(source: string, dest: string) {
  validateMagic(source, true);
  const meta = JSON.parse(
    await run(
      ffprobePath,
      [
        "-v",
        "error",
        "-protocol_whitelist",
        "file,pipe",
        "-show_streams",
        "-of",
        "json",
        source,
      ],
      10000,
    ),
  );
  const stream = meta.streams?.[0];
  if (
    !stream ||
    stream.width > 8192 ||
    stream.height > 8192 ||
    stream.width * stream.height > 24000000
  )
    throw new Error(
      "Images are limited to 24 megapixels and 8192 pixels per side.",
    );
  await run(
    ffmpegPath,
    [
      "-nostdin",
      "-y",
      "-v",
      "error",
      "-protocol_whitelist",
      "file,pipe",
      "-i",
      source,
      "-frames:v",
      "1",
      "-vf",
      "scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease",
      "-map_metadata",
      "-1",
      dest,
    ],
    20000,
  );
}
export function safeUnlink(file: string | null | undefined) {
  if (file)
    try {
      fs.unlinkSync(file);
    } catch {}
}
