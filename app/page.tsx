"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clapperboard,
  Clock3,
  Copy,
  Download,
  Film,
  History,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Monitor,
  Plus,
  Settings2,
  Smartphone,
  Sparkles,
  Square,
  Video,
  WandSparkles,
  X,
} from "lucide-react";

type Status = "idle" | "starting" | "processing" | "succeeded" | "failed";

const examples = [
  {
    title: "Magical forest",
    prompt:
      "A tiny glowing fairy flying through an enchanted forest at night, fireflies floating around ancient trees, magical particles, cinematic camera movement, volumetric moonlight, highly detailed 3D animation.",
  },
  {
    title: "Cinematic travel",
    prompt:
      "A breathtaking cinematic aerial shot of a beautiful historic city at golden hour, people walking peacefully through the courtyard, warm sunlight, elegant camera movement, realistic architecture, respectful documentary style.",
  },
  {
    title: "Kids animation",
    prompt:
      "A cheerful little fox and a friendly rabbit exploring a colourful magical garden, soft 3D cartoon animation, expressive characters, beautiful flowers, gentle camera movement, warm lighting, family-friendly storytelling.",
  },
  {
    title: "Ocean adventure",
    prompt:
      "A majestic sea turtle swimming through crystal-clear turquoise water above a vibrant coral reef, sunbeams piercing the ocean surface, tiny colourful fish, cinematic underwater photography.",
  },
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("5");
  const [resolution, setResolution] = useState("720p");
  const [ratio, setRatio] = useState("16:9");
  const [status, setStatus] = useState<Status>("idle");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const [predictionId, setPredictionId] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const cancelled = useRef(false);
  const busy = status === "starting" || status === "processing";

  async function generate() {
    if (busy) return;
    if (prompt.trim().length < 5) {
      setError("Please enter a more detailed prompt (at least 5 characters).");
      return;
    }
    cancelled.current = false;
    setError("");
    setVideoUrl("");
    setPredictionId("");
    setStatus("starting");

    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          duration: Number(duration),
          resolution,
          aspectRatio: ratio,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not start video generation.");
      if (!data.id)
        throw new Error("The provider did not return a prediction ID.");
      setPredictionId(data.id);
      setStatus("processing");

      for (let attempt = 0; attempt < 120; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        if (cancelled.current) return;
        const res = await fetch(
          `/api/generate-video?id=${encodeURIComponent(data.id)}`,
          { cache: "no-store" },
        );
        const current = await res.json();
        if (!res.ok)
          throw new Error(
            current.error || "Could not check generation status.",
          );
        if (current.status === "succeeded") {
          if (!current.videoUrl)
            throw new Error(
              "Generation completed, but no video URL was returned. Check the model output format in the API route.",
            );
          setVideoUrl(current.videoUrl);
          setStatus("succeeded");
          return;
        }
        if (current.status === "failed" || current.status === "canceled") {
          throw new Error(current.error || `Generation ${current.status}.`);
        }
      }
      throw new Error(
        "Generation is taking longer than expected. Keep the prediction ID and check the provider dashboard.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "An unexpected error occurred.",
      );
      setStatus("failed");
    }
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy prompt in this browser.");
    }
  }

  function reset() {
    cancelled.current = true;
    setPrompt("");
    setVideoUrl("");
    setError("");
    setPredictionId("");
    setStatus("idle");
  }

  const ratioClass =
    ratio === "9:16"
      ? "aspect-[9/16] max-h-[520px]"
      : ratio === "1:1"
        ? "aspect-square"
        : ratio === "4:3"
          ? "aspect-[4/3]"
          : ratio === "3:4"
            ? "aspect-[3/4] max-h-[520px]"
            : "aspect-video";

  return (
    <main className="min-h-screen bg-[#f7f7fa] text-[#20202a]">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[258px] flex-col border-r border-white/10 bg-[#171721] text-white transition-transform lg:static lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-6">
            <a href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500">
                <Clapperboard size={21} />
              </div>
              <div>
                <p className="text-[15px] font-bold">Motion Studio</p>
                <p className="mt-0.5 text-[10px] tracking-[2px] text-white/45">
                  AI CREATIVE LAB
                </p>
              </div>
            </a>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 lg:hidden"
              aria-label="Close menu"
            >
              <X size={19} />
            </button>
          </div>
          <div className="px-4 pt-7">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[2px] text-white/35">
              Workspace
            </p>
            <nav className="space-y-1">
              <a
                href="#overview"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/65 hover:bg-white/5"
              >
                <LayoutDashboard size={18} />
                Overview
              </a>
              <a
                href="#generator"
                className="flex items-center gap-3 rounded-xl bg-violet-500/15 px-3 py-3 text-sm font-semibold text-violet-300"
              >
                <WandSparkles size={18} />
                Video Generator
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
              </a>
              <a
                href="#history"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/65 hover:bg-white/5"
              >
                <History size={18} />
                Recent creations
              </a>
            </nav>
          </div>
          <div className="px-4 pt-8">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[2px] text-white/35">
              Create
            </p>
            <button
              onClick={reset}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-white/65 hover:bg-white/5"
            >
              <Plus size={18} />
              New video
            </button>
            <a
              href="#settings"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/65 hover:bg-white/5"
            >
              <Settings2 size={18} />
              Video settings
            </a>
          </div>
          <div className="mt-auto p-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
                <Sparkles size={18} />
              </div>
              <p className="text-sm font-semibold">Create something amazing</p>
              <p className="mt-2 text-xs leading-5 text-white/45">
                Describe your idea and turn your imagination into motion.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-white/45">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Workspace ready
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 px-2 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold">
                AI
              </div>
              <div>
                <p className="text-xs font-semibold">Creator workspace</p>
                <p className="mt-1 text-[10px] text-white/40">
                  Personal studio
                </p>
              </div>
              <Settings2 size={16} className="ml-auto text-white/35" />
            </div>
          </div>
        </aside>

        {menuOpen && (
          <button
            aria-label="Close menu overlay"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          />
        )}

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#e9e8ef] bg-white/90 px-4 backdrop-blur-md sm:px-7 lg:px-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMenuOpen(true)}
                className="rounded-xl border border-gray-200 p-2 lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  Video Generator
                  <span className="rounded-md bg-violet-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-violet-600">
                    AI Studio
                  </span>
                </div>
                <p className="mt-1 hidden text-[11px] text-gray-400 sm:block">
                  Turn your ideas into cinematic videos
                </p>
              </div>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold hover:bg-gray-50 sm:px-4"
            >
              <Plus size={15} />
              New project
            </button>
          </header>

          <div
            id="overview"
            className="mx-auto max-w-[1180px] px-4 py-8 sm:px-7 sm:py-10 lg:px-10"
          >
            <div className="mb-8">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-violet-600">
                <Sparkles size={15} />
                YOUR CREATIVE SPACE
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[#22212d] sm:text-4xl">
                Bring your ideas to{" "}
                <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                  life.
                </span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-[15px]">
                Describe the scene you imagine. Generate original AI video clips
                for YouTube, storytelling, social media and more.
              </p> 
            </div>
            <div className="grid items-start gap-6 xl:grid-cols-[1.12fr_0.88fr]">
              <div id="generator" className="space-y-5">
                <div className="rounded-2xl border border-[#e9e7f0] bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                        <WandSparkles size={18} />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold">
                          Describe your video
                        </h2>
                        <p className="mt-1 text-[11px] text-gray-400">
                          Write a detailed scene description
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={copyPrompt}
                      disabled={!prompt}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                    >
                      <Copy size={13} />
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    maxLength={2000}
                    rows={7}
                    placeholder="Example: A young explorer walking through an ancient magical forest at sunset, golden light filtering through the trees, cinematic camera movement, beautiful 3D animation..."
                    className="w-full resize-y rounded-xl border border-[#e9e7f0] bg-[#fbfaff] p-4 text-sm leading-7 outline-none placeholder:text-gray-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                  />
                  <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-gray-400">
                    <span>
                      Describe the subject, action, lighting and camera
                      movement.
                    </span>
                    <span>{prompt.length}/2000</span>
                  </div>
                  <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-bold">Need inspiration?</p>
                      <span className="text-[10px] text-gray-400">
                        Sample prompts
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {examples.map((sample) => (
                        <button
                          key={sample.title}
                          onClick={() => setPrompt(sample.prompt)}
                          className="group rounded-xl border border-[#eceaf2] p-3 text-left transition hover:border-violet-300 hover:bg-violet-50/50"
                        >
                          <span className="flex items-center justify-between gap-2 text-xs font-semibold">
                            {sample.title}
                            <ArrowUpRight
                              size={13}
                              className="text-gray-300 group-hover:text-violet-500"
                            />
                          </span>
                          <span className="mt-1.5 block text-[10px] leading-4 text-gray-400">
                            Use this prompt as a starting point.
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  id="settings"
                  className="rounded-2xl border border-[#e9e7f0] bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="mb-5 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-50 text-fuchsia-600">
                      <Settings2 size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold">Video settings</h2>
                      <p className="mt-1 text-[11px] text-gray-400">
                        Customise output for your platform
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold">
                        Duration
                      </span>
                      <div className="relative">
                        <Clock3
                          size={15}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <select
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-[#e9e7f0] bg-[#fbfaff] py-3 pl-9 pr-8 text-sm outline-none focus:border-violet-400"
                        >
                          {[5, 10, 15, 20, 25, 30].map((s) => (
                            <option key={s} value={s}>
                              {s} seconds
                            </option>
                          ))}
                        </select>
                      </div>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold">
                        Resolution
                      </span>
                      <div className="relative">
                        <Monitor
                          size={15}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <select
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-[#e9e7f0] bg-[#fbfaff] py-3 pl-9 pr-8 text-sm outline-none focus:border-violet-400"
                        >
                          <option value="480p">480p · Standard</option>
                          <option value="720p">720p · HD</option>
                          <option value="1080p">1080p · Full HD</option>
                        </select>
                      </div>
                    </label>
                  </div>
                  <div className="mt-6">
                    <span className="mb-3 block text-xs font-semibold">
                      Aspect ratio
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "16:9", label: "Landscape", Icon: Monitor },
                        { value: "9:16", label: "Portrait", Icon: Smartphone },
                        { value: "1:1", label: "Square", Icon: Square },
                      ].map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setRatio(item.value)}
                          className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-4 transition ${ratio === item.value ? "border-violet-500 bg-violet-50 text-violet-700 ring-2 ring-violet-500/10" : "border-[#e9e7f0] text-gray-500 hover:border-violet-200"}`}
                        >
                          <item.Icon size={20} />
                          <span className="text-xs font-bold">
                            {item.value}
                          </span>
                          <span className="text-[10px]">{item.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] leading-5 text-gray-400">
                      The provider/model must support the selected options.
                    </p>
                  </div>
                  <button
                    onClick={generate}
                    disabled={busy || prompt.trim().length < 5}
                    className="mt-7 flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      <Sparkles size={18} />
                    )}{" "}
                    {status === "starting"
                      ? "Starting generation..."
                      : status === "processing"
                        ? "Generating your video..."
                        : "Generate video"}{" "}
                    {!busy && <ArrowUpRight size={16} />}
                  </button>
                  <p className="mt-3 text-center text-[10px] leading-5 text-gray-400">
                    AI video generation can incur API charges. Check model
                    pricing before generating.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="overflow-hidden rounded-2xl border border-[#e9e7f0] bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#eeedf3] px-5 py-4">
                    <div>
                      <h2 className="text-sm font-bold">Video preview</h2>
                      <p className="mt-1 text-[10px] text-gray-400">
                        {videoUrl
                          ? "Your generated video"
                          : "Your output will appear here"}
                      </p>
                    </div>
                    <span
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold ${status === "succeeded" ? "bg-emerald-50 text-emerald-700" : busy ? "bg-violet-50 text-violet-700" : status === "failed" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}
                    >
                      {status === "succeeded" ? (
                        <CheckCircle2 size={12} />
                      ) : busy ? (
                        <LoaderCircle size={12} className="animate-spin" />
                      ) : status === "failed" ? (
                        <AlertCircle size={12} />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      )}
                      {status === "succeeded"
                        ? "Ready"
                        : busy
                          ? "Processing"
                          : status === "failed"
                            ? "Failed"
                            : "Preview"}
                    </span>
                  </div>
                  <div className="bg-[#171721] p-3 sm:p-4">
                    <div
                      className={`relative mx-auto flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#29253d] via-[#201d31] to-[#14141e] ${videoUrl ? ratioClass : "aspect-video"}`}
                    >
                      {videoUrl ? (
                        <video
                          key={videoUrl}
                          src={videoUrl}
                          controls
                          playsInline
                          className="h-full w-full rounded-xl object-contain"
                        />
                      ) : (
                        <div className="flex min-h-[280px] w-full flex-col items-center justify-center px-5 py-10 text-center">
                          {busy ? (
                            <>
                              <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-300/20 bg-violet-400/10">
                                <Film size={32} className="text-violet-300" />
                                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500">
                                  <LoaderCircle
                                    size={14}
                                    className="animate-spin text-white"
                                  />
                                </span>
                              </div>
                              <h3 className="text-sm font-semibold text-white">
                                Creating your video
                              </h3>
                              <p className="mt-2 max-w-[260px] text-xs leading-5 text-white/45">
                                The request has been sent to your video model.
                              </p>
                              <div className="mt-5 h-1.5 w-48 max-w-full overflow-hidden rounded-full bg-white/10">
                                <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400" />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04]">
                                <Video size={34} className="text-violet-300" />
                              </div>
                              <h3 className="text-sm font-semibold text-white">
                                Your next creation starts here
                              </h3>
                              <p className="mt-2 max-w-[255px] text-xs leading-6 text-white/45">
                                Enter a prompt, choose your settings and
                                generate your first AI video.
                              </p>
                              <div className="mt-5 flex items-center gap-2 text-[10px] text-white/40">
                                <Film size={12} />
                                Video preview appears here
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {error && (
                    <div
                      role="alert"
                      className="mx-4 mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700 sm:mx-5"
                    >
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  {predictionId && (
                    <div className="mx-4 mt-4 rounded-xl bg-gray-50 p-3 text-[11px] text-gray-500 sm:mx-5">
                      <span className="font-semibold text-gray-700">
                        Prediction ID:
                      </span>{" "}
                      <span className="break-all">{predictionId}</span>
                    </div>
                  )}
                  <div className="p-4 sm:p-5">
                    {videoUrl ? (
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#22212d] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                      >
                        <Download size={17} />
                        Open / download video
                        <ArrowUpRight size={15} />
                      </a>
                    ) : (
                      <button
                        disabled
                        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3.5 text-sm font-semibold text-gray-400"
                      >
                        <Download size={16} />
                        Download video
                      </button>
                    )}
                    <p className="mt-3 text-center text-[10px] leading-5 text-gray-400">
                      Download access depends on the provider’s output URL and
                      hosting policy.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-[#e9e7f0] bg-white p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <Sparkles size={16} />
                    </div>
                    <h3 className="text-sm font-bold">Prompt writing tips</h3>
                  </div>
                  <ul className="space-y-3 text-xs leading-5 text-gray-500">
                    {[
                      {
                        title: "Subject",
                        text: "Describe who or what appears.",
                      },
                      {
                        title: "Motion",
                        text: "Explain what happens and how the camera moves.",
                      },
                      {
                        title: "Style",
                        text: "Specify cinematic, realistic or animated.",
                      },
                      {
                        title: "Lighting",
                        text: "Mention golden hour, soft light or dramatic shadows.",
                      },
                    ].map((t) => (
                      <li key={t.title} className="flex gap-2">
                        <CheckCircle2
                          size={15}
                          className="mt-0.5 shrink-0 text-emerald-500"
                        />
                        <span>
                          <strong className="text-gray-700">{t.title}:</strong>{" "}
                          {t.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  id="history"
                  className="rounded-2xl border border-dashed border-[#dcd8e9] bg-white/60 p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                      <History size={19} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Recent creations</h3>
                      <p className="mt-1 text-xs text-gray-400">
                        History is not saved after refresh in this starter
                        project.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <footer className="mt-10 border-t border-[#e9e7f0] pt-5 text-center text-[11px] text-gray-400">
              Motion Studio · AI Video Generator
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
