import { API_ENDPOINTS } from './endpoints'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const get = (path: string) =>
  fetch(`${BASE}/${path}`).then(r => r.json())

const post = (path: string, body: unknown) =>
  fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async r => {
    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      throw new Error(err.detail || 'Request failed')
    }
    return r.json()
  })

const del = (path: string) =>
  fetch(`${BASE}/${path}`, { method: 'DELETE' })

export const api = {
  documents: {
    getAll: () =>
      get(API_ENDPOINTS.getDocuments),

    upload: (files: File[]) => {
      const form = new FormData()
      files.forEach(f => form.append('files', f))
      return fetch(`${BASE}/${API_ENDPOINTS.uploadDocuments}`, { method: 'POST', body: form }).then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}))
          throw new Error(err.detail || 'Upload failed')
        }
        return r.json()
      })
    },

    delete: (id: string) =>
      del(API_ENDPOINTS.deleteDocument(id)),
  },

  chat: {
    ask: (query: string, docIds?: string[]) =>
      post(API_ENDPOINTS.askQuestion, {
        query,
        doc_ids: docIds && docIds.length > 0 ? docIds : undefined,
      }),
  },
}
