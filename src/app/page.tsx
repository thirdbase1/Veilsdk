"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Plus,
  Camera,
  Send,
  ChevronDown,
  Download,
  ArrowRight,
  Monitor,
  Smartphone,
  Code2,
  RefreshCcw,
  Terminal,
  Share2,
  Loader2,
  History,
  ClipboardCheck,
  Zap,
  User,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  BrainCircuit,
  FileCode,
  FolderOpen,
  Trash2,
  Edit3,
  Search,
  X,
  Layout,
  Layers,
  Activity,
  Cpu
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// --- Types & Constants ---

type FileItem = { path: string; content: string }
type Message = { role: "user" | "assistant" | "system"; content: string; thinking?: string }
type MobileTab = "chat" | "preview" | "code"

const BRAINY_MODELS = [
  { id: "google/gemini-2.0-flash-001:free", name: "Neural Flash", power: 1 },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Architect Pro", power: 3 },
  { id: "mistralai/mistral-7b-instruct:free", name: "Engine Mini", power: 1 },
  { id: "google/gemma-2-9b-it:free", name: "Logic Lite", power: 2 },
]

// --- Atomic Components ---

const ModelIcon = ({ power, active = false }: { power: number; active?: boolean }) => {
  const sizes = [6, 12, 18]
  const size = sizes[power - 1] || 12
  return (
    <div className={cn("rounded-full border flex items-center justify-center transition-all shrink-0", active ? "border-white bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "border-white/10 bg-transparent")} style={{ width: size, height: size }}>
      {active && <div className="w-1 h-1 bg-black rounded-full" />}
    </div>
  )
}

const IntelligenceSelector = ({ value, onChange }: { value: string; onChange: (id: string) => void }) => {
  const [open, setOpen] = useState(false)
  const current = BRAINY_MODELS.find(m => m.id === value) || BRAINY_MODELS[0]
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center space-x-3 bg-[#111] border border-white/5 rounded-2xl px-4 py-2 hover:bg-[#1a1a1a] transition-all group">
        <ModelIcon power={current.power} />
        <span className="text-[12px] font-bold text-[#555] group-hover:text-white truncate max-w-[120px]">{current.name}</span>
        <ChevronDown className={cn("w-4 h-4 text-[#333] transition-transform duration-500", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute bottom-full left-0 mb-3 w-64 bg-[#0a0a0a] border border-white/10 rounded-[28px] shadow-[0_40px_80px_rgba(0,0,0,0.9)] z-[110] p-2 overflow-hidden">
              <div className="px-4 py-3 text-[10px] text-[#333] font-black uppercase tracking-[0.3em]">Core Intelligence</div>
              {BRAINY_MODELS.map(m => (
                <button key={m.id} onClick={() => { onChange(m.id); setOpen(false) }} className={cn("w-full flex items-center space-x-4 px-4 py-3 rounded-2xl transition-all text-[13px]", value === m.id ? "bg-[#111] text-white border border-white/5" : "text-[#444] hover:bg-[#050505] hover:text-[#888]")}>
                  <ModelIcon power={m.power} active={value === m.id} />
                  <div className="flex flex-col items-start text-left">
                    <span className="font-bold">{m.name}</span>
                    <span className="text-[10px] opacity-30 font-black uppercase">{m.power === 3 ? "Enterprise" : "Standard"}</span>
                  </div>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- Platform Shell ---

export default function OpenBrainyApp() {
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat")
  const [isAuth, setIsAuth] = useState(false)
  const [email, setEmail] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [model, setModel] = useState(BRAINY_MODELS[0].id)
  const [generating, setGenerating] = useState(false)
  const [currentTask, setCurrentTask] = useState<string | null>(null)
  const [files, setFiles] = useState<FileItem[]>([])
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [sbName, setSbName] = useState<string | null>(null)
  const [tab, setTab] = useState("preview")
  const [logs, setLogs] = useState<string[]>([])
  const [review, setReview] = useState<string | null>(null)
  const [view, setView] = useState("desktop")

  const scroll = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const f = localStorage.getItem("ob_files"); if (f) { const p = JSON.parse(f); setFiles(p); if (p.length) setActiveFile(p[0].path) }
    if (localStorage.getItem("ob_auth")) setIsAuth(true)
    const m = localStorage.getItem("ob_messages"); if (m) setMessages(JSON.parse(m)); else setMessages([{ role: "assistant", content: "Industrial Brainy node online. Awaiting system architecture directives." }])
  }, [])

  useEffect(() => { if (files.length) localStorage.setItem("ob_files", JSON.stringify(files)) }, [files])
  useEffect(() => { if (messages.length) localStorage.setItem("ob_messages", JSON.stringify(messages)) }, [messages])
  useEffect(() => { scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: "smooth" }) }, [messages, currentTask])

  const handleAction = async (forced?: string) => {
    const val = forced || input; if (!val.trim() || generating) return
    const msg: Message = { role: "user", content: val }; setMessages(p => [...p, msg]); setInput(""); setGenerating(true); setCurrentTask("Reasoning...")
    try {
      const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ messages: [...messages, msg], model, files }) })
      if (!res.body) return
      const r = res.body.getReader(); const d = new TextDecoder(); let acc = ""; setMessages(p => [...p, { role: "assistant", content: "" }])
      while (true) {
        const { value, done } = await r.read(); if (done) break
        acc += d.decode(value)
        const tM = acc.match(/<thinking>([\s\S]*?)<\/thinking>/); const th = tM ? tM[1].trim() : undefined
        const cl = acc.replace(/<thinking>[\s\S]*?<\/thinking>/, "").trim()
        setMessages(p => { const l = p[p.length - 1]; return [...p.slice(0, -1), { ...l, content: cl, thinking: th }] })
      }
      const fO = Array.from(acc.matchAll(/--- FILE: (.*?) ---\n([\s\S]*?)\n--- END ---/g))
      const dO = Array.from(acc.matchAll(/--- DELETE: (.*?) ---/g))
      let nF = [...files]; let ch = false
      for (const o of fO) { const p = o[1].trim(); const c = o[2].trim(); const i = nF.findIndex(x => x.path === p); if (i !== -1) nF[i].content = c; else nF.push({ path: p, content: c }); ch = true }
      for (const o of dO) { const p = o[1].trim(); nF = nF.filter(x => x.path !== p); ch = true }
      if (ch) { setFiles(nF); if (!activeFile && nF.length) setActiveFile(nF[0].path); await sync(nF); audit(val, nF) }
    } catch (e: any) { setLogs(p => [...p, `[CRITICAL_SYS] ${e.message}`]) } finally { setGenerating(false); setCurrentTask(null) }
  }

  const sync = async (code: FileItem[]) => {
    setCurrentTask("Syncing Hardware..."); setLogs(p => [...p, "[Brainy] Initiating remote compute sync..."])
    try {
      const sanitized = email.replace(/[^a-zA-Z0-9]/g, "-"); const n = `ob-industrial-${sanitized}`
      const res = await fetch("/api/sandbox", { method: "POST", body: JSON.stringify({ files: code, sandboxName: n }) })
      const data = await res.json()
      if (data.url) { setUrl(data.url); setSbName(data.sandboxName); setLogs(p => [...p, `[Brainy] MicroVM ready: ${data.url}`]) }
      if (data.error) { setLogs(p => [...p, `[BOOT_FAIL] ${data.message}`]); fix(data.message) }
    } catch (e: any) { setLogs(p => [...p, `[HW_FAILURE] ${e.message}`]) } finally { setCurrentTask(null) }
  }

  const fix = async (log: string) => { setCurrentTask("Self-healing System..."); await handleAction(`FIX_DIRECTIVE: Build failure detected in Sandbox.\nLOGS:\n${log}`) }
  const audit = async (p: string, f: FileItem[]) => { try { const res = await fetch("/api/review", { method: "POST", body: JSON.stringify({ prompt: p, files: f }) }); const d = await res.json(); setReview(d.review) } catch {} }

  if (!isAuth) return (
    <div className="h-screen w-screen bg-[#050505] flex items-center justify-center p-8 font-sans antialiased text-white">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-[#0a0a0a] border border-white/5 rounded-[60px] p-16 space-y-12 shadow-[0_80px_160px_rgba(0,0,0,0.8)] relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-700 via-white to-cyan-500" />
        <div className="flex flex-col items-center space-y-8">
            <div className="w-28 h-28 rounded-[40px] bg-white flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.1)]"><Cpu className="w-14 h-14 text-black" /></div>
            <div className="space-y-4">
                <h1 className="text-6xl font-black tracking-tightest leading-none">OPEN BRAINY</h1>
                <p className="text-[#333] text-sm uppercase tracking-[0.5em] font-black italic">Engineered Persistence</p>
            </div>
        </div>
        <div className="space-y-6">
            <input type="email" placeholder="identity_token@openbrainy.io" className="w-full bg-[#0d0d0d] border border-white/5 rounded-[32px] px-10 py-8 text-center text-sm focus:outline-none focus:border-white/10 transition-all font-bold tracking-widest placeholder-[#111]" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button onClick={() => { if (email) { setIsAuth(true); localStorage.setItem("ob_auth", "true"); } }} className="w-full bg-white text-black font-black rounded-[32px] py-8 hover:bg-neutral-200 transition-all active:scale-[0.96] shadow-2xl uppercase tracking-[0.3em] text-sm">Initialize Workspace</button>
        </div>
        <div className="flex items-center justify-center space-x-6 opacity-10">
            <ShieldCheck className="w-8 h-8" /><span className="text-[11px] uppercase tracking-[0.6em] font-black">Industrial OIDC Persistence</span>
        </div>
      </motion.div>
    </div>
  )

  return (
    <main className="flex h-screen w-screen bg-[#050505] font-sans antialiased text-white relative overflow-hidden">
      {/* --- Adaptive Navigation --- */}
      <div className={cn("h-full border-r border-white/5 flex flex-col bg-[#0a0a0a] transition-all duration-500", "lg:w-[500px] w-full shrink-0", mobileTab !== "chat" && "hidden lg:flex")}>
        <header className="h-20 border-b border-white/5 flex items-center px-8 justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg"><Cpu className="w-6 h-6 text-black" /></div>
            <span className="font-black text-[18px] tracking-tightest uppercase">Brainy</span>
          </div>
          <div className="flex items-center space-x-5 text-[#333]">
            <History className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
            <RefreshCcw className="w-5 h-5 cursor-pointer hover:text-white transition-colors" onClick={() => { localStorage.clear(); window.location.reload() }} />
            <Share2 className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden relative">
            <div ref={scroll} className="flex-1 overflow-auto p-8 space-y-12 scroll-hide pb-56">
            {messages.map((m, i) => (
                <div key={i} className={cn("flex flex-col space-y-4", m.role === "user" ? "items-start max-w-[95%]" : "max-w-full")}>
                    <div className="flex items-center space-x-3">
                        {m.role === "assistant" ? <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[10px] text-black font-black">OB</div> : <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-xl flex items-center justify-center"><User className="w-4 h-4" /></div>}
                        <span className="text-[10px] font-black text-[#444] uppercase tracking-[0.3em]">{m.role === "assistant" ? "Brainy_Core" : "Architect_Lead"}</span>
                    </div>
                    <div className={cn("px-8 py-6 rounded-[36px] text-[14.5px] leading-relaxed whitespace-pre-wrap shadow-2xl", m.role === "user" ? "bg-[#111] border border-white/5 text-white rounded-tl-none" : "text-[#bbb] px-0")}>
                        {m.thinking && (
                            <div className="mb-8 bg-[#050505] border border-white/5 rounded-[28px] p-6 flex items-start space-x-5 shadow-inner group">
                                <BrainCircuit className="w-6 h-6 text-indigo-600 mt-1 shrink-0 group-hover:animate-pulse" />
                                <span className="text-[13px] text-[#444] italic font-medium leading-relaxed">{m.thinking}</span>
                            </div>
                        )}
                        {m.content || (generating && i === messages.length - 1 && <div className="flex space-x-3 py-3"><div className="w-2.5 h-2.5 bg-white/20 rounded-full animate-bounce" /><div className="w-2.5 h-2.5 bg-white/20 rounded-full animate-bounce [animation-delay:0.2s]" /></div>)}
                    </div>
                </div>
            ))}
            {review && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0a0a0a] border border-indigo-600/10 rounded-[40px] p-10 space-y-6 shadow-3xl relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/[0.03] blur-[100px] rounded-full" />
                    <div className="flex items-center space-x-4 text-indigo-500">
                        <Sparkles className="w-6 h-6" />
                        <span className="text-[11px] font-black uppercase tracking-[0.5em]">Industrial Architectural Audit</span>
                    </div>
                    <p className="text-[14px] text-[#666] leading-[1.8] italic border-l-4 border-indigo-500/20 pl-8">{review}</p>
                </motion.div>
            )}
            </div>

            {/* Float Task Status */}
            {currentTask && (
                <div className="absolute bottom-44 left-8 right-8 z-10">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-indigo-700 text-white rounded-full px-8 py-4 flex items-center justify-between shadow-[0_30px_60px_rgba(79,70,229,0.5)] border border-white/20">
                        <div className="flex items-center space-x-4">
                            <Activity className="w-5 h-5 animate-pulse" />
                            <span className="text-[11px] font-black uppercase tracking-[0.3em]">{currentTask}</span>
                        </div>
                        <Loader2 className="w-5 h-5 animate-spin opacity-50" />
                    </motion.div>
                </div>
            )}
        </div>

        {/* Input Dock */}
        <div className="p-8 bg-[#0a0a0a] border-t border-white/5 relative z-20">
          <div className="relative bg-[#111] border border-white/5 rounded-[44px] p-8 shadow-[0_40px_80px_rgba(0,0,0,0.5)] focus-within:border-white/10 transition-all duration-700 group">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); handleAction() } }} placeholder="Direct Open Brainy..." className="w-full bg-transparent border-none focus:outline-none text-[16px] resize-none h-32 text-white placeholder-[#222] leading-relaxed scroll-hide" />
            <div className="flex justify-between items-center pt-6">
              <div className="flex items-center space-x-4">
                  <button className="p-3.5 hover:bg-[#1a1a1a] rounded-2xl transition-colors text-[#333] hover:text-[#777]"><Plus className="w-7 h-7" /></button>
                  <div className="h-10 w-[1px] bg-[#222]" />
                  <IntelligenceSelector value={model} onChange={setModel} />
              </div>
              <div className="flex items-center space-x-4">
                <button className="p-3.5 hover:bg-[#1a1a1a] rounded-2xl transition-colors text-[#333] hover:text-[#777]"><Camera className="w-7 h-7" /></button>
                <button onClick={() => handleAction()} className={cn("p-5 rounded-[28px] transition-all active:scale-[0.9] shadow-3xl", input.trim() ? "bg-white text-black" : "bg-[#1a1a1a] text-[#222] cursor-not-allowed")}>
                  <Send className="w-7 h-7" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-8 px-6">
                <div className="flex items-center space-x-3 text-[10px] text-[#222] font-black tracking-[0.3em] uppercase"><Zap className="w-4 h-4" /><span>Industrial Compute Active</span></div>
                <div className="flex items-center space-x-3 text-[10px] text-[#222] font-black uppercase"><MessageSquare className="w-5 h-5" /><span>Shift+Enter</span></div>
          </div>
        </div>
      </div>

      {/* --- Main Workspace --- */}
      <div className={cn("flex-1 h-full flex flex-col min-w-0 bg-[#050505]", mobileTab === "chat" && "hidden lg:flex")}>
        <header className="h-20 border-b border-white/5 flex items-center px-10 justify-between bg-[#0a0a0a]">
          <div className="flex items-center space-x-10">
            <div className="flex bg-[#111] rounded-2xl p-1.5 border border-white/5 shadow-inner">
              {["preview", "code", "console"].map(t => (
                <button key={t} onClick={() => setTab(t)} className={cn("px-8 py-3 text-[11px] font-black rounded-xl capitalize transition-all", tab === t ? "bg-white text-black shadow-2xl" : "text-[#444] hover:text-[#aaa]")}>{t}</button>
              ))}
            </div>
            <div className="hidden xl:flex items-center text-[12px] text-[#333] space-x-5">
              <FolderOpen className="w-5 h-5" />
              <span className="text-[#666] font-black tracking-tightest uppercase">{sbName || "ephemeral_node"}</span>
              <span className="opacity-10">/</span>
              <span className="text-white font-bold">{activeFile || "system_idle"}</span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <button className="hidden sm:flex items-center space-x-3 bg-[#0a0a0a] border border-white/5 text-[#444] px-7 py-3.5 rounded-2xl text-[11px] font-black hover:border-white/10 transition-all shadow-xl"><Download className="w-5 h-5" /><span>Export Codebase</span></button>
            <button className="flex items-center space-x-4 bg-white text-black px-9 py-3.5 rounded-2xl text-[11px] font-black hover:bg-neutral-200 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)]"><span>Deploy Instance</span><ArrowRight className="w-5 h-5" /></button>
          </div>
        </header>

        <div className="flex-1 flex min-h-0 relative">
          {tab === "code" && (
            <motion.div initial={{ width: 0 }} animate={{ width: 320 }} className="border-r border-white/5 bg-[#0a0a0a] flex flex-col shrink-0 overflow-hidden hidden md:flex">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-[#222]">System Tree</span>
                    <Search className="w-5 h-5 text-[#222]" />
                </div>
                <div className="flex-1 overflow-auto p-6 space-y-2 scroll-hide">
                    {files.map(f => (
                        <button key={f.path} onClick={() => setActiveFile(f.path)} className={cn("w-full flex items-center space-x-5 px-6 py-4 rounded-[24px] transition-all text-[13px] font-bold", activeFile === f.path ? "bg-[#111] text-white border border-white/5 shadow-2xl" : "text-[#444] hover:bg-[#0d0d0d] hover:text-[#777]")}>
                            <FileCode className={cn("w-5 h-5", activeFile === f.path ? "text-indigo-500" : "text-[#222]")} />
                            <span className="truncate flex-1 text-left">{f.path.split('/').pop()}</span>
                        </button>
                    ))}
                </div>
            </motion.div>
          )}

          <div className="flex-1 relative flex flex-col min-w-0">
            <AnimatePresence mode="wait">
                {tab === "preview" && (
                <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 bg-[#050505] overflow-hidden flex items-center justify-center p-12 sm:p-24">
                    {url ? <div className={cn("bg-white rounded-[72px] shadow-[0_100px_200px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-1000 ease-[cubic-bezier(0.1,1,0.2,1)] border border-white/5 relative", view === "desktop" ? "w-full h-full" : "w-[420px] h-[900px]")}><iframe src={url} className="w-full h-full border-none" /></div> : <div className="flex flex-col items-center space-y-12 text-[#111]"><motion.div animate={{ rotate: 360 }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }}><Layers className="w-48 h-48 opacity-20" /></motion.div><p className="text-[14px] font-black uppercase tracking-[1em] text-[#111]">Neural Node Active</p></div>}
                </motion.div>
                )}
                {tab === "code" && (
                <motion.div key="code" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1 bg-[#050505] p-8 sm:p-16 overflow-hidden flex flex-col">
                    <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-[56px] overflow-hidden flex flex-col shadow-3xl">
                        <div className="h-20 border-b border-white/5 bg-[#0d0d0d] flex items-center px-12 justify-between">
                            <div className="flex items-center space-x-5"><Edit3 className="w-5 h-5 text-indigo-600" /><span className="text-[13px] font-black text-[#444] uppercase tracking-widest">{activeFile || "system_core.ts"}</span></div>
                            <div className="flex items-center space-x-8"><span className="text-[10px] font-black text-[#222] uppercase tracking-[0.4em]">Industrial Source</span><Trash2 className="w-6 h-6 text-[#1a1a1a] cursor-pointer hover:text-red-600 transition-colors" /></div>
                        </div>
                        <div className="flex-1 overflow-auto p-16 font-mono text-[15px] leading-[1.8] text-[#888] scroll-hide"><pre className="whitespace-pre-wrap">{files.find(x => x.path === activeFile)?.content || "// Industrial code manifests here."}</pre></div>
                    </div>
                </motion.div>
                )}
                {tab === "console" && (
                <motion.div key="console" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 bg-[#050505] p-8 sm:p-16">
                    <div className="h-full bg-[#0a0a0a] border border-white/5 rounded-[56px] p-16 font-mono text-[13.5px] overflow-auto space-y-6 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/[0.02] blur-[150px] -z-10" />
                        <div className="flex items-center space-x-5 text-[#222] mb-16 uppercase tracking-[0.5em] font-black"><Terminal className="w-7 h-7" /><span>System Telemetry</span></div>
                        {logs.map((l, i) => <div key={i} className={cn("py-4 border-b border-white/[0.02] last:border-none font-medium", l.includes("ERROR") || l.includes("FAIL") ? "text-red-600 font-black" : l.includes("Brainy") ? "text-indigo-600" : "text-[#222]")}>{l}</div>)}
                    </div>
                </motion.div>
                )}
            </AnimatePresence>
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center space-x-5 bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 p-4 rounded-[40px] shadow-[0_50px_100px_rgba(0,0,0,0.8)] z-40">
                <button onClick={() => setView("desktop")} className={cn("flex items-center space-x-4 px-10 py-4 rounded-2xl text-[12.5px] font-black transition-all", view === "desktop" ? "bg-white text-black shadow-2xl" : "text-[#444] hover:text-white")}><Monitor className="w-6 h-6" /><span>Desktop</span></button>
                <button onClick={() => setView("mobile")} className={cn("flex items-center space-x-4 px-10 py-4 rounded-2xl text-[12.5px] font-black transition-all", view === "mobile" ? "bg-white text-black shadow-2xl" : "text-[#444] hover:text-white")}><Smartphone className="w-6 h-6" /><span>Mobile</span></button>
                <div className="h-10 w-[1px] bg-[#222] mx-4" />
                <button onClick={() => setTab(tab === "code" ? "preview" : "code")} className={cn("p-6 rounded-full transition-all", tab === "code" ? "text-white bg-[#1a1a1a] shadow-inner" : "text-[#222] hover:text-white")}><Code2 className="w-7 h-7" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Mobile Global Nav --- */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full h-24 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-around px-10 z-[200] shadow-[0_-30px_60px_rgba(0,0,0,1)]">
            <button onClick={() => setMobileTab("chat")} className={cn("flex flex-col items-center space-y-2 transition-all", mobileTab === "chat" ? "text-indigo-500 scale-110" : "text-[#222]")}><MessageSquare className="w-7 h-7" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Chat</span></button>
            <button onClick={() => setMobileTab("preview")} className={cn("flex flex-col items-center space-y-2 transition-all", mobileTab === "preview" ? "text-indigo-500 scale-110" : "text-[#222]")}><Layout className="w-7 h-7" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Live</span></button>
            <button onClick={() => setMobileTab("code")} className={cn("flex flex-col items-center space-y-2 transition-all", mobileTab === "code" ? "text-indigo-500 scale-110" : "text-[#222]")}><Code2 className="w-7 h-7" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Node</span></button>
      </div>
    </main>
  )
}
