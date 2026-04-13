import { useState, useRef } from 'react';
import { uploadFile } from '@/lib/supabase-helpers';
import { Upload, X } from 'lucide-react';

interface Props {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  accept?: string;
}

export default function ImageUpload({ label, value, onChange, folder, accept = 'image/png,image/jpeg,image/jpg,image/icon' }: Props) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, folder);
      onChange(url);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    }
    setUploading(false);
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="w-24 h-24 object-cover rounded-lg border border-border" />
          <button onClick={() => onChange(null)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className="w-full py-8 border-2 border-dashed border-border rounded-lg flex flex-col items-center gap-2 hover:bg-secondary/50 transition-colors"
        >
          <Upload className="w-6 h-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload'}</span>
        </button>
      )}
      <input ref={ref} type="file" accept={accept} onChange={handleFile} className="hidden" />
    </div>
  );
}
