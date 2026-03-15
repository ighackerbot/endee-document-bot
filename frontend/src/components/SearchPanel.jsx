import { useState } from 'react';
import './SearchPanel.css';
import SourceCard from './SourceCard';
import { searchDocuments } from '../services/api';

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
        <div className="search-container">
            {/* Header */}
            <div className="search-header glass">
                <div className="search-header-info">
                    <h2>🔍 Semantic Search</h2>
                    {selectedDocName ? (
                        <span className="badge badge-info">📎 {selectedDocName}</span>
                    ) : (
                        <span className="badge badge-success">All documents</span>
                    )}
                </div>
                <p className="search-subtitle">
                    Search by meaning, not just keywords — powered by Endee vector similarity
                </p>
            </div>

            {/* Search Input */}
            <div className="search-input-area">
                <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Search across your documents..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleSearch}
                        disabled={!query.trim() || loading}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Results */}
            <div className="search-results">
                {error && (
                    <div className="search-error animate-slide-up">
                        ⚠️ {error}
                    </div>
                )}

                {loading && (
                    <div className="search-loading">
                        <div className="upload-spinner" />
                        <p>Searching through your documents...</p>
                    </div>
                )}

                {results && !loading && (
                    <div className="animate-fade-in">
                        <div className="results-header">
                            <span className="results-count">
                                {results.total_results} result{results.total_results !== 1 ? 's' : ''} found
                            </span>
                            <span className="results-query">for "{results.query}"</span>
                        </div>

                        {results.results.length === 0 ? (
                            <div className="no-results">
                                <span className="no-results-icon">🔭</span>
                                <p>No matching documents found</p>
                                <p className="no-results-hint">Try a different query or upload more documents</p>
                            </div>
                        ) : (
                            <div className="results-list">
                                {results.results.map((result, i) => (
                                    <div key={i} className="result-card animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                                        <div className="result-meta">
                                            <span className="result-rank">#{i + 1}</span>
                                            <span className="result-filename">{result.filename}</span>
                                            <span className="result-chunk">Chunk {result.chunk_index + 1}</span>
                                            <span className={`result-score ${result.relevance_score > 0.7 ? 'high' : result.relevance_score > 0.4 ? 'medium' : 'low'}`}>
                                                {Math.round(result.relevance_score * 100)}% match
                                            </span>
                                        </div>
                                        <p className="result-text">{result.text_preview}</p>
                                        <div className="result-score-bar">
                                            <div
                                                className="result-score-fill"
                                                style={{ width: `${result.relevance_score * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {!results && !loading && !error && (
                    <div className="search-empty">
                        <div className="search-empty-visual">
                            <span>🔍</span>
                        </div>
                        <h3>Semantic Search</h3>
                        <p>Enter a query to search through your documents by meaning.<br />
                            Unlike keyword search, this finds conceptually similar content.</p>
                        <div className="search-tips">
                            <span className="tip">💡 Try: "What are the key findings?"</span>
                            <span className="tip">💡 Try: "Explain the methodology used"</span>
                            <span className="tip">💡 Try: "Summary of financial data"</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
