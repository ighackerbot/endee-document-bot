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
      {/* We use SidebarProvider (if available from Aceternity) or standard flex to manage layout */}
      <div className="flex w-full h-full z-10 relative overflow-hidden">

        {/* Sidebar Component */}
        <Sidebar
          documents={documents}
          setDocuments={setDocuments}
          selectedDoc={selectedDoc}
          setSelectedDoc={setSelectedDoc}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full bg-black/40 backdrop-blur-2xl sm:border-l border-white/10 overflow-hidden relative shadow-2xl transition-all duration-300 w-full">
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
