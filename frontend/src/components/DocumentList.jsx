import { FileText, LoaderCircle, RefreshCw } from 'lucide-react';
import DownloadButton from './DownloadButton.jsx';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${numberFormatter.format(bytes / 1024)} KB`;
  return `${numberFormatter.format(bytes / (1024 * 1024))} MB`;
}

export default function DocumentList({ documents, loading, error, onRefresh }) {
  return (
    <section className="documents-section" aria-labelledby="documents-title" aria-busy={loading}>
      <div className="section-heading">
        <div className="heading-with-count">
          <h2 id="documents-title">Meus documentos</h2>
          <span className="document-count">{documents.length}</span>
        </div>
        <button
          className="icon-button"
          type="button"
          title="Atualizar documentos"
          aria-label="Atualizar documentos"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? <LoaderCircle className="spinning" size={19} /> : <RefreshCw size={19} />}
        </button>
      </div>
      {error && <p className="feedback error" role="alert">{error}</p>}
      {loading && <p className="list-status" role="status">Carregando documentos...</p>}
      {!loading && !error && documents.length === 0 && (
        <div className="empty-state">
          <FileText size={32} strokeWidth={1.4} aria-hidden="true" />
          <p>Nenhum documento enviado.</p>
        </div>
      )}
      {documents.length > 0 && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th scope="col">Nome</th><th scope="col">Tamanho</th><th scope="col">Enviado em</th><th scope="col"><span className="visually-hidden">Download</span></th></tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td><div className="document-name"><FileText size={20} aria-hidden="true" /><span>{document.originalName}</span></div></td>
                  <td className="document-size">{formatSize(document.size)}</td>
                  <td><time dateTime={document.uploadedAt}>{dateFormatter.format(new Date(document.uploadedAt))}</time></td>
                  <td><DownloadButton document={document} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}