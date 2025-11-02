
import React from 'react';
import { type RenamedFileData } from '../types';
import { XIcon } from './icons';

interface ImagePreviewCardProps {
  fileData: RenamedFileData;
  onRemove: (id: string) => void;
}

export const ImagePreviewCard: React.FC<ImagePreviewCardProps> = ({ fileData, onRemove }) => {
  return (
    <div className="group relative bg-gray-700 rounded-lg overflow-hidden shadow-md border border-gray-600 transition-all duration-300 hover:shadow-lg hover:border-blue-500">
      <img src={fileData.objectUrl} alt={fileData.originalName} className="w-full h-24 object-cover" />
      <button 
        onClick={() => onRemove(fileData.id)}
        className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-red-500"
        aria-label="Remove file"
      >
        <XIcon className="h-4 w-4" />
      </button>
      <div className="p-2 text-xs">
        <p className="text-gray-400 truncate" title={fileData.originalName}>{fileData.originalName}</p>
        <p className="text-teal-300 font-semibold truncate" title={fileData.newName}>{fileData.newName}</p>
      </div>
    </div>
  );
};
