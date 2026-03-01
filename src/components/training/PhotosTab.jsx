import { useState } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { ProtectedImage } from '../ProtectedImage';

export function PhotosTab({ session, isOngoing, isScheduled, onUploadPhotos }) {
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!photoFiles.length) return;
    setUploading(true);
    const formData = new FormData();
    photoFiles.forEach(f => formData.append('photos', f));
    if (photoCaption) formData.append('caption', photoCaption);
    try {
      await onUploadPhotos(formData);
      setPhotoFiles([]);
      setPhotoCaption('');
    } catch (err) {
      alert('Gagal upload foto');
    }
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      {(isOngoing || isScheduled) && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <label className="block text-sm font-medium text-slate-700">Upload Foto Latihan</label>
          <input type="file" accept="image/*" multiple
            onChange={e => setPhotoFiles(Array.from(e.target.files))}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
          <input type="text" value={photoCaption} onChange={e => setPhotoCaption(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" placeholder="Caption foto (opsional)" />
          {photoFiles.length > 0 && (
            <button onClick={handleUpload} disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload {photoFiles.length} foto
            </button>
          )}
        </div>
      )}

      {session.photos?.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {session.photos.map(photo => (
            <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-slate-200">
              <ProtectedImage
                src={photo.photo_url.startsWith('http') ? photo.photo_url : `/api/storage/${photo.photo_url}`}
                alt={photo.caption || 'Foto latihan'}
                className="w-full h-48 object-contain bg-slate-100"
              />
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white text-sm">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-400">
          <Camera className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>Belum ada foto latihan</p>
        </div>
      )}
    </div>
  );
}
