const userId = import.meta.env?.VITE_USER_ID?.trim() || 'usuario-demo';

async function request(path, { headers, ...options } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: { ...headers, 'X-User-Id': userId }
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Nao foi possivel conectar ao servidor.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || 'Nao foi possivel concluir a operacao.');
  }
  return response;
}

export async function listDocuments(signal) {
  const response = await request('/documents', { signal });
  return (await response.json()).documents;
}

export async function uploadDocument(file) {
  const body = new FormData();
  body.append('file', file);
  const response = await request('/upload', { method: 'POST', body });
  return (await response.json()).document;
}

export async function downloadDocument(id) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`);
  return response.blob();
}