# Frontend Angular - Aurora Geoenergy

Frontend moderno em Angular 17+ com Standalone Components para o sistema de gerenciamento de releases.

## Estrutura

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts
│   │   └── guards/
│   │       └── auth.guard.ts
│   ├── pages/
│   │   ├── login/
│   │   │   ├── login.component.ts
│   │   │   ├── login.component.html
│   │   │   └── login.component.scss
│   │   └── dashboard/
│   │       ├── dashboard.component.ts
│   │       ├── dashboard.component.html
│   │       └── dashboard.component.scss
│   ├── shared/
│   │   └── models/
│   │       └── auth.model.ts
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── styles.scss
└── index.html
```

## Desenvolvimento

```bash
npm install
npm start
# Acesso em http://localhost:4200
```

## Build Produção

```bash
npm run build
```

## Docker

```bash
# Desenvolvimento
docker build -f Dockerfile.dev -t aurora-frontend:dev .
docker run -p 4200:4200 aurora-frontend:dev

# Produção
docker build -f Dockerfile.prod -t aurora-frontend:prod .
docker run -p 4200:4200 aurora-frontend:prod
```
