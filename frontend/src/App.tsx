import { useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { DocumentList } from './components/DocumentList';
import { ChatInterface } from './components/ChatInterface';
import { useDocumentStore } from './store/useDocumentStore';
import { FileText, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import './App.css';

function App() {
  const { documents, loading, fetchDocuments } = useDocumentStore()
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  useEffect(() => {
    fetchDocuments()
    const interval = setInterval(fetchDocuments, 5000)
    return () => clearInterval(interval)
  }, [])

  const hasReadyDocs = documents.some(doc => doc.status === 'ready')

  return (
    <div className="app-container">
      <header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', maxWidth: '1300px', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ width: '40px' }}></div>
          <div className="header-logo" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="logo-icon">
              <FileText size={24} />
            </div>
            <h1>DocuMind <span className="gradient-text">Q&A</span></h1>
          </div>
          <button
            className="theme-toggle-btn"
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <p className="header-subtitle">
          Upload PDF documents and get answers with grounded, page-level citations.
        </p>
      </header>

      <main className="app-content">
        <div className="sidebar-section">
          <div className="card-section">
            <UploadZone />
          </div>
          <div className="card-section">
            {loading ? (
              <div className="loading-container glass-panel">
                <div className="spinner"></div>
                <p>Loading documents...</p>
              </div>
            ) : (
              <DocumentList documents={documents} />
            )}
          </div>
        </div>

        <div className="chat-section">
          <ChatInterface hasReadyDocs={hasReadyDocs} />
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2026 DocuMind.</p>
      </footer>
    </div>
  )
}

export default App
