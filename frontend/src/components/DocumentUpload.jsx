import { useState, useRef, useCallback } from 'react';
import './DocumentUpload.css';
import { uploadDocument } from '../services/api';

export default function DocumentUpload({ onUploadComplete }) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleUpload = useCallback(async (file) => {
        setError('');
        setUploading(true);
        setProgress(0);
        setStatus(`Processing "${file.name}"...`);

        try {
            const result = await uploadDocument(file, (pct) => setProgress(pct));
            setStatus(`✓ "${file.name}" processed — ${result.document.num_chunks} chunks created`);
            setProgress(100);
            if (onUploadComplete) onUploadComplete(result.document);
            setTimeout(() => {
                setUploading(false);
                setStatus('');
                setProgress(0);
            }, 3000);
        } catch (err) {
            setError(err.message);
            setUploading(false);
            setProgress(0);
            setStatus('');
        }
    }, [onUploadComplete]);

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
    }, [handleUpload]);

    const onFileSelect = useCallback((e) => {
        const file = e.target.files[0];
        if (file) handleUpload(file);
        e.target.value = '';
    }, [handleUpload]);

    return (
        <div
            className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={onFileSelect}
                style={{ display: 'none' }}
            />

            {uploading ? (
                <div className="upload-progress">
                    <div className="upload-spinner" />
                    <p className="upload-status">{status}</p>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="progress-text">{progress}%</span>
                </div>
            ) : (
                <div className="upload-content">
                    <div className="upload-icon">📄</div>
                    <p className="upload-title">Drop documents here</p>
                    <p className="upload-subtitle">or click to browse — PDF, DOCX, TXT, MD</p>
                </div>
            )}

            {error && (
                <div className="upload-error animate-slide-up">
                    <span>⚠️ {error}</span>
                    <button onClick={(e) => { e.stopPropagation(); setError(''); }}>✕</button>
                </div>
            )}
        </div>
    );
}
