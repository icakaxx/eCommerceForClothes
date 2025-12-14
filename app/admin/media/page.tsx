'use client';

import { useState, useEffect } from 'react';
import { Search, Image as ImageIcon, Download, Trash2, Eye, Folder, X, ExternalLink, CheckSquare, Square } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import AdminLayout from '../components/AdminLayout';

interface MediaFile {
  name: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
  created_at: string;
  updated_at: string;
  folder?: string;
}

export default function MediaPage() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = translations[language];
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterFolder, setFilterFolder] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const response = await fetch('/api/admin/media');
      const result = await response.json();

      if (result.success) {
        setFiles(result.files || []);
      } else {
        console.error('Failed to fetch media:', result.error);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`${t.confirmDeleteFile} "${file.name}"`)) {
      return;
    }

    setDeleting(file.path);
    try {
      const response = await fetch(`/api/admin/media?path=${encodeURIComponent(file.path)}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        setFiles(files.filter(f => f.path !== file.path));
        setSelectedFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(file.path);
          return newSet;
        });
        if (selectedFile?.path === file.path) {
          setSelectedFile(null);
        }
      } else {
        alert(t.deleteFileError);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert(language === 'bg' ? 'Грешка при изтриване на файл' : 'Error deleting file');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleSelect = (filePath: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.path)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;

    const fileNames = Array.from(selectedFiles)
      .map(path => files.find(f => f.path === path)?.name)
      .filter(Boolean)
      .join(', ');

    if (!confirm(`${t.confirmDeleteFiles} (${selectedFiles.size})\n\n${fileNames.substring(0, 100)}${fileNames.length > 100 ? '...' : ''}`)) {
      return;
    }

    setBulkDeleting(true);
    const pathsToDelete = Array.from(selectedFiles);
    const deletePromises = pathsToDelete.map(path => 
      fetch(`/api/admin/media?path=${encodeURIComponent(path)}`, {
        method: 'DELETE'
      })
    );

    try {
      const results = await Promise.all(deletePromises);
      const jsonResults = await Promise.all(results.map(r => r.json()));
      
      const successful = jsonResults.filter(r => r.success).length;
      const failed = jsonResults.length - successful;

      if (successful > 0) {
        setFiles(files.filter(f => !selectedFiles.has(f.path)));
        setSelectedFiles(new Set());
        if (selectedFile && selectedFiles.has(selectedFile.path)) {
          setSelectedFile(null);
        }
      }

      if (failed > 0) {
      if (failed > 0) {
        alert(`${t.deleteFilesError} (${failed} failed, ${successful} successful)`);
      }
      }
    } catch (error) {
      console.error('Error deleting files:', error);
      alert(t.deleteFilesError);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkDownload = () => {
    selectedFiles.forEach(path => {
      const file = files.find(f => f.path === path);
      if (file) {
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        link.click();
      }
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isImage = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = !searchTerm ||
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.folder && file.folder.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFolder = filterFolder === 'all' || file.folder === filterFolder;

    return matchesSearch && matchesFolder;
  });

  const folders = Array.from(new Set(files.map(f => f.folder || 'root'))).sort();

  const handleFileUpload = async (fileList: File[]) => {
    if (fileList.length === 0) return;

    setUploadingFiles(true);
    setUploadProgress(t.uploading);

    try {
      const uploadPromises = fileList.map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name}: ${t.uploadError}`);
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name}: File too large. Maximum size: 10MB`);
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'media');

        const response = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(`${file.name}: ${result.error || t.uploadError}`);
        }

        return result;
      });

      const results = await Promise.allSettled(uploadPromises);

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - successful;

      if (successful > 0) {
        setUploadProgress(`✅ ${successful} ${successful === 1 ? 'file' : 'files'} ${t.uploadSuccess.toLowerCase()}`);
        // Refresh the media list
        await fetchMedia();
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadProgress('');
        }, 2000);
      }

      if (failed > 0) {
        const errors = results
          .filter(r => r.status === 'rejected')
          .map(r => r.reason.message)
          .join('\n');
        setUploadProgress(`❌ ${failed} ${failed === 1 ? 'file' : 'files'} failed:\n${errors}`);
      }
    } catch (error) {
      setUploadProgress(`❌ ${t.uploadError}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingFiles(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout currentPath="/admin/media">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPath="/admin/media">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className="text-2xl sm:text-3xl font-semibold transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.mediaLibrary}
              </h1>
              <p
                className="text-sm sm:text-base transition-colors duration-300 mt-1"
                style={{ color: theme.colors.textSecondary }}
              >
                {t.manageMediaFiles}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center gap-2"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: '#ffffff'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <ImageIcon size={18} />
                {t.uploadMedia}
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
                  viewMode === 'grid' ? 'opacity-100' : 'opacity-60'
                }`}
                style={{
                  backgroundColor: viewMode === 'grid' ? theme.colors.primary : theme.colors.secondary,
                  color: viewMode === 'grid' ? '#ffffff' : theme.colors.text
                }}
              >
                {t.grid}
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
                  viewMode === 'list' ? 'opacity-100' : 'opacity-60'
                }`}
                style={{
                  backgroundColor: viewMode === 'list' ? theme.colors.primary : theme.colors.secondary,
                  color: viewMode === 'list' ? '#ffffff' : theme.colors.text
                }}
              >
                {t.list}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-4 sm:mb-6">
            <div
              className="rounded-lg shadow-sm p-3 sm:p-4 flex-1 transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.surface,
                boxShadow: theme.effects.shadow
              }}
            >
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300"
                  size={18}
                  style={{ color: theme.colors.textSecondary }}
                />
                <input
                  type="text"
                  placeholder={t.searchFiles}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {folders.length > 0 && (
              <select
                value={filterFolder}
                onChange={(e) => setFilterFolder(e.target.value)}
                className="px-4 py-2 rounded-lg text-sm border transition-colors duration-300"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value="all">{t.allFolders}</option>
                {folders.map(folder => (
                  <option key={folder} value={folder}>
                    {folder === 'root' ? t.root : folder}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selection Toolbar */}
          {selectedFiles.size > 0 && (
            <div
              className="rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6 transition-colors duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              style={{
                backgroundColor: theme.colors.primary,
                boxShadow: theme.effects.shadow
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">
                  {selectedFiles.size} {selectedFiles.size === 1 ? t.fileSelected : t.filesSelected}
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-white/80 hover:text-white underline"
                >
                  {selectedFiles.size === filteredFiles.length ? t.deselectAll : t.selectAll}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkDownload}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white"
                >
                  <Download size={16} />
                  {t.download}
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center gap-2 bg-red-500/80 hover:bg-red-600 text-white disabled:opacity-50"
                >
                  {bulkDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {t.deleting}
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      {t.actions}
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedFiles(new Set())}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300 text-white hover:bg-white/20"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div
              className="rounded-lg shadow-sm p-4 sm:p-6 transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.surface,
                boxShadow: theme.effects.shadow
              }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredFiles.map((file) => (
                  <div
                    key={file.path}
                    className="group relative rounded-lg overflow-hidden transition-all duration-300"
                    style={{
                      backgroundColor: theme.colors.cardBg,
                      border: `2px solid ${selectedFiles.has(file.path) ? theme.colors.primary : theme.colors.border}`
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedFiles.has(file.path)) {
                        e.currentTarget.style.borderColor = theme.colors.primary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedFiles.has(file.path)) {
                        e.currentTarget.style.borderColor = theme.colors.border;
                      }
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      className="absolute top-2 left-2 z-10 p-1 rounded bg-black/50 hover:bg-black/70 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(file.path);
                      }}
                    >
                      {selectedFiles.has(file.path) ? (
                        <CheckSquare size={20} className="text-white" />
                      ) : (
                        <Square size={20} className="text-white/60" />
                      )}
                    </div>
                    <div
                      className="cursor-pointer"
                      onClick={() => setSelectedFile(file)}
                    >
                      {isImage(file.mimeType) ? (
                        <div className="aspect-square relative bg-gray-100">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div
                          className="aspect-square flex items-center justify-center"
                          style={{ backgroundColor: theme.colors.secondary }}
                        >
                          <ImageIcon size={32} style={{ color: theme.colors.textSecondary }} />
                        </div>
                      )}
                      <div className="p-2">
                        <div
                          className="text-xs font-medium truncate mb-1"
                          style={{ color: theme.colors.text }}
                          title={file.name}
                        >
                          {file.name}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: theme.colors.textSecondary }}
                        >
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 pointer-events-none">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.url, '_blank');
                        }}
                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors pointer-events-auto"
                        title="View"
                      >
                        <Eye size={16} className="text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const link = document.createElement('a');
                          link.href = file.url;
                          link.download = file.name;
                          link.click();
                        }}
                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors pointer-events-auto"
                        title="Download"
                      >
                        <Download size={16} className="text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file);
                        }}
                        disabled={deleting === file.path}
                        className="p-2 rounded-lg bg-red-500/80 hover:bg-red-600 transition-colors disabled:opacity-50 pointer-events-auto"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div
              className="rounded-lg shadow-sm overflow-hidden transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.surface,
                boxShadow: theme.effects.shadow
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead
                    className="border-b transition-colors duration-300"
                    style={{
                      backgroundColor: theme.colors.secondary,
                      borderColor: theme.colors.border
                    }}
                  >
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                        <button
                          onClick={handleSelectAll}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                          {selectedFiles.size === filteredFiles.length && filteredFiles.length > 0 ? (
                            <CheckSquare size={18} style={{ color: theme.colors.primary }} />
                          ) : (
                            <Square size={18} style={{ color: theme.colors.textSecondary }} />
                          )}
                        </button>
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                        {t.preview}
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                        {t.name}
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                        {t.folder}
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                        {t.size}
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                        {t.type}
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                        {t.uploaded}
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300" style={{ color: theme.colors.textSecondary }}>
                        {t.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: theme.colors.border }}>
                    {filteredFiles.map((file) => (
                      <tr
                        key={file.path}
                        className="transition-colors duration-300"
                        style={{
                          backgroundColor: selectedFiles.has(file.path) ? `${theme.colors.primary}20` : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedFiles.has(file.path)) {
                            e.currentTarget.style.backgroundColor = theme.colors.secondary;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedFiles.has(file.path)) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <td className="px-4 lg:px-6 py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(file.path);
                            }}
                            className="flex items-center"
                          >
                            {selectedFiles.has(file.path) ? (
                              <CheckSquare size={18} style={{ color: theme.colors.primary }} />
                            ) : (
                              <Square size={18} style={{ color: theme.colors.textSecondary }} />
                            )}
                          </button>
                        </td>
                        <td 
                          className="px-4 lg:px-6 py-4 cursor-pointer"
                          onClick={() => setSelectedFile(file)}
                        >
                          {isImage(file.mimeType) ? (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-16 h-16 object-cover rounded"
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className="w-16 h-16 flex items-center justify-center rounded"
                              style={{ backgroundColor: theme.colors.secondary }}
                            >
                              <ImageIcon size={24} style={{ color: theme.colors.textSecondary }} />
                            </div>
                          )}
                        </td>
                        <td 
                          className="px-4 lg:px-6 py-4 cursor-pointer"
                          onClick={() => setSelectedFile(file)}
                        >
                          <div className="font-medium text-sm" style={{ color: theme.colors.text }}>
                            {file.name}
                          </div>
                        </td>
                        <td 
                          className="px-4 lg:px-6 py-4 cursor-pointer"
                          onClick={() => setSelectedFile(file)}
                        >
                          <div className="flex items-center gap-1 text-sm" style={{ color: theme.colors.textSecondary }}>
                            <Folder size={14} />
                            {file.folder === 'root' ? t.root : file.folder}
                          </div>
                        </td>
                        <td 
                          className="px-4 lg:px-6 py-4 text-sm cursor-pointer"
                          style={{ color: theme.colors.text }}
                          onClick={() => setSelectedFile(file)}
                        >
                          {formatFileSize(file.size)}
                        </td>
                        <td 
                          className="px-4 lg:px-6 py-4 text-sm cursor-pointer"
                          style={{ color: theme.colors.textSecondary }}
                          onClick={() => setSelectedFile(file)}
                        >
                          {file.mimeType}
                        </td>
                        <td 
                          className="px-4 lg:px-6 py-4 text-sm cursor-pointer"
                          style={{ color: theme.colors.textSecondary }}
                          onClick={() => setSelectedFile(file)}
                        >
                          {formatDate(file.created_at)}
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(file.url, '_blank');
                              }}
                              className="p-2 rounded-lg transition-colors duration-300"
                              style={{
                                backgroundColor: theme.colors.secondary,
                                color: theme.colors.text
                              }}
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const link = document.createElement('a');
                                link.href = file.url;
                                link.download = file.name;
                                link.click();
                              }}
                              className="p-2 rounded-lg transition-colors duration-300"
                              style={{
                                backgroundColor: theme.colors.secondary,
                                color: theme.colors.text
                              }}
                              title="Download"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(file);
                              }}
                              disabled={deleting === file.path}
                              className="p-2 rounded-lg transition-colors duration-300 disabled:opacity-50"
                              style={{
                                backgroundColor: theme.colors.secondary,
                                color: '#ef4444'
                              }}
                              title="Delete"
                            >
                              {deleting === file.path ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredFiles.length === 0 && (
            <div className="text-center py-12 px-4">
              <ImageIcon
                size={48}
                className="mx-auto mb-4"
                style={{ color: theme.colors.textSecondary }}
              />
              <p
                className="text-sm sm:text-base transition-colors duration-300"
                style={{ color: theme.colors.textSecondary }}
              >
                {filteredFiles.length === files.length ? t.noMediaFiles : t.noFilesMatch}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {selectedFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          onClick={() => setSelectedFile(null)}
        >
          <div
            className="max-w-4xl w-full max-h-[90vh] overflow-auto rounded-lg"
            style={{ backgroundColor: theme.colors.surface }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 p-4 border-b flex items-center justify-between" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate" style={{ color: theme.colors.text }}>
                  {selectedFile.name}
                </h3>
                <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                  {formatFileSize(selectedFile.size)} • {selectedFile.mimeType}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.secondary,
                    color: theme.colors.text
                  }}
                  title={t.openInNewTab}
                >
                  <ExternalLink size={18} />
                </a>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-2 rounded-lg transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.secondary,
                    color: theme.colors.text
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-4">
              {isImage(selectedFile.mimeType) ? (
                <img
                  src={selectedFile.url}
                  alt={selectedFile.name}
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center h-64" style={{ backgroundColor: theme.colors.secondary }}>
                  <div className="text-center">
                    <ImageIcon size={48} style={{ color: theme.colors.textSecondary }} className="mx-auto mb-2" />
                    <p style={{ color: theme.colors.textSecondary }}>{t.previewNotAvailable}</p>
                    <a
                      href={selectedFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                      style={{
                        backgroundColor: theme.colors.primary,
                        color: '#ffffff'
                      }}
                    >
                      <Download size={16} />
                      {t.downloadFile}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => !uploadingFiles && setShowUploadModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-xl font-semibold"
                  style={{ color: theme.colors.text }}
                >
                  {t.uploadMedia}
                </h2>
                <button
                  onClick={() => !uploadingFiles && setShowUploadModal(false)}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  disabled={uploadingFiles}
                >
                  <X size={20} style={{ color: theme.colors.text }} />
                </button>
              </div>

              <div className="mb-6">
                <label
                  className="block mb-2 text-sm font-medium"
                  style={{ color: theme.colors.text }}
                >
                  {t.selectFiles}
                </label>
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
                  style={{
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.cardBg
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = theme.colors.primary;
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = theme.colors.border;
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = theme.colors.border;
                    const files = Array.from(e.dataTransfer.files);
                    handleFileUpload(files);
                  }}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      handleFileUpload(files);
                    }}
                    disabled={uploadingFiles}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer"
                  >
                    <ImageIcon
                      size={48}
                      className="mx-auto mb-4"
                      style={{ color: theme.colors.textSecondary }}
                    />
                    <p
                      className="text-sm mb-2"
                      style={{ color: theme.colors.text }}
                    >
                      {t.dropFilesHere}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {t.supportedFormats}
                    </p>
                  </label>
                </div>
              </div>

              {uploadProgress && (
                <div
                  className="p-4 rounded-lg mb-4"
                  style={{
                    backgroundColor: uploadProgress.includes('✅') || uploadProgress.includes(t.uploadSuccess)
                      ? 'rgba(34, 197, 94, 0.1)'
                      : uploadProgress.includes('❌') || uploadProgress.includes(t.uploadError)
                      ? 'rgba(239, 68, 68, 0.1)'
                      : theme.colors.secondary
                  }}
                >
                  <p
                    className="text-sm"
                    style={{ color: theme.colors.text }}
                  >
                    {uploadProgress}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

