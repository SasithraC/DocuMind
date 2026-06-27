import { create } from 'zustand'
import { api } from '../services/api'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  citations?: number[]
  isError?: boolean
}

const WELCOME: Message = {
  role: 'assistant',
  content: "Hello! Ask me any question, and I'll find the answers in your uploaded documents and cite the exact pages.",
}

interface ChatStore {
  messages: Message[]
  loading: boolean
  sendMessage: (query: string, docIds?: string[]) => Promise<void>
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [WELCOME],
  loading: false,

  sendMessage: async (query: string, docIds?: string[]) => {
    set(state => ({
      messages: [...state.messages, { role: 'user', content: query }],
      loading: true,
    }))

    try {
      const data = await api.chat.ask(query, docIds)
      set(state => ({
        messages: [...state.messages, {
          role: 'assistant',
          content: data.answer,
          citations: data.citations,
        }],
        loading: false,
      }))
    } catch (err: any) {
      set(state => ({
        messages: [...state.messages, {
          role: 'assistant',
          content: err.message || 'An unexpected error occurred.',
          isError: true,
        }],
        loading: false,
      }))
    }
  },

  clearMessages: () => set({ messages: [WELCOME] }),
}))
