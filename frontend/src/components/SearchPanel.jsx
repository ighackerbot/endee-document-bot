import { useState } from 'react';
import SourceCard from './SourceCard';
import { searchDocuments } from '../services/api';
import { Paperclip, AlertTriangle, Telescope, Lightbulb, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="flex flex-col h-full relative w-full z-10 overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-xl z-20 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-500" />
                        Semantic Search
                    </h2>
                    {selectedDocName ? (
                        <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(59,130,246,0.1)] w-fit">
                            <Paperclip className="w-3 h-3" /> <span className="truncate max-w-[150px]">{selectedDocName}</span>
                        </span>
                    ) : (
                        <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-full shadow-[0_0_10px_rgba(16,185,129,0.1)] w-fit">
                            All documents
                        </span>
                    )}
                </div>
                <p className="text-zinc-500 text-xs sm:text-sm font-medium">
                    Search by meaning, not just keywords — powered by Endee vectors
                </p>
            </div>

            {/* Search Input Area (Sticky) */}
            <div className="p-4 sm:p-6 bg-black/40 backdrop-blur-2xl border-b border-white/5 relative flex justify-center sticky top-0 z-30 shadow-2xl">
                <div className="relative w-full max-w-3xl flex items-center group">
                    <div className="absolute left-4 sm:left-5 text-zinc-500 transition-colors group-focus-within:text-blue-500">
                        <Search className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search across your documents..."
                        className="w-full h-12 sm:h-14 rounded-full border border-white/10 bg-black/50 text-white pl-12 sm:pl-14 pr-24 sm:pr-32 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-zinc-900/80 transition-all shadow-inner text-sm sm:text-base placeholder:text-zinc-600"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        className="absolute right-1.5 top-1.5 bottom-1.5 px-4 sm:px-6 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(79,70,229,0.6)]"
                        onClick={handleSearch}
                        disabled={!query.trim() || loading}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide relative">
                <div className="max-w-4xl mx-auto pb-20">
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl mb-6 flex items-center gap-3 backdrop-blur-md"
                            >
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" /> {error}
                            </motion.div>
                        )}

                        {loading && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-20 sm:py-32 text-zinc-400"
                            >
                                <div className="relative w-16 h-16 mb-6">
                                    <div className="absolute inset-0 rounded-full border border-blue-500/20"></div>
                                    <div className="absolute inset-0 rounded-full border border-transparent border-t-blue-500 border-r-indigo-500 animate-spin"></div>
                                    <Search className="absolute inset-0 m-auto w-6 h-6 text-blue-400 animate-pulse" />
                                </div>
                                <p className="font-medium tracking-wide text-sm sm:text-base">Searching vector embeddings...</p>
                            </motion.div>
                        )}

                        {results && !loading && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-6 border-b border-white/5 pb-4">
                                    <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                        {results.total_results} result{results.total_results !== 1 ? 's' : ''} found
                                    </span>
                                    <span className="text-zinc-500 text-sm italic">for "{results.query}"</span>
                                </div>

                                {results.results.length === 0 ? (
                                    <div className="text-center py-20 sm:py-32 bg-black/40 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl">
                                        <Telescope className="w-16 h-16 mx-auto text-zinc-600 mb-6" />
                                        <p className="text-zinc-300 font-semibold text-lg">No semantic matches found</p>
                                        <p className="text-zinc-500 text-sm mt-2">Try rephrasing your search conceptually.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {results.results.map((result, i) => (
                                            <SourceCard key={i} source={result} index={i} />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {!results && !loading && !error && (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="flex flex-col items-center justify-center py-16 sm:py-32 text-center"
                            >
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-blue-500 blur-[40px] opacity-20 rounded-full"></div>
                                    <div className="w-24 h-24 bg-black/50 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white/10 relative z-10">
                                        <Telescope className="w-10 h-10 text-blue-400" />
                                    </div>
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">Meaning, Not Keywords</h3>
                                <p className="text-zinc-400 max-w-lg mx-auto mb-10 text-sm sm:text-base leading-relaxed px-4">
                                    Search through your documents by concept. The AI understands the context of your query and finds conceptually similar passages.
                                </p>
                                <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 max-w-3xl px-4">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="bg-zinc-900/80 backdrop-blur-md border border-white/10 text-zinc-300 px-5 py-3 rounded-full text-sm flex items-center gap-2.5 cursor-pointer hover:bg-zinc-800 hover:text-white hover:border-blue-500/50 transition-all shadow-lg w-full sm:w-auto justify-center"
                                        onClick={() => { setQuery("What are the key findings?"); handleSearch() }}
                                    >
                                        <Lightbulb className="w-4 h-4 text-blue-400" /> "What are the key findings?"
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="bg-zinc-900/80 backdrop-blur-md border border-white/10 text-zinc-300 px-5 py-3 rounded-full text-sm flex items-center gap-2.5 cursor-pointer hover:bg-zinc-800 hover:text-white hover:border-purple-500/50 transition-all shadow-lg w-full sm:w-auto justify-center"
                                        onClick={() => { setQuery("Explain the methodology used"); handleSearch() }}
                                    >
                                        <Lightbulb className="w-4 h-4 text-purple-400" /> "Explain the methodology used"
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="bg-zinc-900/80 backdrop-blur-md border border-white/10 text-zinc-300 px-5 py-3 rounded-full text-sm flex items-center gap-2.5 cursor-pointer hover:bg-zinc-800 hover:text-white hover:border-emerald-500/50 transition-all shadow-lg w-full sm:w-auto justify-center"
                                        onClick={() => { setQuery("Summary of financial data"); handleSearch() }}
                                    >
                                        <Lightbulb className="w-4 h-4 text-emerald-400" /> "Summary of financial data"
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
