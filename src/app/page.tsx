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
  Search
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// --- Types ---

type FileItem = {
  path: string
  content: string
}

type Message = {
  role: "user" | "assistant" | "system"
  content: string
  thinking?: string
  task?: string
}

const FREE_MODELS = [
  { id: "google/gemini-2.0-flash-001:free", name: "Brainy Flash", power: 1 },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Brainy Pro", power: 3 },
  { id: "mistralai/mistral-7b-instruct:free", name: "Brainy Mini", power: 1 },
  { id: "google/gemma-2-9b-it:free", name: "Brainy Lite", power: 2 },
  { id: "openrouter/free", name: "Auto Brainy", power: 2 },
]

// --- Components ---

const ModelIcon = ({ power, active = false }: { power: number, active?: boolean }) => {
  const sizes = [8, 11, 15]
  const size = sizes[power - 1] || 11
  return (
    <div className={cn(
      "rounded-full border flex items-center justify-center transition-all shadow-sm",
      active ? "border-white bg-white" : "border-[#404040] bg-transparent"
    )} style={{ width: size, height: size }}>
      {active && <div className="w-1 h-1 bg-black rounded-full" />}
    </div>
  )
}

const ModelSelectorDropdown = ({ selectedModel, onSelect }: { selectedModel: string, onSelect: (id: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  const currentModel = FREE_MODELS.find(m => m.id === selectedModel) || FREE_MODELS[0]

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-[#171717] border border-[#262626] rounded-xl px-3 py-1.5 cursor-pointer hover:border-[#404040] transition-colors group"
      >
        <ModelIcon power={currentModel.power} />
        <span className="text-[12px] font-medium text-[#a1a1a1] group-hover:text-white transition-colors truncate max-w-[100px]">{currentModel.name}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-[#737373] transition-transform", isOpen && "rotate-180")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute bottom-full left-0 mb-2 w-64 bg-[#171717] border border-[#262626] rounded-2xl shadow-2xl z-20 overflow-hidden p-1.5"
            >
              <div className="px-3 py-2 text-[10px] text-[#525252] font-bold uppercase tracking-wider">Intelligence Level</div>
              {FREE_MODELS.map((model) => (
                <div
                  key={model.id}
                  onClick={() => {
                    onSelect(model.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "px-3 py-2.5 rounded-xl text-[12px] transition-all cursor-pointer flex items-center space-x-3",
                    selectedModel === model.id ? "bg-[#262626] text-white" : "text-[#a1a1a1] hover:bg-[#1a1a1a] hover:text-[#ededed]"
                  )}
                >
                  <ModelIcon power={model.power} active={selectedModel === model.id} />
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-[10px] opacity-50">{model.power === 3 ? "Powerful" : model.power === 2 ? "Balanced" : "Fast & Lazy"}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function OpenBrainyApp() {
  // Auth & Storage
  const [isAuth, setIsAuth] = useState(false)
  const [email, setEmail] = useState("")

  // Conversation State
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [model, setModel] = useState(FREE_MODELS[0].id)
  const [isGenerating, setIsGenerating] = useState(false)
  const [taskStatus, setTaskStatus] = useState<string | null>(null)

  // File System State
  const [files, setFiles] = useState<FileItem[]>([])
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null)

  // Sandbox State
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null)
  const [sandboxId, setSandboxId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("preview")
  const [view, setView] = useState("desktop")
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const [review, setReview] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedFiles = localStorage.getItem("ob_files")
    if (savedFiles) {
        const parsed = JSON.parse(savedFiles)
        setFiles(parsed)
        if (parsed.length > 0) setActiveFilePath(parsed[0].path)
    }
    const savedAuth = localStorage.getItem("ob_auth")
    if (savedAuth) setIsAuth(true)
    const savedMessages = localStorage.getItem("ob_messages")
    if (savedMessages) {
        setMessages(JSON.parse(savedMessages))
    } else {
        setMessages([{ role: "assistant", content: "Welcome to **Open Brainy**. I'm a full-stack AI engineer. Tell me what you want to build (Next.js is my default, but I'm flexible)." }])
    }
  }, [])

  useEffect(() => {
    if (files.length > 0) localStorage.setItem("ob_files", JSON.stringify(files))
  }, [files])

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem("ob_messages", JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const parseThinking = (content: string) => {
      const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/)
      const thinking = thinkingMatch ? thinkingMatch[1].trim() : undefined
      const cleanContent = content.replace(/<thinking>[\s\S]*?<\/thinking>/, "").trim()
      return { thinking, cleanContent }
  }

  const handleSend = async (customPrompt?: string) => {
    const promptValue = customPrompt || input
    if (!promptValue.trim() || isGenerating) return

    const userMsg: Message = { role: "user", content: promptValue }
    setMessages(prev => [...prev, userMsg])
    if (!customPrompt) setInput("")
    setIsGenerating(true)
    setTaskStatus("Initializing Brainy...")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
            messages: [...messages, userMsg],
            model,
            files // Provide full codebase context to the AI
        }),
      })

      if (!response.body) throw new Error("Stream failure.")
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""

      setMessages(prev => [...prev, { role: "assistant", content: "" }])

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        assistantContent += chunk

        const { thinking, cleanContent } = parseThinking(assistantContent)

        setMessages(prev => {
          const last = prev[prev.length - 1]
          return [...prev.slice(0, -1), { ...last, content: cleanContent, thinking }]
        })
      }

      // Parse File Operations from Response
      // Expected Format: --- FILE: path/to/file --- [CONTENT] --- END ---
      const fileOps = assistantContent.matchAll(/--- FILE: (.*?) ---\n([\s\S]*?)\n--- END ---/g)
      const newFiles = [...files]
      let changed = false

      for (const op of fileOps) {
          const path = op[1].trim()
          const content = op[2].trim()
          const existingIdx = newFiles.findIndex(f => f.path === path)
          if (existingIdx !== -1) {
              newFiles[existingIdx].content = content
          } else {
              newFiles.push({ path, content })
          }
          changed = true
      }

      if (changed) {
          setFiles(newFiles)
          if (!activeFilePath && newFiles.length > 0) setActiveFilePath(newFiles[0].path)
          await handleUpdateSandbox(newFiles)
          handleRequestReview(promptValue, newFiles)
      }

    } catch (err: any) {
        setConsoleLogs(prev => [...prev, `[BRAINY ERROR] ${err.message}`])
    } finally {
      setIsGenerating(false)
      setTaskStatus(null)
    }
  }

  const handleUpdateSandbox = async (codebase: FileItem[]) => {
    setTaskStatus("Syncing Multi-file Compute...")
    setConsoleLogs(prev => [...prev, "[Brainy] Uploading project to Vercel Sandbox..."])
    try {
      const res = await fetch("/api/sandbox", {
        method: "POST",
        body: JSON.stringify({ files: codebase, sandboxId }),
      })
      const data = await res.json()
      if (data.url) {
        setSandboxUrl(data.url)
        setSandboxId(data.sandboxId)
        setConsoleLogs(prev => [...prev, `[Brainy] Sandbox active: ${data.url}`])
      }
      if (data.error) {
        setConsoleLogs(prev => [...prev, `[BOOT FAILURE] ${data.error}`])
        handleAutoFix(data.error)
      }
    } catch (err: any) {
        setConsoleLogs(prev => [...prev, `[SYSTEM ERROR] ${err.message}`])
    } finally {
        setTaskStatus(null)
    }
  }

  const handleAutoFix = async (errorLog: string) => {
    setTaskStatus("Brainy is fixing the build...")
    const fixPrompt = `System: Sandbox error detected.\nLOGS:\n${errorLog}\n\nPlease fix the files involved.`
    await handleSend(fixPrompt)
  }

  const handleRequestReview = async (prompt: string, codebase: FileItem[]) => {
    try {
        const res = await fetch("/api/review", {
            method: "POST",
            body: JSON.stringify({ prompt, files: codebase }),
        })
        const data = await res.json()
        setReview(data.review)
    } catch (err) {
        console.error("Review failed:", err)
    }
  }

  const clearHistory = () => {
      setMessages([{ role: "assistant", content: "Memory purged. What's the new project?" }])
      setFiles([])
      setSandboxUrl(null)
      setReview(null)
      setConsoleLogs([])
      localStorage.removeItem("ob_messages")
      localStorage.removeItem("ob_files")
  }

  if (!isAuth) {
    return (
      <div className="h-screen w-screen bg-[#050505] flex items-center justify-center p-6 font-sans antialiased">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-[#0a0a0a] border border-[#1a1a1a] rounded-[40px] p-12 space-y-10 shadow-2xl">
          <div className="flex flex-col items-center space-y-5">
            <div className="w-16 h-16 rounded-[22px] bg-white flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.15)]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 4L4 12L12 20L20 12L12 4Z" fill="black"/></svg>
            </div>
            <div className="text-center">
                <h1 className="text-3xl font-black tracking-tighter text-white">Open Brainy</h1>
                <p className="text-[#666] text-sm mt-2 font-medium">The Full-Stack AI Engineer.</p>
            </div>
          </div>
          <div className="space-y-4">
            <input type="email" placeholder="dev@openbrainy.com" className="w-full bg-[#111] border border-[#222] rounded-2xl px-6 py-5 text-sm focus:outline-none focus:border-white/10 transition-all text-white placeholder-[#444]" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button onClick={() => { if (email) { setIsAuth(true); localStorage.setItem("ob_auth", "true"); } }} className="w-full bg-white text-black font-black rounded-2xl py-5 hover:bg-[#eee] transition-all active:scale-[0.97] shadow-xl text-sm">Enter Workspace</button>
          </div>
          <div className="flex items-center justify-center space-x-3 opacity-30">
              <ShieldCheck className="w-5 h-5 text-white" />
              <span className="text-[10px] text-white uppercase tracking-[0.3em] font-black">Firecracker Isolated</span>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <main className="flex h-screen w-screen overflow-hidden select-none bg-[#0a0a0a] font-sans antialiased text-[#ededed]">
      {/* --- Sidebar: Chat & Files --- */}
      <div className="w-[480px] h-full border-r border-[#262626] flex flex-col bg-[#0a0a0a]">
        <header className="h-16 border-b border-[#262626] flex items-center px-6 justify-between bg-[#0a0a0a]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 4L4 12L12 20L20 12L12 4Z" fill="black"/></svg>
            </div>
            <span className="font-black text-[16px] tracking-tighter">Open Brainy</span>
          </div>
          <div className="flex items-center space-x-4 text-[#737373]">
            <History className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
            <RefreshCcw className="w-4 h-4 cursor-pointer hover:text-white transition-colors" onClick={clearHistory} />
            <Share2 className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
          </div>
        </header>

        {/* Multi-Tab Sidebar: Chat / Explorer */}
        <div className="flex-1 flex flex-col overflow-hidden">
            <div ref={scrollRef} className="flex-1 overflow-auto p-6 space-y-8 scroll-hide">
            {messages.map((msg, i) => (
                <div key={i} className={cn("flex flex-col space-y-3", msg.role === "user" ? "items-start max-w-[95%]" : "max-w-full")}>
                <div className="flex items-center space-x-2">
                    {msg.role === "assistant" ? (
                    <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-[11px] text-black font-black">OB</div>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg"><User className="w-3.5 h-3.5 text-white" /></div>
                    )}
                    <span className="text-[11px] font-black text-[#555] uppercase tracking-widest">{msg.role === "assistant" ? "Engineer" : "Lead"}</span>
                </div>

                <div className={cn(
                    "px-5 py-4 rounded-[24px] text-[13px] leading-relaxed whitespace-pre-wrap",
                    msg.role === "user" ? "bg-[#141414] border border-[#262626] text-white rounded-tl-sm shadow-md" : "text-[#ededed] px-1"
                )}>
                    {msg.thinking && (
                        <div className="mb-5 bg-[#0d0d0d] border border-white/5 rounded-2xl p-4 flex items-start space-x-4">
                            <BrainCircuit className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                            <span className="text-[12px] text-[#737373] italic leading-snug">{msg.thinking}</span>
                        </div>
                    )}
                    {msg.content || (isGenerating && i === messages.length - 1 && <div className="flex space-x-1.5 py-1"><div className="w-2 h-2 bg-white rounded-full animate-bounce" /><div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]" /></div>)}
                </div>
                </div>
            ))}

            {review && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0a0a0a] border border-indigo-500/20 rounded-[28px] p-6 space-y-4 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -z-10" />
                    <div className="flex items-center space-x-3 text-indigo-400">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-[11px] font-black uppercase tracking-[0.3em]">Architect Review</span>
                    </div>
                    <p className="text-[13px] text-[#a1a1a1] leading-relaxed italic border-l-2 border-indigo-500/40 pl-4">{review}</p>
                </motion.div>
            )}

            {taskStatus && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-3 px-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span className="text-[11px] text-[#666] font-black uppercase tracking-widest">{taskStatus}</span>
                </motion.div>
            )}
            </div>
        </div>

        {/* Input Bar */}
        <div className="p-5 bg-[#0a0a0a] border-t border-[#262626]">
          <div className="relative bg-[#111] border border-[#262626] rounded-[32px] p-5 shadow-2xl focus-within:border-white/10 transition-all duration-300">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Tell Open Brainy what to build..."
              className="w-full bg-transparent border-none focus:outline-none text-[14px] resize-none h-28 text-[#ededed] placeholder-[#444] leading-relaxed"
            />
            <div className="flex justify-between items-center pt-3">
              <div className="flex items-center space-x-3">
                  <button className="p-2.5 hover:bg-[#1a1a1a] rounded-xl transition-colors text-[#555] hover:text-white"><Plus className="w-5 h-5" /></button>
                  <div className="h-7 w-[1px] bg-[#262626]" />
                  <ModelSelectorDropdown selectedModel={model} onSelect={setModel} />
              </div>
              <div className="flex items-center space-x-3">
                <button className="p-2.5 hover:bg-[#1a1a1a] rounded-xl transition-colors text-[#555] hover:text-white"><Camera className="w-5 h-5" /></button>
                <button onClick={() => handleSend()} className={cn("p-4 rounded-[22px] transition-all active:scale-[0.92] shadow-2xl", input.trim() ? "bg-white text-black" : "bg-[#1a1a1a] text-[#333] cursor-not-allowed")}>
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-5 px-4">
                <div className="flex items-center space-x-2 text-[10px] text-[#333] font-black tracking-widest uppercase"><Zap className="w-4 h-4" /><span>Full-Stack Sandbox v1.0</span></div>
                <div className="flex items-center space-x-2 text-[10px] text-[#333] font-bold">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Shift + Enter</span>
                </div>
          </div>
        </div>
      </div>

      {/* --- Main Workspace: Files & Preview --- */}
      <div className="flex-1 h-full bg-[#050505] flex flex-col overflow-hidden">
        <header className="h-16 border-b border-[#262626] flex items-center px-6 justify-between bg-[#0a0a0a]">
          <div className="flex items-center space-x-6">
            {/* File Explorer Toggle */}
            <div className="flex bg-[#111] rounded-xl p-1 border border-[#262626]">
              {["preview", "code", "console"].map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} className={cn("px-5 py-2 text-[11px] font-black rounded-lg capitalize transition-all", activeTab === t ? "bg-[#262626] text-white shadow-lg" : "text-[#555] hover:text-[#aaa]")}>{t}</button>
              ))}
            </div>
            <div className="h-6 w-[1px] bg-[#262626]" />
            <div className="flex items-center text-[12px] text-[#666] space-x-3">
              <FolderOpen className="w-4 h-4" />
              <span className="hover:text-white cursor-pointer transition-colors font-black tracking-tight">{sandboxId ? `sandbox-${sandboxId.slice(0, 8)}` : "local-draft"}</span>
              <span className="opacity-20">/</span>
              <span className="text-white font-bold">{activeFilePath || "no-file"}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 bg-[#0a0a0a] border border-[#262626] text-[#666] px-5 py-2.5 rounded-xl text-[11px] font-black hover:border-white/10 transition-all"><Download className="w-4 h-4" /><span>Export codebase</span></button>
            <button className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[11px] font-black hover:bg-indigo-500 active:scale-95 transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)]"><span>Deploy Instance</span><ArrowRight className="w-4 h-4" /></button>
          </div>
        </header>

        <div className="flex-1 flex relative overflow-hidden">
          {/* File Explorer Pane */}
          {activeTab === "code" && (
            <div className="w-64 border-r border-[#262626] bg-[#0a0a0a] flex flex-col">
                <div className="p-4 border-b border-[#262626] flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#444]">Explorer</span>
                    <Search className="w-3.5 h-3.5 text-[#444]" />
                </div>
                <div className="flex-1 overflow-auto p-3 space-y-1">
                    {files.map(file => (
                        <div
                            key={file.path}
                            onClick={() => setActiveFilePath(file.path)}
                            className={cn(
                                "flex items-center space-x-3 px-3 py-2.5 rounded-xl cursor-pointer text-[12px] transition-all",
                                activeFilePath === file.path ? "bg-[#1a1a1a] text-white border border-white/5 shadow-inner" : "text-[#666] hover:bg-[#111] hover:text-[#999]"
                            )}
                        >
                            <FileCode className={cn("w-4 h-4", activeFilePath === file.path ? "text-indigo-400" : "text-[#444]")} />
                            <span className="truncate flex-1">{file.path.split('/').pop()}</span>
                        </div>
                    ))}
                    {files.length === 0 && <div className="text-[11px] text-[#333] italic p-4 text-center">Codebase is empty.</div>}
                </div>
            </div>
          )}

          <div className="flex-1 relative flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
                {activeTab === "preview" && (
                <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 bg-[#050505] overflow-hidden flex items-center justify-center p-16">
                    {sandboxUrl ? (
                    <div className={cn("bg-white rounded-[40px] shadow-[0_60px_120px_rgba(0,0,0,0.7)] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] border border-white/5", view === "desktop" ? "w-full h-full" : "w-[390px] h-[844px]")}>
                        <iframe src={sandboxUrl} className="w-full h-full border-none" />
                    </div>
                    ) : (
                        <div className="flex flex-col items-center space-y-8 text-[#111]">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}><Monitor className="w-24 h-24" /></motion.div>
                            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#222]">Brainy instance ready</p>
                        </div>
                    )}
                </motion.div>
                )}

                {activeTab === "code" && (
                <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 bg-[#050505] p-10 overflow-hidden">
                    <div className="h-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-[32px] overflow-hidden flex flex-col shadow-2xl">
                        <div className="h-12 border-b border-[#1a1a1a] bg-[#0d0d0d] flex items-center px-6 justify-between">
                            <div className="flex items-center space-x-3">
                                <Edit3 className="w-3.5 h-3.5 text-[#555]" />
                                <span className="text-[11px] font-bold text-[#666]">{activeFilePath}</span>
                            </div>
                            <Trash2 className="w-4 h-4 text-[#333] cursor-pointer hover:text-red-400 transition-colors" />
                        </div>
                        <div className="flex-1 overflow-auto p-8 font-mono text-[13px] leading-[1.7] text-[#999] scroll-hide">
                            <pre className="whitespace-pre-wrap">{files.find(f => f.path === activeFilePath)?.content || "// Selected file content will appear here."}</pre>
                        </div>
                    </div>
                </motion.div>
                )}

                {activeTab === "console" && (
                <motion.div key="console" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 bg-[#050505] p-10">
                    <div className="h-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-[32px] p-10 font-mono text-[12px] overflow-auto space-y-4 shadow-inner">
                    <div className="flex items-center space-x-3 text-[#555] mb-8 uppercase tracking-[0.3em] font-black"><Terminal className="w-5 h-5" /><span>Runtime Debug Logs</span></div>
                        {consoleLogs.map((log, i) => (
                            <div key={i} className={cn("py-2 border-b border-white/[0.03] last:border-none", log.includes("[ERROR]") || log.includes("[BOOT FAILURE]") ? "text-red-500 font-bold" : log.includes("[Brainy]") ? "text-indigo-400 font-medium" : "text-[#333]")}>{log}</div>
                        ))}
                        {consoleLogs.length === 0 && <span className="text-[#111] font-black uppercase tracking-widest">Environment Idle.</span>}
                    </div>
                </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 p-2.5 rounded-full shadow-[0_30px_70px_rgba(0,0,0,0.6)] z-30">
                <button onClick={() => setView("desktop")} className={cn("flex items-center space-x-3 px-6 py-3 rounded-full text-[12px] font-black transition-all", view === "desktop" ? "bg-white text-black shadow-lg" : "text-[#555] hover:text-white")}><Monitor className="w-4 h-4" /><span>Desktop</span></button>
                <button onClick={() => setView("mobile")} className={cn("flex items-center space-x-3 px-6 py-3 rounded-full text-[12px] font-black transition-all", view === "mobile" ? "bg-white text-black shadow-lg" : "text-[#555] hover:text-white")}><Smartphone className="w-4 h-4" /><span>Mobile</span></button>
                <div className="h-6 w-[1px] bg-[#262626] mx-2" />
                <button onClick={() => setActiveTab(activeTab === "code" ? "preview" : "code")} className={cn("p-4 rounded-full transition-all", activeTab === "code" ? "text-white bg-[#262626] shadow-inner" : "text-[#555] hover:text-white")}><Code2 className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
