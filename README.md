# Aurora GeoEnergy - Release Management System

Sistema centralizado para gerenciar releases em DEV → PRE-PROD → PROD com aprovações, políticas configuráveis, validação de evidências e auditoria completa.

---

## 🚀 Setup

### Pré-requisitos
- Docker & Docker Compose
- Node.js 18+ (para desenvolvimento local)
- Python 3.9+ (para desenvolvimento local)

### Desenvolvimento

```bash
# Clonar repositório
git clone <repo>
cd aurora-geoenergy

# Copiar arquivo de configuração
cp .env.example .env

# Iniciar services com Docker Compose (dev)
docker-compose up -d

# Acessar aplicação
- Frontend: http://localhost:4200
- Gateway API: http://localhost:3000/docs
- Backend API: http://localhost:8000/docs
- Database: localhost:5432
```

**Credenciais de teste:**
```
ADMIN:
  Email: admin@test.com
  Senha: test123
  Role: admin

APPROVER:
  Email: approver@test.com
  Senha: test123
  Role: approver

VIEWER:
  Email: viewer@test.com
  Senha: test123
  Role: viewer
```

### Produção

```bash
# Iniciar com arquivo de produção
docker-compose -f docker-compose.prod.yml up -d

# Verificar logs
docker-compose logs -f gateway
docker-compose logs -f backend
docker-compose logs -f db
```

---

## 🧪 Testes

> **📋 Documentação completa:** Ver `.copilot/docs/COMO_RODAR_TESTES.md`

### Executar Todos os Testes

```bash
cd service-backend
source venv/bin/activate
pytest -v
```

**Resultado esperado:**
```
============================== 60 passed in 0.25s ==============================
```

### Testes Implementados (Item 8 do Desafio)

**✅ 60 testes unitários cobrindo:**

| Requisito | Arquivo | Qtd |
|-----------|---------|-----|
| Evidence Scoring (0-100) | `test_scoring_service.py` | 14 ✅ |
| Policy-as-Code (YAML) | `test_policy_service.py` | 36 ✅ |
| Regras de Promoção | `test_promotion_rules.py` | 10 ✅ |

### Executar por Categoria

```bash
# Evidence Scoring
pytest tests/test_scoring_service.py -v

# Policy (minApprovals, minScore, freezeWindows)
pytest tests/test_policy_service.py -v

# Promoção (DEV→PRE_PROD→PROD, validações)
pytest tests/test_promotion_rules.py -v
```

### Com Cobertura

```bash
pytest --cov=src --cov-report=html --cov-report=term
open htmlcov/index.html
```

---

## 🔐 Permissões (RBAC - Role-Based Access Control)

### Matriz de Permissões

| Funcionalidade | ADMIN | APPROVER | VIEWER |
|---|---|---|---|
| **Aplicações** | | | |
| Listar | ✅ | ✅ | ✅ |
| Criar | ✅ | ❌ | ❌ |
| Editar | ✅ | ❌ | ❌ |
| Deletar | ✅ | ❌ | ❌ |
| **Releases** | | | |
| Listar | ✅ | ✅ | ✅ |
| Criar | ✅ | ✅ | ❌ |
| Editar | ✅ | ✅ | ❌ |
| Deletar | ✅ | ✅ | ❌ |
| Promover | ✅ | ❌ | ❌ |
| **Aprovações** | | | |
| Listar | ✅ | ✅ | ✅ |
| Aprovar | ✅ | ✅ | ❌ |
| Rejeitar | ✅ | ✅ | ❌ |
| **Auditoria** | | | |
| Ver Logs | ✅ | ✅ | ✅ |

### Descrição dos Roles

- **ADMIN**: Acesso total. Gerencia aplicações, promove releases, aprova, visualiza auditoria.
- **APPROVER**: Cria releases, edita, deleta, aprova/rejeita. Não promove ou gerencia aplicações.
- **VIEWER**: Apenas leitura. Visualiza aplicações, releases, approvals e audit logs.

---

## ⚙️ Policy-as-Code

Arquivo: `service-backend/policy.yaml`

```yaml
minApprovals: 1
minScore: 70
freezeWindows:
  - env: PROD
    start: "22:00"
    end: "23:59"
    timezone: "America/Sao_Paulo"
```

**Regras:**
- **DEV → PRE_PROD**: Permitido sem restrições
- **PRE_PROD → PROD**: Exige:
  - ✅ Approvals >= minApprovals (1)
  - ✅ Score >= minScore (70)
  - ✅ Fora de freezeWindows
  - ✅ Evidence URL válida

**Bloqueio em freezeWindows:** Rejeita promoção se dentro de 22:00-23:59 (horário de São Paulo)

---

## 📊 Evidence Scoring (Determinístico 0-100)

O sistema calcula automaticamente um **score de 0 a 100** para cada `evidenceUrl`, baseado em análise textual da URL (sem fazer requisições HTTP).

### Regras de Pontuação

| Critério | Pontos | Exemplos |
|----------|--------|----------|
| **Protocolo HTTPS** | +20 | `https://ci.example.com/...` |
| **Protocolo HTTP** | +10 | `http://ci.example.com/...` |
| **Palavras-chave:** `test`, `report`, `results`, `evidence` | +20 | `/test-report`, `/results.json` |
| **Palavra "PASS"** | +30 | `test-PASS.json`, `report-PASS` |
| **Palavra "SUCCESS"** | +20 | `build-SUCCESS.html` |
| **Extensões:** `.pdf`, `.html`, `.json`, `.xml`, `.png`, `.jpg` | +10 | `report.pdf`, `results.json` |

**Pontuação máxima:** 100 pontos

### Exemplos Reais

```bash
# Score alto (90 pontos) ✅ - OK para PROD
https://ci.example.com/test-PASS-report.json
# HTTPS(20) + test/report(20) + PASS(30) + json(10) = 80

# Score médio (60 pontos) ⚠️ - Bloqueado em PROD
https://jenkins.com/build-results.html  
# HTTPS(20) + results(20) + html(10) = 50

# Score baixo (30 pontos) ❌ - Bloqueado em PROD
http://report.txt
# HTTP(10) + report(20) = 30 (.txt não está na lista)

# URL inválida (0 pontos) ❌
not-a-url
```

### Policy: minScore = 70

Para promover **PRE_PROD → PROD**, o release precisa ter `score >= 70` (configurado em `policy.yaml`).

**Dica:** Use URLs com `https://`, palavras-chave (`test`, `PASS`, `SUCCESS`) e extensões válidas (`.json`, `.pdf`, `.html`) para garantir score >= 70.

---

## 🏛️ Trade-offs e Decisões de Design

### 1. **Python FastAPI vs Node.js/Java**
- **Decisão**: Python FastAPI
- **Razão**: Desenvolvimento rápido, async nativo, Pydantic para validação, ORM automático
- **Trade-off**: Menos ecosystem que Node/Java, mas suficiente para MVP

### 2. **Otimistic Locking vs Pessimistic**
- **Decisão**: Otimistic locking (versionRow)
- **Razão**: Melhor performance, sem deadlocks
- **Trade-off**: Cliente deve reenviar em caso de conflito (HTTP 409)

### 3. **Idempotency via Header vs Database**
- **Decisão**: Header + Tabela (idempotency_keys)
- **Razão**: Garante deduplicação mesmo com retentativas
- **Trade-off**: Armazenamento adicional, limpeza de chaves antigas

### 4. **Rate Limiting no Gateway**
- **Decisão**: IP (100 req/15min) + User (1000 req/15min)
- **Razão**: Protege contra abuse sem impactar usuários legítimos
- **Trade-off**: Requer storage de Redis (simulado em memória dev)

### 5. **Policy-as-Code em YAML**
- **Decisão**: YAML local vs database
- **Razão**: Simples, versionado, não requer migração
- **Trade-off**: Redeployment para atualizar (não hot-reload)

### 6. **JWT com roles inline**
- **Decisão**: Role no token JWT
- **Razão**: Validação rápida no Gateway sem chamada ao backend
- **Trade-off**: Mudança de role requer novo token

### 7. **Auditoria com JSON payload**
- **Decisão**: Armazenar payload completo em JSON
- **Razão**: Rastreabilidade completa, facilita debug
- **Trade-off**: Espaço de armazenamento maior

---

## 📦 Variáveis de Ambiente

### `.env.example`

```env
# Database
DATABASE_URL=postgresql://user:password@db:5432/aurora

# Gateway
GATEWAY_PORT=3000
BACKEND_URL=http://backend:8000
JWT_SECRET=your-super-secret-key-change-in-prod

# Backend
BACKEND_PORT=8000
LOG_LEVEL=INFO

# Policy
POLICY_FILE=policy.yaml
TIMEZONE=America/Sao_Paulo
```

**Importante:** Nunca commitar `.env` com dados reais!

---

## 🏗️ Arquitetura

```
Angular SPA (4200)
    ↓
Node.js Gateway (3000)
  - Autenticação JWT
  - RBAC validation
  - Rate Limiting
  - Logs estruturados
    ↓
Python FastAPI (8000)
  - Policy Service
  - Scoring Service
  - Approval Workflow
  - Audit Service
    ↓
PostgreSQL (5432)
  - Applications
  - Releases
  - Approvals
  - AuditLogs
```

### Entidades Principais

```sql
Application(id, name UNIQUE, ownerTeam, repoUrl, createdAt)
Release(id, applicationId FK, version, env ENUM, status ENUM, 
        evidenceUrl, versionRow, createdAt, deployedAt)
        UNIQUE(applicationId, version, env)
Approval(id, releaseId FK, approverEmail, outcome ENUM, 
         notes, timestamp)
AuditLog(id, actor, action, entity, entityId, payload JSON, 
         timestamp)
```

---

## 🎯 Features Implementadas

### ✅ Requisitos Obrigatórios (Desafio)

- ✅ **Arquitetura:** Angular + Node.js Gateway + Python FastAPI + PostgreSQL
- ✅ **Policy-as-Code:** YAML com minApprovals, minScore, freezeWindows
- ✅ **Evidence Scoring:** Determinístico 0-100 (testado)
- ✅ **Regras de Promoção:** DEV→PRE_PROD→PROD com validações
- ✅ **Optimistic Locking:** versionRow em Release
- ✅ **Idempotência:** Idempotency-Key header
- ✅ **Auditoria:** AuditLog completo com filtros
- ✅ **RBAC:** admin / approver / viewer
- ✅ **Swagger/OpenAPI:** Gateway (3000/api-docs) e Backend (8000/docs)
- ✅ **Logs estruturados:** requestId/correlationId
- ✅ **Rate Limiting:** IP e User-based
- ✅ **Testes:** 60 unitários (scoring, policy, promoção)
- ✅ **Docker Compose:** dev + prod
- ✅ **Migrations SQL:** Alembic

### 🎁 Features Extras

- ✅ **Angular i18n:** Traduções completas PT/EN
- ✅ **Quick Login:** Botões rápidos para demo (admin/approver/viewer)
- ✅ **Score Badge:** Visualização com barra de progresso
- ✅ **Approval Count Optimization:** Backend calcula counts (1 query)
- ✅ **Duplicate Prevention:** Constraint UNIQUE (applicationId, version, env)
- ✅ **Freeze Window Debug:** Logs detalhados de timezone

---

## 📝 Estrutura do Repositório

```
/frontend-angular          # Angular SPA
/gateway-node             # Node.js Express Gateway
/service-backend          # Python FastAPI Backend
  /migrations             # Alembic SQL migrations
  /src
    /domain/services      # Policy, Scoring, Approval
    /application/usecases # Business logic
    /infrastructure       # DB, repositories
    /presentation/routes  # FastAPI endpoints
  /tests                  # Unit & integration tests
.env.example              # Template de variáveis
docker-compose.yml        # Dev
docker-compose.prod.yml   # Production
```

---

**Versão**: 1.0.0  
**Data**: Janeiro 2026  
**Status**: MVP Pronto para Avaliação
