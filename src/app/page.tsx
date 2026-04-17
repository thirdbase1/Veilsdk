"use client"

import React, { useState } from "react"
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
  Copy,
  Terminal
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// --- Constants & Data ---

const FREE_MODELS = [
  { id: "google/gemini-2.0-flash-001:free", name: "Gemini 2.0 Flash" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B" },
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B" },
  { id: "google/gemma-2-9b-it:free", name: "Gemma 2 9B" },
  { id: "openrouter/free", name: "Auto (Free Router)" },
]

const DASHBOARD_CODE = `import React from 'react';
import { Card } from '@/components/ui/card';

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8 bg-[#0a0a0a] min-h-screen text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">AI Analytics</h1>
        <div className="w-10 h-10 bg-white/10 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-indigo-500/10 border-indigo-500/20">
          <p className="text-xs font-medium text-indigo-400">Total Inference</p>
          <p className="text-3xl font-bold mt-2">1.2M</p>
        </Card>
        <Card className="p-6 bg-white/5 border-white/10">
          <p className="text-xs font-medium text-gray-400">Active Agents</p>
          <p className="text-3xl font-bold mt-2">842</p>
        </Card>
        <Card className="p-6 bg-white/5 border-white/10">
          <p className="text-xs font-medium text-gray-400">Avg. Latency</p>
          <p className="text-3xl font-bold mt-2">124ms</p>
        </Card>
      </div>

      <div className="h-64 bg-white/5 border border-white/10 rounded-3xl p-8">
        <h2 className="text-sm font-medium text-gray-400 mb-6">Activity Volume</h2>
        <div className="flex items-end h-40 space-x-2">
          {[40, 65, 45, 90, 55, 75, 50].map((h, i) => (
            <div
              key={i}
              style={{ height: \`\${h}%\` }}
              className="flex-1 bg-white/10 rounded-t-lg"
            />
          ))}
        </div>
      </div>
    </div>
  );
}`

// --- Components ---

const ModelSelector = ({ selectedModel, onSelect }: { selectedModel: string, onSelect: (id: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  const currentModel = FREE_MODELS.find(m => m.id === selectedModel) || FREE_MODELS[0]

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-[#171717] border border-[#262626] rounded-full px-2.5 py-1 cursor-pointer hover:border-[#404040] transition-colors"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-[11px] font-medium text-[#a1a1a1]">{currentModel.name}</span>
        <ChevronDown className={cn("w-3 h-3 text-[#737373] transition-transform", isOpen && "rotate-180")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute top-full right-0 mt-2 w-56 bg-[#171717] border border-[#262626] rounded-xl shadow-2xl z-20 overflow-hidden"
            >
              {FREE_MODELS.map((model) => (
                <div
                  key={model.id}
                  onClick={() => {
                    onSelect(model.id)
                    setIsOpen(false)
                  }}
                  className="px-4 py-2.5 text-[12px] hover:bg-[#262626] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span className={cn(selectedModel === model.id ? "text-white font-medium" : "text-[#a1a1a1]")}>
                    {model.name}
                  </span>
                  {selectedModel === model.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

const ChatInterface = () => {
  const [model, setModel] = useState(FREE_MODELS[0].id)

  return (
    <div className="w-[450px] h-full border-r border-[#262626] flex flex-col bg-[#0a0a0a]">
      <header className="h-14 border-b border-[#262626] flex items-center px-4 justify-between bg-[#0a0a0a]">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 4L4 12L12 20L20 12L12 4Z" fill="black"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[13px] leading-tight">v0</span>
            <span className="text-[10px] text-[#737373]">v0.dev/chat</span>
          </div>
        </div>
        <ModelSelector selectedModel={model} onSelect={setModel} />
      </header>

      <div className="flex-1 overflow-auto p-5 space-y-6 scroll-hide">
        <div className="flex flex-col items-start space-y-2 max-w-[90%]">
          <div className="bg-[#262626] border border-[#404040] text-white px-4 py-3 rounded-2xl rounded-tl-sm text-[13px] leading-relaxed shadow-sm">
            Design a premium dashboard layout for an AI analytics platform using Tailwind CSS and React. Include a sidebar, navigation, and a main content area with stats cards.
          </div>
          <div className="flex items-center space-x-2 ml-1">
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500" />
            <span className="text-[10px] text-[#737373]">You</span>
          </div>
        </div>

        <div className="flex flex-col space-y-3 max-w-full">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center text-[10px] text-black font-bold">V</div>
            <span className="text-xs font-semibold text-[#a1a1a1]">v0</span>
          </div>
          <div className="text-[#ededed] px-2 py-1 text-[13px] leading-relaxed space-y-4">
            <p>I&apos;ve crafted a sophisticated dashboard layout for your AI analytics platform. It features a dark-themed UI with high-contrast elements and a glassmorphism effect for the sidebar.</p>
            <div className="bg-[#111111] border border-[#262626] rounded-xl p-3">
              <div className="text-[11px] font-medium text-[#737373] mb-2 uppercase tracking-wider">Key Components</div>
              <ul className="space-y-2">
                {["Responsive Navigation Sidebar", "Animated Stats Visualization Cards", "Modern Tab-based Data Views"].map((item) => (
                  <li key={item} className="flex items-center space-x-2 text-[12px]">
                    <span className="w-1 h-1 bg-white rounded-full" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[#a1a1a1]">Check the preview on the right for the full implementation.</p>
          </div>
          <div className="flex items-center space-x-4 ml-2">
            <button className="p-1 text-[#737373] hover:text-white transition-colors"><Copy className="w-4 h-4" /></button>
            <button className="p-1 text-[#737373] hover:text-white transition-colors"><RefreshCcw className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-[#0a0a0a] border-t border-[#262626]">
        <div className="relative bg-[#111111] border border-[#262626] rounded-2xl p-4 shadow-2xl focus-within:border-[#404040] transition-all duration-200">
          <textarea
            placeholder="Ask v0 to refine the design..."
            className="w-full bg-transparent border-none focus:outline-none text-[13px] resize-none h-16 text-[#ededed] placeholder-[#525252]"
          />
          <div className="flex justify-between items-center pt-2">
            <div className="flex space-x-2 text-[#737373]">
              <button className="p-1.5 hover:bg-[#1a1a1a] rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
              <button className="p-1.5 hover:bg-[#1a1a1a] rounded-lg transition-colors"><Camera className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-[#404040] font-medium mr-1">Shift + Enter to send</span>
              <button className="bg-white text-black p-2 rounded-xl hover:bg-[#e5e5e5] transition-all active:scale-95 shadow-lg">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const PreviewInterface = () => {
  const [tab, setTab] = useState("preview")
  const [view, setView] = useState("desktop")

  return (
    <div className="flex-1 h-full bg-[#111111] flex flex-col overflow-hidden">
      <header className="h-14 border-b border-[#262626] flex items-center px-4 justify-between bg-[#0a0a0a]">
        <div className="flex items-center space-x-4">
          <div className="flex bg-[#171717] rounded-lg p-0.5 border border-[#262626]">
            {["preview", "code", "console"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-1 text-[11px] font-medium rounded-md capitalize transition-all",
                  tab === t ? "bg-[#262626] text-white shadow-sm" : "text-[#737373] hover:text-[#a1a1a1]"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="h-4 w-[1px] bg-[#262626]" />
          <div className="flex items-center text-[11px] text-[#737373] space-x-2">
            <span className="hover:text-white cursor-pointer transition-colors">dashboard</span>
            <span>/</span>
            <span className="text-white font-medium">page.tsx</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-1.5 bg-[#171717] border border-[#262626] text-[#a1a1a1] px-3 py-1.5 rounded-lg text-[11px] hover:border-[#404040] transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
          <button className="flex items-center space-x-1.5 bg-white text-black px-4 py-1.5 rounded-lg text-[11px] font-semibold hover:bg-[#e5e5e5] active:scale-95 transition-all">
            <span>Deploy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="flex-1 relative flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {tab === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex-1 bg-[#0a0a0a] overflow-auto flex items-center justify-center p-8 transition-all duration-500",
                view === "mobile" ? "bg-[#050505]" : "bg-[#0a0a0a]"
              )}
            >
              <div className={cn(
                "bg-[#111111] border border-[#262626] rounded-2xl shadow-2xl flex overflow-hidden transition-all duration-500 ease-in-out",
                view === "desktop" ? "w-full max-w-5xl h-[600px]" : "w-[375px] h-[667px]"
              )}>
                {view === "desktop" && (
                  <div className="w-64 border-r border-[#262626] bg-[#0a0a0a] p-5 flex flex-col space-y-8">
                    <div className="flex items-center space-x-3 px-2">
                      <div className="w-8 h-8 rounded-full bg-white/10" />
                      <div className="h-2.5 w-24 bg-[#262626] rounded" />
                    </div>
                    <div className="space-y-4">
                      <div className="h-10 bg-white/5 rounded-xl border border-white/10" />
                      {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-transparent rounded-xl" />)}
                    </div>
                  </div>
                )}

                <div className="flex-1 p-8 space-y-8 overflow-auto">
                  <div className="flex justify-between items-center">
                    <div className="h-7 w-40 bg-[#262626] rounded-lg" />
                    <div className="h-10 w-10 bg-white/10 rounded-full" />
                  </div>
                  <div className={cn("grid gap-5", view === "desktop" ? "grid-cols-3" : "grid-cols-1")}>
                    <div className="h-28 bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/40 transition-colors cursor-pointer">
                      <div className="h-3 w-16 bg-indigo-400/30 rounded mb-3" />
                      <div className="h-8 w-28 bg-white/80 rounded" />
                    </div>
                    {[1, 2].map(i => (
                      <div key={i} className="h-28 bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors cursor-pointer">
                        <div className="h-3 w-16 bg-[#262626] rounded mb-3" />
                        <div className="h-8 w-28 bg-[#a1a1a1] rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="h-64 bg-white/5 border border-white/10 rounded-3xl flex flex-col p-8 space-y-6">
                    <div className="h-4 w-48 bg-[#262626] rounded" />
                    <div className="flex-1 flex items-end space-x-3">
                      {[40, 65, 45, 90, 55, 75, 50].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: i * 0.1, duration: 0.8 }}
                          className={cn(
                            "flex-1 rounded-t-lg transition-colors",
                            h > 80 ? "bg-indigo-500/40 group-hover:bg-indigo-500/60" : "bg-white/10"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "code" && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex-1 bg-[#0a0a0a] p-6 overflow-hidden flex flex-col"
            >
              <div className="flex-1 bg-[#111111] border border-[#262626] rounded-2xl overflow-auto p-6 font-mono text-[13px] leading-relaxed text-[#a1a1a1] scroll-hide">
                <pre className="whitespace-pre-wrap">
                  {DASHBOARD_CODE.split('\n').map((line, i) => (
                    <div key={i} className="flex group hover:bg-[#1a1a1a] px-2 rounded -mx-2">
                      <span className="w-8 text-[#404040] select-none text-right mr-4">{i + 1}</span>
                      <span className="text-[#ededed]">{line}</span>
                    </div>
                  ))}
                </pre>
              </div>
            </motion.div>
          )}

          {tab === "console" && (
            <motion.div
              key="console"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 bg-[#0a0a0a] p-6"
            >
              <div className="flex-1 h-full bg-[#111111] border border-[#262626] rounded-2xl p-6 font-mono text-[13px] space-y-2">
                <div className="flex items-center space-x-2 text-[#737373]">
                  <Terminal className="w-4 h-4" />
                  <span>v0 Console - Listening for events...</span>
                </div>
                <div className="text-emerald-500/80">[v0] Successfully compiled dashboard/page.tsx</div>
                <div className="text-indigo-400">[v0] Hydrated Dashboard Layout in 124ms</div>
                <div className="text-[#737373]">...</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-[#171717]/80 backdrop-blur-xl border border-[#404040] p-1.5 rounded-full shadow-2xl z-10">
          <button
            onClick={() => setView("desktop")}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-full text-[12px] font-semibold transition-all",
              view === "desktop" ? "bg-white text-black" : "text-[#737373] hover:text-white"
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            onClick={() => setView("mobile")}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-full text-[12px] font-semibold transition-all",
              view === "mobile" ? "bg-white text-black" : "text-[#737373] hover:text-white"
            )}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
          <div className="h-4 w-[1px] bg-[#262626] mx-1" />
          <button
            onClick={() => setTab(tab === "code" ? "preview" : "code")}
            className={cn(
              "p-2 rounded-full transition-colors",
              tab === "code" ? "text-white bg-[#262626]" : "text-[#737373] hover:text-white"
            )}
          >
            <Code2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function V0App() {
  return (
    <main className="flex h-screen w-screen overflow-hidden select-none">
      <ChatInterface />
      <PreviewInterface />
    </main>
  )
}
