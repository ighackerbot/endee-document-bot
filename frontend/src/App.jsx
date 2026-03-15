import { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import SearchPanel from './components/SearchPanel';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="app-layout">
      <Sidebar
        documents={documents}
        setDocuments={setDocuments}
        selectedDoc={selectedDoc}
        setSelectedDoc={setSelectedDoc}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="app-content">
        {activeTab === 'chat' ? (
          <ChatInterface selectedDoc={selectedDoc} documents={documents} />
        ) : (
          <SearchPanel selectedDoc={selectedDoc} documents={documents} />
        )}
      </main>
    </div>
  );
}
