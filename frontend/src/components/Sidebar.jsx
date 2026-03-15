import { useState, useEffect } from 'react';
import './Sidebar.css';
import DocumentUpload from './DocumentUpload';
import { getDocuments, deleteDocument } from '../services/api';

export default function Sidebar({ documents, setDocuments, selectedDoc, setSelectedDoc, activeTab, setActiveTab }) {
    const [deleting, setDeleting] = useState(null);

    const fetchDocuments = async () => {
        try {
            const res = await getDocuments();
            setDocuments(res.documents || []);
        } catch (err) {
            console.error('Failed to fetch documents:', err);
        }
    };

    useEffect(() => { fetchDocuments(); }, []);

    const handleDelete = async (docId, e) => {
        e.stopPropagation();
        if (deleting) return;
        setDeleting(docId);
        try {
            await deleteDocument(docId);
            setDocuments(prev => prev.filter(d => d.id !== docId));
            if (selectedDoc === docId) setSelectedDoc(null);
        } catch (err) {
            console.error('Delete failed:', err);
        }
        setDeleting(null);
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (iso) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <aside className="sidebar glass">
            {/* Logo */}
            <div className="sidebar-header">
                <div className="logo">
                    <div className="logo-icon">⚡</div>
                    <div>
                        <h1 className="logo-title">DocChat AI</h1>
                        <span className="logo-subtitle">Powered by Endee</span>
                    </div>
                </div>
            </div>

            {/* Upload */}
            <div className="sidebar-section">
                <DocumentUpload onUploadComplete={(doc) => {
                    setDocuments(prev => [doc, ...prev]);
                }} />
            </div>

            {/* Navigation Tabs */}
            <div className="sidebar-tabs">
                {['chat', 'search'].map(tab => (
                    <button
                        key={tab}
                        className={`sidebar-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'chat' ? '💬' : '🔍'}
                        <span>{tab === 'chat' ? 'Chat' : 'Search'}</span>
                    </button>
                ))}
            </div>

            {/* Document List */}
            <div className="sidebar-section">
                <div className="section-header">
                    <h3 className="section-title">Documents</h3>
                    <span className="badge badge-info">{documents.length}</span>
                </div>

                <div className="doc-list">
                    {documents.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">📁</span>
                            <p>No documents yet</p>
                            <p className="empty-hint">Upload a file to get started</p>
                        </div>
                    ) : (
                        documents.map((doc, i) => (
                            <div
                                key={doc.id}
                                className={`doc-item ${selectedDoc === doc.id ? 'selected' : ''}`}
                                style={{ animationDelay: `${i * 50}ms` }}
                                onClick={() => setSelectedDoc(selectedDoc === doc.id ? null : doc.id)}
                            >
                                <div className="doc-item-icon">
                                    {doc.filename?.endsWith('.pdf') ? '📕' : doc.filename?.endsWith('.docx') ? '📘' : '📄'}
                                </div>
                                <div className="doc-item-info">
                                    <span className="doc-item-name" title={doc.filename}>{doc.filename}</span>
                                    <div className="doc-item-meta">
                                        <span>{doc.num_chunks} chunks</span>
                                        <span>•</span>
                                        <span>{formatSize(doc.file_size)}</span>
                                    </div>
                                </div>
                                <button
                                    className="doc-delete-btn"
                                    onClick={(e) => handleDelete(doc.id, e)}
                                    title="Delete document"
                                    disabled={deleting === doc.id}
                                >
                                    {deleting === doc.id ? '⏳' : '🗑️'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="footer-status">
                    <span className="status-dot" />
                    <span>Endee Vector DB</span>
                </div>
            </div>
        </aside>
    );
}
