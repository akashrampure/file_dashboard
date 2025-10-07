import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, Download, Loader2, ZoomIn, ZoomOut, RotateCw, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { harnessApi } from '../api';
import toast from 'react-hot-toast';

interface FileViewerProps {
  folder: string;
  filename: string;
  onClose: () => void;
}

interface Position {
  x: number;
  y: number;
}

export default function FileViewer({ folder, filename, onClose }: FileViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<Position>({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const MIN_ZOOM = 25;
  const MAX_ZOOM = 400;
  const ZOOM_STEP = 25;

  const loadFile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const blob = await harnessApi.getFileContent(folder, filename);
      
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      
      const newObjectUrl = URL.createObjectURL(blob);
      setObjectUrl(newObjectUrl);
      
      if (blob.type.startsWith('image/')) {
        setFileType('image');
      } else if (blob.type === 'application/pdf') {
        setFileType('pdf');
      }
      
      setError(null);
      setPosition({ x: 0, y: 0 });
      setZoom(100);
    } catch (err) {
      setError('Failed to load file. Please try refreshing.');
      console.error('File loading error:', err);
      toast.error('Failed to load file');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFile();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [folder, filename]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFile();
  };

  const handleDownload = async () => {
    try {
      await harnessApi.downloadFile(folder, filename);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const adjustZoom = useCallback((delta: number) => {
    setZoom(prevZoom => {
      const newZoom = Math.round((prevZoom + delta) / ZOOM_STEP) * ZOOM_STEP;
      return Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);
    });
  }, []);

  const handleZoomIn = () => adjustZoom(ZOOM_STEP);
  const handleZoomOut = () => adjustZoom(-ZOOM_STEP);
  const handleFitToScreen = () => {
    setZoom(100);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      adjustZoom(delta);
    }
  }, [adjustZoom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 100) return;
    
    if (e.button === 0) {
      e.preventDefault();
      setIsDragging(true);
      setStartPos({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      
      if (imageRef.current) {
        imageRef.current.style.cursor = 'grabbing';
      }
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;

    // Calculate bounds based on zoom level and container size
    if (contentRef.current && imageRef.current) {
      const container = contentRef.current.getBoundingClientRect();
      const image = imageRef.current.getBoundingClientRect();
      
      const maxX = (image.width * (zoom / 100) - container.width) / 2;
      const maxY = (image.height * (zoom / 100) - container.height) / 2;

      const boundedX = Math.min(Math.max(newX, -maxX), maxX);
      const boundedY = Math.min(Math.max(newY, -maxY), maxY);

      setPosition({ x: boundedX, y: boundedY });
    }
  }, [isDragging, startPos, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (imageRef.current) {
      imageRef.current.style.cursor = zoom > 100 ? 'grab' : 'default';
    }
  }, [zoom]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const viewer = document.getElementById('file-viewer-content');
    if (viewer) {
      viewer.addEventListener('wheel', handleWheel, { passive: false });
      return () => viewer.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  useEffect(() => {
    if (imageRef.current) {
      imageRef.current.style.cursor = zoom > 100 ? 'grab' : 'default';
    }
  }, [zoom]);

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const renderZoomControls = () => (
    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-2">
      <button
        onClick={handleZoomOut}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        disabled={zoom <= MIN_ZOOM}
        title="Zoom Out (Ctrl + Mouse Wheel Down)"
      >
        <ZoomOut className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={ZOOM_STEP}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-sm font-medium text-gray-700 min-w-[48px] text-center">
          {zoom}%
        </span>
      </div>
      <button
        onClick={handleZoomIn}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        disabled={zoom >= MAX_ZOOM}
        title="Zoom In (Ctrl + Mouse Wheel Up)"
      >
        <ZoomIn className="w-5 h-5" />
      </button>
      <button
        onClick={handleFitToScreen}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2"
        title="Fit to Screen"
      >
        {zoom > 100 ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-[80%] h-[80%] flex flex-col rounded-lg shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-medium text-gray-900">{filename}</h3>
          </div>
          <div className="flex items-center gap-2">
            {fileType === 'image' && (
              <>
                {renderZoomControls()}
                <button
                  onClick={handleRotate}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-2"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={handleRefresh}
              className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${
                refreshing ? 'animate-spin' : ''
              }`}
              disabled={refreshing}
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors ml-4"
              disabled={loading || !!error}
            >
              <Download className="w-5 h-5" />
              Download
            </button>
          </div>
        </div>

        <div 
          id="file-viewer-content"
          ref={contentRef}
          className="flex-1 overflow-hidden bg-[#1a1a1a] relative rounded-b-lg"
        >
          {loading || refreshing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
              <p className="text-gray-200">
                {refreshing ? 'Refreshing...' : 'Loading file...'}
              </p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400">
              <p>{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              {fileType === 'image' ? (
                <div 
                  className="relative overflow-hidden h-full w-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: '#1a1a1a',
                    backgroundImage: 'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                  }}
                  onMouseDown={handleMouseDown}
                >
                  <img
                    ref={imageRef}
                    src={objectUrl || ''}
                    alt={filename}
                    style={{
                      transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transition: isDragging ? 'none' : 'transform 0.3s ease',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      cursor: zoom > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                    }}
                    className="rounded"
                    onError={() => setError('Failed to load image')}
                    draggable={false}
                  />
                </div>
              ) : (
                <iframe
                  src={`${objectUrl}#view=FitH`}
                  className="w-full h-full bg-white rounded"
                  title="Document Viewer"
                  onError={() => setError('Failed to load document')}
                />
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}