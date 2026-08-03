import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

export default function ImageGallery({ photos = [], alt = 'Item photo' }) {
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  if (!photos.length) {
    return (
      <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">
        No photos available
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden group">
          <img
            src={photos[selected]}
            alt={alt}
            className="w-full h-full object-contain cursor-pointer"
            onClick={() => setZoomed(true)}
          />
          <button
            onClick={() => setZoomed(true)}
            className="absolute bottom-3 right-3 p-2 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setSelected((s) => (s - 1 + photos.length) % photos.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 text-white rounded-full"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setSelected((s) => (s + 1) % photos.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 text-white rounded-full"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                  i === selected ? 'border-primary-500' : 'border-transparent'
                }`}
              >
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <button className="absolute top-4 right-4 text-white p-2" onClick={() => setZoomed(false)}>
            <X className="h-6 w-6" />
          </button>
          <img
            src={photos[selected]}
            alt={alt}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
