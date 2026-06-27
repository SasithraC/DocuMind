export const API_ENDPOINTS = {
  // Documents
  getDocuments:       `api/documents/`,
  uploadDocuments:    `api/documents/upload`,
  deleteDocument:     (id: string) => `api/documents/${id}`,

  // Chat
  askQuestion:        `api/chat/`,
}
