import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export type FileItem = {
  path: string
  content: string
}

export type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
  thinking?: string
}

export type ChatSession = {
  id: string
  title: string
  messages: Message[]
  files: FileItem[]
  model: string
  createdAt: number
}

interface BrainyState {
  sessions: ChatSession[]
  activeSessionId: string | null
  isAuth: boolean

  // Actions
  setAuth: (status: boolean) => void
  createSession: (firstPrompt: string, model: string) => string
  updateSession: (id: string, updates: Partial<ChatSession>) => void
  setActiveSession: (id: string | null) => void
  addMessage: (sessionId: string, message: Message) => void
  updateFiles: (sessionId: string, files: FileItem[]) => void
  clearAll: () => void
}

export const useBrainyStore = create<BrainyState>()(
  persist(
    (set) => ({
      sessions: [],
      activeSessionId: null,
      isAuth: false,

      setAuth: (status) => set({ isAuth: status }),

      createSession: (firstPrompt, model) => {
        const id = uuidv4()
        const newSession: ChatSession = {
          id,
          title: firstPrompt.slice(0, 40) + (firstPrompt.length > 40 ? '...' : ''),
          messages: [],
          files: [],
          model,
          createdAt: Date.now(),
        }
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: id,
        }))
        return id
      },

      updateSession: (id, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),

      setActiveSession: (id) => set({ activeSessionId: id }),

      addMessage: (sessionId, message) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s
          ),
        })),

      updateFiles: (sessionId, files) =>
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, files } : s)),
        })),

      clearAll: () => set({ sessions: [], activeSessionId: null }),
    }),
    {
      name: 'brainy-storage',
    }
  )
)
