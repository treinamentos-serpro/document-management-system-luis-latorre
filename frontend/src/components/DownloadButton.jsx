import { useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import { downloadDocument } from '../services/api.js';

export default function DownloadButton({ document }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    setError('');
    try {
      const blob = await downloadDocument(document.id);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName;
      window.document.body.appendChild(link);
      try {
        link.click();
      } finally {
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="download-action">
      <button
        className="icon-button"
        type="button"
        title={`Baixar ${document.originalName}`}
        aria-label={`Baixar ${document.originalName}`}
        disabled={downloading}
        onClick={handleDownload}
      >
        {downloading ? <LoaderCircle className="spinning" size={19} /> : <Download size={19} />}
      </button>
      {error && <p className="feedback error" role="alert">{error}</p>}
    </div>
  );
}