import { useEffect, useState } from 'react';
import { Eye, EyeOff, FileText, Loader2, Trash2 } from 'lucide-react';
import api from '../../../api/axios';

// Preview loads a protected file as a blob; the object URL lives only while shown.
function EvidencePreview({ url, file }) {
  const [state, setState] = useState({ objectUrl: '', error: false });

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = '';
    api.get(url, { responseType: 'blob', signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(response.data);
        setState({ objectUrl, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ objectUrl: '', error: true });
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (state.error) return <p className="mt-2 text-xs text-red-600">File bukti gagal dimuat.</p>;
  if (!state.objectUrl) {
    return <p className="mt-2 flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin" />Memuat file...</p>;
  }
  return (
    <div className="mt-2">
      {file.content_type === 'application/pdf' ? (
        <iframe src={state.objectUrl} title={file.file_name} className="h-96 w-full rounded-lg border border-slate-200" />
      ) : (
        <img src={state.objectUrl} alt={file.file_name} className="max-h-96 w-full rounded-lg border border-slate-200 object-contain" />
      )}
      <a href={state.objectUrl} download={file.file_name} className="mt-1 inline-block text-xs font-semibold text-red-600 hover:underline">Unduh file</a>
    </div>
  );
}

/** Evidence files of one achievement. `fileUrl(file)` gives the protected download path. */
export function EvidenceFileList({ files = [], fileUrl, onDelete, deleteDisabled = false }) {
  const [openId, setOpenId] = useState(null);

  if (files.length === 0) return <p className="text-xs italic text-slate-500">Belum ada file bukti.</p>;

  return (
    <ul className="space-y-1.5">
      {files.map((file) => {
        const isOpen = openId === file.id;
        return (
          <li key={file.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">{file.file_name}</span>
              <button type="button" onClick={() => setOpenId(isOpen ? null : file.id)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-white">
                {isOpen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {isOpen ? 'Tutup' : 'Lihat'}
              </button>
              {onDelete && (
                <button type="button" onClick={() => onDelete(file)} disabled={deleteDisabled} aria-label={`Hapus file ${file.file_name}`} className="rounded-md p-1 text-red-600 hover:bg-red-50 disabled:opacity-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {isOpen && <EvidencePreview url={fileUrl(file)} file={file} />}
          </li>
        );
      })}
    </ul>
  );
}
