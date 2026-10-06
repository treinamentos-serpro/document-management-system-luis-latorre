import { useEffect, useState } from 'react';
import { Files } from 'lucide-react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/api.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    listDocuments(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setDocuments(result);
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);

  function handleUploaded(document) {
    setDocuments((current) => [...current.filter((item) => item.id !== document.id), document]);
    setRevision((current) => current + 1);
  }

  return (
    <>
      <header className="app-header">
        <div className="header-content"><Files size={26} aria-hidden="true" /><span>DMS</span><span className="workspace-label">Documentos</span></div>
      </header>
      <main className="workspace">
        <div className="page-heading"><p className="eyebrow">ARQUIVO PESSOAL</p><h1>Documentos</h1></div>
        <section className="upload-section" aria-labelledby="upload-title">
          <h2 id="upload-title">Novo documento</h2>
          <UploadComponent onUploaded={handleUploaded} />
        </section>
        <DocumentList
          documents={documents}
          loading={loading}
          error={error}
          onRefresh={() => setRevision((current) => current + 1)}
        />
      </main>
    </>
  );
}
