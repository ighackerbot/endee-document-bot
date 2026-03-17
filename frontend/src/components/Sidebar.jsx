import { useState, useEffect } from 'react';
import DocumentUpload from './DocumentUpload';
import { getDocuments, deleteDocument } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar as AcetSidebar, SidebarBody, SidebarLink, useSidebar } from './ui/sidebar';
import { MessageSquare, Search, FileText, Trash2, Files, Zap, PanelLeftClose } from 'lucide-react';

export default function Sidebar({ documents, setDocuments, selectedDoc, setSelectedDoc, activeTab, setActiveTab }) {
    const [deleting, setDeleting] = useState(null);
    const { open, setOpen } = useSidebar();

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

    return (
        <AcetSidebar open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-10">
                <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                <Zap className="w-5 h-5 fill-white" />
                            </div>
                            <AnimatePresence>
                                {open && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="text-xl font-bold text-white whitespace-pre"
                                    >
                                        DocChat AI
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                        <button
                            onClick={() => setOpen(!open)}
                            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                            title="Collapse sidebar"
                        >
                            <PanelLeftClose className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mb-6 px-2">
                        <DocumentUpload onUploadComplete={(doc) => {
                            setDocuments(prev => [doc, ...prev]);
                        }} />
                    </div>

                    <div className="mt-4 flex flex-col gap-2 px-2">
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

                    <div className="mt-8 border-t border-white/10 pt-4 px-2">
                        <div className="flex items-center justify-between text-zinc-400 mb-4 cursor-default">
                            {open && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-xs font-semibold uppercase tracking-wider"
                                >
                                    Documents
                                </motion.span>
                            )}
                            <span className="bg-zinc-800 px-2 py-0.5 rounded-full text-[10px] sm:text-xs">{documents.length}</span>
                        </div>

                        <div className="flex flex-col gap-1">
                            {documents.length === 0 ? (
                                <AnimatePresence>
                                    {open && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="py-4 text-center text-zinc-500 text-sm flex flex-col items-center gap-2"
                                        >
                                            <Files className="h-8 w-8 opacity-50" />
                                            <span>No documents yet</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
                                            <AnimatePresence>
                                                {open && (
                                                    <motion.div
                                                        initial={{ opacity: 0, width: 0 }}
                                                        animate={{ opacity: 1, width: "auto" }}
                                                        exit={{ opacity: 0, width: 0 }}
                                                        className="flex flex-col overflow-hidden"
                                                    >
                                                        <span className={`text-sm truncate ${selectedDoc === doc.id ? 'text-blue-200' : 'text-zinc-300'}`}>
                                                            {doc.filename}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-500 truncate">
                                                            {formatSize(doc.file_size)}
                                                        </span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        {open && (
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
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex items-center justify-center p-2 bg-zinc-900/50 rounded-lg border border-white/5"
                    >
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                        <span className="text-xs font-medium text-zinc-400">Endee Active</span>
                    </motion.div>
                )}
            </SidebarBody>
        </AcetSidebar>
    );
}
