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
  Brain,
  FileCode,
  FolderOpen,
  Search,
  Layout,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Mic,
  Image as ImageIcon,
  Menu,
  Settings,
  Share2,
  AlertTriangle,
  X,
  History,
  Trash2,
  Square
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useBrainyStore, Message, FileItem } from "@/lib/store"

// --- Constants ---

const MODELS = [
  { id: "arcee-ai/trinity-large-preview:free", name: "Trinity Large", power: 3 },
  { id: "z-ai/glm-4.5-air:free", name: "GLM 4.5 Air", power: 3 },
  { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "Nemotron 120B", power: 3 },
  { id: "x-ai/grok-2-1212", name: "Grok 2", power: 3 },
  { id: "nvidia/nemotron-nano-9b-v2:free", name: "Nemotron Nano", power: 1 },
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

const IntelligenceSelector = ({ value, onChange, align = "top" }: { value: string; onChange: (id: string) => void; align?: "top" | "bottom" }) => {
  const [open, setOpen] = useState(false)
  const current = MODELS.find(m => m.id === value) || MODELS[0]
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center space-x-1.5 text-[#666] hover:text-white transition-all group">
        <Brain className="w-3.5 h-3.5" />
        <ChevronDown className={cn("w-2.5 h-2.5 transition-transform duration-500", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: align === "top" ? -10 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: align === "top" ? -10 : 10 }}
              className={cn(
                "absolute left-0 w-64 bg-[#0a0a0a] border border-white/10 rounded-[24px] shadow-[0_40px_80px_rgba(0,0,0,0.9)] z-[110] p-2 overflow-hidden",
                align === "top" ? "bottom-full mb-3" : "top-full mt-3"
              )}
            >
              <div className="px-4 py-3 text-[10px] text-[#333] font-black uppercase tracking-[0.3em]">Compute Engine</div>
              {MODELS.map(m => (
                <button key={m.id} onClick={() => { onChange(m.id); setOpen(false) }} className={cn("w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all text-[13px]", value === m.id ? "bg-white/10 text-white" : "text-[#444] hover:bg-white/5 hover:text-[#888]")}>
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
  const [model, setModel] = useState(MODELS[1].id) // Default to GLM 4.5 Air
  const [isGenerating, setIsGenerating] = useState(false)
  const [taskStatus, setTaskStatus] = useState<string | null>(null)
  const [workspaceTab, setWorkspaceTab] = useState<"preview" | "code">("preview")
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat")
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop")
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [activeFile, setActiveFile] = useState<string | null>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }
  }, [activeSession?.messages, taskStatus])

  const abortControllerRef = useRef<AbortController | null>(null)

  const handleStart = async (forcedPrompt?: string) => {
    const promptValue = forcedPrompt || input
    if (!promptValue.trim() || isGenerating) return

    abortControllerRef.current = new AbortController()
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
        signal: abortControllerRef.current.signal,
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

        // Remove thinking block AND any multi-file protocol blocks from visible chat
        let cleanContent = assistantContent
            .replace(/<thinking>[\s\S]*?<\/thinking>/g, "")
            .replace(/--- FILE: [\s\S]*? ---[\s\S]*?--- END ---/g, "")
            .replace(/--- DELETE: [\s\S]*? ---/g, "")
            .trim()

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

          // Trigger Review
          setTaskStatus("Senior Review...")
          const reviewRes = await fetch("/api/review", {
            method: "POST",
            body: JSON.stringify({ prompt: promptValue, files: newFiles }),
          })
          const reviewData = await reviewRes.json()
          if (reviewData.review) {
            store.addMessage(sessionId, { role: "assistant", content: reviewData.review, thinking: "Senior Architectural Review Complete" })
          }
      }

    } catch (e: any) {
        console.error(e)
    } finally {
      setIsGenerating(false)
      setTaskStatus(null)
      abortControllerRef.current = null
    }
  }

  const handleCancel = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        setTaskStatus("Stopped")
        setTimeout(() => setTaskStatus(null), 2000)
    }
  }

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Voice recognition not supported in this browser.")
        return
    }
    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript
        setInput(prev => prev + (prev ? " " : "") + text)
    }
    recognition.start()
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

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  // --- RENDERING COMPONENTS ---

  const HistorySidebar = () => (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-72 bg-[#0a0a0a] border-r border-white/10 z-[110] flex flex-col shadow-2xl"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#444]">Workspace History</span>
              <X className="w-4 h-4 text-[#444] cursor-pointer hover:text-white" onClick={() => setSidebarOpen(false)} />
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-1">
              <button
                onClick={() => { store.setActiveSession(null); setSidebarOpen(false); }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-left group"
              >
                <Plus className="w-4 h-4 text-indigo-500" />
                <span className="text-[13px] font-bold text-white">New Creation</span>
              </button>
              <div className="h-px bg-white/5 my-2 mx-2" />
              {store.sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => { store.setActiveSession(s.id); setSidebarOpen(false); }}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-left group relative",
                    store.activeSessionId === s.id ? "bg-white/10" : "hover:bg-white/5"
                  )}
                >
                  <MessageSquare className="w-4 h-4 text-[#444] group-hover:text-[#888]" />
                  <span className={cn("text-[13px] font-medium truncate flex-1", store.activeSessionId === s.id ? "text-white" : "text-[#666] group-hover:text-[#aaa]")}>
                    {s.title}
                  </span>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-white/5">
                <button onClick={() => { store.clearAll(); setSidebarOpen(false); }} className="w-full flex items-center justify-center space-x-2 py-2 text-[11px] font-black text-red-500/50 hover:text-red-500 transition-colors uppercase tracking-widest">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge All</span>
                </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  // 1. Initial Landing Experience (No Active Chat)
  if (!store.activeSessionId) {
    return (
        <main className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center p-6 font-sans antialiased text-white relative overflow-hidden">
            <HistorySidebar />
            {/* Header */}
            <header className="fixed top-0 left-0 w-full h-12 flex items-center justify-between px-6 z-50">
                <div className="flex items-center space-x-4">
                    <Menu className="w-4 h-4 text-[#666] cursor-pointer hover:text-white" onClick={toggleSidebar} />
                    <div className="flex items-center space-x-1">
                        <span className="font-black text-lg italic tracking-tighter">V</span>
                        <span className="font-black text-lg tracking-tighter">B</span>
                    </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-white/10" />
            </header>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl space-y-8 flex flex-col items-center">
                <h1 className="text-3xl font-medium tracking-tight text-center">What do you want to create?</h1>

                <div className="w-full max-w-xl relative group px-4">
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-3 shadow-2xl focus-within:border-white/20 transition-all duration-300">
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleStart() } }}
                            placeholder="Ask VB to build..."
                            className="w-full bg-transparent border-none focus:outline-none text-[14px] resize-none h-16 text-white placeholder-[#555] leading-relaxed"
                        />
                        <div className="flex justify-between items-center pt-2">
                            <div className="flex items-center space-x-3">
                                <Plus className="w-4 h-4 text-[#666] cursor-pointer hover:text-white transition-colors" />
                                <IntelligenceSelector value={model} onChange={setModel} align="top" />
                            </div>
                            <div className="flex items-center space-x-3">
                                {isGenerating ? (
                                    <button onClick={handleCancel} className="p-1.5 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all">
                                        <Square className="w-3.5 h-3.5 fill-red-500" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={input.trim() ? () => handleStart() : startVoice}
                                        className={cn("p-1.5 rounded-md transition-all active:scale-90", input.trim() || isListening ? "bg-white text-black" : "bg-[#1a1a1a] text-[#444]")}
                                    >
                                        {input.trim() ? <Send className="w-3.5 h-3.5" /> : <Mic className={cn("w-3.5 h-3.5", isListening && "text-red-500 animate-pulse")} />}
                                    </button>
                                )}
                            </div>
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
    <main className="flex flex-col lg:flex-row h-screen w-screen bg-[#050505] font-sans antialiased text-white relative overflow-hidden">

      {/* Mobile Header (Tabs) */}
      <header className="lg:hidden h-12 border-b border-white/10 flex items-center justify-between px-4 bg-[#0a0a0a] z-50">
          <div className="flex items-center space-x-3">
              <Menu className="w-4 h-4 text-[#666]" onClick={toggleSidebar} />
              <div className="flex items-center space-x-1">
                  <span className="font-black text-lg italic tracking-tighter">V</span>
                  <span className="font-black text-lg tracking-tighter">B</span>
              </div>
          </div>
          <div className="flex bg-[#1a1a1a] rounded-lg p-1">
              <button onClick={() => setMobileTab("chat")} className={cn("px-4 py-1.5 text-[11px] font-bold rounded-md transition-all", mobileTab === "chat" ? "bg-[#2a2a2a] text-white" : "text-[#666]")}>Chat</button>
              <button onClick={() => { setMobileTab("preview"); setWorkspaceTab("preview"); setViewMode("mobile") }} className={cn("px-4 py-1.5 text-[11px] font-bold rounded-md transition-all", mobileTab === "preview" ? "bg-[#2a2a2a] text-white" : "text-[#666]")}>Preview</button>
          </div>
          <div className="w-8" />
      </header>

      {/* --- Desktop Left / Mobile Chat Panel --- */}
      <div className={cn(
          "flex-col bg-[#0a0a0a] border-r border-white/10 shrink-0 lg:w-[450px] transition-all",
          isMobile ? (mobileTab === "chat" ? "flex h-full" : "hidden") : "flex h-full"
      )}>
        <header className="hidden lg:flex h-11 border-b border-white/10 items-center px-4 justify-between">
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-70 transition-opacity" onClick={toggleSidebar}>
                <Menu className="w-3.5 h-3.5 text-[#666] hover:text-white" />
                <div className="flex items-center space-x-1">
                    <span className="font-black text-base italic tracking-tighter">V</span>
                    <span className="font-black text-base tracking-tighter">B</span>
                </div>
                <span className="text-[11px] text-[#666] font-medium truncate max-w-[150px]">/ {activeSession.title}</span>
                <ChevronDown className="w-2.5 h-2.5 text-[#444]" />
            </div>
            <div className="flex items-center space-x-4">
                <Plus className="w-3.5 h-3.5 text-[#666] cursor-pointer hover:text-white transition-colors" onClick={() => store.setActiveSession(null)} />
            </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-6 scroll-hide pb-40">
            {activeSession.messages.map((m, i) => (
                <div key={i} className={cn("flex flex-col space-y-3", m.role === "user" ? "items-start" : "items-start")}>
                    <div className="flex items-center space-x-2">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black", m.role === "assistant" ? "bg-white text-black" : "bg-[#222] text-white")}>
                            {m.role === "assistant" ? "VB" : "U"}
                        </div>
                    </div>
                    <div className={cn("text-[14px] leading-relaxed whitespace-pre-wrap max-w-full", m.role === "user" ? "text-white" : "text-[#aaa]")}>
                        {m.thinking && (
                            <details className="mb-4 group">
                                <summary className="list-none cursor-pointer flex items-center space-x-2 text-[11px] text-[#555] font-black uppercase tracking-widest hover:text-[#888] transition-colors">
                                    <BrainCircuit className="w-3 h-3" />
                                    <span>Thought Process</span>
                                </summary>
                                <div className="mt-3 bg-[#0f0f0f] border border-white/5 rounded-xl p-4 text-[12px] text-[#666] italic leading-relaxed">
                                    {m.thinking}
                                </div>
                            </details>
                        )}
                        {m.content || (isGenerating && i === activeSession.messages.length - 1 && <div className="flex space-x-1 py-1"><div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" /></div>)}
                    </div>
                </div>
            ))}
            {taskStatus && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-3 px-2">
                    <Loader2 className="w-3 h-3 animate-spin text-[#666]" />
                    <span className="text-[10px] text-[#444] font-black uppercase tracking-[0.2em]">{taskStatus}</span>
                </motion.div>
            )}
        </div>

        <div className="p-4 bg-[#0a0a0a]">
          <div className="relative bg-[#0f0f0f] border border-white/10 rounded-xl p-3 shadow-2xl focus-within:border-white/20 transition-all">
            <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleStart() } }}
                placeholder="Ask a follow-up..."
                className="w-full bg-transparent border-none focus:outline-none text-[13px] resize-none h-12 text-white placeholder-[#555]"
            />
            <div className="flex justify-between items-center pt-1.5">
                <div className="flex items-center space-x-3">
                    <Plus className="w-3.5 h-3.5 text-[#666] cursor-pointer hover:text-white transition-colors" />
                    <IntelligenceSelector value={model} onChange={setModel} align="top" />
                </div>
                <div className="flex items-center space-x-3">
                    {isGenerating ? (
                        <button onClick={handleCancel} className="p-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all">
                            <Square className="w-3 h-3 fill-red-500" />
                        </button>
                    ) : (
                        <button
                            onClick={input.trim() ? () => handleStart() : startVoice}
                            className={cn("p-1.5 rounded-md transition-all active:scale-90", input.trim() || isListening ? "bg-white text-black" : "bg-[#1a1a1a] text-[#444]")}
                        >
                            {input.trim() ? <Send className="w-3 h-3" /> : <Mic className={cn("w-3 h-3", isListening && "text-red-500 animate-pulse")} />}
                        </button>
                    )}
                </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between px-2">
              <div className="flex items-center space-x-2 text-[#666] text-[10px] font-bold">
                  <AlertTriangle className="w-3 h-3 text-orange-500" />
                  <span>Reviewing required for production use</span>
              </div>
          </div>
        </div>
      </div>

      {/* --- Desktop Right / Mobile Preview Panel --- */}
      <div className={cn(
          "flex-1 h-full flex flex-col bg-[#050505] transition-all",
          isMobile ? (mobileTab === "preview" ? "flex h-full" : "hidden") : "flex h-full"
      )}>
        <header className="hidden lg:flex h-11 border-b border-white/10 items-center px-4 justify-between bg-[#0a0a0a]">
            <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-white/5">
                <button onClick={() => setWorkspaceTab("code")} className={cn("px-4 py-1.2 text-[10px] font-black rounded-md transition-all", workspaceTab === "code" ? "bg-[#2a2a2a] text-white shadow-xl" : "text-[#666] hover:text-[#aaa]")}>Code</button>
                <button onClick={() => setWorkspaceTab("preview")} className={cn("px-4 py-1.2 text-[10px] font-black rounded-md transition-all", workspaceTab === "preview" ? "bg-[#2a2a2a] text-white shadow-xl" : "text-[#666] hover:text-[#aaa]")}>Preview</button>
            </div>

            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-[#1a1a1a] rounded-lg p-1 border border-white/5">
                    <button onClick={() => setViewMode("desktop")} className={cn("p-1 rounded-md transition-all", viewMode === "desktop" ? "text-white" : "text-[#444]")}><Monitor className="w-3 h-3" /></button>
                    <button onClick={() => setViewMode("mobile")} className={cn("p-1 rounded-md transition-all", viewMode === "mobile" ? "text-white" : "text-[#444]")}><Smartphone className="w-3 h-3" /></button>
                </div>
                <button className="bg-white text-black px-4 py-1.2 rounded-lg text-[10px] font-black hover:bg-[#eee] transition-all">Publish</button>
            </div>
        </header>

        <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4 lg:p-12">
            <AnimatePresence mode="wait">
                {workspaceTab === "preview" ? (
                    <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex items-center justify-center">
                        {sandboxUrl ? (
                            <div className={cn("bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.2,1,0.3,1)] border border-white/10", viewMode === "desktop" ? "w-full h-full" : "w-[375px] h-[667px] max-h-full")}>
                                <iframe src={sandboxUrl} className="w-full h-full border-none" />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-6 opacity-20 text-white">
                                <Layers className="w-16 h-16" />
                                <span className="text-[10px] font-black uppercase tracking-[0.5em]">Awaiting Generation</span>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex flex-col">
                        <div className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                            <div className="h-12 border-b border-white/10 bg-[#0d0d0d] flex items-center px-6 text-[10px] font-black text-[#555] tracking-[0.2em] uppercase">
                                System Codebase
                            </div>
                            <div className="flex-1 flex overflow-hidden">
                                <div className="hidden lg:block w-48 border-r border-white/10 p-3 space-y-1 overflow-auto bg-[#080808]">
                                    {activeSession.files.map((f, idx) => (
                                        <div
                                          key={f.path}
                                          onClick={() => setActiveFile(f.path)}
                                          className={cn(
                                            "flex items-center space-x-2 px-3 py-2 rounded-lg text-[11px] font-bold transition-all truncate cursor-pointer",
                                            (activeFile === f.path || (!activeFile && idx === 0)) ? "bg-white/10 text-white" : "text-[#444] hover:bg-white/5 hover:text-[#888]"
                                          )}
                                        >
                                            <FileCode className="w-3.5 h-3.5" />
                                            <span>{f.path.split('/').pop()}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex-1 p-6 overflow-auto font-mono text-[13px] leading-[1.6] text-[#888]">
                                    <pre className="whitespace-pre-wrap">
                                        {activeSession.files.find(f => f.path === (activeFile || activeSession.files[0]?.path))?.content || "// Select a file to view code."}
                                    </pre>
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
