import { useState, useRef, useEffect } from 'react';
import './ChatInterface.css';
import SourceCard from './SourceCard';
import { sendMessage } from '../services/api';

export default function ChatInterface({ selectedDoc, documents }) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hello! 👋 Upload a document and ask me anything about it. I\'ll use **Endee vector search** to find the most relevant passages and generate an answer.',
            sources: [],
        },
    ]);
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
                content: `⚠️ Error: ${err.message}. Make sure the backend server is running.`,
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

    return (
        <div className="chat-container">
            {/* Header */}
            <div className="chat-header glass">
                <div className="chat-header-info">
                    <h2>💬 Chat with Documents</h2>
                    {selectedDocName ? (
                        <span className="chat-filter badge badge-info">
                            📎 Filtering: {selectedDocName}
                        </span>
                    ) : (
                        <span className="chat-filter-all badge badge-success">
                            All documents
                        </span>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="messages-area">
                {messages.map((msg, i) => (
                    <div key={i} className={`message ${msg.role}`} style={{ animationDelay: `${(i % 5) * 50}ms` }}>
                        <div className="message-avatar">
                            {msg.role === 'user' ? '👤' : '🤖'}
                        </div>
                        <div className="message-body">
                            <div
                                className="message-content"
                                dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                            />
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="message-sources">
                                    <span className="sources-label">📚 Sources ({msg.sources.length})</span>
                                    <div className="sources-list">
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
                    <div className="message assistant">
                        <div className="message-avatar">🤖</div>
                        <div className="message-body">
                            <div className="typing-indicator">
                                <span /><span /><span />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-area glass">
                <div className="chat-input-wrapper">
                    <input
                        ref={inputRef}
                        className="chat-input"
                        type="text"
                        placeholder={selectedDoc ? `Ask about "${selectedDocName}"...` : 'Ask anything about your documents...'}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={loading}
                    />
                    <button
                        className="send-btn"
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                    >
                        {loading ? '⏳' : '➤'}
                    </button>
                </div>
                <p className="input-hint">
                    Powered by Endee vector search + RAG
                </p>
            </div>
        </div>
    );
}
