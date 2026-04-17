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
  BrainCircuit
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// --- Types ---

type Message = {
  role: "user" | "assistant" | "system"
  content: string
  thinking?: string
}

const FREE_MODELS = [
  { id: "google/gemini-2.0-flash-001:free", name: "Gemini 2.0 Flash", power: 1 },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", power: 3 },
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B", power: 1 },
  { id: "google/gemma-2-9b-it:free", name: "Gemma 2 9B", power: 2 },
  { id: "openrouter/free", name: "Auto Router", power: 2 },
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
              <div className="px-3 py-2 text-[10px] text-[#525252] font-bold uppercase tracking-wider">Select Model</div>
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

export default function V0App() {
  const [isAuth, setIsAuth] = useState(false)
  const [email, setEmail] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [model, setModel] = useState(FREE_MODELS[0].id)
  const [isGenerating, setIsGenerating] = useState(false)
  const [taskStatus, setTaskStatus] = useState<string | null>(null)
  const [currentCode, setCurrentCode] = useState("")
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null)
  const [sandboxId, setSandboxId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("preview")
  const [view, setView] = useState("desktop")
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const [review, setReview] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedCode = localStorage.getItem("v0_last_code")
    if (savedCode) setCurrentCode(savedCode)
    const savedAuth = localStorage.getItem("v0_auth")
    if (savedAuth) setIsAuth(true)
    const savedMessages = localStorage.getItem("v0_messages")
    if (savedMessages) {
        setMessages(JSON.parse(savedMessages))
    } else {
        setMessages([{ role: "assistant", content: "Welcome! I'm v0. I can help you build production-ready Next.js interfaces. What should we create?" }])
    }
  }, [])

  useEffect(() => {
    if (currentCode) localStorage.setItem("v0_last_code", currentCode)
  }, [currentCode])

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem("v0_messages", JSON.stringify(messages))
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
    setTaskStatus("v0 is initializing...")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [...messages, userMsg], model }),
      })

      if (!response.body) throw new Error("Stream connection failed.")
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

      const finalAssistantMsg = assistantContent
      const codeMatch = finalAssistantMsg.match(/```(?:tsx|jsx|javascript|typescript|react)?\n([\s\S]*?)```/)
      if (codeMatch && codeMatch[1]) {
        const code = codeMatch[1].trim()
        setCurrentCode(code)
        await handleUpdateSandbox(code)
        handleRequestReview(promptValue, code)
      }

    } catch (err: any) {
        setConsoleLogs(prev => [...prev, `[CRITICAL ERROR] ${err.message}`])
    } finally {
      setIsGenerating(false)
      setTaskStatus(null)
    }
  }

  const handleUpdateSandbox = async (code: string) => {
    setTaskStatus("Executing on Vercel Sandbox...")
    setConsoleLogs(prev => [...prev, "[v0] Syncing source code with ephemeral microVM..."])
    try {
      const res = await fetch("/api/sandbox", {
        method: "POST",
        body: JSON.stringify({ code, sandboxId }),
      })
      const data = await res.json()
      if (data.url) {
        setSandboxUrl(data.url)
        setSandboxId(data.sandboxId)
        setConsoleLogs(prev => [...prev, `[v0] Deployment successful. Live at: ${data.url}`])
      }
      if (data.error) {
        setConsoleLogs(prev => [...prev, `[BUILD ERROR] ${data.error}`])
        await handleAutoFix(data.error)
      }
    } catch (err: any) {
        setConsoleLogs(prev => [...prev, `[SANDBOX FAILURE] ${err.message}`])
    } finally {
        setTaskStatus(null)
    }
  }

  const handleAutoFix = async (errorLog: string) => {
    setTaskStatus("Initiating Auto-fix...")
    const fixPrompt = `The last generation failed to build in the sandbox with this error:\n\n${errorLog}\n\nPlease analyze the logs and provide the corrected code.`
    await handleSend(fixPrompt)
  }

  const handleRequestReview = async (prompt: string, code: string) => {
    try {
        const res = await fetch("/api/review", {
            method: "POST",
            body: JSON.stringify({ prompt, code }),
        })
        const data = await res.json()
        setReview(data.review)
    } catch (err) {
        console.error("Review failed:", err)
    }
  }

  const clearHistory = () => {
      setMessages([{ role: "assistant", content: "Workspace cleared. What are we building next?" }])
      setCurrentCode("")
      setSandboxUrl(null)
      setReview(null)
      setConsoleLogs([])
      localStorage.removeItem("v0_messages")
      localStorage.removeItem("v0_last_code")
  }

  if (!isAuth) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-sans antialiased">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-[#111111] border border-[#262626] rounded-[32px] p-10 space-y-8 shadow-2xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 4L4 12L12 20L20 12L12 4Z" fill="black"/></svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">v0 Pro</h1>
            <p className="text-[#a1a1a1] text-sm text-center leading-relaxed">Secure, isolated compute for AI-generated Next.js applications.</p>
          </div>
          <div className="space-y-4">
            <input type="email" placeholder="email@example.com" className="w-full bg-[#0a0a0a] border border-[#262626] rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-white/20 transition-all text-white placeholder-[#404040]" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button onClick={() => { if (email) { setIsAuth(true); localStorage.setItem("v0_auth", "true"); } }} className="w-full bg-white text-black font-bold rounded-2xl py-4 hover:bg-[#e5e5e5] transition-all active:scale-[0.98] shadow-lg">Login to Workspace</button>
          </div>
          <div className="flex items-center justify-center space-x-2 pt-2 opacity-40">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span className="text-[10px] text-white uppercase tracking-[0.2em] font-black">OIDC Authenticated</span>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <main className="flex h-screen w-screen overflow-hidden select-none bg-[#0a0a0a] font-sans antialiased text-[#ededed]">
      {/* --- Sidebar Chat --- */}
      <div className="w-[450px] h-full border-r border-[#262626] flex flex-col bg-[#0a0a0a]">
        <header className="h-14 border-b border-[#262626] flex items-center px-5 justify-between bg-[#0a0a0a]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4L4 12L12 20L20 12L12 4Z" fill="black"/></svg>
            </div>
            <span className="font-bold text-[14px] tracking-tight">v0</span>
          </div>
          <div className="flex items-center space-x-3.5 text-[#737373]">
            <History className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
            <RefreshCcw className="w-4 h-4 cursor-pointer hover:text-white transition-colors" onClick={clearHistory} />
            <Share2 className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-auto p-6 space-y-8 scroll-hide">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex flex-col space-y-3", msg.role === "user" ? "items-start max-w-[90%]" : "max-w-full")}>
              <div className="flex items-center space-x-2">
                {msg.role === "assistant" ? (
                   <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center text-[10px] text-black font-bold">V</div>
                ) : (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg"><User className="w-3 h-3 text-white" /></div>
                )}
                <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">{msg.role === "assistant" ? "v0-ai" : "Developer"}</span>
              </div>

              <div className={cn(
                "px-4 py-3.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap",
                msg.role === "user" ? "bg-[#171717] border border-[#262626] text-white rounded-tl-sm" : "text-[#ededed] px-1"
              )}>
                {msg.thinking && (
                    <div className="mb-4 bg-[#111111] border border-white/5 rounded-xl p-3 flex items-start space-x-3">
                        <BrainCircuit className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                        <span className="text-[12px] text-[#737373] italic leading-tight">{msg.thinking}</span>
                    </div>
                )}
                {msg.content || (isGenerating && i === messages.length - 1 && <div className="flex space-x-1 py-1"><div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]" /></div>)}
              </div>
            </div>
          ))}

          {/* AI Critical Review Layer */}
          {review && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111111] border border-indigo-500/20 rounded-[24px] p-5 space-y-3 shadow-xl">
                <div className="flex items-center space-x-2 text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Architectural Critique</span>
                </div>
                <p className="text-[12px] text-[#a1a1a1] leading-relaxed italic border-l-2 border-indigo-500/30 pl-3">{review}</p>
              </motion.div>
          )}

          {taskStatus && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-3 px-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span className="text-[11px] text-[#737373] font-bold uppercase tracking-widest">{taskStatus}</span>
            </motion.div>
          )}
        </div>

        {/* Dynamic Input Component */}
        <div className="p-4 bg-[#0a0a0a] border-t border-[#262626]">
          <div className="relative bg-[#111111] border border-[#262626] rounded-[28px] p-4 shadow-2xl focus-within:border-white/10 transition-all duration-300">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Message v0..."
              className="w-full bg-transparent border-none focus:outline-none text-[13px] resize-none h-24 text-[#ededed] placeholder-[#404040]"
            />
            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center space-x-2.5">
                  <button className="p-2 hover:bg-[#1a1a1a] rounded-xl transition-colors text-[#737373] hover:text-white"><Plus className="w-5 h-5" /></button>
                  <div className="h-6 w-[1px] bg-[#262626]" />
                  <ModelSelectorDropdown selectedModel={model} onSelect={setModel} />
              </div>
              <div className="flex items-center space-x-2.5">
                <button className="p-2 hover:bg-[#1a1a1a] rounded-xl transition-colors text-[#737373] hover:text-white"><Camera className="w-5 h-5" /></button>
                <button onClick={() => handleSend()} className={cn("p-3 rounded-2xl transition-all active:scale-[0.95] shadow-lg", input.trim() ? "bg-white text-black" : "bg-[#262626] text-[#404040] cursor-not-allowed")}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 px-3">
                <div className="flex items-center space-x-2 text-[10px] text-[#404040] font-black tracking-widest uppercase"><Zap className="w-3.5 h-3.5" /><span>Secure Sandbox Compute</span></div>
                <div className="flex items-center space-x-1 text-[10px] text-[#404040] font-medium">
                    <MessageSquare className="w-3 h-3" />
                    <span>Shift + Enter</span>
                </div>
          </div>
        </div>
      </div>

      {/* --- Preview Workspace --- */}
      <div className="flex-1 h-full bg-[#111111] flex flex-col overflow-hidden">
        <header className="h-14 border-b border-[#262626] flex items-center px-5 justify-between bg-[#0a0a0a]">
          <div className="flex items-center space-x-5">
            <div className="flex bg-[#111111] rounded-xl p-1 border border-[#262626]">
              {["preview", "code", "console"].map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} className={cn("px-4 py-1.5 text-[11px] font-bold rounded-lg capitalize transition-all", activeTab === t ? "bg-[#262626] text-white shadow-sm" : "text-[#737373] hover:text-[#a1a1a1]")}>{t}</button>
              ))}
            </div>
            <div className="h-5 w-[1px] bg-[#262626]" />
            <div className="flex items-center text-[11px] text-[#737373] space-x-2.5">
              <span className="hover:text-white cursor-pointer transition-colors font-bold tracking-tight">V0_DEPLOYMENT</span>
              <span className="opacity-30">/</span>
              <span className="text-white font-medium">src/app/page.tsx</span>
            </div>
          </div>
          <div className="flex items-center space-x-3.5">
            <button className="flex items-center space-x-2 bg-[#171717] border border-[#262626] text-[#a1a1a1] px-4 py-2 rounded-xl text-[11px] font-bold hover:border-[#404040] transition-all"><Download className="w-4 h-4" /><span>Export</span></button>
            <button className="flex items-center space-x-2 bg-white text-black px-5 py-2 rounded-xl text-[11px] font-black hover:bg-[#e5e5e5] active:scale-95 transition-all shadow-xl"><span>Deploy to Vercel</span><ArrowRight className="w-4 h-4" /></button>
          </div>
        </header>

        <div className="flex-1 relative flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "preview" && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 bg-[#0a0a0a] overflow-hidden flex items-center justify-center p-14">
                {sandboxUrl ? (
                   <div className={cn("bg-white rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] border border-white/5", view === "desktop" ? "w-full h-full" : "w-[375px] h-[667px]")}>
                    <iframe src={sandboxUrl} className="w-full h-full border-none" />
                  </div>
                ) : (
                    <div className="flex flex-col items-center space-y-6 text-[#1a1a1a]">
                        <Monitor className="w-20 h-20" />
                        <p className="text-[11px] font-black uppercase tracking-[0.4em]">Isolated Compute Ready</p>
                    </div>
                )}
              </motion.div>
            )}

            {activeTab === "code" && (
              <motion.div key="code" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="flex-1 bg-[#0a0a0a] p-8 overflow-hidden">
                <div className="h-full bg-[#111111] border border-[#262626] rounded-3xl overflow-auto p-8 font-mono text-[13px] leading-relaxed text-[#ededed] scroll-hide shadow-inner">
                  <pre className="whitespace-pre-wrap">{currentCode || "// Workspace empty."}</pre>
                </div>
              </motion.div>
            )}

            {activeTab === "console" && (
              <motion.div key="console" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 bg-[#0a0a0a] p-8">
                <div className="h-full bg-[#111111] border border-[#262626] rounded-3xl p-8 font-mono text-[12px] overflow-auto space-y-2.5">
                   <div className="flex items-center space-x-3 text-[#737373] mb-5 uppercase tracking-[0.2em] font-black"><Terminal className="w-4 h-4" /><span>Compute Runtime Logs</span></div>
                    {consoleLogs.map((log, i) => (
                        <div key={i} className={cn("py-1 border-b border-white/5 last:border-none", log.includes("[ERROR]") || log.includes("[BUILD ERROR]") || log.includes("[BUILD FAILURE]") ? "text-red-400 font-bold" : log.includes("[v0]") ? "text-indigo-400" : "text-[#404040]")}>{log}</div>
                    ))}
                    {consoleLogs.length === 0 && <span className="text-[#262626] font-black uppercase">System idle.</span>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center space-x-2.5 bg-[#111111]/90 backdrop-blur-2xl border border-white/10 p-2 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20">
            <button onClick={() => setView("desktop")} className={cn("flex items-center space-x-2.5 px-5 py-2.5 rounded-full text-[12px] font-bold transition-all", view === "desktop" ? "bg-white text-black" : "text-[#737373] hover:text-white")}><Monitor className="w-4 h-4" /><span>Desktop</span></button>
            <button onClick={() => setView("mobile")} className={cn("flex items-center space-x-2.5 px-5 py-2.5 rounded-full text-[12px] font-bold transition-all", view === "mobile" ? "bg-white text-black" : "text-[#737373] hover:text-white")}><Smartphone className="w-4 h-4" /><span>Mobile</span></button>
            <div className="h-5 w-[1px] bg-[#262626] mx-1.5" />
            <button onClick={() => setActiveTab(activeTab === "code" ? "preview" : "code")} className={cn("p-3 rounded-full transition-all", activeTab === "code" ? "text-white bg-[#262626] shadow-inner" : "text-[#737373] hover:text-white")}><Code2 className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </main>
  )
}
