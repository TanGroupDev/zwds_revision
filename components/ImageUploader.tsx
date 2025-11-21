import React, { useCallback } from 'react';

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  isProcessing: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload, isProcessing }) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  }, [onUpload, isProcessing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
      // Reset the value so the same file can be selected again if the previous attempt was cancelled/blocked
      e.target.value = ''; 
    }
  };

  return (
    <div 
      className={`w-full max-w-2xl p-12 border-4 border-dashed rounded-3xl transition-all duration-300 flex flex-col items-center justify-center text-center
        ${isProcessing 
          ? 'border-gray-600 bg-gray-900 opacity-50 cursor-not-allowed' 
          : 'border-indigo-500 bg-gray-800/50 hover:bg-gray-800 hover:border-indigo-400 cursor-pointer'
        }
      `}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleChange} 
        className="hidden" 
        id="file-upload"
        disabled={isProcessing}
      />
      <label htmlFor="file-upload" className="w-full h-full cursor-pointer flex flex-col items-center">
        <div className="mb-4 p-4 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Upload ZWDS Chart</h3>
        <p className="text-gray-400 mb-6">Drag & drop or click to browse</p>
        <div className="text-xs text-indigo-300 bg-indigo-900/30 px-3 py-1 rounded-full">
            Optimized for High-Res Chart Images
        </div>
      </label>
    </div>
  );
};

export default ImageUploader;