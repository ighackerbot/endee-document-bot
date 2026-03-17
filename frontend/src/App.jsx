import { useState } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import SearchPanel from './components/SearchPanel';
import { AuroraBackground } from './components/ui/aurora-background';
import { SidebarProvider } from './components/ui/sidebar';
import { PanelLeftOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <AuroraBackground>
      <SidebarProvider open={sidebarOpen} setOpen={setSidebarOpen}>
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
            {/* Floating Toggle Button (Visible when sidebar is closed) */}
            <AnimatePresence>
              {!sidebarOpen && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => setSidebarOpen(true)}
                  className="absolute top-4 left-4 z-50 p-2 bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-all shadow-xl backdrop-blur-md"
                  title="Open sidebar"
                >
                  <PanelLeftOpen className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>

            {activeTab === 'chat' ? (
              <ChatInterface selectedDoc={selectedDoc} documents={documents} isSidebarOpen={sidebarOpen} />
            ) : (
              <SearchPanel selectedDoc={selectedDoc} documents={documents} isSidebarOpen={sidebarOpen} />
            )}
          </main>
        </div>
      </SidebarProvider>
    </AuroraBackground>
  );
}
