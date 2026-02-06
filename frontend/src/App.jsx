import React, { useState, useEffect } from 'react';
import UploadSection from './components/UploadSection';
import DocumentList from './components/DocumentList';
import SearchBar from './components/SearchBar';
import { FileText } from 'lucide-react';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white p-4 rounded-2xl shadow-2xl">
              <FileText size={48} className="text-primary-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">
            Document Manager
          </h1>
          <p className="text-xl text-white/90 drop-shadow">
            Upload, organize, and manage your documents with ease
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-8 animate-slide-up">
          <UploadSection onUploadSuccess={handleUploadSuccess} />
        </div>

        {/* Search and Filter */}
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <SearchBar 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
        </div>

        {/* Document List */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <DocumentList 
            refreshTrigger={refreshTrigger}
            searchQuery={searchQuery}
            sortOrder={sortOrder}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
