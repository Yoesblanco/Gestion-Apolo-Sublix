# Gestión Apolo Sublix

Sistema integral de gestión para Apolo Sublix diseñado bajo Clean Architecture, TypeScript, Drizzle ORM, PostgreSQL y Docker.

---

## 🏛️ Arquitectura del Sistema (Clean Architecture)

```
server/src/
├── app.ts                 # Configuración de Express, middlewares y rutas
├── index.ts               # Entrada principal, inicio del servidor y graceful shutdown
├── config/
│   ├── env.ts             # Variables de entorno validadas estrictamente con Zod
│   └── database.ts        # Pool PostgreSQL y cliente Drizzle ORM
├── db/
│   ├── migrate.ts         # Inicializador y ejecutor de migraciones DDL
│   └── schema/            # Esquemas fuertemente tipados de tablas PostgreSQL
│       ├── users.ts
│       ├── products.ts
│       ├── customers.ts
│       ├── orders.ts
│       ├── payments.ts
│       ├── transactions.ts
│       ├── to-buy.ts
│       ├── to-buy-history.ts
│       ├── stock-history.ts
│       └── meta.ts
├── shared/
│   ├── errors/            # Clases de error de dominio (AppError)
│   ├── middlewares/       # JWT Auth, Rate Limiter, Validador Zod, Error Handler
│   └── utils/             # Logger, Password Hasher (Bcrypt)
└── modules/               # Módulos desacoplados (Domain, Application, Infrastructure, Presentation)
    ├── auth/              # Login, Registro, Actualización de perfil y Tokens JWT
    ├── products/          # Gestión de productos e inventario base
    ├── customers/         # Gestión de clientes
    ├── orders/            # Pedidos y pagos asociados
    ├── transactions/      # Flujo de caja (ingresos / egresos)
    ├── inventory/         # Historial de movimientos de stock
    ├── to-buy/            # Compras pendientes e historial de compras
    └── sync/              # Sincronización masiva con frontend / persistencia
```

---

## 🚀 Despliegue y Ejecución con Docker

### 1. Iniciar toda la infraestructura (PostgreSQL + Backend)
```bash
docker compose up -d --build
```

### 2. Verificar estado de contenedores
```bash
docker compose ps
```

### 3. Detener servicios
```bash
docker compose down
```

---

## 💻 Desarrollo Local

### Backend (Node.js + TypeScript):
```bash
cd server
npm install
npm run dev
```

### Frontend (React + Vite):
```bash
npm install
npm run dev
```

---

## 🔒 Variables de Entorno

Copiar `.env.example` a `.env` en la raíz o en `server/`:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=apolo_sublix
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/apolo_sublix
PORT=5000
NODE_ENV=development
JWT_SECRET=tu_clave_secreta_jwt_para_produccion
JWT_EXPIRES_IN=24h
CORS_ORIGIN=*
VITE_API_BASE_URL=http://localhost:5000
```
