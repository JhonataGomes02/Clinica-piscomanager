# PsicoManager — Sistema de Gestão Psicológica

> Projeto Final — IHC (Interface Homem Computador)  
> SENAI CIMATEC · Professor Celso Barreto · 2025

---

## Tecnologias utilizadas

| Camada         | Tecnologia                        |
|----------------|-----------------------------------|
| Backend        | Node.js + Express                 |
| Frontend       | HTML, CSS, Bootstrap 5            |
| Banco de dados | PostgreSQL via **Supabase**        |
| ORM            | Sequelize                         |
| Autenticação   | JWT + bcryptjs                    |
| Deploy         | **Vercel** (frontend + backend)   |

---

## Pré-requisitos

- **Node.js** (v18+) → https://nodejs.org
- Conta gratuita no **Supabase** → https://supabase.com
- Conta gratuita no **Vercel** → https://vercel.com (para hospedar)

---

## PASSO 1 — Criar o banco no Supabase

1. Acesse https://supabase.com e crie uma conta (gratuita)
2. Clique em **"New project"**, dê um nome (ex: `psicomanager`) e defina uma senha
3. Aguarde o projeto ser criado (~1 minuto)
4. No menu lateral, clique em **SQL Editor** → **New query**
5. Cole todo o conteúdo do arquivo `banco_de_dados.sql` e clique em **Run**
6. As tabelas e dados de exemplo serão criados automaticamente ✅

### Copiar a connection string do Supabase

1. No menu lateral: **Settings → Database**
2. Role até **Connection String** → selecione a aba **URI**
3. Copie a string (formato: `postgresql://postgres:[senha]@db.[projeto].supabase.co:5432/postgres`)

---

## PASSO 2 — Configurar e rodar localmente

```bash
# 1. Entre na pasta backend
cd backend

# 2. Copie o arquivo de variáveis de ambiente
# Windows:
copy .env.example .env
# Mac/Linux:
cp .env.example .env
```

Abra o `.env` e cole a sua connection string do Supabase:

```env
DATABASE_URL=postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJETO].supabase.co:5432/postgres
JWT_SECRET=psicomanager_chave_secreta_2025
JWT_EXPIRES_IN=8h
PORT=3033
```

```bash
# 3. Instalar dependências
npm install

# 4. Iniciar o servidor
npm start
```

Acesse: **http://localhost:3033/login.html**

---

## PASSO 3 — Deploy no Vercel (para apresentação)

### Opção A — Via GitHub (recomendado)

1. Suba o projeto para um repositório no GitHub
2. Acesse https://vercel.com → **Add New Project**
3. Conecte o repositório do GitHub
4. Na tela de configuração, adicione a variável de ambiente:
   - Nome: `DATABASE_URL`
   - Valor: sua connection string do Supabase
   - Também adicione: `JWT_SECRET` com qualquer valor seguro
5. Clique em **Deploy** ✅

### Opção B — Via Vercel CLI

```bash
# Instalar a CLI do Vercel
npm install -g vercel

# Na raiz do projeto
vercel

# Seguir as instruções e adicionar a variável DATABASE_URL quando perguntado
```

Após o deploy, o sistema estará disponível em uma URL pública como:
`https://psicomanager-seuusuario.vercel.app`

---

## Usuários de exemplo

Senha de todos: **`password`**

| Perfil        | E-mail               | Permissões                      |
|---------------|----------------------|---------------------------------|
| Psicóloga     | ana@clinica.com      | Agenda, Pacientes, Prontuários  |
| Psicólogo     | carlos@clinica.com   | Agenda, Pacientes, Prontuários  |
| Administrador | admin@clinica.com    | Financeiro, Relatórios, tudo    |
| Paciente      | maria@email.com      | Área restrita do paciente       |

---

## Estrutura do projeto

```
psicomanager/
│
├── vercel.json                 ← Configuração do deploy no Vercel
├── banco_de_dados.sql          ← Executar no SQL Editor do Supabase
├── README.md
│
├── backend/
│   ├── package.json
│   ├── .env.example            ← Copiar para .env e configurar
│   └── src/
│       ├── server.js
│       ├── config/database.js  ← Conexão Sequelize + Supabase (SSL)
│       ├── models/             (7 models: Usuario, Paciente, Sessao...)
│       ├── controllers/        (7 controllers)
│       ├── routes/             (6 arquivos de rotas)
│       └── middlewares/auth.js (JWT + RBAC)
│
└── frontend/
    ├── login.html
    ├── index.html
    ├── css/style.css
    └── js/app.js               ← URL da API automática (local/produção)
```

---

## Módulos implementados

| Módulo              | Funcionalidades                                             |
|---------------------|-------------------------------------------------------------|
| Autenticação        | Login JWT, controle de acesso por perfil (RBAC)             |
| Agenda              | Calendário mensal, agendamento, detecção de conflito        |
| Pacientes           | Cadastro completo, busca, listagem                          |
| Prontuário          | Anamnese, evolução de sessões, histórico clínico            |
| Financeiro          | Pagamentos, receita mensal, ticket médio                    |
| Relatórios/Dashboard| Métricas em tempo real, gráficos, prontuários pendentes     |
| Tarefas             | Criação e conclusão de tarefas por paciente                 |

---

*Desenvolvido para a Atividade Final de IHC — SENAI CIMATEC, 2025.*
