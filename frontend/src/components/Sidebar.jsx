import { useState, useEffect } from 'react';
import DocumentUpload from './DocumentUpload';
import { getDocuments, deleteDocument } from '../services/api';
import { motion } from 'framer-motion';
import { Sidebar as AcetSidebar, SidebarBody, SidebarLink } from './ui/sidebar';
import { MessageSquare, Search, FileText, Trash2, Files, Zap } from 'lucide-react';

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

    const [open, setOpen] = useState(false);

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <AcetSidebar open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-10">
                <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="flex items-center gap-2 mb-8 px-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold">
                            <Zap className="w-5 h-5 fill-white" />
                        </div>
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xl font-bold text-white whitespace-pre"
                        >
                            DocChat AI
                        </motion.span>
                    </div>

                    <div className="mb-6">
                        <DocumentUpload onUploadComplete={(doc) => {
                            setDocuments(prev => [doc, ...prev]);
                        }} />
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                        <SidebarLink
                            link={{
                                label: "Chat Context",
                                icon: <MessageSquare className="text-zinc-400 h-5 w-5 flex-shrink-0" />,
                            }}
                            className={activeTab === 'chat' ? "bg-zinc-800 rounded-lg" : ""}
                            onClick={() => setActiveTab('chat')}
                        />
                        <SidebarLink
                            link={{
                                label: "Semantic Search",
                                icon: <Search className="text-zinc-400 h-5 w-5 flex-shrink-0" />,
                            }}
                            className={activeTab === 'search' ? "bg-zinc-800 rounded-lg" : ""}
                            onClick={() => setActiveTab('search')}
                        />
                    </div>

                    <div className="mt-8 border-t border-white/10 pt-4">
                        <div className="flex items-center justify-between px-2 text-zinc-400 mb-4 cursor-default">
                            <span className="text-sm font-semibold uppercase tracking-wider">Documents</span>
                            <span className="bg-zinc-800 px-2 py-0.5 rounded-full text-xs">{documents.length}</span>
                        </div>

                        <div className="flex flex-col gap-1">
                            {documents.length === 0 ? (
                                <div className="px-2 py-4 text-center text-zinc-500 text-sm flex flex-col items-center gap-2">
                                    <Files className="h-8 w-8 opacity-50" />
                                    <span>No documents yet</span>
                                </div>
                            ) : (
                                documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        onClick={() => setSelectedDoc(selectedDoc === doc.id ? null : doc.id)}
                                        className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${selectedDoc === doc.id ? 'bg-blue-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]' : 'hover:bg-zinc-800/80'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FileText className={`h-5 w-5 flex-shrink-0 ${selectedDoc === doc.id ? 'text-blue-400' : 'text-zinc-400'}`} />
                                            <div className="flex flex-col overflow-hidden">
                                                <span className={`text-sm truncate ${selectedDoc === doc.id ? 'text-blue-200' : 'text-zinc-300'}`}>
                                                    {doc.filename}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 truncate">
                                                    {formatSize(doc.file_size)} • {doc.num_chunks} chunks
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(doc.id, e)}
                                            disabled={deleting === doc.id}
                                            className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-zinc-500 transition disabled:opacity-50 p-1"
                                        >
                                            {deleting === doc.id ? (
                                                <span className="block w-4 h-4 border-2 border-zinc-500 border-t-red-400 rounded-full animate-spin"></span>
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-center p-2 bg-zinc-900/50 rounded-lg border border-white/5">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                    <span className="text-xs font-medium text-zinc-400">Endee Active</span>
                </div>
            </SidebarBody>
        </AcetSidebar>
    );
}
