"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Plus,
  Send,
  ChevronDown,
  ArrowRight,
  Monitor,
  Smartphone,
  Code2,
  Terminal,
  Loader2,
  Zap,
  User,
  MessageSquare,
  Sparkles,
  BrainCircuit,
  FileCode,
  FolderOpen,
  Search,
  Layout,
  Layers,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useBrainyStore, Message, FileItem } from "@/lib/store"

// --- Constants ---

const MODELS = [
  { id: "groq/llama-3.3-70b-versatile", name: "Groq Llama 3.3", power: 3 },
  { id: "x-ai/grok-2-1212", name: "Grok 2", power: 3 },
  { id: "openrouter/free", name: "Auto Brainy", power: 2 },
]

const QUICK_STARTS = [
  "Build a SaaS landing page with Tailwind",
  "Create an AI analytics dashboard",
  "Build a multi-step component form",
  "Create a personal portfolio site"
]

// --- Atomic Components ---

const ModelIcon = ({ power, active = false }: { power: number; active?: boolean }) => {
  const size = power === 3 ? 16 : 12
  return (
    <div className={cn("rounded-full border flex items-center justify-center transition-all shrink-0", active ? "border-white bg-white" : "border-white/10 bg-transparent")} style={{ width: size, height: size }}>
      {active && <div className="w-1 h-1 bg-black rounded-full" />}
    </div>
  )
}

const IntelligenceSelector = ({ value, onChange }: { value: string; onChange: (id: string) => void }) => {
  const [open, setOpen] = useState(false)
  const current = MODELS.find(m => m.id === value) || MODELS[0]
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center space-x-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-2 hover:bg-white/10 transition-all group">
        <ModelIcon power={current.power} />
        <span className="text-[12px] font-bold text-[#666] group-hover:text-white truncate max-w-[120px]">{current.name}</span>
        <ChevronDown className={cn("w-4 h-4 text-[#333] transition-transform duration-500", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute bottom-full left-0 mb-3 w-64 bg-[#0a0a0a] border border-white/10 rounded-[28px] shadow-[0_40px_80px_rgba(0,0,0,0.9)] z-[110] p-2 overflow-hidden">
              <div className="px-4 py-3 text-[10px] text-[#333] font-black uppercase tracking-[0.3em]">Compute Engine</div>
              {MODELS.map(m => (
                <button key={m.id} onClick={() => { onChange(m.id); setOpen(false) }} className={cn("w-full flex items-center space-x-4 px-4 py-3 rounded-2xl transition-all text-[13px]", value === m.id ? "bg-white/10 text-white" : "text-[#444] hover:bg-white/5 hover:text-[#888]")}>
                  <ModelIcon power={m.power} active={value === m.id} />
                  <span className="font-bold">{m.name}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- Main Platform Component ---

export default function OpenBrainyApp() {
  const store = useBrainyStore()
  const activeSession = store.sessions.find(s => s.id === store.activeSessionId)

  // Local UI State
  const [input, setInput] = useState("")
  const [model, setModel] = useState(MODELS[0].id)
  const [isGenerating, setIsGenerating] = useState(false)
  const [taskStatus, setTaskStatus] = useState<string | null>(null)
  const [workspaceTab, setWorkspaceTab] = useState<"preview" | "code">("preview")
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop")
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }
  }, [activeSession?.messages, taskStatus])

  const handleStart = async (forcedPrompt?: string) => {
    const promptValue = forcedPrompt || input
    if (!promptValue.trim() || isGenerating) return

    let sessionId = store.activeSessionId
    if (!sessionId) {
        sessionId = store.createSession(promptValue, model)
    }

    const userMsg: Message = { role: "user", content: promptValue }
    store.addMessage(sessionId, userMsg)
    if (!forcedPrompt) setInput("")
    setIsGenerating(true)
    setTaskStatus("Architecting...")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
            messages: [...(activeSession?.messages || []), userMsg],
            model,
            files: activeSession?.files || []
        }),
      })

      if (!response.body) return
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let assistantContent = ""

      store.addMessage(sessionId, { role: "assistant", content: "" })

      while (true) {
        const { value, done } = await reader.read(); if (done) break
        assistantContent += decoder.decode(value)

        const thinkingMatch = assistantContent.match(/<thinking>([\s\S]*?)<\/thinking>/)
        const thinking = thinkingMatch ? thinkingMatch[1].trim() : undefined
        const cleanContent = assistantContent.replace(/<thinking>[\s\S]*?<\/thinking>/, "").trim()

        store.updateSession(sessionId, {
            messages: [
                ...store.sessions.find(s => s.id === sessionId)!.messages.slice(0, -1),
                { role: "assistant", content: cleanContent, thinking }
            ]
        })
      }

      // Sync codebase
      const fileOps = Array.from(assistantContent.matchAll(/--- FILE: (.*?) ---\n([\s\S]*?)\n--- END ---/g))
      const deleteOps = Array.from(assistantContent.matchAll(/--- DELETE: (.*?) ---/g))
      let newFiles = [...(activeSession?.files || [])]
      let changed = false

      for (const op of fileOps) {
          const path = op[1].trim(); const content = op[2].trim()
          const idx = newFiles.findIndex(f => f.path === path)
          if (idx !== -1) newFiles[idx].content = content; else newFiles.push({ path, content })
          changed = true
      }
      for (const op of deleteOps) {
          const path = op[1].trim(); newFiles = newFiles.filter(f => f.path !== path); changed = true
      }

      if (changed) {
          store.updateFiles(sessionId, newFiles)
          await syncSandbox(sessionId, newFiles)
      }

    } catch (e: any) {
        console.error(e)
    } finally {
      setIsGenerating(false)
      setTaskStatus(null)
    }
  }

  const syncSandbox = async (id: string, codebase: FileItem[]) => {
    setTaskStatus("Syncing Hardware...")
    try {
      const res = await fetch("/api/sandbox", {
        method: "POST",
        body: JSON.stringify({ files: codebase, sandboxName: `ob-ws-${id.slice(0,8)}` }),
      })
      const data = await res.json()
      if (data.url) setSandboxUrl(data.url)
    } catch (e: any) {
        console.error(e)
    } finally {
        setTaskStatus(null)
    }
  }

  // --- RENDERING ---

  if (!store.isAuth) {
      return (
        <div className="h-screen w-screen bg-[#050505] flex items-center justify-center p-8 font-sans antialiased text-white">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-[#0a0a0a] border border-white/5 rounded-[48px] p-12 space-y-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-white to-cyan-400" />
                <div className="flex flex-col items-center space-y-6 text-center">
                    <div className="w-20 h-20 rounded-[28px] bg-white flex items-center justify-center shadow-2xl shadow-white/5"><Zap className="w-10 h-10 text-black fill-black" /></div>
                    <div><h1 className="text-4xl font-black tracking-tightest">Open Brainy</h1><p className="text-[#333] text-sm font-bold uppercase tracking-widest mt-2">Full-Stack AI Engine</p></div>
                </div>
                <button onClick={() => { store.setAuth(true); }} className="w-full bg-white text-black font-black rounded-2xl py-6 hover:bg-[#eee] transition-all active:scale-[0.97] shadow-xl text-sm uppercase tracking-widest">Connect Workspace</button>
                <div className="flex items-center justify-center space-x-3 opacity-20"><ShieldCheck className="w-5 h-5" /><span className="text-[10px] uppercase tracking-[0.3em] font-black">Industrial Persistence</span></div>
            </motion.div>
        </div>
      )
  }

  // 1. Initial Landing Experience (No Active Chat)
  if (!store.activeSessionId) {
    return (
        <main className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center p-6 font-sans antialiased text-white relative overflow-hidden">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl space-y-16 flex flex-col items-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-2xl"><Zap className="w-6 h-6 text-black fill-black" /></div>
                    <h2 className="text-3xl font-black tracking-tightest">What do you want to build?</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full px-4">
                    {QUICK_STARTS.map(q => (
                        <button key={q} onClick={() => handleStart(q)} className="p-6 bg-white/5 border border-white/5 rounded-3xl text-[13px] font-bold text-[#444] hover:bg-white/10 hover:text-white transition-all text-left flex justify-between group">
                            <span>{q}</span>
                            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>

                <div className="w-full max-w-xl relative group px-4">
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-6 shadow-2xl focus-within:border-white/20 transition-all duration-500">
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleStart() } }}
                            placeholder="Type your idea..."
                            className="w-full bg-transparent border-none focus:outline-none text-[16px] resize-none h-24 text-white placeholder-[#222] leading-relaxed"
                        />
                        <div className="flex justify-between items-center pt-4">
                            <IntelligenceSelector value={model} onChange={setModel} />
                            <button onClick={() => handleStart()} className={cn("p-5 rounded-full transition-all active:scale-90 shadow-2xl", input.trim() ? "bg-white text-black" : "bg-[#111] text-[#333] cursor-not-allowed")}>
                                <ArrowRight className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </main>
    )
  }

  // 2. Full Workspace View (Active Chat)
  if (!activeSession) return null

  return (
    <main className="flex h-screen w-screen bg-[#050505] font-sans antialiased text-white relative overflow-hidden">

      {/* --- Left Panel: Chat --- */}
      <div className="w-[450px] h-full border-r border-white/5 flex flex-col bg-[#0a0a0a] shrink-0">
        <header className="h-16 border-b border-white/5 flex items-center px-6 justify-between">
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-70 transition-opacity" onClick={() => store.setActiveSession(null)}>
                <Zap className="w-5 h-5 text-white" />
                <span className="font-black text-[12px] uppercase tracking-widest truncate max-w-[150px]">{activeSession.title}</span>
            </div>
            <div className="flex items-center space-x-4">
                <Plus className="w-5 h-5 cursor-pointer text-[#444] hover:text-white transition-colors" onClick={() => store.setActiveSession(null)} />
                <div className="w-5 h-5 cursor-pointer text-[#444] hover:text-white transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                </div>
            </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-auto p-6 space-y-10 scroll-hide pb-40">
            {activeSession.messages.map((m, i) => (
                <div key={i} className={cn("flex flex-col space-y-3", m.role === "user" ? "items-start max-w-[95%]" : "max-w-full")}>
                    <div className="flex items-center space-x-2">
                        {m.role === "assistant" ? <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-[9px] text-black font-black">OB</div> : <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center"><User className="w-3 h-3 text-white" /></div>}
                        <span className="text-[10px] font-black text-[#444] uppercase tracking-[0.2em]">{m.role === "assistant" ? "Brainy" : "Lead"}</span>
                    </div>
                    <div className={cn("px-6 py-5 rounded-[28px] text-[13.5px] leading-relaxed whitespace-pre-wrap shadow-2xl", m.role === "user" ? "bg-[#111] border border-white/5 text-white rounded-tl-none" : "text-[#aaa] px-0")}>
                        {m.thinking && (
                            <div className="mb-6 bg-[#050505] border border-white/5 rounded-2xl p-5 flex items-start space-x-4 shadow-inner">
                                <BrainCircuit className="w-5 h-5 text-indigo-500 mt-1 shrink-0" />
                                <span className="text-[12px] text-[#444] italic font-medium">{m.thinking}</span>
                            </div>
                        )}
                        {m.content || (isGenerating && i === activeSession.messages.length - 1 && <div className="flex space-x-1 py-1"><div className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:0.2s]" /></div>)}
                    </div>
                </div>
            ))}
            {taskStatus && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-3 px-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span className="text-[10px] text-[#444] font-black uppercase tracking-[0.3em]">{taskStatus}</span>
                </motion.div>
            )}
        </div>

        <div className="p-6 bg-[#0a0a0a] border-t border-white/5">
          <div className="relative bg-[#111] border border-white/5 rounded-[36px] p-5 shadow-2xl focus-within:border-white/10 transition-all">
            <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleStart() } }}
                placeholder="Message Brainy..."
                className="w-full bg-transparent border-none focus:outline-none text-[14px] resize-none h-20 text-white placeholder-[#222]"
            />
            <div className="flex justify-between items-center pt-3">
                <IntelligenceSelector value={model} onChange={setModel} />
                <button onClick={() => handleStart()} className={cn("p-4 rounded-[20px] transition-all active:scale-[0.92] shadow-2xl", input.trim() ? "bg-white text-black" : "bg-[#1a1a1a] text-[#333] cursor-not-allowed")}>
                  <Send className="w-4 h-4" />
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Right Panel: Workspace --- */}
      <div className="flex-1 h-full flex flex-col bg-[#050505]">
        <header className="h-16 border-b border-white/5 flex items-center px-8 justify-between bg-[#0a0a0a]">
            <div className="flex bg-[#111] rounded-xl p-1 border border-white/5">
                <button onClick={() => setWorkspaceTab("preview")} className={cn("px-6 py-2 text-[11px] font-black rounded-lg capitalize transition-all", workspaceTab === "preview" ? "bg-white text-black shadow-xl" : "text-[#444] hover:text-[#aaa]")}>Preview</button>
                <button onClick={() => setWorkspaceTab("code")} className={cn("px-6 py-2 text-[11px] font-black rounded-lg capitalize transition-all", workspaceTab === "code" ? "bg-white text-black shadow-xl" : "text-[#444] hover:text-[#aaa]")}>Code</button>
            </div>

            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-[#111] rounded-xl p-1 border border-white/5">
                    <button onClick={() => setViewMode("desktop")} className={cn("p-2 rounded-lg transition-all", viewMode === "desktop" ? "bg-white/10 text-white" : "text-[#444] hover:text-[#888]")}><Monitor className="w-4 h-4" /></button>
                    <button onClick={() => setViewMode("mobile")} className={cn("p-2 rounded-lg transition-all", viewMode === "mobile" ? "bg-white/10 text-white" : "text-[#444] hover:text-[#888]")}><Smartphone className="w-4 h-4" /></button>
                </div>
                <button className="bg-white text-black px-6 py-2.5 rounded-xl text-[11px] font-black shadow-2xl hover:bg-[#eee] active:scale-95 transition-all">Deploy</button>
            </div>
        </header>

        <div className="flex-1 relative overflow-hidden flex items-center justify-center p-12">
            <AnimatePresence mode="wait">
                {workspaceTab === "preview" ? (
                    <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center">
                        {sandboxUrl ? (
                            <div className={cn("bg-white rounded-[48px] shadow-2xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.2,1,0.3,1)] border border-white/5", viewMode === "desktop" ? "w-full h-full" : "w-[390px] h-[844px]")}>
                                <iframe src={sandboxUrl} className="w-full h-full border-none" />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-6 opacity-5 text-[#111]">
                                <Layers className="w-32 h-32" />
                                <span className="text-[12px] font-black uppercase tracking-[1em]">Compute Idle</span>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="code" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full h-full p-8 flex flex-col">
                        <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-[40px] overflow-hidden flex flex-col shadow-2xl">
                            <div className="h-14 border-b border-white/5 bg-[#0d0d0d] flex items-center px-8 text-[11px] font-bold text-[#444] tracking-[0.4em] uppercase">
                                System Codebase
                            </div>
                            <div className="flex-1 flex overflow-hidden">
                                <div className="w-56 border-r border-white/5 p-4 space-y-1 overflow-auto bg-[#080808]">
                                    {activeSession.files.map(f => (
                                        <div key={f.path} className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-[12px] font-bold text-[#444] hover:bg-white/5 cursor-pointer truncate transition-all">
                                            <FileCode className="w-4 h-4" />
                                            <span>{f.path.split('/').pop()}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex-1 p-8 overflow-auto font-mono text-[14px] leading-[1.8] text-[#666]">
                                    <pre className="whitespace-pre-wrap">{activeSession.files.length > 0 ? activeSession.files[0].content : "// No artifacts generated."}</pre>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>

    </main>
  )
}
