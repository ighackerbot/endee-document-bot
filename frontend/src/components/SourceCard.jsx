import { useState } from 'react';
import './SourceCard.css';

export default function SourceCard({ source, index }) {
    const [expanded, setExpanded] = useState(false);

    const scorePct = Math.round((source.relevance_score || 0) * 100);

    return (
        <div
            className={`source-card ${expanded ? 'expanded' : ''}`}
            onClick={() => setExpanded(!expanded)}
            style={{ animationDelay: `${index * 80}ms` }}
        >
            <div className="source-header">
                <div className="source-rank">
                    <span className="rank-number">{index + 1}</span>
                </div>
                <div className="source-info">
                    <span className="source-filename">{source.filename}</span>
                    <span className="source-chunk">Chunk {(source.chunk_index || 0) + 1}</span>
                </div>
                <div className="source-score">
                    <div className="score-bar">
                        <div className="score-fill" style={{ width: `${scorePct}%` }} />
                    </div>
                    <span className="score-text">{scorePct}%</span>
                </div>
                <span className={`source-toggle ${expanded ? 'open' : ''}`}>▾</span>
            </div>

            {expanded && (
                <div className="source-body animate-slide-up">
                    <p className="source-preview">{source.text_preview}</p>
                </div>
            )}
        </div>
    );
}
