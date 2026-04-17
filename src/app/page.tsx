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
  User
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// --- Types ---

type Message = {
  role: "user" | "assistant" | "system"
  content: string
  thinking?: string
  task?: string
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
  const sizes = [6, 10, 14]
  const size = sizes[power - 1] || 10
  return (
    <div className={cn(
      "rounded-full border flex items-center justify-center transition-all",
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
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "I'm ready to help you build your next interface. What are we building today?" }
  ])
  const [input, setInput] = useState("")
  const [model, setModel] = useState(FREE_MODELS[0].id)
  const [isGenerating, setIsGenerating] = useState(false)
  const [task, setTask] = useState<string | null>(null)
  const [currentCode, setCurrentCode] = useState("")
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null)
  const [sandboxId, setSandboxId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("preview")
  const [view, setView] = useState("desktop")
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  const [review, setReview] = useState<string | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedCode = localStorage.getItem("v0_last_code")
    if (savedCode) setCurrentCode(savedCode)
    const savedAuth = localStorage.getItem("v0_auth")
    if (savedAuth) setIsAuth(true)
  }, [])

  useEffect(() => {
    if (currentCode) localStorage.setItem("v0_last_code", currentCode)
  }, [currentCode])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const handleSend = async (customPrompt?: string) => {
    const promptValue = customPrompt || input
    if (!promptValue.trim() || isGenerating) return

    const userMsg: Message = { role: "user", content: promptValue }
    setMessages(prev => [...prev, userMsg])
    if (!customPrompt) setInput("")
    setIsGenerating(true)
    setTask("Thinking...")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [...messages, userMsg], model }),
      })

      if (!response.body) throw new Error("No response body")
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""

      setMessages(prev => [...prev, { role: "assistant", content: "" }])

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        assistantContent += chunk

        setMessages(prev => {
          const last = prev[prev.length - 1]
          return [...prev.slice(0, -1), { ...last, content: assistantContent }]
        })
      }

      const codeMatch = assistantContent.match(/```(?:tsx|jsx|javascript|typescript|react)?\n([\s\S]*?)```/)
      if (codeMatch && codeMatch[1]) {
        const code = codeMatch[1].trim()
        setCurrentCode(code)
        await handleUpdateSandbox(code)
        handleRequestReview(promptValue, code)
      }

    } catch (err: any) {
        setConsoleLogs(prev => [...prev, `[ERROR] ${err.message}`])
    } finally {
      setIsGenerating(false)
      setTask(null)
    }
  }

  const handleUpdateSandbox = async (code: string) => {
    setTask("Building in Sandbox...")
    setConsoleLogs(prev => [...prev, "[v0] Synchronizing code with Vercel Sandbox..."])
    try {
      const res = await fetch("/api/sandbox", {
        method: "POST",
        body: JSON.stringify({ code, sandboxId }),
      })
      const data = await res.json()
      if (data.url) {
        setSandboxUrl(data.url)
        setSandboxId(data.sandboxId)
        setConsoleLogs(prev => [...prev, `[v0] Sandbox active: ${data.url}`])
      }
      if (data.error) {
        setConsoleLogs(prev => [...prev, `[BUILD ERROR] ${data.error}`])
        handleAutoFix(data.error)
      }
    } catch (err: any) {
        setConsoleLogs(prev => [...prev, `[ERROR] ${err.message}`])
    } finally {
      setTask(null)
    }
  }

  const handleAutoFix = async (errorLog: string) => {
    setTask("Auto-fixing build error...")
    const fixPrompt = `The previous build failed with the following error:\n\n${errorLog}\n\nPlease analyze and fix the code.`
    handleSend(fixPrompt)
  }

  const handleRequestReview = async (prompt: string, code: string) => {
    setIsReviewing(true)
    try {
        const res = await fetch("/api/review", {
            method: "POST",
            body: JSON.stringify({ prompt, code }),
        })
        const data = await res.json()
        setReview(data.review)
    } catch (err) {
        console.error(err)
    } finally {
        setIsReviewing(false)
    }
  }

  if (!isAuth) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-[#111111] border border-[#262626] rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 4L4 12L12 20L20 12L12 4Z" fill="black"/></svg>
            </div>
            <h1 className="text-2xl font-bold">Welcome to v0</h1>
            <p className="text-[#a1a1a1] text-sm text-center">Enter your email to start building.</p>
          </div>
          <div className="space-y-4">
            <input type="email" placeholder="name@example.com" className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#404040] transition-colors text-white" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button onClick={() => { if (email) { setIsAuth(true); localStorage.setItem("v0_auth", "true"); } }} className="w-full bg-white text-black font-semibold rounded-xl py-3 hover:bg-[#e5e5e5] transition-all active:scale-95">Continue</button>
          </div>
          <p className="text-[10px] text-[#404040] text-center uppercase tracking-widest font-bold">Secure ephemeral compute powered by Vercel</p>
        </motion.div>
      </div>
    )
  }

  return (
    <main className="flex h-screen w-screen overflow-hidden select-none bg-[#0a0a0a]">
      {/* --- Chat Side --- */}
      <div className="w-[450px] h-full border-r border-[#262626] flex flex-col bg-[#0a0a0a]">
        <header className="h-14 border-b border-[#262626] flex items-center px-4 justify-between bg-[#0a0a0a]">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4L4 12L12 20L20 12L12 4Z" fill="black"/></svg>
            </div>
            <span className="font-bold text-[13px] text-white">v0</span>
          </div>
          <div className="flex items-center space-x-3 text-[#a1a1a1]">
            <History className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
            <RefreshCcw className="w-4 h-4 cursor-pointer hover:text-white transition-colors" onClick={() => window.location.reload()} />
            <Share2 className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-auto p-5 space-y-6 scroll-hide">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex flex-col space-y-2", msg.role === "user" ? "items-start max-w-[90%]" : "max-w-full")}>
              <div className="flex items-center space-x-2">
                {msg.role === "assistant" ? (
                   <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center text-[10px] text-black font-bold">V</div>
                ) : (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center"><User className="w-3 h-3 text-white" /></div>
                )}
                <span className="text-xs font-semibold text-[#a1a1a1]">{msg.role === "assistant" ? "v0" : "You"}</span>
              </div>
              <div className={cn(
                "px-4 py-3 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap",
                msg.role === "user" ? "bg-[#262626] border border-[#404040] text-white rounded-tl-sm" : "text-[#ededed] px-1"
              )}>
                {msg.content}
                {isGenerating && i === messages.length - 1 && <span className="inline-block ml-1 w-1 h-4 bg-white animate-pulse" />}
              </div>
            </div>
          ))}

          {/* Reviewer Block */}
          {review && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111111] border border-indigo-500/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-400">
                    <ClipboardCheck className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">AI Code Review</span>
                </div>
                <p className="text-[12px] text-[#a1a1a1] leading-relaxed italic">{review}</p>
              </motion.div>
          )}
          {isReviewing && <div className="flex items-center space-x-2 text-[#404040] text-[11px] px-1"><Loader2 className="w-3 h-3 animate-spin" /><span>Generating review...</span></div>}

          {task && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-2 px-1">
                <div className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-[11px] text-[#737373] font-medium ml-1">{task}</span>
            </motion.div>
          )}
        </div>

        <div className="p-4 bg-[#0a0a0a] border-t border-[#262626]">
          <div className="relative bg-[#111111] border border-[#262626] rounded-3xl p-4 shadow-2xl focus-within:border-[#404040] transition-all duration-200">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask v0 to build something..."
              className="w-full bg-transparent border-none focus:outline-none text-[13px] resize-none h-20 text-[#ededed] placeholder-[#525252]"
            />
            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center space-x-3">
                  <button className="p-1.5 hover:bg-[#1a1a1a] rounded-xl transition-colors text-[#737373] hover:text-white"><Plus className="w-5 h-5" /></button>
                  <div className="h-6 w-[1px] bg-[#262626]" />
                  <ModelSelectorDropdown selectedModel={model} onSelect={setModel} />
              </div>
              <div className="flex items-center space-x-3">
                <button className="p-1.5 hover:bg-[#1a1a1a] rounded-xl transition-colors text-[#737373] hover:text-white"><Camera className="w-5 h-5" /></button>
                <button onClick={() => handleSend()} className={cn("p-2.5 rounded-2xl transition-all active:scale-95 shadow-lg", input.trim() ? "bg-white text-black" : "bg-[#262626] text-[#737373] cursor-not-allowed")}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-4 mt-4">
                <div className="flex items-center space-x-1 text-[10px] text-[#404040]"><Zap className="w-3 h-3" /><span>Vercel Sandbox v0.4</span></div>
                <div className="w-1 h-1 bg-[#262626] rounded-full" />
                <p className="text-[10px] text-[#404040]">Shift + Enter to send</p>
          </div>
        </div>
      </div>

      {/* --- Preview Side --- */}
      <div className="flex-1 h-full bg-[#111111] flex flex-col overflow-hidden">
        <header className="h-14 border-b border-[#262626] flex items-center px-4 justify-between bg-[#0a0a0a]">
          <div className="flex items-center space-x-4">
            <div className="flex bg-[#171717] rounded-lg p-0.5 border border-[#262626]">
              {["preview", "code", "console"].map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} className={cn("px-3 py-1 text-[11px] font-medium rounded-md capitalize transition-all", activeTab === t ? "bg-[#262626] text-white shadow-sm" : "text-[#737373] hover:text-[#a1a1a1]")}>{t}</button>
              ))}
            </div>
            <div className="h-4 w-[1px] bg-[#262626]" />
            <div className="flex items-center text-[11px] text-[#737373] space-x-2">
              <span className="hover:text-white cursor-pointer transition-colors truncate max-w-[150px]">project-v0</span>
              <span>/</span>
              <span className="text-white font-medium">page.tsx</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-1.5 bg-[#171717] border border-[#262626] text-[#a1a1a1] px-3 py-1.5 rounded-lg text-[11px] hover:border-[#404040] transition-colors"><Download className="w-3.5 h-3.5" /><span>Download</span></button>
            <button className="flex items-center space-x-1.5 bg-white text-black px-4 py-1.5 rounded-lg text-[11px] font-semibold hover:bg-[#e5e5e5] active:scale-95 transition-all"><span>Deploy</span><ArrowRight className="w-3.5 h-3.5" /></button>
          </div>
        </header>

        <div className="flex-1 relative flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "preview" && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 bg-[#0a0a0a] overflow-hidden flex items-center justify-center p-8">
                {sandboxUrl ? (
                   <div className={cn("bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ease-in-out border border-[#262626]", view === "desktop" ? "w-full h-full" : "w-[375px] h-[667px]")}>
                    <iframe src={sandboxUrl} className="w-full h-full border-none" />
                  </div>
                ) : (
                    <div className="flex flex-col items-center space-y-4 text-[#404040]">
                        <Monitor className="w-12 h-12 opacity-20" />
                        <p className="text-sm font-medium">Ready for deployment</p>
                    </div>
                )}
              </motion.div>
            )}

            {activeTab === "code" && (
              <motion.div key="code" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex-1 bg-[#0a0a0a] p-6 overflow-hidden">
                <div className="h-full bg-[#111111] border border-[#262626] rounded-2xl overflow-auto p-6 font-mono text-[13px] leading-relaxed text-[#ededed] scroll-hide">
                  <pre className="whitespace-pre-wrap">{currentCode || "// No code generated yet."}</pre>
                </div>
              </motion.div>
            )}

            {activeTab === "console" && (
              <motion.div key="console" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 bg-[#0a0a0a] p-6">
                <div className="h-full bg-[#111111] border border-[#262626] rounded-2xl p-6 font-mono text-[13px] overflow-auto space-y-2">
                   <div className="flex items-center space-x-2 text-[#737373] mb-4"><Terminal className="w-4 h-4" /><span>Sandbox Runtime Logs</span></div>
                    {consoleLogs.map((log, i) => (
                        <div key={i} className={cn("py-0.5", log.includes("[ERROR]") || log.includes("[BUILD ERROR]") ? "text-red-400" : log.includes("[v0]") ? "text-emerald-500" : "text-[#737373]")}>{log}</div>
                    ))}
                    {consoleLogs.length === 0 && <span className="text-[#404040]">No activity recorded.</span>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-[#171717]/80 backdrop-blur-xl border border-[#404040] p-1.5 rounded-full shadow-2xl z-10">
            <button onClick={() => setView("desktop")} className={cn("flex items-center space-x-2 px-4 py-2 rounded-full text-[12px] font-semibold transition-all", view === "desktop" ? "bg-white text-black" : "text-[#737373] hover:text-white")}><Monitor className="w-3.5 h-3.5" /><span>Desktop</span></button>
            <button onClick={() => setView("mobile")} className={cn("flex items-center space-x-2 px-4 py-2 rounded-full text-[12px] font-semibold transition-all", view === "mobile" ? "bg-white text-black" : "text-[#737373] hover:text-white")}><Smartphone className="w-3.5 h-3.5" /><span>Mobile</span></button>
            <div className="h-4 w-[1px] bg-[#262626] mx-1" />
            <button onClick={() => setActiveTab(activeTab === "code" ? "preview" : "code")} className={cn("p-2 rounded-full transition-colors", activeTab === "code" ? "text-white bg-[#262626]" : "text-[#737373] hover:text-white")}><Code2 className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </main>
  )
}
