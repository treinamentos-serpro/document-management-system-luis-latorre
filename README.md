# Document Management System com GitHub Copilot

<img src="https://octodex.github.com/images/Professortocat_v2.png" align="right" height="200px" />

Hey luisltorre!

Mona here. I'm done preparing your exercise. Hope you enjoy! 💚

Remember, it's self-paced so feel free to take a break! ☕️

[![](https://img.shields.io/badge/Go%20to%20Exercise-%E2%86%92-1f883d?style=for-the-badge&logo=github&labelColor=197935)](https://github.com/treinamentos-serpro/document-management-system-luis-latorre/issues/1)

## Execucao local

Em dois terminais, inicie o backend e o frontend:

```sh
cd backend
npm install
npm start
```

```sh
cd frontend
npm install
npm run dev
```

A interface fica em http://localhost:5173. O Vite encaminha as chamadas `/api`
ao backend em http://localhost:3000, removendo o prefixo.

O frontend envia `X-User-Id: usuario-demo` por padrao. Para usar outra identidade,
inicie o frontend com `VITE_USER_ID=outro-usuario npm run dev`. Essa identidade
e apenas uma demonstracao, nao autenticacao segura para producao. Os arquivos
ficam em `backend/storage`; os metadados sao perdidos ao reiniciar o backend.

Para validar o frontend, execute `npm run build` dentro de `frontend`.
Em producao, o servidor web deve encaminhar `/api` ao backend; o proxy do Vite
e exclusivo do desenvolvimento.

---

&copy; 2025 GitHub &bull; [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md) &bull; [MIT License](https://gh.io/mit)

