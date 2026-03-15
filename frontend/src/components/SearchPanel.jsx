import { useState } from 'react';
import SourceCard from './SourceCard';
import { searchDocuments } from '../services/api';
import { Paperclip, AlertTriangle, Telescope, Lightbulb } from 'lucide-react';

export default function SearchPanel({ selectedDoc, documents }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const selectedDocName = documents?.find(d => d.id === selectedDoc)?.filename;

    const handleSearch = async () => {
        if (!query.trim() || loading) return;
        setLoading(true);
        setError('');
        setResults(null);

        try {
            const res = await searchDocuments(query, 10, selectedDoc);
            setResults(res);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full relative w-full z-10">
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/10 bg-zinc-900/50 backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        Semantic Search
                    </h2>
                    {selectedDocName ? (
                        <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs rounded-md flex items-center gap-1">
                            <Paperclip className="w-3 h-3" /> {selectedDocName}
                        </span>
                    ) : (
                        <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-300 text-xs rounded-md">
                            All documents
                        </span>
                    )}
                </div>
                <p className="text-zinc-400 text-sm">
                    Search by meaning, not just keywords — powered by Endee vector similarity
                </p>
            </div>

            {/* Search Input Area */}
            <div className="p-6 bg-zinc-950/80 border-b border-white/5 relative flex justify-center sticky top-0 z-20">
                <div className="relative w-full max-w-3xl flex items-center">
                    <div className="absolute left-4 text-zinc-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search across your documents..."
                        className="w-full h-12 rounded-full border border-zinc-700 bg-zinc-900 text-white pl-12 pr-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        className="absolute right-1 top-1 bottom-1 px-6 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSearch}
                        disabled={!query.trim() || loading}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="max-w-4xl mx-auto">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-6 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" /> {error}
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                            <div className="w-10 h-10 border-4 border-zinc-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                            <p>Searching through your documents vector embeddings...</p>
                        </div>
                    )}

                    {results && !loading && (
                        <div className="animate-in fade-in duration-500">
                            <div className="flex items-baseline gap-2 mb-6 border-b border-zinc-800 pb-2">
                                <span className="text-xl font-bold text-white">
                                    {results.total_results} result{results.total_results !== 1 ? 's' : ''} found
                                </span>
                                <span className="text-zinc-500 text-sm">for "{results.query}"</span>
                            </div>

                            {results.results.length === 0 ? (
                                <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                                    <Telescope className="w-12 h-12 mx-auto text-zinc-500 mb-4" />
                                    <p className="text-zinc-300 font-medium">No matching documents found</p>
                                    <p className="text-zinc-500 text-sm mt-1">Try a different query or upload more documents</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {results.results.map((result, i) => (
                                        <div
                                            key={i}
                                            className="bg-zinc-900/50 relative border border-zinc-800 p-5 rounded-xl hover:border-blue-500/50 transition-colors animate-in slide-in-from-bottom-2"
                                            style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
                                        >
                                            <div className="flex items-center justify-between mb-3 border-b border-zinc-800/50 pb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-bold">
                                                        #{i + 1}
                                                    </span>
                                                    <span className="font-semibold text-zinc-200">{result.filename}</span>
                                                    <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded">Chunk {result.chunk_index + 1}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded ${result.relevance_score > 0.7 ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                        result.relevance_score > 0.4 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                            'bg-red-500/10 text-red-400 border border-red-500/20'
                                                        }`}>
                                                        {Math.round(result.relevance_score * 100)}% Match
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-zinc-300 leading-relaxed font-serif bg-zinc-950/30 p-4 rounded-lg">
                                                ...{result.text_preview}...
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {!results && !loading && !error && (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-xl border border-white/5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Semantic Search</h3>
                            <p className="text-zinc-400 max-w-md mx-auto mb-8">
                                Enter a query to search through your documents by meaning. Unlike keyword search, this finds conceptually similar content.
                            </p>
                            <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
                                <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-full text-sm flex items-center gap-2 cursor-pointer hover:bg-zinc-800 hover:text-white transition" onClick={() => { setQuery("What are the key findings?"); handleSearch() }}><Lightbulb className="w-4 h-4 text-blue-400" /> "What are the key findings?"</span>
                                <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-full text-sm flex items-center gap-2 cursor-pointer hover:bg-zinc-800 hover:text-white transition" onClick={() => { setQuery("Explain the methodology used"); handleSearch() }}><Lightbulb className="w-4 h-4 text-blue-400" /> "Explain the methodology used"</span>
                                <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-full text-sm flex items-center gap-2 cursor-pointer hover:bg-zinc-800 hover:text-white transition" onClick={() => { setQuery("Summary of financial data"); handleSearch() }}><Lightbulb className="w-4 h-4 text-blue-400" /> "Summary of financial data"</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
