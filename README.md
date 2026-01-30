# Aurora Release Management System

Sistema centralizado de gerenciamento de releases com aprovações, auditoria e rastreamento de versões.

## Stack
- **Backend**: Python FastAPI
- **API Gateway**: Node.js Express + TypeScript
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Container**: Docker & Docker Compose
- **Testing**: pytest (Backend)

## Requisitos
- Docker & Docker Compose
- Python 3.11+ (opcional, para desenvolvimento local)

## Quick Start

### 1. Clonar e configurar
```bash
git clone <repo>
cd aurora-geoenergy

# Copiar .env.example para .env
cp .env.example .env
```

### 2. Rodar com Docker (Recomendado)
```bash
# Subir containers (PostgreSQL + Backend + Gateway)
docker-compose up -d

# Migrations rodam automaticamente!
# Backend disponível em http://localhost:8000
# API Gateway disponível em http://localhost:3000
# Swagger disponível em http://localhost:3000/docs
```

### 3. Verificar status
```bash
# Ver logs
docker-compose logs -f service-backend

# Ver containers rodando
docker-compose ps

# Acessar health check
curl http://localhost:8000/health

# Acessar Swagger Gateway
curl http://localhost:3000/docs
```

## Desenvolvimento Local

### 1. Setup do ambiente
```bash
cd backend-python

# Criar virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt
```

### 2. Configurar banco de dados
```bash
# Copiar e editar .env
cp .env.example .env

# Se tiver PostgreSQL rodando localmente:
# Rodar migrations
./venv/bin/alembic upgrade head
```

### 3. Rodar servidor
```bash
./venv/bin/uvicorn main:app --reload
# Acesso em http://localhost:8000
```

## Migrations

### Ver histórico
```bash
docker-compose exec backend alembic history
```

### Ver status atual
```bash
docker-compose exec backend alembic current
```

### Criar nova migration
```bash
docker-compose exec backend alembic revision -m "descrição da mudança"
# Editar o arquivo em migrations/versions/
# Rodar: docker-compose exec backend alembic upgrade head
```

## Testes

### Testes de Integração - Backend Python

#### Rodar todos os testes
```bash
cd service-backend
python3 -m pytest tests/ -v
```

#### Rodar apenas testes de autenticação
```bash
python3 -m pytest tests/integration/test_auth.py -v
```

#### Rodar um teste específico
```bash
python3 -m pytest tests/integration/test_auth.py::test_login_success -v
```

#### Com relatório de cobertura
```bash
python3 -m pytest tests/ -v --cov=src --cov-report=term-missing
```

**Opções úteis:**
- `-v` → verbose (mostra cada teste)
- `-s` → mostra prints/logs durante os testes
- `--tb=short` → mostra menos informações de erro
- `-k "login"` → roda só testes com "login" no nome

**Testes disponíveis:**
- `test_login_success` - Login com credenciais válidas
- `test_login_invalid_email` - Email não encontrado (404)
- `test_login_invalid_password` - Senha incorreta (401)
- `test_get_me_with_token` - /auth/me com token válido
- `test_get_me_without_token` - /auth/me sem token (401)


## Estrutura do Projeto
```
aurora-geoenergy/
├── service-backend/           # Backend Python FastAPI
│   ├── src/
│   │   ├── domain/            # Entidades de domínio
│   │   ├── infrastructure/    # ORM e database
│   │   ├── application/       # Serviços e DTOs
│   │   ├── presentation/      # Controllers e middleware
│   │   └── core/              # Config, auth, logger
│   ├── tests/
│   │   ├── integration/       # Testes de integração
│   │   ├── conftest.py        # Fixtures pytest
│   │   └── helpers.py         # Utilitários para testes
│   ├── migrations/            # Alembic migrations
│   ├── main.py                # Entrada da aplicação
│   ├── requirements.txt        # Dependências Python
│   ├── pytest.ini             # Config pytest
│   ├── Dockerfile             # Build da imagem
│   ├── entrypoint.sh          # Script de entrada
│   ├── seed.py                # Seeder com dados de teste
│   └── .env.example           # Template de variáveis
├── gateway-node/              # API Gateway Node.js TypeScript
│   ├── src/
│   │   ├── domain/            # Entidades de domínio
│   │   ├── application/       # Use cases e DTOs
│   │   ├── infrastructure/    # HTTP client, config
│   │   ├── presentation/      # Controllers, middleware, routes
│   │   └── core/              # Config, logger, utils
│   ├── dist/                  # Código compilado TypeScript
│   ├── main.ts                # Entrada da aplicação
│   ├── package.json           # Dependências Node.js
│   ├── tsconfig.json          # Config TypeScript
│   ├── nodemon.json           # Config hot reload
│   ├── Dockerfile             # Build da imagem
│   └── .env.example           # Template de variáveis
├── frontend-angular/          # Frontend Angular (em desenvolvimento)
├── docker-compose.yml         # Orquestração de containers
├── .env.example               # Template consolidado de variáveis
└── README.md                  # Este arquivo
```

## Desenvolvimento

- Backend rodando em modo reload (hot reload)
- Database URL configurável via .env
- Health check automático dos containers
- Migrations automáticas na inicialização

