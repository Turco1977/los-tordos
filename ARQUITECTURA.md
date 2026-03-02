# Los Tordos - Documento Funcional & Arquitectura

## 1. Resumen Ejecutivo

| Dato | Valor |
|------|-------|
| **Stack** | Next.js 16.1.6 + React 19 + Supabase + Zustand |
| **Líneas de código** | ~19,123 |
| **Componentes** | 42 en components/main/ |
| **Tablas DB** | 18+ en Supabase |
| **API Routes** | 9 endpoints |
| **Hooks custom** | 10 hooks |
| **Deploy** | Vercel (auto-deploy desde GitHub) |
| **Producción** | https://los-tordos.vercel.app |

---

## 2. Mapa de Módulos Funcionales

```
┌─────────────────────────────────────────────────────────┐
│                    LOS TORDOS APP                       │
├─────────────┬───────────────┬───────────────────────────┤
│  GESTIÓN    │  OPERACIONES  │  SOPORTE                  │
├─────────────┼───────────────┼───────────────────────────┤
│ Dashboard   │ Inventario    │ Organigrama               │
│ Tareas      │ Reservas      │ Perfiles                  │
│ Kanban      │ Sponsors      │ Archivos                  │
│ Recurrentes │ Presupuestos  │ Comunicaciones            │
│ Proyectos   │ Distribuciones│ Notificaciones            │
│ Mi Dash     │ Mantenimiento │ Calendario                │
│ Actividad   │ Viajes        │ Exportaciones             │
└─────────────┴───────────────┴───────────────────────────┘
```

### 2.1 Módulos detallados

#### GESTIÓN DE TAREAS
- **Dashboard** (`CustomDash.tsx` - 360 líneas): Vista principal admin con KPIs
- **Mi Dash** (`MyDash.tsx` - 272 líneas): Vista personal enlace/usuario
- **Tareas** (`TaskList.tsx` - 92 líneas): Lista filtrable de tareas
- **Kanban** (`KanbanView.tsx` - 42 líneas): Vista kanban drag-and-drop
- **Detalle** (`Det.tsx` - 198 líneas): Detalle de tarea con log/chat
- **Nueva Tarea** (`NewPedido.tsx` - 115 líneas): Formulario creación
- **Recurrentes** (`RecurrentTasks.tsx` - 274 líneas): Templates recurrentes
- **Actividad** (`ActivityFeed.tsx` - 133 líneas): Feed de actividad

#### INVENTARIO (nuevo)
- **Inventario** (`InventarioView.tsx` - 564 líneas): Gestión completa
  - Activos Fijos (con fichas, mantenimiento)
  - Material Deportivo (lotes Rugby/Hockey)
  - Distribuciones (con acuse de recibo)
  - Resumen por División + Material
- **Mi Inventario** (`EnlaceInventario` en MyDash.tsx): Vista enlace
- **Importar** (`InvImport.tsx` - 139 líneas): Import CSV/Excel

#### SPONSORS
- **Sponsors** (`SponsorsView.tsx` - 840 líneas): Gestión de sponsors
- **Entregas** (`SponDelivery.tsx` - 132 líneas): Tracking entregas
- **Facturación** (`NewFactura.tsx` - 157 líneas): Generación facturas

#### ESPACIOS & RESERVAS
- **Reservas** (`ReservasView.tsx` - 611 líneas): Booking de espacios

#### PROYECTOS
- **Proyectos** (`ProyectosView.tsx` - 490 líneas): Gestión de proyectos
- **Presupuestos** (`PresView.tsx` - 197 líneas): Presupuestos asociados

#### REUNIONES
- **Reuniones** (`Reuniones.tsx` - 388 líneas): Agenda + minutas

#### ORGANIGRAMA
- **Organigrama** (`Org.tsx` - 204 líneas): Estructura institucional
- **Departamentos** (`Depts.tsx` - 45 líneas)

#### COMUNICACIONES
- **Comunicar** (`CommView.tsx` - 115 líneas): Anuncios
- **Solicitudes** (`CommReq.tsx` - 167 líneas)

#### ARCHIVOS
- **Archivos** (`ArchivosView.tsx` - 148 líneas): Gestor documental

---

## 3. Arquitectura de Datos

### 3.1 Tablas Supabase (18)

```
CORE
├── profiles              → Usuarios del sistema
├── tasks                 → Tareas/pedidos
├── task_messages          → Mensajes/log de tareas
├── org_members           → Miembros organigrama
├── milestones            → Hitos/fases
├── notifications         → Notificaciones
├── reminders             → Recordatorios
│
INVENTARIO
├── inventory             → Items (activos + lotes)
├── inventory_maintenance → Mantenimiento de activos
├── inventory_distributions → Distribuciones a divisiones
│
PROYECTOS & PRESUPUESTOS
├── projects              → Proyectos
├── project_tasks         → Tareas de proyecto
├── project_budgets       → Presupuestos de proyecto
├── presupuestos          → Presupuestos de tareas
├── proveedores           → Proveedores
│
SPONSORS
├── sponsors              → Sponsors
├── sponsor_messages      → Mensajes de sponsors
├── sponsor_deliveries    → Entregas de sponsors
│
RESERVAS & OTROS
├── bookings              → Reservas de espacios
├── archivos              → Archivos/documentos
├── task_templates         → Templates recurrentes
├── push_subscriptions    → Suscripciones push
├── viajes                → Viajes
│
DEPORTIVO (módulo separado)
├── dep_athletes          → Atletas
├── dep_training_sessions → Sesiones entrenamiento
├── dep_attendance        → Asistencia
├── dep_cuotas            → Cuotas
```

### 3.2 Flujo de datos

```
Browser → Supabase Auth → Session
                ↓
        useDataFetch (3 fases)
        ├── Fase 1: 22 queries paralelos (inmediato)
        ├── Fase 2: +500 tareas antiguas (2s delay)
        └── Cache: IndexedDB para offline
                ↓
        Zustand Store (23 slices)
                ↓
        Componentes React (subscriptions)
                ↓
        Mutations → Supabase API → Realtime → Otros clientes
```

### 3.3 Roles y permisos

| Rol | Nivel | Acceso |
|-----|-------|--------|
| superadmin | 5 | Todo |
| admin | 4 | Todo |
| coordinador | 3 | Depto propio + gestión |
| embudo | 3 | Compras/tesorería |
| usuario | 2 | Tareas propias |
| enlace | 1 | Pedidos + inventario propio |
| manager | 1 | Similar a enlace |

---

## 4. Estructura de Archivos

```
los-tordos/
├── app/
│   ├── page.tsx                    (316 líneas) ← ARCHIVO PRINCIPAL
│   ├── layout.tsx                  (metadata + fonts)
│   ├── deportivo/page.tsx          (módulo deportivo separado)
│   └── api/
│       ├── setup/route.ts          (460 líneas) ← Migraciones DB
│       ├── tasks/route.ts          (161 líneas)
│       ├── notifications/route.ts  (223 líneas)
│       ├── upload/route.ts         (105 líneas)
│       ├── push/subscribe/route.ts (50 líneas)
│       ├── admin/create-user/      (62 líneas)
│       ├── deportivo/create-user/  (65 líneas)
│       ├── hockey/viajes/          (56 líneas)
│       └── cron/daily-summary/     (252 líneas)
│
├── components/
│   ├── main/                       (42 componentes)
│   │   ├── SponsorsView.tsx        840 líneas ← MÁS GRANDE
│   │   ├── ClubMap.tsx             680
│   │   ├── ReservasView.tsx        611
│   │   ├── InventarioView.tsx      564
│   │   ├── ProyectosView.tsx       490
│   │   ├── Reuniones.tsx           388
│   │   ├── CustomDash.tsx          360
│   │   ├── RecurrentTasks.tsx      274
│   │   ├── MyDash.tsx              272
│   │   ├── CalView.tsx             291
│   │   ├── ProfileActivity.tsx     212
│   │   ├── ViajesManager.tsx       205
│   │   ├── Det.tsx                 198
│   │   ├── PresView.tsx            197
│   │   ├── ViajeChecklist.tsx      168
│   │   ├── CommReq.tsx             167
│   │   ├── NewFactura.tsx          157
│   │   ├── ArchivosView.tsx        148
│   │   ├── InvImport.tsx           139
│   │   ├── ActivityFeed.tsx        133
│   │   ├── SponDelivery.tsx        132
│   │   ├── NotifPrefs.tsx          125
│   │   ├── CommView.tsx            115
│   │   ├── NewPedido.tsx           115
│   │   ├── CommandPalette.tsx      111
│   │   ├── NotificationPanel.tsx   107
│   │   ├── TaskList.tsx            92
│   │   ├── AppHeader.tsx           75
│   │   ├── Profs.tsx               56
│   │   ├── Sidebar.tsx             51
│   │   ├── Login.tsx               45
│   │   ├── Thread.tsx              44
│   │   ├── KanbanView.tsx          42
│   │   ├── Proyecto.tsx            41
│   │   ├── ChangePw.tsx            39
│   │   ├── CsvImport.tsx           35
│   │   ├── Depts.tsx               45
│   │   ├── DeptCircles.tsx         18
│   │   ├── Circles.tsx             16
│   │   └── KPIs.tsx                15
│   ├── ui.tsx                      (componentes base: Btn, Card, Ring...)
│   ├── ErrorBoundary.tsx
│   └── MentionInput.tsx
│
├── hooks/
│   ├── useDataFetch.ts             193 líneas
│   ├── useNotifications.ts         200
│   ├── useRealtimeSetup.ts         117
│   ├── useViews.ts                 80
│   ├── useTaskHandlers.ts          70
│   ├── useRecurringTasks.ts        57
│   ├── useCommandPalette.ts        53
│   ├── useAuth.ts                  51
│   ├── useKeyboard.ts             39
│   └── useSearch.ts               30
│
├── lib/
│   ├── constants.ts                190 líneas (T, AREAS, ROLES, etc.)
│   ├── export.ts                   633 (CSV/PDF/iCal/Word)
│   ├── store.ts                    146 (Zustand 23 slices)
│   ├── mappers.ts                  19 (DB ↔ UI mappers)
│   ├── use-offline.ts              215 (offline mode + sync)
│   ├── sync-queue.ts               123
│   ├── offline-store.ts            77 (IndexedDB)
│   ├── storage.ts                  54 (localStorage)
│   ├── notifications.ts            74
│   ├── realtime.ts                 70
│   ├── theme.ts                    56
│   ├── theme-context.tsx           6
│   ├── pagination.ts              30
│   ├── types-internal.ts          167
│   └── supabase/
│       ├── client.ts               (browser client)
│       ├── server.ts               (server client)
│       └── types.ts                (28 interfaces)
│
├── middleware.ts                    (auth middleware)
├── package.json
├── next.config.ts
├── vercel.json
└── tsconfig.json
```

---

## 5. Recomendaciones de Arquitectura

### 5.1 CRÍTICO — Problemas actuales

#### A) `page.tsx` es un God Object (316 líneas, 105 definiciones)
**Problema**: Todo pasa por un solo archivo. Callbacks, state, routing, rendering.
**Riesgo**: Rules of Hooks (ya causó 2 crashes en producción).

**Recomendación**: Extraer callbacks a hooks dedicados.
```
Antes:  page.tsx tiene onAddDist, onUpdDist, onDelDist, onConfirmReceipt inline
Después: useInventoryHandlers(supabase, store) → { onAddDist, onUpdDist, ... }
```

#### B) Sin validación server-side
**Problema**: RLS policies son `FOR ALL USING (true)` — cualquier usuario autenticado puede hacer cualquier cosa.
**Riesgo**: Un enlace podría borrar datos de admin.

**Recomendación**: Implementar RLS policies por rol.

#### C) 22 queries paralelos al cargar
**Problema**: Cada vez que se carga la app, se hacen 22 queries a Supabase.
**Riesgo**: Lento en conexiones débiles, costos de Supabase.

**Recomendación**: Cargar solo lo que necesita cada vista (lazy loading de datos).

### 5.2 IMPORTANTE — Mejoras recomendadas

#### D) Separar módulos en rutas Next.js
```
Actual:   app/page.tsx maneja TODO con un switch de vw
Propuesto: app/(main)/inventario/page.tsx
           app/(main)/tareas/page.tsx
           app/(main)/sponsors/page.tsx
           etc.
```
**Beneficio**: Code splitting automático, carga más rápida.

#### E) Mover estilos inline a CSS Modules o Tailwind
**Problema**: Miles de objetos `style={{...}}` inline.
**Impacto**: Bundle más grande, no cacheable, difícil mantener.

#### F) TypeScript estricto
**Problema**: Uso extensivo de `any` (especialmente en props y callbacks).
**Recomendación**: Definir interfaces para cada componente.

### 5.3 NICE TO HAVE

- **Testing**: Agregar tests para flujos críticos (login, crear tarea, distribuir)
- **Storybook**: Documentar componentes UI
- **Error tracking**: Integrar Sentry para errores en producción
- **Analytics**: Vercel Analytics o similar

---

## 6. Estrategia de Backup

### 6.1 Código fuente
- **GitHub**: Ya respaldado en https://github.com/Turco1977/los-tordos.git
- **Recomendación**: Hacer tags de versión en releases importantes
  ```bash
  git tag -a v1.0 -m "Versión estable con inventario"
  git push origin v1.0
  ```

### 6.2 Base de datos (Supabase)

#### Opción A: Backup manual desde Supabase Dashboard
1. Ir a https://supabase.com → tu proyecto → Settings → Database
2. Backups → descargar dump SQL

#### Opción B: Backup automático con script
```bash
# Instalar CLI de Supabase
npx supabase db dump -f backup_$(date +%Y%m%d).sql
```

#### Opción C: Export desde la app (ya implementado)
- La app ya tiene export CSV/Excel en varios módulos
- Usar los botones de exportar en Tareas, Inventario, etc.

#### Opción D: Backup programado (recomendado)
Crear un cron job que exporte todas las tablas a un bucket de Supabase Storage:
```sql
-- Supabase tiene backups automáticos en planes Pro ($25/mes)
-- En plan Free: backups manuales o via API
```

### 6.3 Plan de backup recomendado

| Qué | Cómo | Frecuencia |
|-----|------|------------|
| Código | GitHub (automático en cada push) | Cada cambio |
| DB completa | Supabase Dashboard export | Semanal |
| Datos críticos | Export CSV desde la app | Mensual |
| Archivos/fotos | Supabase Storage (ya incluido) | Automático |
| Configuración | `.env` guardado aparte | Manual |

### 6.4 Archivos a resguardar fuera del repo

```
.env.local                    → Variables de entorno
SUPABASE_URL                  → URL del proyecto
SUPABASE_ANON_KEY            → API key pública
SUPABASE_SERVICE_ROLE_KEY    → API key admin (SECRETO)
VAPID keys                    → Para push notifications
```

**NUNCA** subir estos archivos a GitHub. Guardar en un password manager (1Password, Bitwarden) o documento encriptado.

---

## 7. Roadmap sugerido

### Fase 1 — Estabilización (actual)
- [x] Inventario con distribuciones
- [x] Acuse de recibo para enlaces
- [ ] Corregir error de carga de perfiles
- [ ] Validar que enlaces ven sus distribuciones

### Fase 2 — Seguridad
- [ ] Implementar RLS policies por rol en Supabase
- [ ] Validación server-side en API routes
- [ ] Rate limiting

### Fase 3 — Performance
- [ ] Lazy loading de datos por vista
- [ ] Reducir queries iniciales de 22 a ~5
- [ ] Implementar paginación server-side

### Fase 4 — Refactor
- [ ] Extraer callbacks de page.tsx a hooks
- [ ] Separar en rutas Next.js
- [ ] TypeScript estricto (eliminar `any`)

---

*Generado el 2026-03-01. Última actualización de código: commit bde5eb5.*
