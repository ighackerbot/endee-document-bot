import { useState } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import SearchPanel from './components/SearchPanel';
import { AuroraBackground } from './components/ui/aurora-background';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <AuroraBackground>
      <div className="flex w-full h-full z-10 relative">
        <Sidebar
          documents={documents}
          setDocuments={setDocuments}
          selectedDoc={selectedDoc}
          setSelectedDoc={setSelectedDoc}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <main className="flex-1 flex flex-col h-full bg-black/20 backdrop-blur-xl border-l border-white/10 overflow-hidden">
          {activeTab === 'chat' ? (
            <ChatInterface selectedDoc={selectedDoc} documents={documents} />
          ) : (
            <SearchPanel selectedDoc={selectedDoc} documents={documents} />
          )}
        </main>
      </div>
    </AuroraBackground>
  );
}
