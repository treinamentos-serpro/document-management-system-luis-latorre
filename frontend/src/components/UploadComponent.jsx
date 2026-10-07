import { useRef, useState } from 'react';
import { LoaderCircle, Upload } from 'lucide-react';
import { uploadDocument } from '../services/api.js';

const maxFileSize = 10 * 1024 * 1024;

export default function UploadComponent({ onUploaded }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (uploading) return;
    setError('');
    setMessage('');
    if (!file) return setError('Selecione um arquivo.');
    if (!file.size) return setError('O arquivo nao pode estar vazio.');
    if (file.size > maxFileSize) return setError('O arquivo excede o limite de 10 MiB.');

    setUploading(true);
    try {
      const document = await uploadDocument(file);
      setFile(null);
      inputRef.current.value = '';
      setMessage(`${document.originalName} enviado com sucesso.`);
      onUploaded(document);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit} aria-busy={uploading}>
      <label htmlFor="document-file">Arquivo</label>
      <div className="upload-controls">
        <input
          ref={inputRef}
          id="document-file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          disabled={uploading}
          onChange={(event) => {
            setFile(event.target.files[0] || null);
            setError('');
            setMessage('');
          }}
        />
        <button className="primary-button" type="submit" disabled={!file || uploading}>
          {uploading ? <LoaderCircle className="spinning" size={18} /> : <Upload size={18} />}
          {uploading ? 'Enviando...' : 'Enviar arquivo'}
        </button>
      </div>
      {error && <p className="feedback error" role="alert">{error}</p>}
      <p className="feedback success" role="status">{message}</p>
    </form>
  );
}