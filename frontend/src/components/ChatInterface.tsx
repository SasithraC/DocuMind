import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Quote, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ConfirmDialog } from './ConfirmDialog';
import { useChatStore } from '../store/useChatStore';
import { useDocumentStore } from '../store/useDocumentStore';

interface ChatInterfaceProps {
  hasReadyDocs: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ hasReadyDocs }) => {
  const { messages, loading, sendMessage, clearMessages } = useChatStore()
  const { selectedDocIds } = useDocumentStore()
  const [input, setInput] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    await sendMessage(text, selectedDocIds)
  }

  const handleSuggestion = (q: string) => {
    if (!loading) sendMessage(q, selectedDocIds)
  }

  const suggestions = [
    'Summarize this document',
    'What are the key findings?',
    'What is the timeline of events?',
    'Find important contact details',
  ]

  return (
    <div className="chat-container glass-panel">
      <ConfirmDialog
        open={showConfirm}
        title="Clear Conversation"
        description="Are you sure you want to clear this conversation? This cannot be undone."
        onConfirm={() => { setShowConfirm(false); clearMessages() }}
        onCancel={() => setShowConfirm(false)}
      />

      <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Sparkles size={18} className="sparkle-icon" />
          <h2>Query Documents</h2>
        </div>
        <button
          className="reset-btn"
          onClick={() => setShowConfirm(true)}
          disabled={messages.length <= 1 || loading}
          title="Clear Conversation"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-wrapper ${msg.role}`}>
            <div className={`message-bubble ${msg.isError ? 'error-bubble' : ''}`}>
              <div className="message-content">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              {msg.citations && msg.citations.length > 0 && (
                <div className="citations-container">
                  <span className="citation-label">Sources:</span>
                  <div className="citation-badges">
                    {msg.citations.map(page => (
                      <span key={page} className="citation-badge">
                        <Quote size={10} /> Page {page}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message-wrapper assistant">
            <div className="message-bubble loading-bubble">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}

        {hasReadyDocs && messages.length === 1 && !loading && (
          <div className="suggested-questions-container">
            <h4 className="suggested-title">Suggested Questions</h4>
            <div className="suggested-grid">
              {suggestions.map((q, i) => (
                <button key={i} className="suggested-card" onClick={() => handleSuggestion(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-area">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={hasReadyDocs ? 'Ask a question about your documents...' : 'Upload and index documents to start chat'}
          disabled={!hasReadyDocs || loading}
          className="chat-input"
        />
        <button
          type="submit"
          disabled={!hasReadyDocs || !input.trim() || loading}
          className="chat-send-btn"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
