import { create } from 'zustand'
import { api } from '../services/api'

export interface DocumentInfo {
  id: string
  filename: string
  status: 'queued' | 'processing' | 'ready' | 'failed'
  error_message?: string
  created_at: string
}

interface DocumentStore {
  documents: DocumentInfo[]
  selectedDocIds: string[]
  loading: boolean
  fetchDocuments: () => Promise<void>
  uploadDocuments: (files: File[]) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  toggleDocument: (id: string) => void
  selectAll: () => void
  deselectAll: () => void
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  selectedDocIds: [],
  loading: true,

  fetchDocuments: async () => {
    const data = await api.documents.getAll()
    const readyIds = data.filter((d: DocumentInfo) => d.status === 'ready').map((d: DocumentInfo) => d.id)
    set(state => {
      const knownIds = state.documents.map(d => d.id)
      const brandNewReadyIds = readyIds.filter((id: string) => !knownIds.includes(id))
      return {
        documents: data,
        loading: false,
        selectedDocIds: [
          ...state.selectedDocIds.filter((id: string) => readyIds.includes(id)), // keep existing, remove deleted
          ...brandNewReadyIds, // auto-select only newly uploaded docs
        ],
      }
    })
  },

  uploadDocuments: async (files: File[]) => {
    await api.documents.upload(files)
  },

  deleteDocument: async (id: string) => {
    await api.documents.delete(id)
    set(state => ({
      documents: state.documents.filter(d => d.id !== id),
      selectedDocIds: state.selectedDocIds.filter(sid => sid !== id),
    }))
  },

  toggleDocument: (id: string) => {
    set(state => ({
      selectedDocIds: state.selectedDocIds.includes(id)
        ? state.selectedDocIds.filter(sid => sid !== id)
        : [...state.selectedDocIds, id],
    }))
  },

  selectAll: () => {
    const readyIds = get().documents.filter(d => d.status === 'ready').map(d => d.id)
    set({ selectedDocIds: readyIds })
  },

  deselectAll: () => set({ selectedDocIds: [] }),
}))
