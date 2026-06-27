import React from 'react';
import { FileText, Loader2, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { useDocumentStore, type DocumentInfo } from '../store/useDocumentStore';

interface DocumentListProps {
  documents: DocumentInfo[];
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents }) => {
  const { selectedDocIds, deleteDocument, toggleDocument, selectAll, deselectAll } = useDocumentStore()

  const getStatusBadge = (status: DocumentInfo['status']) => {
    switch (status) {
      case 'queued':
        return <span className="status-badge queued"><Loader2 size={12} className="spin-icon" /> Queued</span>
      case 'processing':
        return <span className="status-badge processing"><Loader2 size={12} className="spin-icon" /> Processing</span>
      case 'ready':
        return <span className="status-badge ready"><CheckCircle size={12} /> Ready</span>
      case 'failed':
        return <span className="status-badge failed"><AlertTriangle size={12} /> Failed</span>
    }
  }

  if (documents.length === 0) {
    return (
      <div className="doc-list-empty glass-panel">
        <p>No documents uploaded yet. Upload a PDF to start asking questions.</p>
      </div>
    )
  }

  const readyDocs = documents.filter(d => d.status === 'ready')
  const allSelected = readyDocs.length > 0 && readyDocs.every(d => selectedDocIds.includes(d.id))

  return (
    <div className="doc-list glass-panel">
      <h2>Your Documents</h2>

      {readyDocs.length > 0 && (
        <div className="select-all-container">
          <span className="selected-count">
            {selectedDocIds.length} of {readyDocs.length} selected
          </span>
          <button className="select-all-btn" onClick={allSelected ? deselectAll : selectAll}>
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      )}

      <div className="doc-grid">
        {documents.map(doc => (
          <div key={doc.id} className={`doc-card ${doc.status} ${selectedDocIds.includes(doc.id) ? 'selected' : ''}`}>
            <div className="doc-card-header">
              {doc.status === 'ready' && (
                <input
                  type="checkbox"
                  checked={selectedDocIds.includes(doc.id)}
                  onChange={() => toggleDocument(doc.id)}
                  className="doc-checkbox"
                />
              )}
              <FileText size={20} className="doc-icon" />
              <div className="doc-meta">
                <span className="doc-title" title={doc.filename}>{doc.filename}</span>
                {getStatusBadge(doc.status)}
              </div>
            </div>
            {doc.error_message && (
              <div className="doc-error-desc">Error: {doc.error_message}</div>
            )}
            <button
              className="delete-btn"
              onClick={() => deleteDocument(doc.id)}
              title="Delete Document"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
