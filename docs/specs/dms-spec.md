# Especificação - Document Management System

> Especificação funcional e técnica para orientar a implementação incremental do DMS.
> Esta especificação descreve o comportamento desejado; as etapas de execução ao
> final são um roteiro futuro e não fazem parte da implementação deste documento.

## 1. Objetivo

Disponibilizar uma aplicação web para que usuários enviem, listem e baixem seus documentos, mantendo os arquivos exclusivamente no filesystem local e os metadados em memória nesta fase inicial.

## 2. Escopo

### Dentro do escopo

- Envio de um documento por requisição, com validação de tipo e tamanho.
- Gravação dos arquivos em `backend/storage`, usando `multer` com `diskStorage`.
- Geração de identificador e nome interno seguros, independentes do nome original.
- Registro em memória dos metadados do documento e do respectivo dono.
- Listagem dos documentos associados ao usuário da requisição.
- Download de documento existente pertencente ao usuário da requisição.
- Interface React para upload, listagem e download, integrada à API.
- Tratamento consistente de erros e testes do backend com `node:test`.

### Fora do escopo

- Armazenamento externo, em nuvem, banco de dados ou serviços de terceiros.
- Persistência durável dos metadados ou recuperação automática deles após reinício.
- Autenticação robusta, cadastro de usuários, sessões, JWT ou autorização administrativa.
- Compartilhamento de documentos entre usuários.
- Exclusão, versionamento, busca, filtros e paginação.
- Upload de múltiplos arquivos em uma única requisição.
- Preview, conversão, edição, antivírus ou processamento do conteúdo dos arquivos.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | A API deve aceitar um arquivo por requisição `multipart/form-data`, no campo `file`. |
| RF-02 | A API deve exigir o header `X-User-Id` para identificar o dono do documento. O valor deve ser não vazio após remoção de espaços e ter no máximo 128 caracteres. |
| RF-03 | A API deve rejeitar requisições sem arquivo, com arquivo vazio, acima do limite ou fora da lista de tipos permitidos, sem registrar metadados. |
| RF-04 | A API deve aceitar arquivos de até 10 MiB (10.485.760 bytes), inclusive, dos tipos PDF, JPEG, PNG, GIF, WebP e documentos Microsoft Word, Excel ou PowerPoint nos formatos DOC, DOCX, XLS, XLSX, PPT e PPTX. A validação deve considerar extensão e tipo MIME declarados e rejeitar incompatibilidades óbvias; esses dados não devem ser tratados como prova de segurança do conteúdo. |
| RF-05 | A API deve criar um identificador opaco único para cada documento e gravar o arquivo com nome interno gerado pela aplicação. O nome original nunca deve ser usado como caminho de destino. |
| RF-06 | Após uma gravação bem-sucedida, a API deve manter em memória os metadados do documento, incluindo o identificador do dono e a referência interna necessária para localizar o arquivo. |
| RF-07 | Se não for possível registrar os metadados após gravar o arquivo, a aplicação deve tentar remover o arquivo recém-gravado e retornar erro; não deve reportar sucesso parcial. |
| RF-08 | A API deve listar somente documentos cujo `owner` corresponda ao `X-User-Id` da requisição. A lista deve estar vazia quando o usuário não tiver documentos. |
| RF-09 | A API deve permitir download somente de documento existente pertencente ao `X-User-Id` da requisição. Documento inexistente e documento de outro usuário devem produzir a mesma resposta externa. |
| RF-10 | A resposta de download deve usar o nome original como nome de apresentação, sem permitir que esse valor determine o caminho no filesystem. |
| RF-11 | A interface deve permitir selecionar e enviar um arquivo, apresentar o resultado ou erro do envio, atualizar a lista e iniciar o download de um documento listado. |
| RF-12 | A interface deve enviar o `X-User-Id` configurado para a sessão de demonstração. Como não há autenticação nesta fase, essa identificação não deve ser apresentada como mecanismo seguro para produção. |
| RF-13 | Ao reiniciar o processo, os metadados em memória podem ser perdidos mesmo que os arquivos permaneçam no disco. Arquivos sem metadados não devem ser listados nem baixados pela API. |
| RF-14 | A API deve disponibilizar `GET /health`, retornando status de saúde simples, sem expor informações internas ou caminhos locais. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser armazenados somente no filesystem local em `backend/storage`, com `multer` configurado com `diskStorage`. Não utilizar armazenamento remoto ou provedor de upload externo. |
| RNF-02 | Os metadados devem permanecer em memória nesta fase. A camada de repositório deve encapsular tanto o acesso ao filesystem quanto a coleção em memória. |
| RNF-03 | O backend deve usar Node.js e Express em CommonJS; o frontend deve usar React e Vite em ESM. Não introduzir TypeScript nesta fase. |
| RNF-04 | O backend deve separar responsabilidades em `routes/`, `controllers/`, `services/` e `repositories/`, com dependências fluindo de `routes -> controllers -> services -> repositories`. |
| RNF-05 | Rotas devem apenas registrar endpoints e delegar; controllers devem tratar HTTP e validação de entrada básica; services devem aplicar regras de negócio; repositories devem controlar persistência local e metadados. Camadas internas não devem depender de Express ou da interface. |
| RNF-06 | O nome original do arquivo não pode compor caminhos. Caminhos de leitura e escrita devem ser derivados de identificadores internos gerados pela aplicação e permanecer dentro de `backend/storage`, prevenindo traversal e sobrescrita por nomes fornecidos pelo usuário. |
| RNF-07 | A API não deve retornar caminho absoluto, nome interno de armazenamento, stack trace ou detalhes de implementação ao cliente. |
| RNF-08 | Configurações operacionais, incluindo a porta do servidor, devem vir de variáveis de ambiente, com padrão documentado para desenvolvimento local. A configuração não pode permitir transferir o armazenamento para serviço externo. |
| RNF-09 | As respostas de erro da API devem usar JSON com formato consistente, exceto erros ocorridos após o início de uma transferência binária. Mensagens devem ser claras e não revelar dados de outros usuários. |
| RNF-10 | O backend deve ter testes automatizados com o runner nativo `node:test`, cobrindo sucesso, validações, isolamento por usuário, acesso a documento inexistente e falhas de armazenamento relevantes. |
| RNF-11 | O frontend deve acessar a API por `fetch` usando o prefixo `/api`. No desenvolvimento, o proxy do Vite deve encaminhar ao backend local e remover esse prefixo; as rotas do backend não incluem `/api`. |
| RNF-12 | O sistema deve lidar com erros de leitura e escrita do filesystem no limite da aplicação e não deve deixar a requisição sem resposta HTTP definida. |

## 5. Modelo de dados (metadados do documento)

### Metadados públicos

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador opaco e único gerado pela aplicação, preferencialmente UUID. É usado nos endpoints de listagem e download. |
| `originalName` | string | Nome original enviado pelo cliente, preservado apenas como metadado e nome de apresentação. Nunca é caminho de filesystem. |
| `size` | number | Tamanho do arquivo em bytes. Deve ser maior que zero e não exceder 10.485.760. |
| `uploadedAt` | string | Data e hora do recebimento bem-sucedido, em ISO 8601 UTC. |
| `owner` | string | Identificador recebido em `X-User-Id`; usado para filtrar a listagem e autorizar o download. |

### Metadado interno de armazenamento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `storedName` | string | Nome gerado pela aplicação para localizar o arquivo dentro de `backend/storage`. É interno, não deve aparecer nas respostas públicas e não deve conter segmentos de diretório fornecidos pelo usuário. |

Os metadados devem ser mantidos em uma estrutura em memória acessada pelo repositório. O caminho completo deve ser resolvido a partir do diretório de armazenamento e de `storedName`; não deve ser aceito diretamente de parâmetros HTTP. Como os metadados são voláteis, reiniciar o processo torna os arquivos existentes inacessíveis pela API até que sejam enviados novamente ou que uma futura especificação altere a estratégia de persistência.

## 6. Contratos de API

Todas as rotas abaixo são rotas do backend, sem o prefixo `/api`. O frontend chama, por exemplo, `/api/documents`; o proxy de desenvolvimento do Vite remove `/api` antes de encaminhar a requisição ao backend.

### Convenções

- O header `X-User-Id` é obrigatório em todas as rotas relacionadas a documentos.
- Ausência do header ou valor em branco: `401 Unauthorized`.
- Para erros JSON, o formato é `{ "error": { "code": "...", "message": "..." } }`.
- Respostas não devem incluir stack trace, caminho local ou `storedName`.
- Um documento pertencente a outro usuário deve ser tratado como inexistente.

### `POST /upload`

- **Entrada:** `multipart/form-data`, com exatamente um arquivo no campo `file`; header `X-User-Id` obrigatório.
- **Validações:** campo ausente ou arquivo vazio resulta em `400`; tipo não permitido resulta em `415`; tamanho acima de 10 MiB resulta em `413`; identidade ausente ou vazia resulta em `401`.
- **Sucesso:** `201 Created`, `Content-Type: application/json`.
- **Resposta de sucesso:**

```json
{
  "document": {
    "id": "8c4f41be-6043-4c54-99ba-438dba4cf183",
    "originalName": "relatorio.pdf",
    "size": 2048,
    "uploadedAt": "2026-10-06T12:00:00.000Z",
    "owner": "usuario-demo"
  }
}
```

- **Erros adicionais:** `500 Internal Server Error` para falha inesperada ao persistir o arquivo ou os metadados. Se a gravação do arquivo tiver ocorrido antes da falha, a aplicação deve tentar removê-lo.

### `GET /documents`

- **Entrada:** sem corpo; header `X-User-Id` obrigatório.
- **Comportamento:** retorna todos os documentos do usuário identificado, sem paginação nesta fase. Um usuário sem documentos recebe lista vazia.
- **Sucesso:** `200 OK`, `Content-Type: application/json`.
- **Resposta de sucesso:**

```json
{
  "documents": [
    {
      "id": "8c4f41be-6043-4c54-99ba-438dba4cf183",
      "originalName": "relatorio.pdf",
      "size": 2048,
      "uploadedAt": "2026-10-06T12:00:00.000Z",
      "owner": "usuario-demo"
    }
  ]
}
```

- **Erros:** `401 Unauthorized` se a identidade estiver ausente ou vazia; `500 Internal Server Error` para falha inesperada ao consultar o repositório.

### `GET /documents/:id/download`

- **Entrada:** identificador opaco no parâmetro `id`; header `X-User-Id` obrigatório.
- **Comportamento:** procura o documento e confirma que pertence ao usuário. O arquivo é transmitido como binário, com `Content-Type` apropriado e `Content-Disposition: attachment` usando `originalName` de forma segura.
- **Sucesso:** `200 OK`, corpo binário.
- **Erros:** `401 Unauthorized` se a identidade estiver ausente ou vazia; `404 Not Found` se o identificador for inválido, não existir, pertencer a outro usuário ou se o arquivo correspondente não estiver disponível. Respostas para documento inexistente e de outro usuário devem ser indistinguíveis. `500 Internal Server Error` para falha inesperada de leitura anterior ao início da transferência.

### `GET /health`

- **Entrada:** sem autenticação e sem corpo.
- **Sucesso:** `200 OK`, `Content-Type: application/json`, corpo `{ "status": "ok" }`.
- **Uso:** verificação básica de disponibilidade; não confirma a integridade de cada arquivo nem expõe configuração interna.

## 7. Decisões arquiteturais

- O backend usa Clean Architecture simples: rotas delegam aos controllers; controllers dependem dos services; services dependem dos repositories. `app.js` compõe a aplicação e registra middleware e rotas.
- O repository local encapsula a escrita e leitura de arquivos em `backend/storage` via `multer` com `diskStorage`, além do armazenamento em memória dos metadados. Services não manipulam diretamente objetos Express nem constroem caminhos a partir de entrada do usuário.
- O identificador público e o nome interno são gerados pela aplicação. `originalName` é metadado e nome para download, nunca chave de armazenamento.
- O dono vem de `X-User-Id`, não do corpo do upload. Esse header é apenas uma identidade de demonstração e pode ser falsificado; a API não é adequada para exposição pública sem autenticação e autorização reais.
- Não há banco de dados nesta fase. Em caso de reinício, a coleção de metadados começa vazia; arquivos locais antigos podem permanecer órfãos e não devem ser reconstruídos automaticamente.
- O frontend segue organização por componentes React funcionais e Hooks, com comunicação via `fetch` em serviços da aplicação. O proxy `/api` é exclusivamente uma conveniência de desenvolvimento do Vite.
- O backend lê `PORT` do ambiente, usando `3000` como padrão local. Os arquivos continuam restritos ao diretório local definido pelo projeto.
- Erros de entrada e de multer devem ser convertidos pelo limite HTTP em respostas JSON padronizadas. Após iniciar um download, falhas na transmissão devem encerrar a resposta sem tentar substituí-la por JSON.

## 8. Plano de execução

As etapas abaixo orientam trabalho futuro e não são executadas como parte da criação desta especificação.

1. Implementar o repositório local de arquivos e metadados em memória, incluindo configuração do diretório, nomes internos gerados e limpeza em falha de persistência.
2. Implementar os services com regras de validação, associação ao dono e autorização para listar e baixar documentos.
3. Implementar controllers, middleware de erro e rotas HTTP para upload, listagem, download e saúde, respeitando os contratos desta especificação.
4. Adicionar testes backend com `node:test` para contratos, validações de upload, isolamento entre usuários, download e falhas de filesystem.
5. Implementar no frontend os serviços `fetch`, formulário de upload, listagem e ação de download, incluindo estados de carregamento e erro.
6. Integrar frontend e backend pelo proxy Vite, validar os fluxos ponta a ponta em ambiente local e revisar a documentação de execução.
7. Antes de qualquer uso além de demonstração local, substituir a identidade de demonstração por autenticação e autorização adequadas; esse trabalho exige revisão de escopo e de segurança.