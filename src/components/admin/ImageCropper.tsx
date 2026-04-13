import { useState, useRef, useEffect } from 'react';
import { uploadFile } from '@/lib/supabase-helpers';
import { Upload, X, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface Props {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  previewAspectRatio?: number; // e.g., 2 for 2:1, 16/9 for 16:9
  previewLabel?: string;
}

interface CropData {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export default function ImageCropper({ 
  label, 
  value, 
  onChange, 
  folder, 
  previewAspectRatio = 16/9,
  previewLabel = 'Preview'
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [cropData, setCropData] = useState<CropData>({ offsetX: 0, offsetY: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, folder);
      onChange(url);
      setCropData({ offsetX: 0, offsetY: 0, scale: 1 });
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setUploading(false);
  }

  function handleMouseDown(e: React.MouseEvent) {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropData.offsetX, y: e.clientY - cropData.offsetY });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging || !canvasRef.current) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setCropData(prev => ({ ...prev, offsetX: newX, offsetY: newY }));
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setCropData(prev => ({ ...prev, scale: Math.max(1, Math.min(3, prev.scale + delta)) }));
  }

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">{label}</label>
        {value ? (
          <div className="space-y-4">
            {/* Upload Area */}
            <div className="relative inline-block">
              <img src={value} alt="" className="w-24 h-24 object-cover rounded-lg border border-border" />
              <button onClick={() => { onChange(null); setCropData({ offsetX: 0, offsetY: 0, scale: 1 }); }} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Crop Controls */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <div>
                <p className="text-xs font-medium mb-2 flex items-center gap-1">
                  <Move className="w-3 h-3" /> Drag to adjust image position
                </p>
                <div
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onWheel={handleWheel}
                  className="relative w-full bg-black rounded-lg overflow-hidden cursor-move border border-border"
                  style={{ aspectRatio: previewAspectRatio }}
                >
                  <img
                    ref={imgRef}
                    src={value}
                    alt=""
                    className="absolute w-full h-full object-cover"
                    style={{
                      transform: `translate(${cropData.offsetX}px, ${cropData.offsetY}px) scale(${cropData.scale})`,
                      transformOrigin: 'center',
                    }}
                  />
                </div>
              </div>

              {/* Zoom Controls */}
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setCropData(prev => ({ ...prev, scale: Math.max(1, prev.scale - 0.1) }))}
                  className="p-2 rounded border border-border hover:bg-secondary"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={cropData.scale}
                  onChange={(e) => setCropData(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                  className="flex-1"
                />
                <button
                  onClick={() => setCropData(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.1) }))}
                  className="p-2 rounded border border-border hover:bg-secondary"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <span className="text-xs text-muted-foreground w-8">{cropData.scale.toFixed(1)}x</span>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => setCropData({ offsetX: 0, offsetY: 0, scale: 1 })}
                className="w-full text-sm px-3 py-2 rounded border border-border hover:bg-secondary"
              >
                Reset
              </button>
            </div>

            {/* Preview */}
            <div className="border-t pt-4">
              <p className="text-xs font-medium mb-2">{previewLabel}</p>
              <div
                className="w-full bg-gray-900 rounded-lg overflow-hidden border border-border"
                style={{ aspectRatio: previewAspectRatio }}
              >
                <img
                  src={value}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{
                    transform: `translate(${cropData.offsetX}px, ${cropData.offsetY}px) scale(${cropData.scale})`,
                    transformOrigin: 'center',
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-8 border-2 border-dashed border-border rounded-lg flex flex-col items-center gap-2 hover:bg-secondary/50 transition-colors"
          >
            <Upload className="w-6 h-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload image'}</span>
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleFile} className="hidden" />
      </div>
    </div>
  );
}
