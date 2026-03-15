import { useState, useRef, useEffect } from 'react';
import SourceCard from './SourceCard';
import { sendMessage } from '../services/api';
import { PlaceholdersAndVanishInput } from './ui/placeholders-and-vanish-input';
import { MessageSquare, Paperclip, User, Bot, BookOpen, AlertTriangle } from 'lucide-react';

export default function ChatInterface({ selectedDoc, documents }) {
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

    // When the selected document changes, load its specific chat history
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        setMessages(saved ? JSON.parse(saved) : [defaultMessage]);
    }, [storageKey]);

    // Save messages to local storage whenever they change
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
    }, [messages]);

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

    const renderContent = (text) => {
        // Simple markdown-like rendering
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br/>');
    };

    const placeholders = [
        "Ask anything about your documents...",
        "Summarize the key findings...",
        "What does page 3 say about...",
        "Extract the main financial figures..."
    ];

    return (
        <div className="flex flex-col h-full relative z-10 w-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/50 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-100 to-neutral-500 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-neutral-300" /> Chat with Documents
                    </h2>
                    {selectedDocName ? (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            <Paperclip className="w-3 h-3" /> Filtering: {selectedDocName}
                        </span>
                    ) : (
                        <span className="mt-1 inline-block text-xs px-2 py-1 rounded bg-green-500/20 text-green-300 border border-green-500/30">
                            All documents
                        </span>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-hide">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 ${msg.role === 'user' ? 'bg-zinc-700 text-white' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                            }`}>
                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                            <div
                                className={`px-5 py-3 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-zinc-800 text-neutral-200 rounded-tr-sm'
                                    : 'bg-zinc-900/80 border border-white/10 text-neutral-300 rounded-tl-sm shadow-xl'
                                    }`}
                                dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                            />
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-3 w-full">
                                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> Sources ({msg.sources.length})
                                    </span>
                                    <div className="flex flex-col gap-2">
                                        {msg.sources.map((source, si) => (
                                            <SourceCard key={si} source={source} index={si} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-4 max-w-4xl mx-auto">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="px-5 py-4 rounded-2xl bg-zinc-900/80 border border-white/10 rounded-tl-sm flex items-center gap-1">
                            <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 sm:p-6 bg-zinc-950/80 backdrop-blur-md border-t border-white/10 flex flex-col items-center">
                <div className="w-full max-w-3xl relative">
                    <PlaceholdersAndVanishInput
                        placeholders={selectedDoc ? [`Ask about "${selectedDocName}"...`] : placeholders}
                        onChange={(e) => setInput(e.target.value)}
                        onSubmit={handleSend}
                        disabled={loading}
                    />
                </div>
                <p className="text-xs text-zinc-500 mt-3 text-center">
                    Powered by Endee vector search
                </p>
            </div>
        </div>
    );
}
