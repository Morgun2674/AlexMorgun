
import React, { useState, useEffect, useCallback } from 'react';
import { type RenamedFileData } from './types';
import { ImagePreviewCard } from './components/ImagePreviewCard';
import { Button } from './components/Button';
import { UploadCloudIcon, DownloadIcon, FileIcon, LoaderIcon } from './components/icons';

declare const JSZip: any;

const MAX_FILES = 15;

export default function App() {
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [renamedFiles, setRenamedFiles] = useState<RenamedFileData[]>([]);
  const [baseName, setBaseName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  useEffect(() => {
    // Revoke URLs for files that are no longer in the source list
    const currentFileIds = new Set(sourceFiles.map(f => `${f.name}-${f.lastModified}`));
    renamedFiles.forEach(rf => {
      if (!currentFileIds.has(rf.id)) {
        URL.revokeObjectURL(rf.objectUrl);
      }
    });

    const updatedFiles = sourceFiles.map((file, index) => {
        const fileId = `${file.name}-${file.lastModified}`;
        const extension = file.name.split('.').pop() || 'file';
        const newName = baseName.trim()
          ? `${baseName.trim()}${index + 1}.${extension}`
          : file.name;

        const existingFile = renamedFiles.find(rf => rf.id === fileId);
        
        return {
          id: fileId,
          originalName: file.name,
          newName: newName,
          objectUrl: existingFile?.objectUrl || URL.createObjectURL(file),
          file: file,
        };
      });

    setRenamedFiles(updatedFiles);

    // Cleanup function for when the component unmounts
    return () => {
        // Use the latest 'updatedFiles' from this render's closure
        updatedFiles.forEach(file => URL.revokeObjectURL(file.objectUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFiles, baseName]);

  const processFiles = (files: File[]) => {
    setError(null);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length !== files.length) {
      setError('Пожалуйста, загружайте только файлы изображений.');
    }

    if (imageFiles.length > MAX_FILES) {
      setError(`Вы можете загрузить не более ${MAX_FILES} фотографий.`);
      setSourceFiles(imageFiles.slice(0, MAX_FILES));
    } else {
      setSourceFiles(imageFiles);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      processFiles(Array.from(event.target.files));
    }
    event.target.value = ''; // Reset input to allow re-uploading the same file
  };
  
  const handleRemoveFile = useCallback((idToRemove: string) => {
    setSourceFiles(prevFiles => prevFiles.filter(file => `${file.name}-${file.lastModified}` !== idToRemove));
  }, []);

  const handleDownload = async () => {
    if (renamedFiles.length === 0 || !baseName.trim()) {
      setError('Пожалуйста, загрузите файлы и укажите базовое имя.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const zip = new JSZip();
      renamedFiles.forEach(fileData => {
        zip.file(fileData.newName, fileData.file);
      });
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${baseName.trim()}_photos.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (err) {
      setError('Не удалось создать ZIP-архив. Пожалуйста, попробуйте снова.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      processFiles(Array.from(event.dataTransfer.files));
      event.dataTransfer.clearData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">Пакетное переименование фото</h1>
          <p className="mt-2 text-lg text-gray-400">Загрузите до {MAX_FILES} фото, задайте имя, и скачайте ZIP-архив.</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 h-fit">
            <h2 className="text-2xl font-semibold mb-4 text-teal-300">Управление</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-2">1. Загрузите фотографии</label>
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md transition-colors ${isDraggingOver ? 'border-blue-500 bg-gray-700' : ''}`}
                >
                  <div className="space-y-1 text-center">
                    <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-500" />
                    <div className="flex text-sm text-gray-400">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-blue-400 hover:text-blue-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-blue-500">
                        <span>Выберите файлы</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleFileChange} />
                      </label>
                      <p className="pl-1">или перетащите их сюда</p>
                    </div>
                    <p className="text-xs text-gray-500">Изображения (PNG, JPG, и т.д.)</p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="base-name" className="block text-sm font-medium text-gray-300 mb-2">2. Введите базовое имя</label>
                <input
                  type="text"
                  id="base-name"
                  value={baseName}
                  onChange={(e) => setBaseName(e.target.value)}
                  placeholder="Например: Слава"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition"
                  disabled={sourceFiles.length === 0}
                />
                 <p className="text-xs text-gray-500 mt-1">Файлы будут названы: {baseName || "имя"}1, {baseName || "имя"}2 и т.д.</p>
              </div>

              <div>
                 <Button 
                    onClick={handleDownload}
                    disabled={isLoading || sourceFiles.length === 0 || !baseName.trim()}
                 >
                    {isLoading ? (
                        <>
                           <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                            Создание архива...
                        </>
                    ) : (
                        <>
                            <DownloadIcon className="-ml-1 mr-3 h-5 w-5" />
                            Скачать .zip ({renamedFiles.length})
                        </>
                    )}
                 </Button>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          </div>
          
          <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 min-h-[300px]">
            <h2 className="text-2xl font-semibold mb-4 text-teal-300">Предпросмотр</h2>
            {renamedFiles.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {renamedFiles.map(fileData => (
                    <ImagePreviewCard key={fileData.id} fileData={fileData} onRemove={handleRemoveFile} />
                ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                    <FileIcon className="h-16 w-16 mb-4"/>
                    <p className="text-lg font-medium">Фотографии для переименования не выбраны</p>
                    <p className="text-sm">Выберите файлы в панели управления слева.</p>
                </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
