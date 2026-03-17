import { useState, useRef, useEffect } from 'react';
import SourceCard from './SourceCard';
import { sendMessage } from '../services/api';
import { PlaceholdersAndVanishInput } from './ui/placeholders-and-vanish-input';
import { MessageSquare, Paperclip, User, Bot, BookOpen, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatInterface({ selectedDoc, documents, isSidebarOpen }) {
    const storageKey = `chat_${selectedDoc || 'all'}`;

    const defaultMessage = {
        role: 'assistant',
        content: 'Hello! Upload a document and ask me anything about it. I\'ll use **Endee vector search** to find the most relevant passages and generate an answer.',
        sources: [],
    };

    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : [defaultMessage];
    });

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        setMessages(saved ? JSON.parse(saved) : [defaultMessage]);
    }, [storageKey]);

    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(messages));
        }
    }, [messages, storageKey]);

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const selectedDocName = documents?.find(d => d.id === selectedDoc)?.filename;

    const handleSend = async () => {
        const query = input.trim();
        if (!query || loading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: query, sources: [] }]);
        setLoading(true);

        try {
            const result = await sendMessage(query, selectedDoc);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: result.answer,
                sources: result.sources || [],
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Error: ${err.message}. Make sure the backend server is running.`,
                sources: [],
            }]);
        }

        setLoading(false);
        inputRef.current?.focus();
    };

    const handleClearChat = () => {
        setMessages([defaultMessage]);
        localStorage.removeItem(storageKey);
    };

    const renderContent = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-black/30 px-1.5 py-0.5 rounded text-blue-300 font-mono text-sm">$1</code>')
            .replace(/\n/g, '<br/>');
    };

    const placeholders = [
        "Ask anything about your documents...",
        "Summarize the key findings...",
        "What does page 3 say about...",
        "Extract the main financial figures..."
    ];

    return (
        <div className="flex flex-col h-full relative z-10 w-full overflow-hidden">
            {/* Header */}
            <div className={`flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-xl z-20 shadow-lg transition-all duration-300 ${!isSidebarOpen ? 'pl-16 sm:pl-16' : ''}`}>
                <div>
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-100 to-neutral-400 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-400" /> Document Chat
                    </h2>
                    {selectedDocName ? (
                        <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                            <Paperclip className="w-3 h-3" /> Filtering: <span className="font-medium truncate max-w-[150px] sm:max-w-xs">{selectedDocName}</span>
                        </span>
                    ) : (
                        <span className="mt-1.5 inline-block text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                            Searching all documents
                        </span>
                    )}
                </div>
                {/* Clear Chat Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClearChat}
                    title="Clear chat"
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 hover:shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear chat</span>
                </motion.button>
            </div>

            {/* Messages Area — takes remaining height, scrolls internally */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-8 scrollbar-hide">
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                            className={`flex gap-3 sm:gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full flex-shrink-0 shadow-lg ${msg.role === 'user'
                                ? 'bg-gradient-to-tr from-zinc-800 to-zinc-600 text-white border border-white/10'
                                : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                }`}>
                                {msg.role === 'user' ? <User className="w-4 h-4 sm:w-5 sm:h-5" /> : <Bot className="w-4 h-4 sm:w-5 sm:h-5" />}
                            </div>

                            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[80%]`}>
                                <div
                                    className={`px-4 sm:px-6 py-3 sm:py-4 rounded-3xl ${msg.role === 'user'
                                        ? 'bg-gradient-to-b from-zinc-800 to-zinc-900 border border-white/5 text-neutral-200 rounded-tr-sm shadow-xl'
                                        : 'bg-black/40 backdrop-blur-md border border-white/10 text-neutral-200 rounded-tl-sm shadow-2xl'
                                        } leading-relaxed font-medium text-sm sm:text-base`}
                                    dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                                />

                                {msg.sources && msg.sources.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        transition={{ delay: 0.2, duration: 0.3 }}
                                        className="mt-4 w-full"
                                    >
                                        <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 ml-1">
                                            <BookOpen className="w-3.5 h-3.5" /> Retrieved Sources ({msg.sources.length})
                                        </span>
                                        <div className="flex flex-col gap-2.5">
                                            {msg.sources.map((source, si) => (
                                                <SourceCard key={si} source={source} index={si} />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3 sm:gap-4 max-w-4xl mx-auto"
                        >
                            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="px-5 py-4 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 rounded-tl-sm flex items-center gap-1.5 shadow-2xl">
                                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s] shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s] shadow-[0_0_8px_rgba(79,70,229,0.6)]"></span>
                                <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce shadow-[0_0_8px_rgba(168,85,247,0.6)]"></span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input — sticky footer, no overlap */}
            <div className="flex-shrink-0 border-t border-white/5 bg-black/30 backdrop-blur-xl px-4 sm:px-6 py-4 flex flex-col items-center gap-3">
                <div className="w-full max-w-3xl">
                    <PlaceholdersAndVanishInput
                        placeholders={selectedDoc ? [`Ask about "${selectedDocName}"...`] : placeholders}
                        onChange={(e) => setInput(e.target.value)}
                        onSubmit={handleSend}
                        disabled={loading}
                    />
                </div>
                <p className="text-[10px] sm:text-xs text-zinc-600 text-center font-medium tracking-wide">
                    Powered by Endee Vector Similarity &amp; Groq LLMs
                </p>
            </div>
        </div>
    );
}
