import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Youtube, Upload, CheckCircle2, ExternalLink, Link2Off, Download } from "lucide-react";
import { ImageIcon, X, Music, CalendarIcon, Sparkles, Type, ArrowUp, ArrowDown, Plus, Film, Crop as CropIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format as formatDate } from "date-fns";
import { cn } from "@/lib/utils";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import Cropper, { Area } from "react-easy-crop";
import { GoogleDrivePicker } from "@/components/admin/GoogleDrivePicker";
import { HardDrive } from "lucide-react";

type Genre = { id: string; name: string };
type Artist = { id: string; genre: string; artist_name: string };

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const FFMPEG_CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";

function buildTitle(beat: string, artist: string, genre: string, isShort = false) {
  const year = new Date().getFullYear();
  if (isShort) return `[FREE] ${artist} Type Beat - "${beat}" #Shorts #${genre.replace(/\s+/g, "")}`;
  return `[FREE] ${artist} Type Beat ${year} - "${beat}" | ${genre} Instrumental`;
}

function buildDescription(o: { beat: string; artist: string; genre: string; bpm?: string; key?: string; licenseUrl: string; isShort?: boolean }) {
  const year = new Date().getFullYear();
  if (o.isShort) {
    return `🎵 [FREE] ${o.artist} Type Beat - "${o.beat}"

▶ Full beat / license: ${o.licenseUrl}

🎁 FREE BEAT PACK (5 beats): https://jokabeatz.com/free-beats
🎬 Music Videos: https://jokabeatz.com/music-videos
🎚 AI Mastering: https://jokabeatz.com/ai-mastering

#shorts #${o.artist.replace(/\s+/g, "")}TypeBeat #${o.genre.replace(/\s+/g, "")}Beat #FreeBeats`;
  }
  return `🎵 [FREE] ${o.artist} Type Beat ${year} - "${o.beat}"

▶ Free Download / Purchase: ${o.licenseUrl}

BPM: ${o.bpm || "—"}  |  Key: ${o.key || "—"}  |  Genre: ${o.genre}

━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 FREE OFFERS & SERVICES
🎁 Free Beat Pack (5 exclusive beats): https://jokabeatz.com/free-beats
📘 Free Producer Guide: https://jokabeatz.com/free-guide
🎬 Custom Music Videos: https://jokabeatz.com/music-videos
🎚 AI Mastering ($15/track): https://jokabeatz.com/ai-mastering
🎹 Custom Beats: https://jokabeatz.com/services/custom-beats
💼 1-on-1 Consultation: https://jokabeatz.com/services/consultation
📰 Producer Blog: https://jokabeatz.com/blog

━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 LICENSING
• Free for non-profit use (must credit "Prod. Joka Beatz")
• For commercial use, get a license: ${o.licenseUrl}

🔥 More beats: https://jokabeatz.com
📧 Contact: https://jokabeatz.com/contact

━━━━━━━━━━━━━━━━━━━━━━━━━━
#${o.artist.replace(/\s+/g, "")}TypeBeat #${o.genre.replace(/\s+/g, "")}Beat #FreeBeats #TypeBeat${year}`;
}

function buildTags(artist: string, genre: string) {
  const year = new Date().getFullYear();
  const a = artist.toLowerCase();
  const g = genre.toLowerCase();
  return [
    `${a} type beat`,
    `${a} type beat ${year}`,
    `free ${a} type beat`,
    `${g} type beat`,
    `${g} instrumental`,
    `hard ${g} beat`,
    `free ${g} beat`,
    `type beat ${year}`,
    "free beats",
    "joka beatz",
    "free instrumentals",
  ];
}

function fmtTimestamp(s: number) {
  const total = Math.max(0, Math.floor(s));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

type MixTrack = { file: File; name: string; duration: number };

function buildMixTitle(genre: string, artist: string, count: number) {
  const year = new Date().getFullYear();
  const a = (artist || "").trim();
  const prefix = a ? `${a} x ${genre}` : `${genre}`;
  const n = count > 0 ? `${count} ` : "";
  return `[FREE] ${prefix} Type Beat Mix ${year} | ${n}Free ${a ? `${a} Type ` : ""}Beats`.slice(0, 100);
}

function buildMixDescription(o: { genre: string; artist: string; tracks: MixTrack[]; licenseUrl: string }) {
  const year = new Date().getFullYear();
  let cursor = 0;
  const stamps = o.tracks.map((t) => {
    const line = `${fmtTimestamp(cursor)} - ${t.name}`;
    cursor += t.duration;
    return line;
  }).join("\n");
  const a = (o.artist || "").trim();
  const styleLabel = a ? `${a} x ${o.genre}` : o.genre;
  const tagBase = a ? `${a.replace(/\s+/g, "")}TypeBeat` : `${o.genre.replace(/\s+/g, "")}TypeBeat`;
  return `🎵 [FREE] ${styleLabel} Type Beat Mix ${year} - ${o.tracks.length} Free ${a ? `${a} Type ` : `${o.genre} `}Beats

▶ Free Download / Purchase: ${o.licenseUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱ TIMESTAMPS
${stamps}

━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 FREE OFFERS & SERVICES
🎁 Free Beat Pack (5 exclusive beats): https://jokabeatz.com/free-beats
📘 Free Producer Guide: https://jokabeatz.com/free-guide
🎬 Custom Music Videos: https://jokabeatz.com/music-videos
🎚 AI Mastering ($15/track): https://jokabeatz.com/ai-mastering
🎹 Custom Beats: https://jokabeatz.com/services/custom-beats
💼 1-on-1 Consultation: https://jokabeatz.com/services/consultation
📰 Producer Blog: https://jokabeatz.com/blog

━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 LICENSING
• Free for non-profit use (must credit "Prod. Joka Beatz")
• For commercial use, get a license: ${o.licenseUrl}

🔥 More beats: https://jokabeatz.com
📧 Contact: https://jokabeatz.com/contact

━━━━━━━━━━━━━━━━━━━━━━━━━━
#${tagBase} #${o.genre.replace(/\s+/g, "")}Mix${a ? ` #${a.replace(/\s+/g, "")}Mix` : ""} #FreeBeats #TypeBeat${year} #BeatMix #${o.genre.replace(/\s+/g, "")}Beats`;
}

function buildMixTags(genre: string, artist: string) {
  const year = new Date().getFullYear();
  const g = genre.toLowerCase();
  const a = (artist || "").trim().toLowerCase();
  const base = [
    `${g} type beat mix`,
    `${g} beat mix`,
    `free ${g} beats`,
    `${g} instrumentals`,
    `${g} type beat ${year}`,
    `${g} beats ${year}`,
    `hard ${g} beats`,
    `type beat mix`,
    `beat compilation`,
    `free beats`,
    `joka beatz`,
    `${g} mix`,
  ];
  if (!a) return base;
  return [
    `${a} type beat mix`,
    `${a} x ${g} type beat`,
    `${a} type beat ${year}`,
    `free ${a} type beat`,
    `${a} mix`,
    `${a} instrumentals`,
    ...base,
  ].slice(0, 20);
}

function parseFilename(filename: string) {
  // Strip extension
  const original = filename.replace(/\.[^.]+$/, "");

  let bpm = "";
  let key = "";
  const cutIndices: number[] = [];

  // BPM: "BPM 140", "140 BPM", "140bpm", "140-bpm"
  const bpmRe = /(?:bpm\s*[-_ ]*(\d{2,3})|(\d{2,3})\s*[-_ ]*bpm)/i;
  const bpmMatch = original.match(bpmRe);
  if (bpmMatch) {
    bpm = bpmMatch[1] || bpmMatch[2] || "";
    cutIndices.push(bpmMatch.index!);
  }

  // Key: "C#min", "Cmaj", "F# minor", "Bb major", "Am", "C# m"
  const keyRe = /(?:^|[\s\-_|\(\[])([A-Ga-g])([#b]?)\s*[-_ ]*(min(?:or)?|maj(?:or)?|m)(?=$|[\s\-_|\)\]])/;
  const keyMatch = original.match(keyRe);
  if (keyMatch) {
    const noteLetter = keyMatch[1].toUpperCase();
    const accidental = keyMatch[2].toLowerCase() === "b" ? "b" : keyMatch[2];
    const q = keyMatch[3].toLowerCase();
    const qual = q.startsWith("maj") ? "major" : "minor";
    key = `${noteLetter}${accidental} ${qual}`;
    // index of the note letter itself
    cutIndices.push(keyMatch.index! + keyMatch[0].indexOf(keyMatch[1]));
  }

  // Beat name = portion before earliest metadata token
  let beat = original;
  if (cutIndices.length) {
    beat = beat.substring(0, Math.min(...cutIndices));
  }

  beat = beat.replace(/[\[\(].*?[\]\)]/g, " "); // strip [free], (prod...)
  beat = beat.replace(/\b(prod\.?|prod by|type beat|free|official)\b.*$/i, " ");
  beat = beat.replace(/[-_|]+/g, " ").replace(/\s+/g, " ").trim();
  beat = beat.replace(/\b\w/g, (c) => c.toUpperCase());

  return { beat, bpm, key };
}

const AdminYouTubeUploader = () => {
  const [connected, setConnected] = useState<{ connected: boolean; channel_title?: string } | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [beatName, setBeatName] = useState("");
  const [bpm, setBpm] = useState("");
  const [musicKey, setMusicKey] = useState("");
  const [genre, setGenre] = useState("");
  const [artist, setArtist] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("https://jokabeatz.com/beats");
  const [privacy, setPrivacy] = useState<"public" | "unlisted" | "private">("public");
  const [scheduledAt, setScheduledAt] = useState<string>(""); // datetime-local value

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [stage, setStage] = useState<"idle" | "rendering" | "uploading" | "thumbnail" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
  const [renderedVideoName, setRenderedVideoName] = useState<string>("video.mp4");
  const [thumbDragOver, setThumbDragOver] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [audioDragOver, setAudioDragOver] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [drivePicker, setDrivePicker] = useState<null | "audio" | "image" | "mix" | "video">(null);

  // Shorts mode + audio trim + image crop
  const [format, setFormat] = useState<"long" | "short" | "mix">("long");
  const [audioDuration, setAudioDuration] = useState(0);
  const [trim, setTrim] = useState<[number, number]>([0, 60]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedThumb, setCroppedThumb] = useState<File | null>(null);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);
  const [overlayText, setOverlayText] = useState(true);
  const [longOverlayText, setLongOverlayText] = useState(true);
  const [generatingArt, setGeneratingArt] = useState(false);
  const [artPrompt, setArtPrompt] = useState("");

  // Shorts background video clip (loops behind audio)
  const [bgVideoFile, setBgVideoFile] = useState<File | null>(null);
  const [bgVideoUrl, setBgVideoUrl] = useState<string | null>(null);
  const [bgVideoDragOver, setBgVideoDragOver] = useState(false);
  const bgVideoInputRef = useRef<HTMLInputElement>(null);
  const [bgVideoMeta, setBgVideoMeta] = useState<{ width: number; height: number } | null>(null);
  const [bgCropX, setBgCropX] = useState(50); // 0=left, 50=center, 100=right
  const [croppingBg, setCroppingBg] = useState(false);
  const [bgVideoCropped, setBgVideoCropped] = useState(false);

  useEffect(() => {
    if (!bgVideoFile) { setBgVideoUrl(null); return; }
    const url = URL.createObjectURL(bgVideoFile);
    setBgVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [bgVideoFile]);

  const handleBgVideoFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("video/") && !/\.(mp4|mov|webm|m4v)$/i.test(f.name)) {
      toast.error("Please upload a video file (mp4/mov/webm)");
      return;
    }
    if (f.size > 200 * 1024 * 1024) {
      toast.error("Video too large (max 200MB) — keep clips short for in-browser rendering");
      return;
    }
    setBgVideoFile(f);
    setBgVideoMeta(null);
    setBgCropX(50);
    setBgVideoCropped(false);
    toast.success(`Loaded ${f.name} as Shorts background`);
  };

  const applyBgVideoCrop = async () => {
    if (!bgVideoFile || !bgVideoMeta) return;
    const { width: iw, height: ih } = bgVideoMeta;
    const targetRatio = 9 / 16;
    const sourceRatio = iw / ih;
    if (sourceRatio <= targetRatio + 0.001) {
      toast.info("Video is already 9:16 or taller — no crop needed");
      setBgVideoCropped(true);
      return;
    }
    const cropW = Math.floor(ih * targetRatio / 2) * 2; // even
    const maxX = iw - cropW;
    const xOffset = Math.max(0, Math.min(maxX, Math.round(maxX * (bgCropX / 100))));
    setCroppingBg(true);
    const t = toast.loading("Cropping video to 9:16…");
    try {
      const ffmpeg = await loadFFmpeg();
      const ext = (bgVideoFile.name.split(".").pop() || "mp4").toLowerCase();
      const inName = `bgcrop_in.${ext}`;
      const outName = `bgcrop_out.mp4`;
      await ffmpeg.writeFile(inName, await fetchFile(bgVideoFile));
      const args = [
        "-i", inName,
        "-vf", `crop=${cropW}:${ih}:${xOffset}:0,scale=1080:1920:flags=bilinear,setsar=1`,
        "-an",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-y", outName,
      ];
      const code = await ffmpeg.exec(args, 180000);
      if (code !== 0) throw new Error(`Crop failed (${code})`);
      const data = await ffmpeg.readFile(outName) as Uint8Array;
      const buf = new Uint8Array(data.byteLength); buf.set(data);
      const baseName = bgVideoFile.name.replace(/\.[^.]+$/, "");
      const cropped = new File([buf.buffer], `${baseName}_9x16.mp4`, { type: "video/mp4" });
      try { await ffmpeg.deleteFile(inName); await ffmpeg.deleteFile(outName); } catch {}
      setBgVideoFile(cropped);
      setBgVideoMeta({ width: 1080, height: 1920 });
      setBgVideoCropped(true);
      toast.success("Cropped to 9:16", { id: t });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to crop video", { id: t });
    } finally {
      setCroppingBg(false);
    }
  };

  // Mix mode tracks
  const [mixTracks, setMixTracks] = useState<MixTrack[]>([]);
  const [mixDragOver, setMixDragOver] = useState(false);
  const mixInputRef = useRef<HTMLInputElement>(null);
  const [mixArtPrompt, setMixArtPrompt] = useState("");
  const [mixOverlayText, setMixOverlayText] = useState(true);
  const [generatingMixArt, setGeneratingMixArt] = useState(false);

  const trimAudioRef = useRef<HTMLAudioElement | null>(null);
  const trimStopAt = useRef<number | null>(null);
  const [audioObjectUrl, setAudioObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!audioFile) { setAudioObjectUrl(null); return; }
    const url = URL.createObjectURL(audioFile);
    setAudioObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioFile]);

  useEffect(() => {
    if (!thumbFile) { setThumbPreviewUrl(null); return; }
    const url = URL.createObjectURL(thumbFile);
    setThumbPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbFile]);

  const handleAudioFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("audio/") && !/\.(mp3|wav)$/i.test(f.name)) {
      toast.error("Please upload an audio file");
      return;
    }
    setAudioFile(f);
    const { beat, bpm: b, key: k } = parseFilename(f.name);
    if (beat) setBeatName(beat);
    if (b) setBpm(b);
    if (k) setMusicKey(k);
    // Probe duration & set default trim window
    getAudioDuration(f).then((d) => {
      setAudioDuration(d);
      const end = Math.min(d, 60);
      const start = Math.max(0, end - Math.min(d, 60));
      setTrim([start, end]);
    }).catch(() => {});
  };

  const handleThumbFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setThumbFile(file);
    setCroppedThumb(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const ffmpegRef = useRef<FFmpeg | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const r = await fetch(`${FUNCTIONS_BASE}/youtube-auth?action=status`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setConnected(await r.json());

      const [{ data: g }, { data: a }] = await Promise.all([
        supabase.from("youtube_genres").select("*").order("display_order"),
        supabase.from("youtube_type_artists").select("*").order("display_order"),
      ]);
      setGenres(g || []);
      setArtists(a || []);
    })();
  }, []);

  // Auto-generate title/desc/tags
  useEffect(() => {
    if (format === "mix") {
      if (genre) {
        setTitle(buildMixTitle(genre, artist, mixTracks.length));
        setDescription(buildMixDescription({ genre, artist, tracks: mixTracks, licenseUrl }));
        setTags(buildMixTags(genre, artist));
      }
      return;
    }
    if (beatName && artist && genre) {
      const isShort = format === "short";
      setTitle(buildTitle(beatName, artist, genre, isShort));
      setDescription(buildDescription({ beat: beatName, artist, genre, bpm, key: musicKey, licenseUrl, isShort }));
      setTags(buildTags(artist, genre));
    }
  }, [beatName, artist, genre, bpm, musicKey, licenseUrl, format, mixTracks]);

  const handleConnect = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const r = await fetch(`${FUNCTIONS_BASE}/youtube-auth?action=start`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const { url } = await r.json();
    const popup = window.open(url, "yt_oauth", "width=600,height=700");
    const poll = setInterval(async () => {
      if (popup?.closed) {
        clearInterval(poll);
        const r2 = await fetch(`${FUNCTIONS_BASE}/youtube-auth?action=status`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        setConnected(await r2.json());
      }
    }, 1000);
  };

  const handleDisconnect = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`${FUNCTIONS_BASE}/youtube-auth?action=disconnect`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setConnected({ connected: false });
  };

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({
      coreURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const getAudioDuration = (file: File): Promise<number> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const a = document.createElement("audio");
      a.preload = "metadata";
      a.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(a.duration);
      };
      a.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read audio duration"));
      };
      a.src = url;
    });

  const buildCroppedFile = async (): Promise<File | null> => {
    if (!thumbFile || !croppedAreaPixels) return null;
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("image load failed"));
      i.src = URL.createObjectURL(thumbFile);
    });
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
      img,
      croppedAreaPixels.x, croppedAreaPixels.y,
      croppedAreaPixels.width, croppedAreaPixels.height,
      0, 0, 1080, 1920,
    );
    if (overlayText) {
      await ensureOverlayFonts();
      drawShortsOverlay(ctx, 1080, 1920, { beat: beatName, artist, bpm, musicKey });
    }
    const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.92));
    return new File([blob], (thumbFile.name.replace(/\.[^.]+$/, "") || "thumb") + "_shorts.jpg", { type: "image/jpeg" });
  };

  // Premium font stack used on baked overlays
  const FONT_DISPLAY = `"Bowlby One", "Archivo Black", Impact, Arial Black, sans-serif`;
  const FONT_CONDENSED = `"Archivo Black", "Bowlby One", Impact, Arial Black, sans-serif`;
  const FONT_MONO = `"Space Mono", "JetBrains Mono", ui-monospace, monospace`;
  const FONT_ACCENT = `"Space Grotesk", Montserrat, Arial, sans-serif`;

  // Ensure overlay webfonts are loaded before drawing on canvas
  const ensureOverlayFonts = async () => {
    try {
      const f: any = (document as any).fonts;
      if (!f) return;
      await Promise.all([
        f.load('400 190px "Bowlby One"'),
        f.load('400 130px "Archivo Black"'),
        f.load('400 130px "Bebas Neue"'),
        f.load('400 130px "Anton"'),
        f.load('700 48px "Space Mono"'),
        f.load('700 44px "Space Grotesk"'),
      ]);
      await f.ready;
    } catch { /* noop */ }
  };

  // Wrap text into stacked lines that each fit within maxWidth.
  // Shrinks font size if a single word still exceeds maxWidth at the starting size.
  const wrapTextLines = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    fontFamily: string,
    startSize: number,
    minSize: number,
    weight: number | string = 400,
  ): { lines: string[]; size: number } => {
    let size = startSize;
    const fitsSingleWord = () => {
      ctx.font = `${weight} ${size}px ${fontFamily}`;
      return text.split(/\s+/).every((w) => ctx.measureText(w).width <= maxWidth);
    };
    while (!fitsSingleWord() && size > minSize) size -= 4;
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(test).width <= maxWidth) {
        cur = test;
      } else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return { lines, size };
  };

  // Bake type-beat text on a 1080x1920 canvas: [FREE] ARTIST TYPE BEAT (top),
  // beat name (center), BPM • KEY (bottom), "PROD. JOKA BEATZ" tag.
  const drawShortsOverlay = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    o: { beat: string; artist: string; bpm?: string; musicKey?: string },
  ) => {
    // top + bottom dark gradient bands for legibility
    const topGrad = ctx.createLinearGradient(0, 0, 0, 520);
    topGrad.addColorStop(0, "rgba(0,0,0,0.85)");
    topGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, W, 520);
    const botGrad = ctx.createLinearGradient(0, H - 620, 0, H);
    botGrad.addColorStop(0, "rgba(0,0,0,0)");
    botGrad.addColorStop(1, "rgba(0,0,0,0.9)");
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, H - 620, W, 620);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Small [FREE] tag at very top — mono badge for premium feel
    ctx.fillStyle = "#DC2626";
    ctx.font = `700 56px ${FONT_MONO}`;
    (ctx as any).letterSpacing = "6px";
    ctx.fillText("[ FREE ]", W / 2, 140);
    (ctx as any).letterSpacing = "0px";

    // Row 1: Beat name (big white) — wrap to stacked lines if needed
    const maxW = W - 100;
    const titleText = `"${(o.beat || "UNTITLED").toUpperCase()}"`;
    const titleWrap = wrapTextLines(ctx, titleText, maxW, FONT_DISPLAY, 200, 80, 400);
    const titleLineH = Math.round(titleWrap.size * 1.0);

    // Row 2: ARTIST TYPE BEAT — wrap to stacked lines
    const subText = `${o.artist.toUpperCase()} TYPE BEAT`;
    const subWrap = wrapTextLines(ctx, subText, maxW, FONT_CONDENSED, 140, 60, 400);
    const subLineH = Math.round(subWrap.size * 1.05);

    const gap = 50;
    const titleBlockH = titleLineH * titleWrap.lines.length;
    const subBlockH = subLineH * subWrap.lines.length;
    const blockH = titleBlockH + gap + subBlockH;
    let cursorY = H / 2 - blockH / 2 + titleWrap.size / 2;

    // Draw beat name lines
    ctx.font = `400 ${titleWrap.size}px ${FONT_DISPLAY}`;
    (ctx as any).letterSpacing = "-1px";
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(220,38,38,0.7)";
    ctx.shadowBlur = 28;
    for (const line of titleWrap.lines) {
      ctx.fillText(line, W / 2, cursorY);
      cursorY += titleLineH;
    }
    (ctx as any).letterSpacing = "0px";
    ctx.shadowBlur = 0;

    // Draw artist type beat lines — white fill + red stroke
    cursorY = cursorY - titleLineH + titleWrap.size / 2 + gap + subWrap.size / 2;
    ctx.font = `400 ${subWrap.size}px ${FONT_CONDENSED}`;
    (ctx as any).letterSpacing = "3px";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 20;
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = Math.max(10, Math.round(subWrap.size * 0.1));
    for (const line of subWrap.lines) {
      ctx.strokeText(line, W / 2, cursorY);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(line, W / 2, cursorY);
      cursorY += subLineH;
    }
    ctx.shadowBlur = 0;
    (ctx as any).letterSpacing = "0px";

    // Bottom: BPM • KEY
    const bits: string[] = [];
    if (o.bpm) bits.push(`${o.bpm} BPM`);
    if (o.musicKey) bits.push(o.musicKey.toUpperCase());
    if (bits.length) {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 72px ${FONT_MONO}`;
      (ctx as any).letterSpacing = "4px";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 12;
      ctx.fillText(bits.join("   •   "), W / 2, H - 180);
      ctx.shadowBlur = 0;
      (ctx as any).letterSpacing = "0px";
    }

    // Producer tag
    ctx.fillStyle = "#DC2626";
    ctx.font = `700 44px ${FONT_MONO}`;
    (ctx as any).letterSpacing = "8px";
    ctx.fillText("PROD. JOKA BEATZ", W / 2, H - 90);
    (ctx as any).letterSpacing = "0px";
  };

  // Build a 1080x1920 File from any image source URL with optional baked text.
  const composeShortsArtFromUrl = async (srcUrl: string, baseName = "ai-shorts-art"): Promise<File> => {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("Could not load generated image"));
      i.src = srcUrl;
    });
    const W = 1080, H = 1920;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    // cover-fit
    const scale = Math.max(W / img.width, H / img.height);
    const dw = img.width * scale, dh = img.height * scale;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    if (overlayText) {
      await ensureOverlayFonts();
      drawShortsOverlay(ctx, W, H, { beat: beatName, artist, bpm, musicKey });
    }
    const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.92));
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  };

  const handleGenerateAIArt = async () => {
    if (!beatName || !artist) {
      toast.error("Set Beat name and Type beat artist first");
      return;
    }
    setGeneratingArt(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in first");
      toast.info("Generating AI thumbnail art…");
      const r = await fetch(`${FUNCTIONS_BASE}/generate-shorts-art`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ beat: beatName, artist, genre, customPrompt: artPrompt || undefined }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "AI generation failed");
      const file = await composeShortsArtFromUrl(json.imageDataUrl, `${beatName.toLowerCase().replace(/\s+/g, "-")}-shorts`);
      setThumbFile(file);
      setCroppedThumb(file); // already 1080x1920, skip manual crop
      toast.success("AI thumbnail ready (1080×1920) — text overlay baked in");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGeneratingArt(false);
    }
  };

  // ---- Mix AI thumbnail (1920x1080) ----
  const drawMixOverlay = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    o: { genre: string; count: number },
  ) => {
    // Left dark gradient for text legibility
    const leftGrad = ctx.createLinearGradient(0, 0, W * 0.75, 0);
    leftGrad.addColorStop(0, "rgba(0,0,0,0.85)");
    leftGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = leftGrad;
    ctx.fillRect(0, 0, W, H);
    // Bottom band
    const botGrad = ctx.createLinearGradient(0, H - 220, 0, H);
    botGrad.addColorStop(0, "rgba(0,0,0,0)");
    botGrad.addColorStop(1, "rgba(0,0,0,0.9)");
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, H - 220, W, 220);

    const year = new Date().getFullYear();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // Top tag
    ctx.fillStyle = "#DC2626";
    ctx.font = `700 44px ${FONT_MONO}`;
    (ctx as any).letterSpacing = "4px";
    ctx.fillText(`[FREE] ${o.count} ${o.genre.toUpperCase()} TYPE BEATS`, 80, 140);
    (ctx as any).letterSpacing = "0px";

    // Big title — auto shrink to fit
    const maxW = W - 160;
    let s1 = 190;
    ctx.font = `400 ${s1}px ${FONT_DISPLAY}`;
    while (ctx.measureText(o.genre.toUpperCase()).width > maxW && s1 > 80) {
      s1 -= 6; ctx.font = `400 ${s1}px ${FONT_DISPLAY}`;
    }
    let s2 = 140;
    ctx.font = `400 ${s2}px ${FONT_CONDENSED}`;
    while (ctx.measureText("TYPE BEAT MIX").width > maxW && s2 > 60) {
      s2 -= 4; ctx.font = `400 ${s2}px ${FONT_CONDENSED}`;
    }
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(220,38,38,0.7)";
    ctx.shadowBlur = 24;
    ctx.font = `400 ${s1}px ${FONT_DISPLAY}`;
    (ctx as any).letterSpacing = "-1px";
    ctx.fillText(o.genre.toUpperCase(), 80, 320);
    ctx.font = `400 ${s2}px ${FONT_CONDENSED}`;
    (ctx as any).letterSpacing = "3px";
    ctx.fillText("TYPE BEAT MIX", 80, 320 + s1 * 0.85);
    ctx.shadowBlur = 0;
    (ctx as any).letterSpacing = "0px";

    // Year stamp
    ctx.fillStyle = "#DC2626";
    ctx.font = `400 110px ${FONT_DISPLAY}`;
    ctx.fillText(`${year}`, 80, 570);

    // Producer tag bottom-left
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 36px ${FONT_MONO}`;
    (ctx as any).letterSpacing = "6px";
    ctx.fillText("PROD. JOKA BEATZ", 80, H - 80);
    (ctx as any).letterSpacing = "0px";

    // Bottom-right runtime label
    ctx.textAlign = "right";
    ctx.fillStyle = "#DC2626";
    ctx.font = `700 36px ${FONT_MONO}`;
    (ctx as any).letterSpacing = "6px";
    ctx.fillText("FREE DOWNLOAD", W - 80, H - 80);
    (ctx as any).letterSpacing = "0px";
  };

  // ---- Long-form 16:9 overlay (single beat) ----
  const drawLongOverlay = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    o: { beat: string; artist: string; bpm?: string; musicKey?: string },
  ) => {
    // Bottom dark gradient for legibility
    const botGrad = ctx.createLinearGradient(0, H - H * 0.55, 0, H);
    botGrad.addColorStop(0, "rgba(0,0,0,0)");
    botGrad.addColorStop(1, "rgba(0,0,0,0.92)");
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, H - H * 0.55, W, H * 0.55);
    // Top dark gradient
    const topGrad = ctx.createLinearGradient(0, 0, 0, H * 0.28);
    topGrad.addColorStop(0, "rgba(0,0,0,0.8)");
    topGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, W, H * 0.28);

    const padX = Math.round(W * 0.05);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Top tag
    ctx.fillStyle = "#DC2626";
    const tagSize = Math.round(H * 0.04);
    ctx.font = `700 ${tagSize}px ${FONT_MONO}`;
    (ctx as any).letterSpacing = "6px";
    const tagY = Math.round(H * 0.08);
    ctx.fillText("[ FREE ]", padX, tagY);
    (ctx as any).letterSpacing = "0px";

    // Available vertical band between top tag and bottom info row
    const bottomInfoY = Math.round(H * 0.9);
    const topBoundary = tagY + tagSize + Math.round(H * 0.04);
    const availableH = bottomInfoY - topBoundary - Math.round(H * 0.04);
    const maxW = W - padX * 2;

    const titleText = `"${(o.beat || "UNTITLED").toUpperCase()}"`;
    const subText = `${(o.artist || "ARTIST").toUpperCase()} TYPE BEAT`;
    const gap = Math.round(H * 0.025);

    // Auto-shrink: start big, shrink both proportionally until total block fits availableH
    let titleStart = Math.round(H * 0.14);
    const titleMin = Math.round(H * 0.055);
    const subRatio = 0.55; // sub size ≈ 55% of title size
    let titleWrap = wrapTextLines(ctx, titleText, maxW, FONT_DISPLAY, titleStart, titleMin, 400);
    let subStart = Math.max(Math.round(titleWrap.size * subRatio), Math.round(H * 0.04));
    let subWrap = wrapTextLines(ctx, subText, maxW, FONT_CONDENSED, subStart, Math.round(H * 0.035), 400);
    let titleLineH = Math.round(titleWrap.size * 1.05);
    let subLineH = Math.round(subWrap.size * 1.15);
    let totalH = titleLineH * titleWrap.lines.length + gap + subLineH * subWrap.lines.length;
    while (totalH > availableH && titleStart > titleMin) {
      titleStart -= 6;
      titleWrap = wrapTextLines(ctx, titleText, maxW, FONT_DISPLAY, titleStart, titleMin, 400);
      subStart = Math.max(Math.round(titleWrap.size * subRatio), Math.round(H * 0.035));
      subWrap = wrapTextLines(ctx, subText, maxW, FONT_CONDENSED, subStart, Math.round(H * 0.03), 400);
      titleLineH = Math.round(titleWrap.size * 1.05);
      subLineH = Math.round(subWrap.size * 1.15);
      totalH = titleLineH * titleWrap.lines.length + gap + subLineH * subWrap.lines.length;
    }

    // Anchor block to bottom of the available band
    let cursorY = bottomInfoY - Math.round(H * 0.04) - totalH;
    cursorY = Math.max(cursorY, topBoundary);

    ctx.font = `400 ${titleWrap.size}px ${FONT_DISPLAY}`;
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(220,38,38,0.7)";
    ctx.shadowBlur = 24;
    (ctx as any).letterSpacing = "-1px";
    for (const line of titleWrap.lines) {
      ctx.fillText(line, padX, cursorY);
      cursorY += titleLineH;
    }
    ctx.shadowBlur = 0;
    (ctx as any).letterSpacing = "0px";

    cursorY += gap;
    ctx.font = `400 ${subWrap.size}px ${FONT_CONDENSED}`;
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = Math.max(6, Math.round(subWrap.size * 0.1));
    ctx.shadowColor = "rgba(0,0,0,0.85)";
    ctx.shadowBlur = 16;
    (ctx as any).letterSpacing = "3px";
    for (const line of subWrap.lines) {
      ctx.strokeText(line, padX, cursorY);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(line, padX, cursorY);
      cursorY += subLineH;
    }
    ctx.shadowBlur = 0;
    (ctx as any).letterSpacing = "0px";

    // BPM • Key (right side, bottom info row) — switch back to alphabetic for crisp baseline
    ctx.textBaseline = "alphabetic";
    const bits: string[] = [];
    if (o.bpm) bits.push(`${o.bpm} BPM`);
    if (o.musicKey) bits.push(o.musicKey.toUpperCase());
    if (bits.length) {
      ctx.textAlign = "right";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${Math.round(H * 0.045)}px ${FONT_MONO}`;
      (ctx as any).letterSpacing = "3px";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 10;
      ctx.fillText(bits.join("   •   "), W - padX, Math.round(H * 0.93));
      ctx.shadowBlur = 0;
      (ctx as any).letterSpacing = "0px";
    }

    // Producer tag bottom-left
    ctx.fillStyle = "#DC2626";
    ctx.textAlign = "left";
    ctx.font = `700 ${Math.round(H * 0.03)}px ${FONT_MONO}`;
    (ctx as any).letterSpacing = "6px";
    ctx.fillText("PROD. JOKA BEATZ", padX, Math.round(H * 0.93));
    (ctx as any).letterSpacing = "0px";
  };

  const composeMixArtFromUrl = async (srcUrl: string, baseName = "mix-art"): Promise<File> => {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("Could not load generated image"));
      i.src = srcUrl;
    });
    const W = 1920, H = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    const scale = Math.max(W / img.width, H / img.height);
    const dw = img.width * scale, dh = img.height * scale;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    if (mixOverlayText) {
      await ensureOverlayFonts();
      drawMixOverlay(ctx, W, H, { genre, count: mixTracks.length });
    }
    const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.92));
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  };

  const handleGenerateMixArt = async () => {
    if (!genre) { toast.error("Pick a genre first"); return; }
    setGeneratingMixArt(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in first");
      toast.info("Generating AI mix thumbnail (1920×1080)…");
      const r = await fetch(`${FUNCTIONS_BASE}/generate-shorts-art`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          beat: `${genre} Type Beat Mix`,
          artist: genre,
          genre,
          aspect: "16:9",
          mode: "mix",
          customPrompt: mixArtPrompt || undefined,
        }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "AI generation failed");
      const file = await composeMixArtFromUrl(json.imageDataUrl, `${genre.toLowerCase().replace(/\s+/g, "-")}-mix`);
      setThumbFile(file);
      toast.success("AI mix thumbnail ready (1920×1080)");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGeneratingMixArt(false);
    }
  };

  // ---- Mix mode helpers ----
  const cleanTrackName = (filename: string) => {
    const { beat } = parseFilename(filename);
    return beat || filename.replace(/\.[^.]+$/, "");
  };

  const addMixFiles = async (files: FileList | File[] | null) => {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith("audio/") || /\.(mp3|wav)$/i.test(f.name));
    if (!arr.length) { toast.error("Pick MP3/WAV files"); return; }
    const probed: MixTrack[] = [];
    for (const f of arr) {
      try {
        const d = await getAudioDuration(f);
        probed.push({ file: f, name: cleanTrackName(f.name), duration: d });
      } catch {
        toast.warning(`Skipped (couldn't read): ${f.name}`);
      }
    }
    setMixTracks((prev) => [...prev, ...probed]);
  };

  const removeMixTrack = (i: number) => setMixTracks((prev) => prev.filter((_, idx) => idx !== i));
  const moveMixTrack = (i: number, dir: -1 | 1) => setMixTracks((prev) => {
    const j = i + dir;
    if (j < 0 || j >= prev.length) return prev;
    const next = [...prev];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
  const updateMixTrackName = (i: number, name: string) =>
    setMixTracks((prev) => prev.map((t, idx) => (idx === i ? { ...t, name } : t)));

  const totalMixDuration = mixTracks.reduce((s, t) => s + t.duration, 0);

  const handleConfirmCrop = async () => {
    try {
      const f = await buildCroppedFile();
      if (f) {
        setCroppedThumb(f);
        toast.success("Crop saved (1080×1920)");
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const renderMP4 = async (): Promise<Blob> => {
    const ffmpeg = await loadFFmpeg();
    const isMix = format === "mix";
    const isShort = format === "short";
    const fullDuration = isMix ? totalMixDuration : await getAudioDuration(audioFile!);
    if (!isFinite(fullDuration) || fullDuration <= 0) throw new Error("Invalid audio duration");
    const start = isShort ? Math.max(0, trim[0]) : 0;
    const end = isShort ? Math.min(fullDuration, trim[1]) : fullDuration;
    const duration = end - start;
    if (isShort && (duration < 30 || duration > 60)) {
      throw new Error(`Shorts must be 30–60s (current: ${duration.toFixed(1)}s)`);
    }
    const execTimeoutMs = Math.max(120000, Math.ceil(duration * 8000));

    // Log-based progress (ffmpeg's built-in progress event is unreliable with -loop 1)
    const logHandler = ({ message }: { message: string }) => {
      const m = message.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      if (m) {
        const t = (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 100;
        setProgress(Math.min(99, Math.round((t / duration) * 100)));
      }
    };
    ffmpeg.on("log", logHandler);

    const useBgVideo = (isShort || format === "long") && !!bgVideoFile;
    const targetW = isShort ? 1080 : 1280;
    const targetH = isShort ? 1920 : 720;
    const vf = `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black`;
    const vfCover = `scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},setsar=1`;

    let imgName = "";
    let bgName = "";
    if (useBgVideo) {
      const ext = (bgVideoFile!.name.split(".").pop() || "mp4").toLowerCase();
      bgName = `bg.${ext}`;
      await ffmpeg.writeFile(bgName, await fetchFile(bgVideoFile!));
    } else {
      const videoImage = isShort && croppedThumb ? croppedThumb : thumbFile!;
      imgName = "thumb." + (videoImage.name.split(".").pop() || "jpg");
      await ffmpeg.writeFile(imgName, await fetchFile(videoImage));
    }

    // Build transparent overlay PNG when baking text on top of a bg video clip (Shorts only)
    let overlayName = "";
    const useTextOverlayOnVideo =
      useBgVideo &&
      ((isShort && overlayText) || (format === "long" && !isMix && longOverlayText));
    if (useTextOverlayOnVideo) {
      const c = document.createElement("canvas");
      c.width = targetW; c.height = targetH;
      const octx = c.getContext("2d")!;
      await ensureOverlayFonts();
      // transparent background — overlay painters add semi-transparent bands + text
      if (isShort) {
        drawShortsOverlay(octx, targetW, targetH, { beat: beatName, artist, bpm, musicKey });
      } else {
        drawLongOverlay(octx, targetW, targetH, { beat: beatName, artist, bpm, musicKey });
      }
      const pngBlob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), "image/png"));
      overlayName = "overlay.png";
      await ffmpeg.writeFile(overlayName, await fetchFile(new File([pngBlob], overlayName, { type: "image/png" })));
    }

    // Write audio inputs
    const audioInputs: string[] = [];
    if (isMix) {
      for (let i = 0; i < mixTracks.length; i++) {
        const t = mixTracks[i];
        const ext = (t.file.name.split(".").pop() || "mp3").toLowerCase();
        const name = `t${i}.${ext}`;
        await ffmpeg.writeFile(name, await fetchFile(t.file));
        audioInputs.push(name);
      }
    } else {
      const audioName = "audio." + (audioFile!.name.split(".").pop() || "mp3");
      await ffmpeg.writeFile(audioName, await fetchFile(audioFile!));
      audioInputs.push(audioName);
    }

    const args: string[] = [];
    if (useBgVideo) {
      // Loop the video clip indefinitely; we'll cut to audio length below
      args.push("-stream_loop", "-1", "-i", bgName);
    } else {
      args.push("-loop", "1", "-framerate", "1", "-i", imgName);
    }
    if (isShort && !isMix) args.push("-ss", start.toFixed(2));
    for (const a of audioInputs) args.push("-i", a);
    const overlayInputIdx = 1 + audioInputs.length;
    if (useTextOverlayOnVideo) args.push("-loop", "1", "-i", overlayName);

    if (isMix && audioInputs.length > 1) {
      const labels = audioInputs.map((_, i) => `[${i + 1}:a:0]`).join("");
      const videoFilter = useBgVideo ? vfCover : vf;
      const videoChain = useTextOverlayOnVideo
        ? `[0:v]${videoFilter}[bg];[bg][${overlayInputIdx}:v]overlay=0:0[v]`
        : `[0:v]${videoFilter}[v]`;
      args.push(
        "-filter_complex",
        `${videoChain};${labels}concat=n=${audioInputs.length}:v=0:a=1[aout]`,
      );
      args.push("-map", "[v]", "-map", "[aout]");
    } else {
      if (useBgVideo) {
        const videoChain = useTextOverlayOnVideo
          ? `[0:v]${vfCover}[bg];[bg][${overlayInputIdx}:v]overlay=0:0[v]`
          : `[0:v]${vfCover}[v]`;
        args.push("-filter_complex", videoChain);
        args.push("-map", "[v]", "-map", "1:a:0");
      } else {
        args.push("-map", "0:v:0", "-map", "1:a:0");
      }
    }

    args.push("-t", duration.toFixed(2), "-c:v", "libx264", "-preset", "ultrafast");
    if (!useBgVideo) args.push("-tune", "stillimage");
    args.push(
      "-threads", "1",
      "-filter_threads", "1",
      "-filter_complex_threads", "1",
      "-pix_fmt", "yuv420p",
    );
    if (!useBgVideo) {
      // Static-image background: scale + pad video output stream
      args.push("-vf", vf);
    }
    args.push(
      "-r", useBgVideo ? "30" : "1",
      "-c:a", "aac",
      "-b:a", "192k",
      "-shortest",
      "-movflags", "+faststart",
      "-y",
      "out.mp4",
    );

    try {
      const exitCode = await ffmpeg.exec(args, execTimeoutMs);
      if (exitCode !== 0) {
        throw new Error(exitCode === 1 ? "Rendering timed out in the browser" : `Rendering failed (${exitCode})`);
      }
    } finally {
      ffmpeg.off("log", logHandler);
    }
    const data = await ffmpeg.readFile("out.mp4") as Uint8Array;
    const buf = new Uint8Array(data.byteLength);
    buf.set(data);
    return new Blob([buf.buffer], { type: "video/mp4" });
  };

  const handleUpload = async () => {
    if (format === "mix") {
      if (mixTracks.length < 2) { toast.error("Add at least 2 tracks for a mix"); return; }
      if (!genre) { toast.error("Fill genre"); return; }
      if (!thumbFile && !bgVideoFile) { toast.error("Add a thumbnail image or background video"); return; }
    } else {
      if (!audioFile || !beatName || !genre || !artist) {
        toast.error("Fill all required fields");
        return;
      }
      if (!thumbFile && !bgVideoFile) {
        toast.error("Add a thumbnail image or background video");
        return;
      }
    }
    if (format === "short") {
      const len = trim[1] - trim[0];
      if (len < 30 || len > 60) { toast.error("Shorts clip must be 30–60 seconds"); return; }
      if (thumbFile && !croppedThumb) { toast.error("Crop your image to 9:16 first"); return; }
    }
    if (!connected?.connected) {
      toast.error("Connect YouTube first");
      return;
    }
    setResultUrl(null);
    if (renderedVideoUrl) { URL.revokeObjectURL(renderedVideoUrl); setRenderedVideoUrl(null); }
    try {
      setStage("rendering");
      setProgress(0);
      toast.info("Rendering MP4 in your browser…");
      const videoBlob = await renderMP4();
      const dlUrl = URL.createObjectURL(videoBlob);
      setRenderedVideoUrl(dlUrl);
      const safeName = (format === "mix"
        ? `${genre || "mix"}-type-beat-mix`
        : `${artist || "type"}-${beatName || "beat"}`)
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "video";
      setRenderedVideoName(`${safeName}.mp4`);
      setProgress(0);

      setStage("uploading");
      const { data: { session } } = await supabase.auth.getSession();
      const initRes = await fetch(`${FUNCTIONS_BASE}/youtube-upload-init`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
        body: JSON.stringify({
          title, description, tags,
          fileSize: videoBlob.size, mimeType: "video/mp4",
          beat_name: format === "mix" ? `${genre} Type Beat Mix (${mixTracks.length} beats)` : beatName,
          genre, type_artist: format === "mix" ? (artist || "Various") : artist,
          bpm: bpm ? Number(bpm) : null, music_key: musicKey || null,
          privacyStatus: privacy,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        }),
      });
      const init = await initRes.json();
      if (!initRes.ok) throw new Error(init.error || "init failed");

      // Chunked resumable upload directly to Google.
      // Large chunks keep it fast; auto-resume on transient network errors.
      const total = videoBlob.size;
      const CHUNK = 16 * 1024 * 1024; // 16MB (multiple of 256KB per Google spec)
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      const sendChunk = (start: number, end: number): Promise<{ status: number; body: string; range: string | null }> => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", init.uploadUrl);
          xhr.setRequestHeader("Content-Type", "video/mp4");
          xhr.setRequestHeader("Content-Range", `bytes ${start}-${end - 1}/${total}`);
          xhr.timeout = 0;
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const sent = start + e.loaded;
              setProgress(Math.min(99, Math.round((sent / total) * 100)));
            }
          };
          xhr.onload = () => resolve({ status: xhr.status, body: xhr.responseText || "", range: xhr.getResponseHeader("Range") });
          xhr.onerror = () => reject(new Error("network"));
          xhr.ontimeout = () => reject(new Error("timeout"));
          xhr.send(videoBlob.slice(start, end));
        });
      };

      const queryOffset = (): Promise<number> => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", init.uploadUrl);
          xhr.setRequestHeader("Content-Range", `bytes */${total}`);
          xhr.timeout = 30000;
          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 201) {
              resolve(total);
            } else if (xhr.status === 308) {
              const range = xhr.getResponseHeader("Range");
              if (!range) return resolve(0);
              const m = range.match(/bytes=0-(\d+)/);
              resolve(m ? parseInt(m[1], 10) + 1 : 0);
            } else {
              reject(new Error(`status query failed: ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error("network"));
          xhr.ontimeout = () => reject(new Error("timeout"));
          xhr.send(null);
        });
      };

      let offset = 0;
      let finalStatus = 0;
      let finalBody = "";
      let attempt = 0;
      while (offset < total) {
        const end = Math.min(offset + CHUNK, total);
        try {
          const { status, body, range } = await sendChunk(offset, end);
          if (status === 200 || status === 201) {
            finalStatus = status;
            finalBody = body;
            offset = total;
            break;
          } else if (status === 308) {
            // Resume from server-reported offset
            if (range) {
              const m = range.match(/bytes=0-(\d+)/);
              offset = m ? parseInt(m[1], 10) + 1 : end;
            } else {
              offset = end;
            }
            attempt = 0;
          } else if (status === 500 || status === 502 || status === 503 || status === 504) {
            throw new Error(`retryable ${status}`);
          } else {
            throw new Error(`YouTube upload failed (${status}): ${body.slice(0, 300)}`);
          }
        } catch (err) {
          attempt++;
          if (attempt > 6) throw err;
          await sleep(Math.min(16000, 1000 * Math.pow(2, attempt)));
          // Re-sync offset from server before retry
          try { offset = await queryOffset(); } catch { /* keep current offset */ }
        }
      }

      if (finalStatus !== 200 && finalStatus !== 201) {
        // Final confirmation
        try {
          offset = await queryOffset();
          if (offset !== total) throw new Error("Upload incomplete");
        } catch (e) {
          throw new Error(`YouTube upload failed: ${(e as Error).message}`);
        }
      }
      setProgress(100);
      let videoId = "";
      try { videoId = JSON.parse(finalBody).id; }
      catch { throw new Error("Bad YouTube response"); }
      if (!videoId) throw new Error("Missing video id from YouTube");

      // Set thumbnail
      setStage("thumbnail");
      const thumbToUpload = format === "short" && croppedThumb ? croppedThumb : thumbFile;
      if (thumbToUpload) {
        try {
          await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${init.accessToken}`, "Content-Type": thumbToUpload.type },
            body: thumbToUpload,
          });
        } catch (e) {
          console.warn("Thumbnail set failed (non-fatal):", e);
          toast.warning("Video uploaded but thumbnail failed — set it manually on YouTube.");
        }
      }

      // Mark complete
      try {
        await fetch(`${FUNCTIONS_BASE}/youtube-upload-complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
          body: JSON.stringify({ recordId: init.recordId, videoId, status: "completed" }),
        });
      } catch (e) {
        console.warn("Complete callback failed (non-fatal):", e);
      }

      setStage("done");
      setResultUrl(`https://youtu.be/${videoId}`);
      toast.success("Uploaded to YouTube!");
    } catch (e) {
      console.error(e);
      const msg = (e as Error).message || "Upload failed";
      if (/REAUTH_REQUIRED|invalid_grant|expired or revoked/i.test(msg)) {
        toast.error("YouTube connection expired. Click 'Connect YouTube' to reconnect.", { duration: 8000 });
        setConnected({ connected: false });
      } else {
        toast.error(msg);
      }
      setStage("idle");
    }
  };

  const filteredArtists = artists.filter((a) => a.genre === genre);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Youtube className="text-primary" /> YouTube Uploader</h1>
          <p className="text-muted-foreground mt-1">Render MP4 from MP3 + thumbnail and upload to YouTube with auto-filled SEO.</p>
        </div>
        {connected?.connected ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Connected: <strong className="text-foreground">{connected.channel_title}</strong></span>
            <Button size="sm" variant="outline" onClick={handleDisconnect}><Link2Off className="h-4 w-4" /> Disconnect</Button>
          </div>
        ) : (
          <Button onClick={handleConnect}><Youtube className="h-4 w-4" /> Connect YouTube</Button>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>Beat Info</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label>Video format</Label>
            <Tabs value={format} onValueChange={(v) => setFormat(v as "long" | "short" | "mix")}>
              <TabsList className="grid w-full max-w-2xl grid-cols-3">
                <TabsTrigger value="long">Long-form (16:9)</TabsTrigger>
                <TabsTrigger value="short">Shorts / Reel (9:16)</TabsTrigger>
                <TabsTrigger value="mix">Mix (multi-track)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {format !== "mix" && (
            <div className="space-y-2"><Label>Beat name *</Label><Input value={beatName} onChange={(e) => setBeatName(e.target.value)} placeholder="Stargazer" /></div>
          )}
          <div className="space-y-2"><Label>License / purchase URL</Label><Input value={licenseUrl} onChange={(e) => setLicenseUrl(e.target.value)} /></div>
          {format !== "mix" && (
            <>
              <div className="space-y-2"><Label>BPM</Label><Input value={bpm} onChange={(e) => setBpm(e.target.value)} placeholder="140" /></div>
              <div className="space-y-2"><Label>Key</Label><Input value={musicKey} onChange={(e) => setMusicKey(e.target.value)} placeholder="C# minor" /></div>
            </>
          )}
          <div className="space-y-2">
            <Label>Genre *</Label>
            <Select value={genre} onValueChange={(v) => { setGenre(v); setArtist(""); }}>
              <SelectTrigger><SelectValue placeholder="Pick a genre" /></SelectTrigger>
              <SelectContent>{genres.map((g) => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {format !== "mix" && (
            <div className="space-y-2">
              <Label>Type beat artist *</Label>
              <Select value={artist} onValueChange={setArtist} disabled={!genre}>
                <SelectTrigger><SelectValue placeholder={genre ? "Pick an artist" : "Pick a genre first"} /></SelectTrigger>
                <SelectContent>{filteredArtists.map((a) => <SelectItem key={a.id} value={a.artist_name}>{a.artist_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {format !== "mix" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>MP3 audio *</Label>
              <Button type="button" variant="outline" size="sm" className="h-7" onClick={() => setDrivePicker("audio")}>
                <HardDrive className="h-3.5 w-3.5 mr-1" /> Drive
              </Button>
            </div>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav"
              className="hidden"
              onChange={(e) => handleAudioFile(e.target.files?.[0] || null)}
            />
            {audioFile ? (
              <div className="rounded-lg border border-border bg-secondary px-3 py-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Music className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm truncate">{audioFile.name}</span>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAudioFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {audioObjectUrl && (
                  <audio src={audioObjectUrl} controls preload="metadata" className="w-full h-9" />
                )}
              </div>
            ) : (
              <div
                onClick={() => audioInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setAudioDragOver(true); }}
                onDragLeave={() => setAudioDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setAudioDragOver(false);
                  handleAudioFile(e.dataTransfer.files?.[0] || null);
                }}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center",
                  audioDragOver
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-secondary/50"
                )}
              >
                <Music className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground mb-1">Drop MP3 here or click to browse</p>
                <p className="text-xs text-muted-foreground">MP3 or WAV</p>
              </div>
            )}
          </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Thumbnail ({format === "short" ? "1080x1920 9:16" : "1280x720 16:9"} jpg/png) *
              </Label>
              <Button type="button" variant="outline" size="sm" className="h-7" onClick={() => setDrivePicker("image")}>
                <HardDrive className="h-3.5 w-3.5 mr-1" /> Drive
              </Button>
            </div>
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => handleThumbFile(e.target.files?.[0] || null)}
            />
            {thumbFile ? (
              <div className="relative rounded-lg overflow-hidden border border-border bg-secondary">
                {thumbPreviewUrl && (
                  <img
                    src={thumbPreviewUrl}
                    alt="Thumbnail preview"
                    className={cn(
                      "object-cover",
                      format === "short" ? "mx-auto max-h-[420px] aspect-[9/16]" : "w-full aspect-video"
                    )}
                  />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => setThumbFile(null)}
                  className="absolute top-2 right-2 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground px-3 py-2 truncate">{thumbFile.name}</p>
              </div>
            ) : (
              <div
                onClick={() => thumbInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setThumbDragOver(true); }}
                onDragLeave={() => setThumbDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setThumbDragOver(false);
                  handleThumbFile(e.dataTransfer.files?.[0] || null);
                }}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center",
                  format === "short" ? "aspect-[9/16] max-w-[260px] mx-auto" : "aspect-video",
                  thumbDragOver
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-secondary/50"
                )}
              >
                <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground mb-1">Drop thumbnail here or click to browse</p>
                <p className="text-xs text-muted-foreground">
                  JPG or PNG, {format === "short" ? "1080x1920 (9:16)" : "1280x720 (16:9)"}
                </p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Privacy</Label>
            <Select value={privacy} onValueChange={(v: any) => setPrivacy(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Schedule publish (optional)</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("flex-1 justify-start text-left font-normal", !scheduledAt && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledAt ? formatDate(new Date(scheduledAt), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledAt ? new Date(scheduledAt) : undefined}
                    onSelect={(d) => {
                      if (!d) return;
                      const existing = scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 60 * 60000);
                      d.setHours(existing.getHours(), existing.getMinutes(), 0, 0);
                      // datetime-local format: YYYY-MM-DDTHH:mm (local)
                      const pad = (n: number) => String(n).padStart(2, "0");
                      setScheduledAt(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                className="w-32"
                value={scheduledAt ? scheduledAt.split("T")[1] || "" : ""}
                onChange={(e) => {
                  const time = e.target.value;
                  if (!time) return;
                  const datePart = scheduledAt
                    ? scheduledAt.split("T")[0]
                    : (() => {
                        const d = new Date();
                        const pad = (n: number) => String(n).padStart(2, "0");
                        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
                      })();
                  setScheduledAt(`${datePart}T${time}`);
                }}
              />
              {scheduledAt && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setScheduledAt("")}
                  title="Cancel scheduled publish"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {scheduledAt && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => setScheduledAt("")}
              >
                <X className="h-3 w-3 mr-1" /> Clear schedule — publish using privacy setting above
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              {scheduledAt
                ? `Will publish at ${new Date(scheduledAt).toLocaleString()} (uploaded as Private until then)`
                : "Leave empty to publish immediately with the privacy setting above."}
            </p>
          </div>
        </CardContent>
      </Card>

      {format === "mix" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Mix Tracks ({mixTracks.length})</span>
              <span className="text-sm font-normal text-muted-foreground">
                Total: {fmtTimestamp(totalMixDuration)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold">AI mix thumbnail (1920×1080)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Type className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label htmlFor="mix-overlay-toggle" className="text-xs text-muted-foreground">Bake text overlay</Label>
                  <Switch id="mix-overlay-toggle" checked={mixOverlayText} onCheckedChange={setMixOverlayText} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Generates a 16:9 cinematic background based on the genre, then bakes "{genre || "GENRE"} TYPE BEAT MIX {new Date().getFullYear()}" + producer tag onto it. Sets it as the video thumbnail.
              </p>
              <Textarea
                value={mixArtPrompt}
                onChange={(e) => setMixArtPrompt(e.target.value)}
                rows={2}
                placeholder="(Optional) Custom art direction — e.g. 'rainy tokyo street, neon red glow, cinematic widescreen'"
              />
              <Button
                type="button"
                onClick={handleGenerateMixArt}
                disabled={generatingMixArt || !genre}
                className="w-full"
              >
                {generatingMixArt ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {generatingMixArt ? "Generating…" : "Generate AI mix thumbnail"}
              </Button>
            </div>

            <input
              ref={mixInputRef}
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav"
              multiple
              className="hidden"
              onChange={(e) => { addMixFiles(e.target.files); if (mixInputRef.current) mixInputRef.current.value = ""; }}
            />
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" className="h-7" onClick={() => setDrivePicker("mix")}>
                <HardDrive className="h-3.5 w-3.5 mr-1" /> Add from Drive
              </Button>
            </div>
            <div
              onClick={() => mixInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setMixDragOver(true); }}
              onDragLeave={() => setMixDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setMixDragOver(false); addMixFiles(e.dataTransfer.files); }}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center",
                mixDragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-secondary/50",
              )}
            >
              <Plus className="w-6 h-6 mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Drop MP3s here or click to add tracks</p>
              <p className="text-xs text-muted-foreground">Order = playback order. Track names appear as timestamps in the description.</p>
            </div>

            {mixTracks.length > 0 && (
              <div className="space-y-2">
                {mixTracks.map((t, i) => {
                  let cum = 0;
                  for (let k = 0; k < i; k++) cum += mixTracks[k].duration;
                  return (
                    <div key={`${t.file.name}-${i}`} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 p-2">
                      <span className="text-xs font-mono text-primary w-16 shrink-0">{fmtTimestamp(cum)}</span>
                      <Input
                        value={t.name}
                        onChange={(e) => updateMixTrackName(i, e.target.value)}
                        className="flex-1 h-8"
                      />
                      <span className="text-xs text-muted-foreground w-12 text-right">{fmtTimestamp(t.duration)}</span>
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0} onClick={() => moveMixTrack(i, -1)}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={i === mixTracks.length - 1} onClick={() => moveMixTrack(i, 1)}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeMixTrack(i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setMixTracks([])}>
                    Clear all
                  </Button>
                </div>
              </div>
            )}

            {totalMixDuration > 3600 && (
              <p className="text-xs text-amber-500">
                ⚠ Total length {fmtTimestamp(totalMixDuration)} — long renders take a while in the browser.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {(format === "short" || format === "long") && (
        <Card>
          <CardHeader><CardTitle>Background Video Clip (optional)</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold">
                    Loop a video clip behind the audio ({format === "short" ? "9:16" : "16:9"})
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-7" onClick={() => setDrivePicker("video")}>
                    <HardDrive className="h-3.5 w-3.5 mr-1" /> Drive
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-7" onClick={() => bgVideoInputRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5 mr-1" /> Upload
                  </Button>
                </div>
              </div>
              {format === "long" && (
                <div className="flex items-center justify-end gap-2">
                  <Type className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label htmlFor="long-overlay-toggle" className="text-xs text-muted-foreground">
                    Bake text overlay (title, BPM, key)
                  </Label>
                  <Switch
                    id="long-overlay-toggle"
                    checked={longOverlayText}
                    onCheckedChange={setLongOverlayText}
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Loops a short video clip (MP4/MOV/WebM) as the video background instead of the static image. The thumbnail image is still used as the YouTube thumbnail. Keep clips short (a few seconds) for fast browser rendering — they auto-loop to fill the audio length.
              </p>
              <input
                ref={bgVideoInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={(e) => { handleBgVideoFile(e.target.files?.[0] || null); if (bgVideoInputRef.current) bgVideoInputRef.current.value = ""; }}
              />
              {bgVideoFile && bgVideoUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-border bg-black">
                  <video
                    src={bgVideoUrl}
                    className={cn(
                      "mx-auto object-cover",
                      format === "short" ? "max-h-[360px] aspect-[9/16]" : "w-full aspect-video",
                    )}
                    muted
                    loop
                    autoPlay
                    playsInline
                    onLoadedMetadata={(e) => {
                      const v = e.currentTarget;
                      setBgVideoMeta({ width: v.videoWidth, height: v.videoHeight });
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => setBgVideoFile(null)}
                    className="absolute top-2 right-2 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground px-3 py-2 truncate">{bgVideoFile.name} · {(bgVideoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                </div>
              ) : (
                <div
                  onClick={() => bgVideoInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setBgVideoDragOver(true); }}
                  onDragLeave={() => setBgVideoDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setBgVideoDragOver(false); handleBgVideoFile(e.dataTransfer.files?.[0] || null); }}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center mx-auto",
                    format === "short" ? "aspect-[9/16] max-w-[220px]" : "aspect-video w-full",
                    bgVideoDragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-secondary/50",
                  )}
                >
                  <Film className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop video clip</p>
                  <p className="text-xs text-muted-foreground">MP4/MOV/WebM · loops automatically</p>
                </div>
              )}
              {format === "short" && bgVideoFile && bgVideoUrl && bgVideoMeta && (bgVideoMeta.width / bgVideoMeta.height) > (9 / 16 + 0.001) && !bgVideoCropped && (() => {
                const cropWPct = ((bgVideoMeta.height * (9 / 16)) / bgVideoMeta.width) * 100;
                const leftPct = (100 - cropWPct) * (bgCropX / 100);
                return (
                  <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CropIcon className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold">Crop to 9:16</Label>
                      <span className="text-xs text-muted-foreground ml-auto">
                        Source {bgVideoMeta.width}×{bgVideoMeta.height}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This clip is wider than 9:16. Drag the slider to position the crop window, then apply.
                    </p>
                    <div className="relative mx-auto bg-black rounded-md overflow-hidden" style={{ maxWidth: 480 }}>
                      <video
                        src={bgVideoUrl}
                        className="w-full h-auto block"
                        muted
                        loop
                        autoPlay
                        playsInline
                      />
                      {/* dim outside */}
                      <div className="absolute inset-y-0 left-0 bg-black/60" style={{ width: `${leftPct}%` }} />
                      <div className="absolute inset-y-0 right-0 bg-black/60" style={{ width: `${100 - leftPct - cropWPct}%` }} />
                      {/* crop frame */}
                      <div
                        className="absolute inset-y-0 border-2 border-primary pointer-events-none"
                        style={{ left: `${leftPct}%`, width: `${cropWPct}%` }}
                      />
                    </div>
                    {/* Live 9:16 preview */}
                    {(() => {
                      const previewH = 360;
                      const previewW = previewH * 9 / 16;
                      const sourceRatio = bgVideoMeta.width / bgVideoMeta.height;
                      const videoDisplayW = previewH * sourceRatio;
                      const maxShift = videoDisplayW - previewW;
                      const shift = -(maxShift * (bgCropX / 100));
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Live 9:16 preview</Label>
                            <span className="text-[10px] text-muted-foreground">(what will be exported)</span>
                          </div>
                          <div
                            className="relative bg-black rounded-md overflow-hidden mx-auto ring-1 ring-primary/40"
                            style={{ width: previewW, height: previewH }}
                          >
                            <video
                              src={bgVideoUrl}
                              muted
                              loop
                              autoPlay
                              playsInline
                              style={{
                                position: "absolute",
                                top: 0,
                                left: shift,
                                height: previewH,
                                width: videoDisplayW,
                                maxWidth: "none",
                                display: "block",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Left</span>
                        <span>Position: {Math.round(bgCropX)}%</span>
                        <span>Right</span>
                      </div>
                      <Slider
                        value={[bgCropX]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(v) => setBgCropX(v[0])}
                        disabled={croppingBg}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setBgCropX(0)} disabled={croppingBg}>Left</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setBgCropX(50)} disabled={croppingBg}>Center</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setBgCropX(100)} disabled={croppingBg}>Right</Button>
                      <Button
                        type="button"
                        size="sm"
                        className="ml-auto"
                        onClick={applyBgVideoCrop}
                        disabled={croppingBg}
                      >
                        {croppingBg ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Cropping…</> : <><CropIcon className="h-3.5 w-3.5 mr-1" /> Apply 9:16 crop</>}
                      </Button>
                    </div>
                  </div>
                );
              })()}
              {format === "short" && bgVideoCropped && (
                <p className="text-xs text-primary">✓ Cropped to 9:16 (1080×1920)</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {format === "short" && (
        <Card>
          <CardHeader><CardTitle>Shorts Editor</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold">AI type-beat thumbnail</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Type className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label htmlFor="overlay-toggle" className="text-xs text-muted-foreground">Bake text overlay</Label>
                  <Switch id="overlay-toggle" checked={overlayText} onCheckedChange={setOverlayText} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Generates a 9:16 background from the beat name + type-beat artist, then bakes the title, BPM and key onto the image so they show in both the YouTube thumbnail and the Shorts video frame.
              </p>
              <Textarea
                value={artPrompt}
                onChange={(e) => setArtPrompt(e.target.value)}
                rows={2}
                placeholder="(Optional) Custom art direction — e.g. 'foggy night skyline, neon red, lone hooded figure'"
              />
              <Button
                type="button"
                onClick={handleGenerateAIArt}
                disabled={generatingArt || !beatName || !artist}
                className="w-full"
              >
                {generatingArt ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {generatingArt ? "Generating…" : "Generate AI thumbnail"}
              </Button>
              {croppedThumb && (
                <p className="text-xs text-primary">✓ Using {croppedThumb.name} as Shorts art</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <Label>Audio clip (30–60s)</Label>
                <span className="text-sm text-muted-foreground">
                  {audioFile ? `${trim[0].toFixed(1)}s → ${trim[1].toFixed(1)}s · length ${(trim[1]-trim[0]).toFixed(1)}s` : "Upload an MP3 first"}
                </span>
              </div>
              {audioFile && audioDuration > 0 ? (
                <>
                  <Slider
                    min={0}
                    max={audioDuration}
                    step={0.1}
                    value={trim}
                    onValueChange={(v) => {
                      let [a, b] = v as [number, number];
                      a = Math.max(0, Math.min(a, audioDuration));
                      b = Math.max(0, Math.min(b, audioDuration));
                      if (b < a) [a, b] = [b, a];
                      const minLen = Math.min(30, audioDuration);
                      const maxLen = Math.min(60, audioDuration);
                      const movedStart = Math.abs(a - trim[0]) > 0.001;
                      const movedEnd = Math.abs(b - trim[1]) > 0.001;
                      const len = b - a;
                      if (len < minLen) {
                        if (movedStart && !movedEnd) a = Math.max(0, b - minLen);
                        else b = Math.min(audioDuration, a + minLen);
                      } else if (len > maxLen) {
                        if (movedStart && !movedEnd) a = b - maxLen;
                        else b = a + maxLen;
                      }
                      setTrim([Number(a.toFixed(2)), Number(b.toFixed(2))]);
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button" variant="secondary" size="sm"
                      onClick={() => setTrim([0, Math.min(60, audioDuration)])}
                    >First 60s</Button>
                    <Button
                      type="button" variant="secondary" size="sm"
                      onClick={() => setTrim([0, Math.min(30, audioDuration)])}
                    >First 30s</Button>
                    <Button
                      type="button" variant="secondary" size="sm"
                      onClick={() => {
                        const end = audioDuration;
                        const start = Math.max(0, end - Math.min(60, audioDuration));
                        setTrim([start, end]);
                      }}
                    >Last 60s</Button>
                    <Button
                      type="button" variant="secondary" size="sm"
                      onClick={() => {
                        const end = audioDuration;
                        const start = Math.max(0, end - Math.min(30, audioDuration));
                        setTrim([start, end]);
                      }}
                    >Last 30s</Button>
                    <Button
                      type="button" variant="secondary" size="sm"
                      onClick={() => {
                        const mid = audioDuration / 2;
                        const half = Math.min(30, audioDuration / 2);
                        setTrim([Math.max(0, mid - half), Math.min(audioDuration, mid + half)]);
                      }}
                    >Middle 60s</Button>
                    <Button
                      type="button" variant="secondary" size="sm"
                      onClick={() => {
                        const mid = audioDuration / 2;
                        const half = Math.min(15, audioDuration / 2);
                        setTrim([Math.max(0, mid - half), Math.min(audioDuration, mid + half)]);
                      }}
                    >Middle 30s</Button>
                    <Button
                      type="button" variant="secondary" size="sm"
                      onClick={() => {
                        const a = trimAudioRef.current; if (!a) return;
                        a.currentTime = trim[0];
                        trimStopAt.current = trim[1];
                        a.play().catch(() => {});
                      }}
                    >▶ Play clip</Button>
                    <Button
                      type="button" variant="ghost" size="sm"
                      onClick={() => {
                        const a = trimAudioRef.current; if (!a) return;
                        const t = Math.max(0, Math.min(audioDuration, a.currentTime));
                        const len = Math.min(60, audioDuration - t);
                        setTrim([Number(t.toFixed(2)), Number((t + len).toFixed(2))]);
                      }}
                    >Set start = playhead</Button>
                  </div>
                  <audio
                    ref={trimAudioRef}
                    src={audioObjectUrl ?? undefined}
                    controls
                    className="w-full"
                    onTimeUpdate={(e) => {
                      const a = e.currentTarget;
                      if (trimStopAt.current != null && a.currentTime >= trimStopAt.current) {
                        a.pause();
                        trimStopAt.current = null;
                      }
                    }}
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Drop an MP3 in the Beat Info section above.</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <Label>Crop image to 9:16 (1080×1920)</Label>
                {croppedThumb && <span className="text-xs text-primary">✓ Crop saved</span>}
              </div>
              {thumbPreviewUrl ? (
                <>
                  <div className="relative w-full max-w-md mx-auto bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "9 / 16" }}>
                    <Cropper
                      image={thumbPreviewUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={9 / 16}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={(_, area) => setCroppedAreaPixels(area)}
                    />
                  </div>
                  <div className="flex items-center gap-3 max-w-xs mx-auto">
                    <Label className="text-xs">Zoom</Label>
                    <Slider min={1} max={4} step={0.05} value={[zoom]} onValueChange={(v) => setZoom(v[0])} />
                  </div>
                  <div className="flex justify-center">
                    <Button type="button" onClick={handleConfirmCrop} variant="secondary">
                      {overlayText ? "Save crop + bake text overlay" : "Save crop"}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Upload an image in the Beat Info section above.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>YouTube Metadata (auto-generated, edit before upload)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={10} /></div>
          <div className="space-y-2">
            <Label>Tags ({tags.length})</Label>
            <Textarea value={tags.join(", ")} onChange={(e) => setTags(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} rows={3} />
          </div>
        </CardContent>
      </Card>

      {stage !== "idle" && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              {stage === "done" ? <CheckCircle2 className="text-primary" /> : <Loader2 className="animate-spin" />}
              <span className="capitalize">{stage === "rendering" ? "Rendering MP4…" : stage === "uploading" ? "Uploading to YouTube…" : stage === "thumbnail" ? "Setting thumbnail…" : "Done!"}</span>
            </div>
            {stage !== "done" && <Progress value={progress} />}
            {resultUrl && (
              <a href={resultUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                {resultUrl} <ExternalLink className="h-4 w-4" />
              </a>
            )}
            {renderedVideoUrl && (
              <div className="pt-2">
                <Button asChild variant="outline" size="sm">
                  <a href={renderedVideoUrl} download={renderedVideoName}>
                    <Download className="h-4 w-4" /> Download rendered MP4
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button size="lg" onClick={handleUpload} disabled={stage !== "idle" && stage !== "done"}>
          <Upload className="h-4 w-4" /> Render & Upload
        </Button>
      </div>

      <GoogleDrivePicker
        open={drivePicker !== null}
        onOpenChange={(v) => { if (!v) setDrivePicker(null); }}
        mode={drivePicker === "image" ? "image" : drivePicker === "video" ? "video" : "audio"}
        onSelect={(file) => {
          if (drivePicker === "image") {
            handleThumbFile(file);
          } else if (drivePicker === "video") {
            handleBgVideoFile(file);
          } else if (drivePicker === "mix") {
            const dt = new DataTransfer();
            dt.items.add(file);
            addMixFiles(dt.files);
          } else {
            handleAudioFile(file);
          }
        }}
      />
    </div>
  );
};

export default AdminYouTubeUploader;