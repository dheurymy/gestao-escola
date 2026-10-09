# Gestão Escola

Sistema web para **controle de frequência de alunos**, feito para uma escola que funciona em três turnos com aulas de duas horas. O professor cadastra os alunos, registra a presença em um ou mais horários de cada dia e consulta o histórico por aluno ou por período (dia, semana e mês).

Funciona no **celular e no computador**, pode ser adicionado à tela inicial como um app e é usado por até 5 professores.

## Funcionalidades

- **Login** por usuário e senha. Não existe cadastro público: as contas dos professores são criadas por quem administra o sistema.
- **Alunos:** nome, foto, data de nascimento (a idade é calculada), escola, responsável, telefone do responsável e observações. Alunos podem ser marcados como inativos (somem da chamada, mas o histórico é mantido) ou excluídos.
- **Chamada:** escolha a data e um dos 5 horários e toque no aluno para marcar a presença. A tela atualiza na hora e desfaz a marcação se o servidor recusar.
- **Relatórios:**
  - *Por período:* tabela aluno × horários (dia) ou aluno × dias (semana e mês), com totais.
  - *Por aluno:* dias com presença, horários e total de horas no período.
  - Exportação em **CSV** (compatível com Excel).
- **Responsivo**, com abas fixas na parte de baixo para uso com o polegar, e tema claro/escuro automático.

### Horários

| Turno | Horários |
|-------|----------|
| Manhã | 8h–10h, 10h–12h |
| Tarde | 14h–16h, 16h–18h |
| Noite | 18h–20h |

Cada presença é um registro de **aluno + data + horário**. Um aluno pode ter de 1 a 5 presenças no mesmo dia, e não é possível duplicar a mesma presença.

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Interface | React 19, TypeScript, Vite, React Router |
| API | Funções serverless do Vercel (TypeScript, Node) |
| Banco de dados | MongoDB Atlas, via Mongoose |
| Autenticação | bcrypt (hash de senha) + JWT em cookie `HttpOnly` |
| Hospedagem | Vercel (front-end e API no mesmo projeto) |

## Arquitetura

```
Celular / PC ──► Vercel ─┬─ React + TypeScript (arquivos estáticos)
                         └─ /api/*  funções serverless ──► MongoDB Atlas
```

Front-end e API ficam no mesmo domínio, então não há configuração de CORS. A API é composta por funções independentes: cada arquivo em `api/` vira uma rota.

### Estrutura de pastas

```
api/
  _lib/            conexão com o banco, modelos, autenticação e utilitários
  auth/            login, logout e me (usuário logado)
  students/        listagem/cadastro e consulta/edição/exclusão de alunos
  attendance/      consulta e marcação de presenças
shared/            tipos e lista de horários usados por front-end e API
src/
  pages/           Login, Chamada, Alunos, Formulário do aluno, Relatórios
  components/      Avatar, navegação de datas
  api.ts           cliente das rotas da API
  dates.ts         utilitários de datas (fuso local)
scripts/
  create-user.ts   cria ou atualiza um professor
  check-db.ts      testa a conexão com o MongoDB
```

### Modelo de dados (MongoDB)

- **users:** `username` (único), `name`, `passwordHash`.
- **students:** `name`, `photo` (JPEG reduzido em formato data URL), `birthDate`, `school`, `guardianName`, `guardianPhone`, `notes`, `active`.
- **attendances:** `studentId`, `date` (`AAAA-MM-DD`), `slot` (`08-10`, `10-12`, `14-16`, `16-18`, `18-20`), `markedBy`. Índice único em `studentId + date + slot`.

As fotos são redimensionadas para no máximo 400 px no próprio navegador antes do envio e guardadas no MongoDB, o que dispensa um serviço extra de armazenamento de imagens.

### API

Todas as rotas, exceto login e logout, exigem login.

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Entra com `username` e `password` |
| POST | `/api/auth/logout` | Encerra a sessão |
| GET | `/api/auth/me` | Dados do usuário logado |
| GET | `/api/students` | Lista os alunos |
| POST | `/api/students` | Cadastra um aluno |
| GET / PUT / DELETE | `/api/students/:id` | Consulta, edita ou exclui (e apaga o histórico dele) |
| GET | `/api/attendance?from=&to=[&studentId=]` | Presenças no intervalo de datas |
| POST | `/api/attendance` | Marca ou desmarca: `{ studentId, date, slot, present }` |

## Segurança

- Senhas guardadas com hash (bcrypt); o login compara o hash mesmo quando o usuário não existe, para não revelar quais usuários existem.
- Sessão por JWT em cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção, válida por 7 dias.
- Dados de entrada validados na API (datas, horários, tamanho e tipo da foto).
- Segredos ficam em variáveis de ambiente. O arquivo `.env` está no `.gitignore` e **nunca deve ser enviado ao repositório**.
- O sistema guarda dados e fotos de menores de idade. Use somente com autorização dos responsáveis, de acordo com a LGPD, e mantenha as senhas dos professores fortes.

## Como rodar localmente

### Pré-requisitos
- Node.js 20 ou superior
- Uma conta gratuita no [MongoDB Atlas](https://cloud.mongodb.com) e uma no [Vercel](https://vercel.com)

### 1. Banco de dados (MongoDB Atlas)
1. Crie um cluster gratuito (M0).
2. Em *Database Access*, crie um usuário com senha forte, só com letras e números para evitar caracteres especiais na URL.
3. Em *Network Access*, libere `0.0.0.0/0` (o Vercel não tem IP fixo).
4. Em *Connect → Drivers*, copie a connection string e inclua o nome do banco antes do `?`:
   ```
   mongodb+srv://USUARIO:SENHA@cluster0.xxxxx.mongodb.net/gestao-escola?retryWrites=true&w=majority
   ```

### 2. Configuração
```bash
npm install
cp .env.example .env     # no Windows (cmd): copy .env.example .env
```
Edite o `.env`:

| Variável | Descrição |
|----------|-----------|
| `MONGODB_URI` | Connection string do Atlas (com o nome do banco) |
| `JWT_SECRET` | Frase longa e aleatória usada para assinar as sessões |

Para gerar um `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Teste a conexão:
```bash
npm run check-db
```

### 3. Criar os professores
```bash
npm run create-user -- usuario SenhaForte123 "Nome do Professor"
```
A senha precisa ter pelo menos 8 caracteres. Rodar de novo com o mesmo usuário atualiza a senha.

### 4. Iniciar
```bash
npx vercel dev
```
Na primeira vez o Vercel pede login e a criação (ou vínculo) de um projeto. Depois acesse `http://localhost:3000`.

> `npm run dev` roda só a interface (Vite), sem a API. Para o sistema completo use `npx vercel dev`.

## Scripts

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Servidor do Vite (usado pelo `vercel dev`) |
| `npm run build` | Checa os tipos e gera o build de produção |
| `npm run typecheck` | Só a checagem de tipos do TypeScript |
| `npm run create-user -- <usuário> <senha> "<nome>"` | Cria ou atualiza um professor |
| `npm run check-db` | Testa a conexão com o MongoDB |

## Publicação no Vercel

1. Envie o projeto para um repositório no GitHub.
2. No Vercel, use *Add New → Project* e importe o repositório (o framework Vite é detectado automaticamente).
3. Em *Settings → Environment Variables*, defina `MONGODB_URI` e `JWT_SECRET` para **Production**. Use um `JWT_SECRET` diferente do local.
4. Faça o deploy. A cada push na branch principal, o Vercel publica uma nova versão.
5. Se o site pedir login do Vercel para quem acessa, desative a proteção em *Settings → Deployment Protection*.

No celular, abra o endereço do site e use *Adicionar à tela inicial* para instalar como app.

## Decisões de projeto

- **Só presença:** a falta é a ausência de registro. Não há "falta justificada".
- **Sem turno fixo por aluno:** a chamada lista todos os alunos ativos em qualquer horário.
- **Todos os professores veem todos os alunos** e podem marcar presença.
- **Idade calculada** a partir da data de nascimento, para nunca ficar desatualizada.
- **Datas em texto `AAAA-MM-DD`** no fuso local, para evitar erros de fuso horário.

## Ideias para o futuro

- Registrar faltas e justificativas
- Turno fixo por aluno e filtro da chamada por turma
- Gráficos de frequência e alertas de ausências seguidas
- Perfis de acesso (administrador × professor)
- Funcionamento offline (service worker)
