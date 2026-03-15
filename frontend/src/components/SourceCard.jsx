import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SourceCard({ source, index }) {
    const [expanded, setExpanded] = useState(false);

    const scorePct = Math.round((source.score || source.relevance_score || 0) * 100);
    const content = source.meta?.text || source.text_preview || source.text || 'No content preview available';
    const filename = source.meta?.filename || source.filename || 'Unknown Document';
    const chunkIndex = source.meta?.chunk_index ?? source.chunk_index ?? 0;

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`cursor-pointer border rounded-2xl p-3 sm:p-4 mb-2 shadow-lg transition-colors overflow-hidden relative group 
                ${expanded ? 'bg-zinc-900 border-zinc-700 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'bg-black/40 backdrop-blur-xl border-white/5 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                }`}
            onClick={() => setExpanded(!expanded)}
        >
            <div className={`absolute inset-0 bg-gradient-to-r ${expanded ? 'from-blue-500/5 to-indigo-500/5' : 'from-blue-500/0 to-purple-500/0'} group-hover:from-blue-500/10 group-hover:via-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-500`} />

            <div className="flex items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 flex-shrink-0 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-shadow">
                        {index + 1}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-200 truncate max-w-[140px] sm:max-w-[200px] group-hover:text-blue-100 transition-colors">{filename}</span>
                        <span className="text-[10px] text-zinc-500 font-medium tracking-wide">Chunk {chunkIndex + 1}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <div className="w-16 h-1.5 mt-1 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400" style={{ width: `${scorePct}%` }} />
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-1 font-bold">{scorePct}% match</span>
                    </div>
                    <span className={`text-zinc-500 transition-transform duration-300 ${expanded ? 'rotate-180 text-blue-400' : 'group-hover:text-blue-300 group-hover:translate-x-1'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </span>
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 pt-3 border-t border-white/5 relative z-10"
                    >
                        <p className="text-sm sm:text-base text-zinc-300 leading-relaxed border-l-2 border-blue-500/40 pl-3 sm:pl-4 py-2 font-serif bg-black/40 rounded-r-xl shadow-inner break-words">
                            "{content}"
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
