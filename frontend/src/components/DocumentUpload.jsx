import { useState, useRef, useCallback } from 'react';
import { uploadDocument } from '../services/api';
import { FileUpload } from './ui/file-upload';
import { AlertTriangle, X } from 'lucide-react';

export default function DocumentUpload({ onUploadComplete }) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleUpload = useCallback(async (file) => {
        setError('');
        setUploading(true);
        setProgress(0);
        setStatus(`Processing "${file.name}"...`);

        try {
            const result = await uploadDocument(file, (pct) => setProgress(pct));
            setStatus(`Successfully processed "${file.name}" — ${result.document.num_chunks} chunks`);
            setProgress(100);
            if (onUploadComplete) onUploadComplete(result.document);
            setTimeout(() => {
                setUploading(false);
                setStatus('');
                setProgress(0);
            }, 3000);
        } catch (err) {
            setError(err.message);
            setUploading(false);
            setProgress(0);
            setStatus('');
        }
    }, [onUploadComplete]);

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
    }, [handleUpload]);

    const onFileSelect = useCallback((e) => {
        const file = e.target.files[0];
        if (file) handleUpload(file);
        e.target.value = '';
    }, [handleUpload]);

    return (
        <div className="w-full relative">
            <FileUpload onChange={handleUpload} />

            {uploading && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-white/10">
                    <div className="w-8 h-8 rounded-full border-2 border-zinc-500 border-t-white animate-spin mb-3"></div>
                    <span className="text-zinc-300 text-sm font-medium mb-3 px-4 text-center">{status}</span>
                    <div className="w-3/4 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex justify-between items-start gap-2">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setError(''); }} className="hover:text-red-300 p-0.5">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
