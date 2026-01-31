# Aurora GeoEnergy - Release Management System

Um sistema centralizado, auditável e configurável para gerenciar releases através de ambientes (DEV → PRE-PROD → PROD) com aprovações, políticas configuráveis, validação de evidências e auditoria completa.

**Status**: MVP Completo (90%)
- ✅ 4 Obrigatórios: Policy-as-Code, Evidence Scoring, Regras de Promoção, Auditoria
- ✅ Full-Stack CRUD: Angular + Node.js Gateway + Python Backend
- ✅ Segurança: JWT obrigatório, RBAC (admin/approver/viewer)
- ✅ Observabilidade: Swagger/OpenAPI, Logs Estruturados, Métricas
- ⏳ Rate Limiting, Optimistic Locking, Testes de Integração

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (Angular SPA) - http://localhost:4200                  │
│ - Applications, Releases, Approvals, Audit-Logs, Timeline       │
│ - Guards por role, Interceptors para erro/retry                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────▼──────────────────────────────────────┐
│ Gateway (Node.js Express) - http://localhost:3000               │
│ - Autenticação JWT, RBAC, Rate Limiting                         │
│ - Swagger/OpenAPI em /docs                                      │
│ - Proxy orquestrado para backend                                │
│ - Logs estruturados com requestId/correlationId                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────────────┐
│ Backend (Python FastAPI) - http://localhost:8000                │
│ - Domain Services: Policy, Scoring, Promotion                   │
│ - Repositories: Application, Release, Approval, Audit           │
│ - Validações determinísticas e concorrência                     │
│ - Swagger/OpenAPI em /docs                                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ SQL
┌──────────────────────────▼──────────────────────────────────────┐
│ PostgreSQL Database                                              │
│ - Applications, Releases, Approvals, ReleaseEvents, AuditLogs   │
│ - Constraints de unicidade e integridade                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Setup Rápido

### Pré-requisitos
- Docker & Docker Compose
- Node.js 18+ (development)
- Python 3.9+ (development)
- PostgreSQL 13+ (executar via Docker)

### 1. Clonar e Preparar Ambiente

```bash
git clone <repo>
cd aurora-geoenergy

# Copiar exemplo de .env (sem segredos)
cp .env.example .env
# Editar .env conforme necessário (JWT_SECRET, DB_URL, etc)
```

### 2. Iniciar com Docker Compose

```bash
# Production-ready (recomendado)
docker-compose -f docker-compose.prod.yml up -d

# Development (com hot-reload)
docker-compose up -d
```

**Serviços iniciados:**
- `db` (PostgreSQL 13): localhost:5432
- `backend` (Python FastAPI): localhost:8000
- `gateway` (Node.js Express): localhost:3000
- `frontend` (Angular): localhost:4200

### 3. Acessar Aplicação

| URL | Descrição |
|-----|-----------|
| http://localhost:4200 | Frontend SPA |
| http://localhost:3000/docs | Swagger API Gateway |
| http://localhost:8000/docs | Swagger Backend FastAPI |

**Credenciais de teste:**
```
Email: admin@aurora.local
Senha: (autenticação via JWT token - gerar via login)
Role: admin
```

---

## ⚙️ Configuração da Policy-as-Code

### Arquivo: `policy.yaml`

```yaml
policy:
  minApprovals: 1                    # Mínimo de aprovações para PROD
  minScore: 70                       # Score mínimo de evidência (0-100)
  freezeWindows:
    - env: PROD
      start: "22:00"
      end: "23:59"
      timezone: "America/Sao_Paulo"  # Bloqueia promoção neste horário
```

### Carregamento e Validação

1. **Backend carrega em runtime**: `PolicyService` lê `policy.yaml` ao iniciar
2. **Validação automática em promoção**:
   - DEV → PRE_PROD: ✅ Sempre permitido
   - PRE_PROD → PROD: Verifica minApprovals, minScore, freezeWindow

### Exemplo: Bloquear Promoção

```bash
# PRE_PROD → PROD às 22:30 (dentro da freeze window)
POST /api/releases/{id}/promote
# Resposta: 400 Bad Request
{
  "success": false,
  "error": {
    "code": "FREEZE_WINDOW_ACTIVE",
    "message": "Promoção bloqueada: janela de congelamento ativa para PROD (22:00-23:59 America/Sao_Paulo)"
  }
}
```

---

## 📊 Evidence Scoring

### Regras Determinísticas

O score é calculado **automaticamente** ao criar release (sem HTTP calls). Determinístico baseado em URL:

| Critério | Pontos | Exemplos |
|----------|--------|----------|
| HTTPS | +20 | `https://...` |
| Contém "test" | +20 | `...test-results...` |
| Contém "PASS" | +30 | `...PASS...` |
| Extensão de relatório | +10 | `.xml`, `.json`, `.html` |
| **Máximo** | **100** | — |

### Exemplo Scoring

```json
// Evidence URL
"https://ci.aurora.local/tests/v1.0.1-PASS-results.json"

// Breakdown
- Protocolo HTTPS: +20
- Nome contém "test": +20
- Nome contém "PASS": +30
- Extensão .json: +10
= SCORE: 80
```

### Validação de Promoção

```javascript
// PRE_PROD → PROD (policy.minScore = 70)
if (release.score < policy.minScore) {
  return 400 Bad Request
  "Score 65 < minScore 70 requerido para PROD"
}
```

### Recalcular Manualmente

```bash
POST /api/releases/calculate-score
Content-Type: application/json

{
  "evidence_url": "https://ci.example.com/results-PASS.xml"
}

# Resposta
{
  "score": 80,
  "breakdown": {
    "https": 20,
    "contains_test": 20,
    "contains_pass": 30,
    "file_extension": 10
  }
}
```

---

## 🔐 Autenticação e Autorização

### Fluxo JWT

1. **Login**: `POST /auth/login` com email/senha
2. **Receber token**: Header `Authorization: Bearer <token>`
3. **Todas as requisições**: Incluir header
4. **Validação Gateway**: Extrai email do token JWT
5. **Backend**: Cria audit log com actor_email

### Roles e Permissões

| Role | Permissões |
|------|-----------|
| `admin` | CRUD aplicações, releases, aprovações; visualizar audit |
| `approver` | Visualizar releases, aprovar/rejeitar, visualizar audit |
| `viewer` | Visualizar aplicações, releases, audit (read-only) |

### Exemplo de Token

```json
{
  "email": "user@aurora.local",
  "roles": ["admin"],
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## 📋 Fluxo de Promoção Completo

### Cenário: DEV → PRE_PROD → PROD

#### 1. Criar Release em DEV

```bash
POST /api/releases
{
  "application_id": "app-1",
  "version": "v1.0.2",
  "env": "DEV",
  "evidence_url": "https://ci.example.com/v1.0.2-PASS-results.json"
}

# Resposta: 201 Created
{
  "id": "rel-123",
  "env": "DEV",
  "status": "PENDING",
  "score": 80,
  "created_at": "2026-01-31T20:00:00Z"
}
```

**Audit Log gerado**: CREATE event, actor=user@aurora.local

#### 2. Promover DEV → PRE_PROD

```bash
POST /api/releases/rel-123/promote
{
  "notes": "Promovido para testes de integração"
}

# Resposta: 200 OK
{
  "id": "rel-123",
  "env": "PRE_PROD",  # Ambiente atualizado
  "status": "PENDING",
  "promoted_at": "2026-01-31T20:05:00Z"
}
```

**Validações realizadas:**
- ✅ DEV → PRE_PROD sempre permitido
- ✅ Evidence URL válida
- ✅ Score calculado

**Audit Log gerado**: PROMOTE event

#### 3. Aprovar em PRE_PROD

```bash
POST /api/approvals/rel-123/approve
{
  "notes": "Validado em staging. Pronto para PROD."
}

# Resposta: 200 OK
{
  "approval_id": "appr-456",
  "release_id": "rel-123",
  "outcome": "APPROVED",
  "approver_email": "approver@aurora.local",
  "timestamp": "2026-01-31T20:10:00Z"
}
```

**Audit Log gerado**: APPROVE event

#### 4. Promover PRE_PROD → PROD

```bash
POST /api/releases/rel-123/promote
{
  "notes": "Promovido para produção"
}

# Resposta validações pré-promoção:
# ✅ Score 80 >= minScore 70
# ✅ Approvals: 1 >= minApprovals 1
# ✅ Evidence URL presente
# ✅ Fora da freeze window (se aplicável)

# Sucesso:
{
  "id": "rel-123",
  "env": "PROD",  # Agora em PROD
  "status": "PENDING",
  "promoted_at": "2026-01-31T20:15:00Z"
}
```

**Audit Log gerado**: PROMOTE event

#### 5. Visualizar Timeline

```bash
GET /api/releases/rel-123/timeline

# Resposta
[
  {
    "id": "evt-1",
    "event_type": "CREATE",
    "status": "COMPLETED",
    "actor_email": "user@aurora.local",
    "timestamp": "2026-01-31T20:00:00Z",
    "notes": "Release v1.0.2 criado para DEV"
  },
  {
    "id": "evt-2",
    "event_type": "PROMOTE",
    "status": "COMPLETED",
    "actor_email": "user@aurora.local",
    "timestamp": "2026-01-31T20:05:00Z",
    "notes": "Promovido de DEV para PRE_PROD"
  },
  {
    "id": "evt-3",
    "event_type": "APPROVED",
    "status": "APPROVED",
    "actor_email": "approver@aurora.local",
    "timestamp": "2026-01-31T20:10:00Z",
    "notes": "Validado em staging. Pronto para PROD."
  },
  {
    "id": "evt-4",
    "event_type": "PROMOTE",
    "status": "COMPLETED",
    "actor_email": "user@aurora.local",
    "timestamp": "2026-01-31T20:15:00Z",
    "notes": "Promovido de PRE_PROD para PROD"
  }
]
```

---

## 🛑 Erros de Validação Comuns

### 1. Score Insuficiente

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Score 45 < minScore 70 requerido para PRE_PROD → PROD"
  }
}
```

**Solução**: Adicionar URL com mais critérios (HTTPS, "PASS", ".xml")

### 2. Falta de Aprovação

```json
{
  "success": false,
  "error": {
    "code": "APPROVAL_REQUIRED",
    "message": "Release requer 1 aprovação(ões) para PROD. Atual: 0"
  }
}
```

**Solução**: Solicitar aprovação via POST /api/approvals/{release_id}/approve

### 3. Freeze Window Ativo

```json
{
  "success": false,
  "error": {
    "code": "FREEZE_WINDOW_ACTIVE",
    "message": "Promoção bloqueada: janela de congelamento ativa para PROD (22:00-23:59 America/Sao_Paulo)"
  }
}
```

**Solução**: Aguardar após 23:59 ou contatar admin para exceção

### 4. Versão Duplicada

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Release v1.0.1 já existe para App 'web-app' no ambiente PRE_PROD"
  }
}
```

**Solução**: Usar versão diferente ou deletar release existente

---

## 📡 API Gateway - Endpoints Principais

Documentação completa em **http://localhost:3000/docs** (Swagger UI)

### Applications
- `GET /api/applications` - Listar (paginado)
- `POST /api/applications` - Criar
- `GET /api/applications/{id}` - Detalhes
- `PUT /api/applications/{id}` - Atualizar
- `DELETE /api/applications/{id}` - Remover

### Releases
- `GET /api/releases` - Listar (filtros: env, skip, limit)
- `POST /api/releases` - Criar
- `GET /api/releases/{id}` - Detalhes
- `PUT /api/releases/{id}` - Atualizar (evidência, notas)
- `DELETE /api/releases/{id}` - Remover
- `POST /api/releases/{id}/promote` - Promover com validação
- `GET /api/releases/{id}/timeline` - Timeline de eventos
- `POST /api/releases/calculate-score` - Calcular score manual

### Approvals
- `GET /api/approvals` - Listar pendentes (paginado, sem PROD)
- `POST /api/approvals` - Criar aprovação
- `GET /api/approvals/{id}` - Detalhes
- `PUT /api/approvals/{id}` - Atualizar
- `POST /api/approvals/{release_id}/approve` - Aprovar
- `POST /api/approvals/{release_id}/reject` - Rejeitar

### Audit
- `GET /api/audit` - Listar logs (filtros: action, actor, entity_type)
- `GET /api/audit/{entity_type}/{entity_id}` - Logs de entidade específica

---

## 🧪 Testes

### Testes Unitários (Backend)

```bash
# Scoring
pytest service-backend/tests/test_scoring_service.py -v

# Policy
pytest service-backend/tests/test_policy_service.py -v

# Resultado esperado: 13/13 testes passando
```

### Teste Manual: Fluxo Completo

```bash
# 1. Criar aplicação
curl -X POST http://localhost:3000/api/applications \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-app",
    "ownerTeam": "platform",
    "repoUrl": "https://github.com/example/test-app"
  }'

# 2. Criar release
curl -X POST http://localhost:3000/api/releases \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "application_id": "<app_id>",
    "version": "v1.0.0",
    "env": "DEV",
    "evidence_url": "https://ci.example.com/v1.0.0-PASS-results.xml"
  }'

# 3. Promover DEV → PRE_PROD
curl -X POST http://localhost:3000/api/releases/<release_id>/promote \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Promovido para staging"}'

# 4. Aprovar
curl -X POST http://localhost:3000/api/approvals/<release_id>/approve \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Testes passaram. Aprovado."}'

# 5. Promover PRE_PROD → PROD
curl -X POST http://localhost:3000/api/releases/<release_id>/promote \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Promovido para produção"}'

# 6. Verificar timeline
curl -X GET http://localhost:3000/api/releases/<release_id>/timeline \
  -H "Authorization: Bearer <token>"
```

---

## 🏛️ Trade-offs e Decisões de Design

### 1. Evidence Scoring Determinístico (sem HTTP)
**Decisão**: Validar URL por padrão (HTTPS, extensão, palavras-chave) em vez de fazer HTTP calls.

**Pros**:
- Sem latência de rede
- Sem dependência de serviços externos
- Determinístico (mesmo resultado sempre)
- Seguro (sem exposição de credenciais)

**Cons**:
- Menos preciso que análise real de artefatos
- Não valida conteúdo real do arquivo

**Alternativa descartada**: HTTP calls para CI/CD systems (Jenkins, GitHub Actions) → complexo, latência, erros de rede

### 2. Status Obrigatório em ReleaseEvents
**Decisão**: Manter status NOT NULL mas com valores padrão (COMPLETED para não-approval).

**Pros**:
- Integridade referencial
- Frontend pode filtrar por status

**Cons**:
- Status não é significativo para eventos não-approval

**Alternativa descartada**: Status nullable → dificultaria queries e serialização

### 3. JWT Obrigatório em Todas Operações
**Decisão**: Remover fallback "system" actor. Exigir JWT sempre.

**Pros**:
- Rastreabilidade completa
- Segurança: sem operações anônimas
- Auditoria clara: quem fez o quê

**Cons**:
- Scripts automatizados precisam de token

**Alternativa descartada**: Service accounts com JWT de longa duração (introduz risco de vazamento)

### 4. Paginação no Backend
**Decisão**: skip/limit em query parameters (não offset-based).

**Pros**:
- Simples, familiar
- Funciona bem com UX de "carregar mais"

**Cons**:
- Vulnerável a inconsistências em dados dinâmicos
- Skip sobre grandes datasets é O(n)

**Alternativa descartada**: Cursor-based pagination (melhor performance, mais complexo)

### 5. Auditoria Centralizada
**Decisão**: Backend cria AuditLog para todas ações (CREATE, UPDATE, DELETE, APPROVE, REJECT, PROMOTE).

**Pros**:
- Completo e confiável
- Fonte única de verdade

**Cons**:
- Cada operação = 2 inserts (tabela + auditlog)
- Cresce rápido em volume

**Alternativa descartada**: Event sourcing (architecture overkill para esta fase)

---

## 📦 Variáveis de Ambiente

### Backend

```bash
# Banco de dados
DATABASE_URL=postgresql://user:pass@db:5432/aurora

# JWT
JWT_SECRET=sua-chave-super-secreta-aqui-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Política
POLICY_FILE_PATH=/app/policy.yaml

# Logging
LOG_LEVEL=INFO
```

### Gateway

```bash
# Backend
BACKEND_BASE_URL=http://backend:8000

# JWT
JWT_SECRET=sua-chave-super-secreta-aqui-min-32-chars

# Rate Limiting (próximas versões)
RATE_LIMIT_IP_REQUESTS=100
RATE_LIMIT_IP_WINDOW_MINUTES=1
RATE_LIMIT_USER_REQUESTS=50
RATE_LIMIT_USER_WINDOW_MINUTES=1
```

### Frontend

```bash
# API Gateway
API_BASE_URL=http://localhost:3000/api

# Auth
AUTH_STORAGE_KEY=aurora_token
```

---

## 🔧 Troubleshooting

### "Connection refused" na porta 3000

```bash
# Verificar status
docker-compose ps

# Restart gateway
docker-compose restart gateway

# Ver logs
docker-compose logs -f gateway
```

### "Unauthorized" (401)

- Verificar se token está no header `Authorization: Bearer <token>`
- Token expirou? Fazer login novamente
- JWT_SECRET diferente entre Gateway e Backend?

### "Score insuficiente para PROD"

- Checar URL da evidência: deve conter HTTPS, "PASS" ou "test", e extensão .json/.xml
- Recalcular via POST /api/releases/calculate-score
- Atualizar policy.yaml se score mínimo deve ser menor

### Database connection error

```bash
# Verificar PostgreSQL
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up -d db
# Aguardar ~10s e iniciar outros serviços
```

---

## 📈 Próximas Fases (Não Obrigatório)

- [ ] Rate Limiting no Gateway (IP-based + User-based)
- [ ] Optimistic Locking com versionRow
- [ ] Idempotency-Key para deduplicação de promoção
- [ ] Integration Tests (pytest com fixtures)
- [ ] Notificações (email/Slack) ao bloquear/promover
- [ ] Dashboard com métricas (releases/dia, taxa de sucesso)
- [ ] Support para múltiplas políticas por aplicação
- [ ] Approval workflows customizados (escada de aprovações)
- [ ] Rollback automático em PROD

---

## 📝 Licença

Desafio Técnico - Aurora GeoEnergy 2026

---

## 👥 Suporte

- **Issues**: Abrir issue no repositório
- **Documentação**: Consultar Swagger em `/docs`
- **Logs**: `docker-compose logs <service>`

---

**Versão**: 1.0.0-alpha  
**Última atualização**: 31 de Janeiro de 2026  
**Status**: MVP Pronto para Avaliação
