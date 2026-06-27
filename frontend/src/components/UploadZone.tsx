import React, { useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { useDocumentStore } from '../store/useDocumentStore';

export const UploadZone: React.FC = () => {
  const { uploadDocuments, fetchDocuments } = useDocumentStore()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const upload = async (files: FileList) => {
    const pdfs = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
    if (pdfs.length === 0) {
      setError('Please select one or more PDF files.')
      return
    }
    setUploading(true)
    setError(null)
    try {
      await uploadDocuments(pdfs)
      await fetchDocuments()
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during upload.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) upload(e.dataTransfer.files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) upload(e.target.files)
  }

  return (
    <div className="upload-container">
      <div
        className={`upload-zone glass-panel ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="pdf-file-input"
          multiple
          accept=".pdf"
          onChange={handleFileInput}
          disabled={uploading}
          style={{ display: 'none' }}
        />
        <label htmlFor="pdf-file-input" className="upload-label">
          {uploading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <p>Uploading files...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon-container">
                <Upload size={32} />
              </div>
              <h3>Drag & Drop PDFs here</h3>
              <p>or click to browse from your computer</p>
            </>
          )}
        </label>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
