---
description: Valida o projeto e prepara a descrição do Pull Request.
name: preparar-pr
argument-hint: resumo opcional da mudança
agent: agent
---

# Preparar Pull Request

Prepare a branch atual para um Pull Request para a `main`.

Passos:

1. Execute `npm test` em `backend/` e `npm run build` em `frontend/`, e informe falhas.
2. Revise as mudanças (`git diff main...HEAD`) quanto a SOLID, segurança e alinhamento com `docs/specs/dms-spec.md`.
3. Gere a descrição do PR em português com: Resumo, Mudanças, Como testar e Riscos.

Contexto adicional: ${input:resumo:resumo opcional da mudança}

Não faça commit nem push; apenas apresente o resultado.
