/**
 * API Client — communicates with the FastAPI backend.
 */

// If VITE_API_URL is provided (e.g. in Vercel), use it.
// Else if in production mode (Vite build/Nginx), use relative path.
// Else local dev environment.
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    // Default headers, merge with any custom headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || 'Request failed');
    }

    return response.json();
}

// ── Documents ─────────────────────────────────────────────────
export async function uploadDocument(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/documents/upload`);

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                try {
                    const err = JSON.parse(xhr.responseText);
                    reject(new Error(err.detail || 'Upload failed'));
                } catch {
                    reject(new Error('Upload failed'));
                }
            }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.send(formData);
    });
}

export async function getDocuments() {
    return request('/documents');
}

export async function deleteDocument(docId) {
    return request(`/documents/${docId}`, { method: 'DELETE' });
}

// ── Chat (RAG) ────────────────────────────────────────────────
export async function sendMessage(query, docId = null) {
    return request('/chat', {
        method: 'POST',
        body: JSON.stringify({ query, doc_id: docId }),
    });
}

// ── Search ────────────────────────────────────────────────────
export async function searchDocuments(query, topK = 10, docId = null) {
    return request('/search', {
        method: 'POST',
        body: JSON.stringify({ query, top_k: topK, doc_id: docId }),
    });
}

// ── Health ────────────────────────────────────────────────────
export async function checkHealth() {
    return request('/health');
}
