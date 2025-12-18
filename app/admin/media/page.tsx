'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { getAdminSession } from '@/lib/auth';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface MediaFile {
  name: string;
  path: string;
  url: string;
  size?: number;
  folder: string;
}

export default function MediaPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language || 'en'];
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('images');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getAdminSession();
        if (!session) {
          router.push('/admin/login');
          return;
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadMediaFiles();
    }
  }, [isAuthenticated, selectedFolder]);

  const loadMediaFiles = async () => {
    try {
      setLoading(true);
      console.log('🔍 DEBUG: Loading media files for folder:', selectedFolder);
      const response = await fetch(`/api/storage/list?folders=${selectedFolder}&limit=200`);
      const result = await response.json();
      console.log('🔍 DEBUG: Media API response:', result);

      if (result.success) {
        console.log('🔍 DEBUG: Setting media files:', result.files?.length || 0, 'files');
        console.log('🔍 DEBUG: Media files data:', result.files);
        setMediaFiles(result.files || []);
      } else {
        console.error('🔍 DEBUG: API returned error:', result.error);
      }
    } catch (error) {
      console.error('Failed to load media files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', selectedFolder);

        const response = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        if (!result.success) {
          alert(`${t.failedToUpload} ${file.name}: ${result.error}`);
        }
      }

      // Reload media files
      loadMediaFiles();
    } catch (error) {
      console.error('Upload error:', error);
      alert(t.uploadError);
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (path: string) => {
    if (!confirm(t.confirmDeleteFile)) return;

    try {
      const response = await fetch('/api/storage/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });

      const result = await response.json();
      if (result.success) {
        loadMediaFiles();
      } else {
        alert(t.deleteFileError + ': ' + result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(t.deleteFileError);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const folders = ['images', 'logos', 'hero-images'];
  
  const getFolderDisplayName = (folder: string): string => {
    switch (folder) {
      case 'images':
        return t.folderImages;
      case 'logos':
        return t.folderLogos;
      case 'hero-images':
        return t.folderHeroImages;
      default:
        return folder.replace('-', ' ').toUpperCase();
    }
  };

  const folderFiles = mediaFiles.filter(file => {
    const fileFolder = file.path.split('/')[0]; // Extract folder from path like "images/filename.jpg"
    const matches = fileFolder === selectedFolder;
    console.log('🔍 DEBUG: Filtering file:', file.name, 'folder:', fileFolder, 'selected:', selectedFolder, 'matches:', matches);
    return matches;
  });

  console.log('🔍 DEBUG: Total media files:', mediaFiles.length, 'filtered to:', folderFiles.length, 'for folder:', selectedFolder);

  return (
    <AdminLayout currentPath="/admin/media">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t.mediaLibrary}</h1>
          <p className="text-gray-600 mt-2">{t.manageImagesAndMediaFiles}</p>
        </div>

        {/* Folder Selection */}
        <div className="mb-6">
          <div className="flex gap-2">
            {folders.map(folder => (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedFolder === folder
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getFolderDisplayName(folder)}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">{t.uploadFiles}</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-gray-600 mb-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-500">{t.clickToUpload}</span> {t.orDragAndDrop}
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                disabled={uploading}
              />
            </div>
            <p className="text-sm text-gray-500">{t.supportedImageFormats}</p>
            {uploading && (
              <div className="mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">{t.uploading}</p>
              </div>
            )}
          </div>
        </div>

        {/* Media Grid */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">
              {getFolderDisplayName(selectedFolder)} ({folderFiles.length} {t.files})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-500">{t.loadingMediaFiles}</p>
            </div>
          ) : folderFiles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>{t.noFilesInFolder}</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {folderFiles.map((file, index) => (
                  <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => deleteFile(file.path)}
                        className="opacity-0 group-hover:opacity-100 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                        title={t.deleteFile}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                      <p className="text-xs truncate" title={file.name}>
                        {file.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}