# Aurora Release Management System

Sistema centralizado de gerenciamento de releases com aprovações, auditoria e rastreamento de versões.

## Stack
- **Backend**: Python FastAPI
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Container**: Docker & Docker Compose

## Requisitos
- Docker & Docker Compose
- Python 3.11+ (opcional, para desenvolvimento local)

## Quick Start

### 1. Clonar e configurar
```bash
git clone <repo>
cd aurora-geoenergy

# Copiar .env.example para .env
cp backend-python/.env.example backend-python/.env
```

### 2. Rodar com Docker (Recomendado)
```bash
# Subir containers (PostgreSQL + Backend)
docker-compose up -d

# Migrations rodam automaticamente!
# A aplicação estará disponível em http://localhost:8000
```

### 3. Verificar status
```bash
# Ver logs
docker-compose logs -f backend

# Ver containers rodando
docker-compose ps

# Acessar health check
curl http://localhost:8000/health
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

## Estrutura do Projeto
```
aurora-geoenergy/
├── backend-python/
│   ├── src/
│   │   ├── domain/          # Entidades de domínio
│   │   ├── infrastructure/  # ORM e database
│   │   └── ...
│   ├── migrations/          # Alembic migrations
│   ├── main.py             # Entrada da aplicação
│   ├── requirements.txt     # Dependências Python
│   ├── Dockerfile          # Build da imagem
│   ├── entrypoint.sh       # Script de entrada
│   └── .env.example        # Template de variáveis
├── docker-compose.yml      # Orquestração de containers
└── README.md               # Este arquivo
```

## Desenvolvimento

- Backend rodando em modo reload (hot reload)
- Database URL configurável via .env
- Health check automático dos containers
- Migrations automáticas na inicialização

