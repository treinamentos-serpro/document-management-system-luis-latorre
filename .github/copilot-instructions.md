# Instruções do projeto - Document Management System (DMS)

Estas instruções são aplicadas automaticamente pelo GitHub Copilot em todas as
interações neste repositório. Use-as como contexto de engenharia para gerar
código consistente com a arquitetura e as convenções do projeto.

## Visão geral

Sistema web para gestão de documentos com:

- Upload de documentos
- Listagem de documentos
- Download de documentos
- Gestão simples por usuário

Consulte o [README](../README.md) para executar o projeto e a
[especificação do DMS](../docs/specs/dms-spec.md) para requisitos e contratos
completos. Ao alterar um comportamento descrito na especificação, mantenha
código e testes alinhados com ela.

## Stack

- Backend: Node.js + Express (CommonJS)
- Frontend: React + Vite (ESM)
- Testes backend: runner nativo do Node (`node:test`)
- Sem TypeScript nesta fase (JavaScript puro)

## Princípios obrigatórios

- SOLID, DRY, KISS, YAGNI
- 12-Factor App (configuração via variáveis de ambiente)
- Código legível tem prioridade sobre código complexo
- Sem overengineering e sem abstrações desnecessárias

## Arquitetura do backend (Clean Architecture simples)

Separe responsabilidades em quatro camadas dentro de `backend/src`:

- `routes/`: definem os endpoints e delegam para os controllers
- `controllers/`: tratam entrada/saída HTTP e validação básica
- `services/`: concentram as regras de negócio
- `repositories/`: cuidam da persistência

Fluxo de dependência: `routes -> controllers -> services -> repositories`.
Camadas internas não conhecem camadas externas.

## Endpoints previstos

- Backend: `POST /upload`, `GET /documents`,
  `GET /documents/:id/download` e `GET /health`.
- O frontend chama os endpoints de documentos via `/api`; o proxy do Vite
  remove `/api`. As rotas do backend não têm esse prefixo.

## Armazenamento (restrição importante)

- Os arquivos enviados são gravados no filesystem local da aplicação, na pasta
  `backend/storage`, utilizando `multer` com `diskStorage`.
- Os metadados dos documentos (id, nome original, tamanho, data, dono) ficam em
  memória nesta fase inicial.
- Não utilize provedores de armazenamento externos ou serviços de upload de
  terceiros. O armazenamento é estritamente local à aplicação.

## Convenções do frontend

- Componentes funcionais com React Hooks
- Organização baseada em componentes: `components/`, `pages/`, `services/`
- A comunicação com o backend é feita via `fetch`, através do prefixo `/api`
  (proxy configurado no Vite)
- Centralize as chamadas HTTP em `frontend/src/services/api.js`; a identidade
  da sessão vem de `VITE_USER_ID` ou usa `usuario-demo` por padrão. Isso é uma
  identidade de demonstração, não autenticação.
- Preserve o cancelamento de requisições com `AbortController` e a atualização
  da listagem após upload, conforme o padrão em `frontend/src/App.jsx`.
- Reutilize componentes e evite duplicação

## Desenvolvimento e validação

- Instale dependências separadamente em `backend/` e `frontend/` com
  `npm install`.
- Backend: `npm start`, `npm run dev` (watch) e `npm test` (`node:test`).
- Frontend: `npm run dev`, `npm run build` e `npm run preview`.
- O frontend requer Node.js 24 ou superior. Não há script de lint configurado.
- Execute os testes do backend após mudanças na API, serviços, repositório ou
  armazenamento; execute o build após mudanças no frontend.

## Identidade e dados

- O backend exige `X-User-Id` e usa esse valor para isolar listagem e download.
  Preserve a autorização por dono e não exponha `storedName` ou caminhos locais.
- Arquivos ficam em `backend/storage`, mas metadados ficam em memória e se
  perdem ao reiniciar o processo. Não introduza armazenamento remoto ou banco
  de dados sem alteração explícita de escopo.
- O header e `VITE_USER_ID` servem apenas para demonstração; não os descreva
  como autenticação segura para produção.

## Estilo de código

- Nomes descritivos em inglês para símbolos de código
- Mensagens ao usuário e comentários em português
- Funções pequenas e com responsabilidade única
- Trate erros nos limites do sistema (entrada HTTP, leitura/escrita de arquivos)

## Restrições gerais

- Não quebrar funcionalidades existentes
- Manter o seed simples e evolutivo
- Preferir dependências já presentes no `package.json`
