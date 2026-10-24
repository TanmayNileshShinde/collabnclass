import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Speech,
  Sparkles,
  ArrowRight,
  Code2,
  PenTool,
  Bot,
  MessageSquare,
  ShieldCheck,
  Video,
  Zap,
  ChevronDown,
  Monitor,
  Sun,
  Moon,
  Radio,
  Layers,
  Share2,
  CheckCircle2,
  FolderTree,
  Send,
} from "lucide-react";

// ==========================================
// DATA DEFINITIONS & CONSTANTS
// ==========================================

const STATS = [
  { value: "< 45ms", label: "Ultra-Low Latency", sub: "WebRTC peer-to-peer mesh" },
  { value: "4-in-1", label: "Unified Tools", sub: "Code, Canvas, AI & Video" },
  { value: "100%", label: "Zero Installation", sub: "Runs natively in browser" },
  { value: "99.99%", label: "Uptime SLA", sub: "Enterprise cloud backbone" },
];

const BENTO_FEATURES = [
  {
    id: "github",
    title: "Live GitHub Repository Explorer",
    category: "Developer First",
    badge: "Native Integration",
    desc: "Inspect any public repository directly inside your classroom. Browse file trees, review commits, and examine syntax-highlighted code without switching tabs.",
    icon: Code2,
    accent: "#00e5ff",
    gradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
    border: "border-cyan-500/30",
    glow: "shadow-[0_0_30px_rgba(0,229,255,0.15)]",
    colSpan: "lg:col-span-2",
  },
  {
    id: "whiteboard",
    title: "Infinite Collaborative Canvas",
    category: "Creative Workspace",
    badge: "Multi-User Sync",
    desc: "Real-time drawing canvas with sticky notes, freehand sketching, architecture blocks, and laser pointer for visual explanations.",
    icon: PenTool,
    accent: "#38bdf8",
    gradient: "from-sky-500/20 via-blue-600/10 to-transparent",
    border: "border-sky-500/30",
    glow: "shadow-[0_0_30px_rgba(56,189,248,0.15)]",
    colSpan: "lg:col-span-1",
  },
  {
    id: "ai",
    title: "In-Meeting AI Study Copilot",
    category: "Intelligent Assistant",
    badge: "Llama 3 / Groq Powered",
    desc: "Instant lecture summarization, real-time code explanations, automatic quiz generation, and conceptual deep-dives on demand.",
    icon: Bot,
    accent: "#a855f7",
    gradient: "from-purple-500/20 via-indigo-600/10 to-transparent",
    border: "border-purple-500/30",
    glow: "shadow-[0_0_30px_rgba(168,85,247,0.15)]",
    colSpan: "lg:col-span-1",
  },
  {
    id: "video",
    title: "WebRTC Ultra-Low Latency Video",
    category: "Streaming Engine",
    badge: "Adaptive Bitrate",
    desc: "HD multi-participant video mesh with active speaker tracking, background noise suppression, and crisp 60fps screen broadcasting.",
    icon: Video,
    accent: "#10b981",
    gradient: "from-emerald-500/20 via-teal-600/10 to-transparent",
    border: "border-emerald-500/30",
    glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    colSpan: "lg:col-span-1",
  },
  {
    id: "rooms",
    title: "Permanent Rooms & 8-Digit PINs",
    category: "Access & Dispatch",
    badge: "Instant Access",
    desc: "Custom personal URL for instructors, plus short 8-character meeting codes (e.g. 7X9K-2M4P) that students can join without sign-up friction.",
    icon: Zap,
    accent: "#f59e0b",
    gradient: "from-amber-500/20 via-orange-600/10 to-transparent",
    border: "border-amber-500/30",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    colSpan: "lg:col-span-1",
  },
  {
    id: "security",
    title: "Cloud Vault, Logs & Attendance",
    category: "Institutional Grade",
    badge: "Automated Records",
    desc: "Downloadable attendance timestamps, CSV participant reports, cloud recording archives, and end-to-end encrypted signaling.",
    icon: ShieldCheck,
    accent: "#ec4899",
    gradient: "from-pink-500/20 via-rose-600/10 to-transparent",
    border: "border-pink-500/30",
    glow: "shadow-[0_0_30px_rgba(236,72,153,0.15)]",
    colSpan: "lg:col-span-2",
  },
];

const FAQS = [
  {
    question: "Do students need to create an account to join a classroom?",
    answer: "No! Instructors can share an 8-character classroom code (e.g., 7X9K-2M4P) or a direct URL. Participants can join immediately with zero friction.",
  },
  {
    question: "How does the in-meeting GitHub explorer work?",
    answer: "CollabClass integrates directly with GitHub's REST and Raw APIs. Simply paste any repository URL into the side dock to instantly browse directory trees, open source files, and review code with syntax highlighting in real-time.",
  },
  {
    question: "Can I record our classroom sessions for students to re-watch?",
    answer: "Yes! CollabClass includes full recording capabilities backed by Stream Video SDK. All recorded lectures are automatically saved to your Cloud Vault for review and download.",
  },
  {
    question: "How does the AI Study Copilot assist during live calls?",
    answer: "Our in-meeting Copilot is powered by high-speed inference (Llama 3 via Groq). It can answer questions about the code on screen, generate 3-question conceptual quizzes, summarize key takeaways, and explain complex algorithms.",
  },
  {
    question: "Is CollabClass free for students and educators?",
    answer: "Yes, CollabClass is completely free and open for educational and team use, featuring unlimited personal rooms, whiteboard canvases, and code exploration.",
  },
];

const COMPARISON = [
  {
    feature: "Unified All-in-One Interface",
    collabClass: "Code, Canvas, AI & Video in 1 tab",
    legacy: "5 fragmented apps (Zoom + Miro + GitHub + Slack)",
  },
  {
    feature: "GitHub Repository Inspection",
    collabClass: "Native file-tree & syntax viewer inside call",
    legacy: "Clunky screen-sharing with text blurriness",
  },
  {
    feature: "In-Meeting AI Assistance",
    collabClass: "Built-in Copilot for summaries & code quizzes",
    legacy: "Requires switching to separate ChatGPT tab",
  },
  {
    feature: "Student Join Experience",
    collabClass: "Instant 8-character PIN, zero app install",
    legacy: "Forced software download & account sign-up",
  },
  {
    feature: "Memory & Resource Footprint",
    collabClass: "Lightweight browser WebRTC (< 200MB RAM)",
    legacy: "Heavy desktop electron apps (> 2GB RAM)",
  },
];

// ==========================================
// INTERACTIVE MOCK CLASSROOM COMPONENT
// ==========================================

function InteractiveClassroomPreview() {
  const [activeTab, setActiveTab] = useState<"code" | "board" | "ai" | "chat">("code");
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const tabs: Array<{ id: "code" | "board" | "ai" | "chat"; label: string; icon: React.ElementType }> = [
    { id: "code", label: "GitHub Code", icon: Code2 },
    { id: "board", label: "Whiteboard", icon: PenTool },
    { id: "ai", label: "AI Copilot", icon: Bot },
    { id: "chat", label: "Team Chat", icon: MessageSquare },
  ];

  // Auto-rotation every 5s unless hovered
  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      setActiveTab((prev) => {
        const order: Array<"code" | "board" | "ai" | "chat"> = ["code", "board", "ai", "chat"];
        const nextIdx = (order.indexOf(prev) + 1) % order.length;
        return order[nextIdx];
      });
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full max-w-5xl mx-auto rounded-3xl overflow-hidden dark:bg-[#020b18]/90 bg-white/95 border dark:border-cyan-500/30 border-cyan-200/80 shadow-[0_20px_70px_rgba(0,180,255,0.18)] dark:shadow-[0_0_80px_rgba(0,229,255,0.15)] transition-all duration-300"
    >
      {/* Top Window Chrome */}
      <div className="dark:bg-[#041224] bg-slate-100/90 border-b dark:border-cyan-500/20 border-slate-200 px-4 py-3 flex items-center justify-between gap-3 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-rose-500/80 hover:bg-rose-500 transition-colors" />
          <div className="size-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors" />
          <div className="size-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors" />
          <div className="h-4 w-px bg-slate-300 dark:bg-white/10 mx-1" />
          <span className="text-xs font-mono font-medium dark:text-cyan-300 text-cyan-700 hidden sm:inline-flex items-center gap-1.5">
            <Radio className="size-3 animate-pulse text-cyan-400" />
            CS-402: Distributed Systems Lab
          </span>
        </div>

        {/* Center Room Code Pill */}
        <div className="flex items-center gap-2 dark:bg-[#020813] bg-white px-3 py-1 rounded-full border dark:border-cyan-500/30 border-cyan-200 text-xs font-mono shadow-sm">
          <span className="dark:text-slate-400 text-slate-500 text-[10px] uppercase font-bold tracking-wider">Room PIN</span>
          <span className="dark:text-cyan-300 text-cyan-700 font-extrabold tracking-widest">7X9K-2M4P</span>
        </div>

        {/* Live Call Telemetry */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[11px]">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>42ms · 6 Live</span>
          </div>
        </div>
      </div>

      {/* Main Classroom Mock Body */}
      <div className="flex flex-col md:flex-row h-[460px] sm:h-[480px]">
        {/* Left Side Dock Navigation */}
        <div className="w-full md:w-48 dark:bg-[#030d1b] bg-slate-50 border-r dark:border-cyan-500/15 border-slate-200 p-2.5 flex md:flex-col justify-between gap-1.5 flex-shrink-0 transition-colors duration-300">
          <div className="flex md:flex-col gap-1 w-full overflow-x-auto md:overflow-visible">
            <div className="text-[10px] font-mono uppercase tracking-wider dark:text-cyan-400 text-cyan-700 px-2 py-1 font-bold hidden md:block">
              Workspace Modes
            </div>
            {tabs.map((t) => {
              const Icon = t.icon;
              const isSelected = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                    isSelected
                      ? "dark:bg-cyan-500/20 bg-cyan-100 dark:text-cyan-300 text-cyan-800 border dark:border-cyan-500/40 border-cyan-300 shadow-sm"
                      : "dark:text-slate-400 text-slate-600 dark:hover:bg-white/5 hover:bg-slate-200/70"
                  }`}
                >
                  <Icon className="size-4 flex-shrink-0" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Participants Avatars in Call */}
          <div className="hidden md:flex flex-col gap-2 pt-3 border-t dark:border-cyan-500/15 border-slate-200">
            <span className="text-[10px] font-mono uppercase tracking-wider dark:text-slate-400 text-slate-500 px-1 font-semibold">
              In Session (4)
            </span>
            <div className="flex items-center gap-2 px-1">
              <div className="relative">
                <div className="size-7 rounded-full bg-cyan-600 border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-cyan-400/50">
                  TS
                </div>
                <span className="absolute bottom-0 right-0 size-2 bg-emerald-400 rounded-full border border-black" />
              </div>
              <div className="relative">
                <div className="size-7 rounded-full bg-purple-600 border border-purple-300 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                  AP
                </div>
                <span className="absolute bottom-0 right-0 size-2 bg-emerald-400 rounded-full border border-black" />
              </div>
              <div className="relative">
                <div className="size-7 rounded-full bg-rose-600 border border-rose-300 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                  JD
                </div>
                <span className="absolute bottom-0 right-0 size-2 bg-emerald-400 rounded-full border border-black" />
              </div>
              <div className="relative">
                <div className="size-7 rounded-full bg-amber-600 border border-amber-300 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                  +1
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Active Viewport Panel */}
        <div className="flex-1 overflow-hidden relative dark:bg-[#020813] bg-white transition-colors duration-300 flex flex-col">
          {/* TAB 1: CODE EXPLORER */}
          {activeTab === "code" && (
            <div className="h-full flex flex-col">
              <div className="px-4 py-2.5 dark:bg-[#041224] bg-slate-100 border-b dark:border-cyan-500/20 border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 dark:text-slate-300 text-slate-700 font-mono">
                  <FolderTree className="size-3.5 text-cyan-400" />
                  <span className="dark:text-cyan-400 text-cyan-700 font-bold">TanmayNileshShinde</span>
                  <span>/</span>
                  <span className="font-semibold">collabnclass</span>
                  <span>/</span>
                  <span className="text-slate-400">src/webrtc/mesh.ts</span>
                </div>
                <span className="text-[10px] font-mono dark:text-cyan-300 text-cyan-700 px-2 py-0.5 rounded dark:bg-cyan-950/80 bg-cyan-100 border dark:border-cyan-500/30 border-cyan-200">
                  TypeScript · Read Only
                </span>
              </div>
              <div className="flex-1 font-mono text-xs p-4 overflow-y-auto space-y-1 dark:bg-[#01060e] bg-slate-900 text-slate-200">
                {[
                  { n: 1, c: 'import { StreamVideoClient } from "@stream-io/video-react-sdk";' },
                  { n: 2, c: 'import { supabaseClient } from "@/lib/supabase";' },
                  { n: 3, c: '' },
                  { n: 4, c: '// Initialize low-latency collaborative classroom session' },
                  { n: 5, c: 'export async function initializeClassroomSession(roomId: string) {' },
                  { n: 6, c: '  const call = client.call("default", roomId);' },
                  { n: 7, c: '  await call.join({ create: true });' },
                  { n: 8, c: '  console.log("Connected to WebRTC mesh peer network");' },
                  { n: 9, c: '  return { call, status: "ONLINE_ACTIVE" };' },
                  { n: 10, c: '}' },
                ].map((line) => (
                  <div key={line.n} className="flex gap-4 py-0.5 hover:bg-cyan-500/10 px-1 rounded transition-colors">
                    <span className="text-slate-600 select-none w-5 text-right font-mono text-[11px]">{line.n}</span>
                    <span className="dark:text-cyan-100/90 text-slate-100 font-mono">{line.c}</span>
                  </div>
                ))}
                {/* Live Participant Cursor Simulation */}
                <div className="mt-3 flex items-center gap-2 pl-9">
                  <div className="size-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    Tanmay is reviewing Line 7
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WHITEBOARD CANVAS */}
          {activeTab === "board" && (
            <div className="h-full relative overflow-hidden dark:bg-[#030d1b] bg-slate-50 flex items-center justify-center p-6">
              {/* Dot Grid Background */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(0,229,255,0.4) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
              {/* Architecture Diagram Nodes */}
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 max-w-lg w-full">
                <div className="rounded-xl p-3.5 dark:bg-[#07162b] bg-white border dark:border-cyan-500/40 border-cyan-200 shadow-md text-center flex-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">Client Node</span>
                  <p className="text-xs font-bold dark:text-white text-slate-900 mt-1">Browser WebRTC</p>
                </div>
                <ArrowRight className="size-5 text-cyan-400 flex-shrink-0 animate-pulse" />
                <div className="rounded-xl p-3.5 dark:bg-purple-950/60 bg-purple-50 border border-purple-500/40 shadow-md text-center flex-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold block">Signaling Core</span>
                  <p className="text-xs font-bold dark:text-white text-slate-900 mt-1">Stream SDK + Clerk</p>
                </div>
                <ArrowRight className="size-5 text-purple-400 flex-shrink-0 animate-pulse" />
                <div className="rounded-xl p-3.5 dark:bg-emerald-950/60 bg-emerald-50 border border-emerald-500/40 shadow-md text-center flex-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">Persistence</span>
                  <p className="text-xs font-bold dark:text-white text-slate-900 mt-1">Supabase DB</p>
                </div>
              </div>
              {/* Floating Sticky Note */}
              <div className="absolute top-4 right-4 bg-amber-200/90 dark:bg-amber-300/90 text-amber-950 p-2.5 rounded-xl shadow-lg font-sans text-xs max-w-[150px] rotate-2 border border-amber-400">
                <span className="font-bold block text-[10px] uppercase">Sticky Note</span>
                Canvas sync latency &lt; 20ms across peers 🔥
              </div>
            </div>
          )}

          {/* TAB 3: AI STUDY COPILOT */}
          {activeTab === "ai" && (
            <div className="h-full flex flex-col justify-between p-4 dark:bg-[#020813] bg-white">
              <div className="space-y-3 overflow-y-auto">
                <div className="flex gap-2.5 items-start">
                  <div className="size-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-xs flex-shrink-0 font-bold">
                    Q
                  </div>
                  <div className="p-2.5 rounded-2xl dark:bg-cyber-surface/90 bg-slate-100 dark:border-cyan-500/20 border-slate-200 text-xs dark:text-slate-200 text-slate-800 max-w-[85%]">
                    Can you summarize the difference between WebRTC mesh vs SFU for 20 students?
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="size-6 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0 shadow-sm">
                    ✦
                  </div>
                  <div className="p-3 rounded-2xl dark:bg-cyan-950/40 bg-cyan-50/80 border dark:border-cyan-500/30 border-cyan-200 text-xs dark:text-cyan-100 text-slate-800 space-y-2 max-w-[90%]">
                    <p className="font-semibold text-cyan-400 text-[11px] uppercase tracking-wider">Copilot Analysis</p>
                    <p className="leading-relaxed">
                      In a pure <strong>P2P Mesh</strong>, each client uploads $N-1$ streams, which saturates uplink at ~4-6 peers. An <strong>SFU (Selective Forwarding Unit)</strong> routes packets through a central relay, enabling smooth 50+ participant lectures with adaptive bitrate.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl dark:bg-[#07162b] bg-slate-100 border dark:border-cyan-500/30 border-slate-300 text-xs">
                  <Bot className="size-3.5 text-cyan-400" />
                  <span className="dark:text-slate-400 text-slate-500">Ask AI about current lecture...</span>
                </div>
                <button className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md hover:bg-cyan-400 transition-colors">
                  <Send className="size-3" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: TEAM CHAT */}
          {activeTab === "chat" && (
            <div className="h-full flex flex-col justify-between p-4 dark:bg-[#020813] bg-white">
              <div className="space-y-3 overflow-y-auto">
                {[
                  { user: "Tanmay Shinde", time: "10:14 AM", text: "Pushed the fix for the whiteboard synchronization event loop.", color: "text-cyan-400" },
                  { user: "Antara Parab", time: "10:15 AM", text: "Reviewing right now on the live GitHub viewer! Clean implementation.", color: "text-purple-400" },
                  { user: "Alex Chen", time: "10:16 AM", text: "Screen share audio is super crisp. Let's record this module.", color: "text-emerald-400" },
                ].map((msg, i) => (
                  <div key={i} className="flex flex-col text-xs space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${msg.color}`}>{msg.user}</span>
                      <span className="text-[10px] dark:text-slate-500 text-slate-400 font-mono">{msg.time}</span>
                    </div>
                    <div className="dark:text-slate-300 text-slate-700 bg-slate-100 dark:bg-white/5 p-2 rounded-xl border dark:border-white/5 border-slate-200">
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Send a message to the classroom..."
                  readOnly
                  className="flex-1 px-3 py-1.5 rounded-xl dark:bg-[#07162b] bg-slate-100 border dark:border-cyan-500/30 border-slate-300 text-xs dark:text-slate-300 text-slate-700 outline-none"
                />
                <button className="px-3 py-1.5 rounded-xl btn-cyber-primary text-xs font-bold">
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN LANDING COMPONENT
// ==========================================

export default function CollabClassLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignIn = () => {
    navigate("/sign-in");
  };

  const handleGetStarted = () => {
    navigate("/sign-in");
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen dark:bg-[#020813] bg-slate-50 dark:text-white text-slate-900 transition-colors duration-300 selection:bg-cyan-500/30 selection:text-cyan-600 dark:selection:text-cyan-200 overflow-x-hidden font-sans">
      {/* ===================== NAVBAR ===================== */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "dark:bg-[#020b18]/90 bg-white/90 backdrop-blur-xl border-b dark:border-cyan-500/15 border-slate-200 shadow-md py-3"
            : "bg-transparent py-4 sm:py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo Branding */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="size-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.4)] group-hover:scale-105 transition-transform duration-300">
              <Speech className="size-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight leading-tight">
                Collab<span className="text-cyan-400">Class</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold dark:text-cyan-400 text-cyan-600 leading-none">
                OS Workspace
              </span>
            </div>
          </div>

          {/* Middle Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold dark:text-slate-300 text-slate-700">
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-cyan-400 transition-colors duration-200"
            >
              Capabilities
            </button>
            <button
              onClick={() => scrollToSection("demo")}
              className="hover:text-cyan-400 transition-colors duration-200"
            >
              Interactive Preview
            </button>
            <button
              onClick={() => scrollToSection("comparison")}
              className="hover:text-cyan-400 transition-colors duration-200"
            >
              Why CollabClass
            </button>
            <button
              onClick={() => scrollToSection("workflow")}
              className="hover:text-cyan-400 transition-colors duration-200"
            >
              Workflow
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="hover:text-cyan-400 transition-colors duration-200"
            >
              FAQ
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="size-9 rounded-xl flex items-center justify-center dark:bg-white/5 bg-slate-100 dark:border-white/10 border-slate-300 border hover:border-cyan-400 dark:hover:border-cyan-400 transition-all duration-300 text-slate-700 dark:text-slate-200"
              title="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="size-4 text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.6)]" />
              ) : (
                <Moon className="size-4 text-cyan-600 drop-shadow-[0_0_6px_rgba(8,145,178,0.4)]" />
              )}
            </button>

            <button
              onClick={handleSignIn}
              className="hidden sm:inline-block text-xs font-bold px-4 py-2 rounded-xl dark:text-slate-300 text-slate-700 hover:text-cyan-400 transition-colors duration-200"
            >
              Sign In
            </button>

            <button
              onClick={handleGetStarted}
              className="btn-cyber-primary text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 transition-all duration-300 hover:scale-[1.02]"
            >
              <span>Get Started</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ===================== HERO SECTION ===================== */}
      <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient Radial Lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] sm:size-[800px] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 size-[400px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />

        {/* Hero Background Grid */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              theme === "dark"
                ? "repeating-linear-gradient(0deg, transparent, transparent 70px, rgba(0, 180, 255, 0.08) 70px, rgba(0, 180, 255, 0.08) 71px), repeating-linear-gradient(90deg, transparent, transparent 100px, rgba(0, 180, 255, 0.06) 100px, rgba(0, 180, 255, 0.06) 101px)"
                : "repeating-linear-gradient(0deg, transparent, transparent 70px, rgba(2, 132, 199, 0.06) 70px, rgba(2, 132, 199, 0.06) 71px), repeating-linear-gradient(90deg, transparent, transparent 100px, rgba(2, 132, 199, 0.05) 100px, rgba(2, 132, 199, 0.05) 101px)",
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full dark:bg-cyan-500/10 bg-cyan-50 border dark:border-cyan-500/30 border-cyan-200 text-xs font-semibold dark:text-cyan-300 text-cyan-700 shadow-sm mb-6 animate-pulse">
            <Sparkles className="size-3.5 text-cyan-400" />
            <span>CollabClass v2.4 Architecture Live · WebRTC Low Latency</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
            Where Code, Canvas &amp;<br />
            <span className="shimmer-text">Conversations</span> Flow as One.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl dark:text-slate-300 text-slate-600 max-w-3xl mx-auto leading-relaxed mb-10">
            The next-generation virtual classroom combining live WebRTC video, native GitHub repository inspection, collaborative whiteboard, and intelligent AI study assistance into a single browser tab.
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto mb-12">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto btn-cyber-primary text-sm sm:text-base font-bold px-8 py-3.5 rounded-xl shadow-xl flex items-center justify-center gap-2 group transition-all duration-300 hover:scale-105"
            >
              <span>Launch Classroom</span>
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => scrollToSection("demo")}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl dark:bg-white/5 bg-white dark:border-white/10 border-slate-300 border text-xs sm:text-sm font-semibold dark:text-slate-200 text-slate-800 hover:border-cyan-400 transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
            >
              <Monitor className="size-4 text-cyan-400" />
              <span>Explore Interactive Demo</span>
            </button>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl mx-auto">
            {STATS.map((s, idx) => (
              <div
                key={idx}
                className="glass-cyber-card rounded-2xl p-4 sm:p-5 border dark:border-cyan-500/20 border-slate-200 text-center transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-2xl sm:text-3xl font-extrabold dark:text-cyan-300 text-cyan-600 mb-0.5">
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm font-bold dark:text-white text-slate-900">
                  {s.label}
                </div>
                <div className="text-[11px] dark:text-slate-400 text-slate-500 mt-0.5">
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== INTERACTIVE DEMO SHOWCASE ===================== */}
      <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase tracking-widest dark:text-cyan-400 text-cyan-600 font-bold block mb-2">
              ◈ INTERACTIVE PRODUCT EXPERIENCE
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Step inside the classroom workspace.
            </h2>
            <p className="text-sm sm:text-base dark:text-slate-400 text-slate-600">
              Click between workspace modes below to test how code review, whiteboard sketches, AI assistance, and chat operate simultaneously in a live call.
            </p>
          </div>

          <InteractiveClassroomPreview />
        </div>
      </section>

      {/* ===================== BENTO CAPABILITIES GRID ===================== */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 relative dark:bg-[#01060e] bg-slate-100/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-widest dark:text-cyan-400 text-cyan-600 font-bold block mb-2">
              ◈ MODULAR CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Engineered for seamless collaboration.
            </h2>
            <p className="text-sm sm:text-base dark:text-slate-400 text-slate-600">
              Every tool modern engineers and students need, unified directly inside the video stream.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {BENTO_FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`glass-cyber-card rounded-3xl p-6 sm:p-8 border ${item.border} ${item.colSpan} flex flex-col justify-between group hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden`}
                >
                  {/* Neon Ambient Background Tint */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div
                        className="size-12 rounded-2xl flex items-center justify-center border shadow-md group-hover:scale-110 transition-transform duration-300"
                        style={{
                          backgroundColor: `${item.accent}15`,
                          borderColor: `${item.accent}40`,
                          color: item.accent,
                        }}
                      >
                        <Icon className="size-6" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold px-3 py-1 rounded-full border dark:border-white/10 border-slate-300 dark:bg-white/5 bg-white text-slate-700 dark:text-slate-300 shadow-sm">
                        {item.badge}
                      </span>
                    </div>

                    <span className="text-xs font-mono uppercase tracking-widest font-bold block mb-1 text-slate-400 dark:text-slate-400">
                      {item.category}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold dark:text-white text-slate-900 mb-3 group-hover:text-cyan-400 transition-colors duration-200">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm dark:text-slate-300 text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="relative z-10 pt-6 mt-6 border-t dark:border-white/5 border-slate-200 flex items-center justify-between text-xs font-bold text-cyan-400">
                    <span>Explore integration</span>
                    <ArrowRight className="size-4 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== COMPARISON: COLLABCLASS VS LEGACY ===================== */}
      <section id="comparison" className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-widest dark:text-cyan-400 text-cyan-600 font-bold block mb-2">
              ◈ ARCHITECTURAL ADVANTAGE
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Stop juggling five browser tabs.
            </h2>
            <p className="text-sm sm:text-base dark:text-slate-400 text-slate-600">
              Compare the friction of traditional meeting setups with CollabClass unified browser architecture.
            </p>
          </div>

          <div className="glass-cyber-panel rounded-3xl overflow-hidden border dark:border-cyan-500/25 border-slate-200 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 dark:bg-[#041224] bg-slate-100 p-4 sm:p-5 border-b dark:border-cyan-500/20 border-slate-200 font-mono text-xs uppercase tracking-wider font-extrabold">
              <div className="dark:text-slate-400 text-slate-500">Capability</div>
              <div className="text-cyan-400 flex items-center gap-1.5 mt-2 md:mt-0">
                <CheckCircle2 className="size-4" />
                <span>CollabClass Unified OS</span>
              </div>
              <div className="dark:text-slate-400 text-slate-500 mt-2 md:mt-0">
                Legacy Stack (Zoom/Meet/Slack)
              </div>
            </div>

            <div className="divide-y dark:divide-white/5 divide-slate-200 text-xs sm:text-sm">
              {COMPARISON.map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 p-4 sm:p-5 gap-2 md:gap-4 items-center">
                  <div className="font-bold dark:text-white text-slate-900">{row.feature}</div>
                  <div className="dark:text-cyan-200 text-cyan-800 font-semibold flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-cyan-400" />
                    <span>{row.collabClass}</span>
                  </div>
                  <div className="dark:text-slate-400 text-slate-500 text-xs">{row.legacy}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS / WORKFLOW ===================== */}
      <section id="workflow" className="py-24 px-4 sm:px-6 lg:px-8 relative dark:bg-[#01060e] bg-slate-100/40 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-widest dark:text-cyan-400 text-cyan-600 font-bold block mb-2">
              ◈ ZERO-FRICTION SETUP
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              From zero to teaching in 10 seconds.
            </h2>
            <p className="text-sm sm:text-base dark:text-slate-400 text-slate-600">
              No software installations, no complex calendar invites, and no student sign-up barriers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              {
                step: "01",
                title: "Launch or Schedule",
                desc: "Start an instant live session, schedule an upcoming lecture module, or activate your permanent Personal Classroom Room.",
                icon: Zap,
              },
              {
                step: "02",
                title: "Dispatch 8-Digit PIN",
                desc: "Send the clean 8-character meeting code or direct classroom link to students or peers. They join directly from their browser.",
                icon: Share2,
              },
              {
                step: "03",
                title: "Collaborate Natively",
                desc: "Import any GitHub repo, sketch concepts on the whiteboard, request AI summaries, and record the session for cloud replay.",
                icon: Layers,
              },
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={idx}
                  className="glass-cyber-card rounded-3xl p-7 border dark:border-cyan-500/20 border-slate-200 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="text-5xl font-extrabold font-mono dark:text-white/10 text-slate-300 select-none mb-4 group-hover:text-cyan-400/30 transition-colors">
                    {s.step}
                  </div>
                  <div className="size-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm dark:text-slate-300 text-slate-600 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== FAQ ACCORDION ===================== */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-widest dark:text-cyan-400 text-cyan-600 font-bold block mb-2">
              ◈ FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Everything you need to know.
            </h2>
            <p className="text-sm sm:text-base dark:text-slate-400 text-slate-600">
              Clear answers regarding student access, GitHub explorer security, and AI integrations.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="glass-cyber-panel rounded-2xl border dark:border-cyan-500/20 border-slate-200 overflow-hidden transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base dark:text-white text-slate-900 hover:text-cyan-400 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`size-4 text-cyan-400 transition-transform duration-300 flex-shrink-0 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm dark:text-slate-300 text-slate-600 leading-relaxed border-t dark:border-white/5 border-slate-200/80 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== FINAL CALL TO ACTION ===================== */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative">
          <div className="rounded-3xl p-8 sm:p-14 dark:bg-gradient-to-br dark:from-[#04162e] dark:via-[#020b18] dark:to-[#031124] bg-gradient-to-br from-cyan-50 via-white to-sky-100 border dark:border-cyan-500/40 border-cyan-300 shadow-[0_20px_80px_rgba(0,180,255,0.22)] text-center relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 size-72 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 size-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
              <span className="text-xs font-mono uppercase tracking-widest font-extrabold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 mb-4">
                Free Forever · Open Education
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
                Ready to elevate your engineering classroom?
              </h2>
              <p className="text-sm sm:text-base dark:text-slate-300 text-slate-600 leading-relaxed mb-8">
                Start instant collaborative lectures, review pull requests in real time, and sketch architectures seamlessly with your students.
              </p>

              <button
                onClick={handleGetStarted}
                className="btn-cyber-primary text-base sm:text-lg font-bold px-10 py-4 rounded-2xl shadow-xl flex items-center gap-2 hover:scale-105 transition-all duration-300"
              >
                <span>Get Started for Free</span>
                <ArrowRight className="size-5" />
              </button>

              <p className="text-[11px] font-mono dark:text-slate-400 text-slate-500 mt-4">
                Instant access · No credit card required · Full WebRTC features
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t dark:border-white/10 border-slate-200 py-12 px-4 sm:px-6 lg:px-8 dark:bg-[#01060e] bg-white transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Speech className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight">
                Collab<span className="text-cyan-400">Class</span>
              </span>
              <span className="text-[10px] font-mono dark:text-slate-400 text-slate-500">
                Live · Learn · Connect
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs dark:text-slate-400 text-slate-600 font-semibold">
            <button onClick={() => scrollToSection("features")} className="hover:text-cyan-400 transition-colors">
              Capabilities
            </button>
            <button onClick={() => scrollToSection("demo")} className="hover:text-cyan-400 transition-colors">
              Demo
            </button>
            <button onClick={() => scrollToSection("comparison")} className="hover:text-cyan-400 transition-colors">
              Comparison
            </button>
            <button onClick={() => scrollToSection("workflow")} className="hover:text-cyan-400 transition-colors">
              Workflow
            </button>
            <button onClick={() => scrollToSection("faq")} className="hover:text-cyan-400 transition-colors">
              FAQ
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs dark:text-slate-400 text-slate-500">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-200 font-mono text-[10px]">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
            <span>© 2026 CollabClass</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
