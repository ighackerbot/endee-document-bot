import { useState } from 'react';

export default function SourceCard({ source, index }) {
    const [expanded, setExpanded] = useState(false);

    const scorePct = Math.round((source.relevance_score || 0) * 100);

    return (
        <div
            className={`cursor-pointer border rounded-lg p-3 transition-colors ${expanded ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-900/50 hover:bg-zinc-800 border-zinc-800'
                }`}
            onClick={() => setExpanded(!expanded)}
            style={{ animationDelay: `${index * 80}ms` }}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 flex-shrink-0 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30">
                        {index + 1}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-200 truncate max-w-[150px] sm:max-w-[200px]">{source.filename}</span>
                        <span className="text-[10px] text-zinc-500">Chunk {(source.chunk_index || 0) + 1}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <div className="w-16 h-1 mt-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400" style={{ width: `${scorePct}%` }} />
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-1">{scorePct}% match</span>
                    </div>
                    <span className={`text-zinc-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </span>
                </div>
            </div>

            {expanded && (
                <div className="mt-3 pt-3 border-t border-zinc-700/50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-sm text-zinc-300 leading-relaxed border-l-2 border-blue-500/40 pl-3 py-1 font-serif italic bg-zinc-900/40 rounded-r-md">
                        {source.text_preview}
                    </p>
                </div>
            )}
        </div>
    );
}
