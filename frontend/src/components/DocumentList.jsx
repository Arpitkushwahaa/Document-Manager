import React, { useState, useEffect } from 'react';
import { Download, File, Calendar, HardDrive, ChevronLeft, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import axios from 'axios';

const DocumentList = ({ refreshTrigger, searchQuery, sortOrder }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  const [downloading, setDownloading] = useState({});
  const [deleting, setDeleting] = useState({});

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger, searchQuery, sortOrder, pagination.page]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortOrder: sortOrder
      };

      if (searchQuery) {
        params.q = searchQuery;
      }

      const response = await axios.get('/api/documents', { params });
      setDocuments(response.data.documents);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination
      }));
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc) => {
    setDownloading(prev => ({ ...prev, [doc.id]: true }));
    
    try {
      const response = await axios.get(`/api/documents/${doc.id}/download`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    } finally {
      setDownloading(prev => ({ ...prev, [doc.id]: false }));
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(prev => ({ ...prev, [doc.id]: true }));
    
    try {
      await axios.delete(`/api/documents/${doc.id}`);
      // Refresh the document list
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
      setDeleting(prev => ({ ...prev, [doc.id]: false }));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  if (loading && documents.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary-600" size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <File className="text-primary-600" size={28} />
        Documents
        <span className="text-lg font-normal text-gray-500 ml-2">
          ({pagination.total} total)
        </span>
      </h2>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <File className="mx-auto mb-4 text-gray-300" size={64} />
          <p className="text-xl text-gray-500">
            {searchQuery ? 'No documents found matching your search' : 'No documents uploaded yet'}
          </p>
          <p className="text-gray-400 mt-2">
            {searchQuery ? 'Try a different search term' : 'Upload your first document to get started'}
          </p>
        </div>
      ) : (
        <>
          {/* Documents Grid */}
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:shadow-md gap-4"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="p-3 bg-primary-100 rounded-lg flex-shrink-0">
                    <File className="text-primary-600" size={24} />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 truncate mb-1">
                      {doc.title}
                    </h3>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <HardDrive size={16} />
                        <span>{formatFileSize(doc.size)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>{formatDate(doc.uploadDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={downloading[doc.id] || deleting[doc.id]}
                    className="btn-primary flex items-center gap-2 whitespace-nowrap"
                  >
                    {downloading[doc.id] ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download size={18} />
                        Download
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={downloading[doc.id] || deleting[doc.id]}
                    className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Delete document"
                  >
                    {deleting[doc.id] ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between border-t pt-6">
              <p className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first, last, current, and adjacent pages
                      return (
                        page === 1 ||
                        page === pagination.totalPages ||
                        Math.abs(page - pagination.page) <= 1
                      );
                    })
                    .map((page, index, array) => {
                      // Add ellipsis if there's a gap
                      const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                      
                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && (
                            <span className="px-3 py-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => goToPage(page)}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              page === pagination.page
                                ? 'bg-primary-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>
                
                <button
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentList;
