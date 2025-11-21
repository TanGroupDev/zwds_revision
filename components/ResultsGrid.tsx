import React from 'react';
import { ProcessedImage, RegionData } from '../types';

interface ResultsGridProps {
  data: ProcessedImage;
}

declare global {
  interface Window {
    JSZip: any;
  }
}

const ResultsGrid: React.FC<ResultsGridProps> = ({ data }) => {
  
  const handleDownloadAll = async () => {
    if (!window.JSZip) {
      alert("JSZip library not loaded properly.");
      return;
    }

    const zip = new window.JSZip();
    const folder = zip.folder("ZWDS_Segments");

    data.regions.forEach((region) => {
      folder.file(`box_${region.id}.jpg`, region.blob);
    });

    try {
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = "ZWDS_Chart_Segments.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to zip files", err);
      alert("Failed to create zip file.");
    }
  };

  return (
    <div className="w-full space-y-8 animate-fade-in">
      
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <div className="text-gray-400 text-sm">Resolution</div>
            <div className="text-xl font-mono text-indigo-400">{data.resolution.width} x {data.resolution.height}</div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <div className="text-gray-400 text-sm">Regions Detected</div>
            <div className="text-xl font-mono text-green-400">{data.regions.length} / 13</div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <div className="text-gray-400 text-sm">Processing Time</div>
            <div className="text-xl font-mono text-orange-400">{data.processingTimeMs}ms</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-indigo-900/20 p-6 rounded-2xl border border-indigo-500/30">
        <div>
            <h2 className="text-2xl font-bold text-white">Segmentation Results</h2>
            <p className="text-indigo-200 text-sm mt-1">Successfully validated structure.</p>
        </div>
        <button 
            onClick={handleDownloadAll}
            className="mt-4 md:mt-0 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/40 transition-all transform hover:scale-105 flex items-center gap-2"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download All (ZIP)
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {data.regions.map((region) => (
          <div key={region.id} className="group relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-indigo-500 transition-colors">
            <div className="aspect-square relative bg-black/40 p-2 flex items-center justify-center">
                <img 
                    src={region.url} 
                    alt={`Region ${region.id}`} 
                    className="max-w-full max-h-full object-contain shadow-md" 
                />
            </div>
            <div className="p-3 flex justify-between items-center bg-gray-900">
                <span className="text-xs font-mono text-gray-400">Box #{region.id}</span>
                <a 
                    href={region.url} 
                    download={`box_${region.id}.jpg`}
                    className="text-indigo-400 hover:text-white transition-colors p-1"
                    title="Download single image"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </a>
            </div>
          </div>
        ))}
      </div>

      {/* Technical Visuals Section */}
      <div className="mt-12 pt-8 border-t border-gray-800">
         <h3 className="text-lg font-semibold text-gray-300 mb-4">Computer Vision Debug View</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-gray-500">Original Input</p>
                <img src={data.originalUrl} className="w-full h-64 object-contain bg-black rounded-lg border border-gray-700 opacity-80" alt="Original" />
            </div>
            <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-gray-500">Inverted Segmentation Mask (Threshold: 40)</p>
                <img src={data.cutoutMapUrl} className="w-full h-64 object-contain bg-black rounded-lg border border-gray-700 image-pixelated" alt="Mask" />
            </div>
         </div>
      </div>
    </div>
  );
};

export default ResultsGrid;
