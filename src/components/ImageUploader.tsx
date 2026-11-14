import * as React from 'react';
import { Camera, ImagePlus, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB per file

/**
 * Up to 5 photos, compressed client-side into data URLs.
 * In Supabase mode these would be uploaded to a `listing-images` bucket instead.
 */
export function ImageUploader({
  images,
  onChange,
  max = 5,
  onError,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
  max?: number;
  onError?: (msg: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);

  /** Downscale + JPEG-compress an image file to keep localStorage small. */
  const compress = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read that file'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Unsupported image file'));
        img.onload = () => {
          const maxSide = 1000;
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas not supported'));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = max - images.length;
    if (room <= 0) {
      onError?.(`You can upload up to ${max} photos`);
      return;
    }
    const picked = Array.from(files).slice(0, room);
    setBusy(true);
    const next: string[] = [];
    for (const file of picked) {
      if (!file.type.startsWith('image/')) {
        onError?.(`"${file.name}" is not an image file`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        onError?.(`"${file.name}" is larger than 3 MB`);
        continue;
      }
      try {
        next.push(await compress(file));
      } catch (e) {
        onError?.((e as Error).message);
      }
    }
    if (next.length) onChange([...images, ...next].slice(0, max));
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'grid grid-cols-3 gap-2 rounded-2xl border-2 border-dashed p-2 transition-colors sm:grid-cols-5',
          dragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/40',
        )}
      >
        {images.map((src, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-xl bg-card">
            <img src={src} alt={`Listing photo ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                COVER
              </span>
            )}
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
              aria-label={`Remove photo ${i + 1}`}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card text-muted-foreground transition hover:border-primary/50 hover:text-primary"
            aria-label="Add photos"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            <span className="text-[10px] font-medium">{busy ? 'Adding…' : 'Add photo'}</span>
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Camera className="h-3.5 w-3.5" /> Add clear photos of the scrap — dealers trust them more.
        </span>
        <span>{images.length}/{max}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
    </div>
  );
}
