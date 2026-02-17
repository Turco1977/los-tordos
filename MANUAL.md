# Manual de Uso — Los Tordos Rugby Club

## Plataforma de Gestión Integral

**URL**: https://los-tordos.vercel.app

Cada usuario accede con email + contraseña asignados por un administrador. La app funciona en cualquier navegador moderno (Chrome, Safari, Firefox) tanto en computadora como en celular. También funciona offline: si perdés conexión, los datos cacheados siguen disponibles y los cambios se sincronizan automáticamente al reconectar.

---

# PARTE 1 — GUÍA POR ROL

Cada persona del club tiene un rol asignado que determina qué puede ver y hacer en la plataforma. A continuación, la guía específica para cada rol.

---

## Enlace / Manager

**Pensado para**: Colaboradores externos, encargados puntuales, personas que participan en tareas específicas.

### Lo que ves al entrar
- **Mis Tareas**: Lista de tareas que te asignaron o que creaste vos.
- **Calendario**: Vista mensual con tareas, reuniones y recordatorios.
- **+ Tarea**: Botón para crear una nueva tarea.

### Barra lateral (sidebar)
En las **Secciones** ves:
- Plan 2035 (hitos estratégicos del club)
- Organigrama (estructura del club)
- Perfiles (directorio de personas)
- Proyectos (tablero de proyectos del club)
- Espacios (reserva de canchas y espacios)

### Cómo crear una tarea
1. Tocá **+ Tarea** en el header
2. Completá: tipo de tarea, descripción, fecha límite, urgencia
3. Podés asignarte la tarea a vos mismo o dejarla pendiente
4. Si la tarea requiere un gasto, marcá "Requiere gasto" y opcionalmente cargá un presupuesto
5. Tocá **Crear**

### Cómo trabajar una tarea
1. En **Mis Tareas**, tocá una tarea para ver el detalle
2. Podés:
   - **Tomar la tarea** si está pendiente y no tiene asignado
   - **Enviar mensajes** en el hilo de la tarea (log de actividad)
   - **Marcar resolución** y enviar a validación cuando terminaste
3. Si la tarea requiere gasto, primero pasa por Compras antes de que puedas completarla

### Flujo de estados de una tarea
```
Pendiente (🔴) → En Curso (🟡) → Compras (💰, si requiere gasto) → Validación (🔵) → Completada (🟢)
```

### Atajos de teclado
| Tecla | Acción |
|-------|--------|
| `D` | Ir a Mis Tareas |
| `N` | Nueva tarea |
| `C` | Calendario |
| `Cmd+K` o `Ctrl+K` | Paleta de comandos (buscador rápido) |

---

## Usuario

**Pensado para**: Miembros activos del club que trabajan en tareas pero no coordinan áreas.

### Qué ves (igual que Enlace, más)
Todo lo de Enlace, más la posibilidad de ver **Espacios/Reservas** y **Proyectos**.

### Diferencia con Enlace
Funcionalmente son equivalentes. El rol "Usuario" está pensado para miembros estables del club, mientras que "Enlace" es para colaboradores externos o temporales.

### Tu flujo típico
1. Entrás → ves **Mis Tareas** con todo lo que tenés asignado
2. Las tareas con fecha vencida aparecen marcadas
3. Trabajás la tarea → escribís mensajes de avance → completás la resolución
4. Enviás a **Validación** → el coordinador o admin la aprueba

---

## Compras / Tesorería

**Pensado para**: La persona o equipo encargado de aprobar gastos y gestionar el flujo financiero.

### Lo que ves al entrar
- **Dashboard**: Vista general de todas las áreas con anillos de progreso (% de tareas completadas por área)
- **Kanban**: Tablero visual de tareas por estado (columnas: Pendiente, En Curso, Compras, Validación, Completada)
- **Actividad**: Feed cronológico de toda la actividad reciente

### Secciones adicionales en la barra lateral
Todo lo que ve un Usuario, más:
- **Presupuestos** (💰): Gestión completa de presupuestos, proveedores y cotizaciones
- **Sponsors** (🥇): CRM de sponsors del club (oro, plata, bronce, colaborador)

### Tu función principal: Aprobar gastos
1. Cuando una tarea requiere gasto, llega al estado **Compras** (💰)
2. Recibís una notificación
3. Abrís la tarea → ves el detalle y presupuesto adjunto
4. **Aprobás** o **Rechazás** el gasto
5. Si aprobás, la tarea vuelve a **En Curso** y el responsable puede continuar
6. Si rechazás, también vuelve a En Curso con la nota

### Presupuestos
- Crear presupuestos asociados a tareas
- Cargar cotizaciones de proveedores (con archivo adjunto)
- Estados: Solicitado → Recibido → Aprobado / Rechazado
- Monedas: ARS o USD
- Presupuestos tipo "canje" asociados a sponsors

### Sponsors (CRM)
- Registrar sponsors con tier (Oro 🥇, Plata 🥈, Bronce 🥉, Colaborador 🤝)
- Estado: Activo, Negociando, Inactivo, Vencido
- Datos de contacto, tipo de pago, montos
- Seguimiento de uso de canje por sponsor

---

## Coordinador

**Pensado para**: Coordinadores de área o departamento. Personas que organizan el trabajo de su equipo.

### Lo que ves al entrar
Todo lo de Compras/Tesorería, más:
- **Reuniones** (🤝): Órdenes del Día y Minutas
- **Recurrentes** (🔁): Templates de tareas automáticas
- **Comunicar** (📢): Herramienta de comunicación interna
- **Inventario** (📦): Gestión de equipamiento y materiales

### Dashboard
- 6 áreas con anillos de progreso: Comisión Directiva, Secretaría Ejecutiva, Gobernanza, Deportiva, Social, Infraestructura
- Tocá un área → ves sus departamentos → tocá un departamento → ves sus tareas
- KPIs: Completadas, Pendientes, Vencidas, Con Gasto (tocá para filtrar)
- Exportar reporte **Semanal** o **Mensual** en PDF

### Asignar tareas
1. Abrí una tarea → tocá **Asignar**
2. Elegí la persona del listado
3. La tarea pasa automáticamente de Pendiente a En Curso
4. La persona asignada recibe una notificación

### Acciones masivas (bulk)
En la lista de tareas:
- Seleccioná múltiples tareas con los checkboxes
- **Cambiar estado** en lote
- **Asignar** en lote

### Importar tareas por CSV
Desde la lista de tareas → botón Importar → subí un CSV con columnas: `tipo`, `descripcion`, `fecha_limite`, `urgencia`

### Reuniones
#### Crear una Orden del Día (OD)
1. Ir a **Reuniones** → **Nueva OD**
2. Elegir tipo: Comisión Directiva, Secretaría Ejecutiva, o Área
3. Se pre-carga una estructura de secciones según el tipo
4. Completar los temas de cada sección
5. **Guardar como borrador** o **Enviar** (se genera minuta automática)

#### Completar una Minuta
1. La minuta se genera automáticamente cuando se envía la OD
2. Completar: hora inicio, hora cierre, lugar, presentes, ausentes
3. Registrar lo tratado en cada sección
4. Agregar tareas surgidas de la reunión (con responsable y fecha)
5. **Generar Tareas**: crea las tareas automáticamente en el sistema

#### Tipos de reuniones
| Tipo | Frecuencia | Duración | Estructura |
|------|-----------|----------|------------|
| Comisión Directiva | Mensual | 2 horas | Apertura, Informe SE, Tesorería, Áreas, Proyectos, Mociones, Cierre |
| Secretaría Ejecutiva | Quincenal | 1h30 | Pendientes, Informe Áreas, Resoluciones, Agenda, Temas a elevar |
| Área / Departamento | Quincenal | 1 hora | Qué hicimos, Qué hacemos, Stoppers, Próximos hitos, Necesidades |

### Tareas recurrentes
- Crear templates que generan tareas automáticamente
- Frecuencias: Semanal, Quincenal, Mensual, Trimestral
- Asignar responsable por defecto
- El sistema genera la tarea automáticamente cuando corresponde

### Inventario
- Registrar items del club (deportivo, indumentaria, infraestructura, tecnología, mobiliario)
- Estado: Nuevo, Bueno, Regular, A Reparar, De Baja
- Asignar responsable
- Cuando se completa una tarea de "Material deportivo", se genera automáticamente un item en inventario

### Reservas de espacios
- Canchas de rugby (1 a 6), Hockey (1 y 2), Pileta, Gimnasio, Salón Blanco, Cantina, Pajarera, Pérgola
- Reservar por fecha y horario
- Estados: Pendiente, Confirmada, Cancelada

---

## Administrador

**Pensado para**: Personas con responsabilidad administrativa amplia en el club.

### Lo que ves
Todo lo del Coordinador, más capacidades de gestión:

### Gestión de usuarios
1. Ir a **Perfiles** → **Agregar usuario**
2. Completar: nombre, apellido, email, rol, departamento, división
3. Se crea la cuenta automáticamente (el usuario recibe email para setear contraseña)
4. Podés **editar** el perfil de cualquier usuario (cambiar rol, departamento, etc.)

### Editar Plan 2035
- En **Plan 2035**, ajustar el % de avance de cada hito estratégico
- Los hitos se agrupan por fase (cada fase con un color)

### Editar tareas
- Modificar tipo, descripción, fecha límite, urgencia, división de cualquier tarea
- Se registra "Editó la tarea" en el log

### Validar tareas
- Cuando una tarea llega a **Validación**, podés aprobar (pasa a Completada) o rechazar (vuelve a En Curso)

---

## Super Admin

**Pensado para**: La persona con máximo control sobre la plataforma. Típicamente el presidente de la Secretaría Ejecutiva o administrador general del sistema.

### Lo que ves
**Todo**. Acceso completo a todas las funcionalidades.

### Capacidades exclusivas
- **Eliminar tareas**: Borrar tareas definitivamente
- **Eliminar usuarios**: Borrar perfiles y cuentas
- **Reordenar organigrama**: Cambiar el orden de miembros en la estructura
- Toda otra acción del sistema

---

# PARTE 2 — FUNCIONALIDADES COMUNES

Estas funcionalidades están disponibles para todos los roles (con las limitaciones indicadas).

---

## Paleta de Comandos (Cmd+K)
Abrí con `Cmd+K` (Mac) o `Ctrl+K` (Windows). Buscá cualquier cosa:
- Navegación rápida a cualquier sección
- Buscar tareas por número o descripción
- Buscar personas
- Cambiar tema (claro/oscuro)
- Cambiar contraseña
- Cerrar sesión

## Búsqueda global
El campo de búsqueda en el header busca en:
- Tareas (por ID, descripción, creador, tipo)
- Personas (por nombre)
- Presupuestos (por proveedor, descripción)

## Notificaciones
- Campana (🔔) en el header muestra notificaciones en tiempo real
- Badge rojo con cantidad de notificaciones pendientes
- Tipos: tareas asignadas, gastos aprobados/rechazados, @menciones, tareas vencidas
- Notificaciones push opcionales (activar desde el panel de notificaciones)

## @Menciones
En los mensajes de una tarea, escribí `@Nombre Apellido` para notificar a esa persona.

## Modo oscuro
Tocá el ícono de sol/luna en el header para alternar entre modo claro y oscuro.

## Calendario
Vista mensual con:
- Tareas por fecha límite
- Reuniones agendadas
- Recordatorios personales
- Arrastrar una tarea para cambiar su fecha
- Crear recordatorios con color y recurrencia

## Exportaciones
- **Tareas**: Exportar a CSV, PDF o iCal
- **Minutas**: Exportar a PDF o Word
- **Dashboard**: Reporte semanal o mensual en PDF (incluye KPIs, estado de tareas, presupuestos)
- **Proyectos**: Exportar proyecto a PDF

## Modo offline
La app funciona sin internet:
- Los datos se cachean automáticamente en el dispositivo
- Si perdés conexión, ves un indicador rojo **"Sin conexion"** en el header
- Podés seguir consultando datos y creando registros
- Al reconectar, los cambios se sincronizan automáticamente
- Si hay cambios pendientes, ves un badge amarillo que podés tocar para forzar la sincronización

## Proyectos
Tablero de proyectos tipo Kanban:
- Estados: Backlog, To Do, In Progress, Review, Done
- Prioridades: Low, Medium, High, Critical
- Cada proyecto tiene tareas internas y presupuesto propio
- Crear borradores o enviar directamente

---

# PARTE 3 — MANUAL DE GOBERNANZA (Super Admin)

## Modelo de Gobernanza de Los Tordos

La plataforma refleja la estructura de gobernanza del club. Este manual explica cómo la herramienta soporta cada nivel de la organización.

### Estructura organizacional

```
                    COMISIÓN DIRECTIVA
                    (Presidente, Vice, Secretario, Tesorero, Vocales)
                            │
                    SECRETARÍA EJECUTIVA
                    (Presidencia SE + Coordinación General SE)
                            │
              ┌─────────────┼─────────────┬──────────────┐
              │             │             │              │
         GOBERNANZA     DEPORTIVA       SOCIAL     INFRAESTRUCTURA
              │             │             │              │
         Departamentos  Departamentos  Departamentos  Departamentos
```

### Áreas y Departamentos

**Comisión Directiva** (🏛️)
- Presidente, Vicepresidente, Secretario, Tesorero
- 1er y 2do Vocal Titular, 1er y 2do Vocal Suplente

**Secretaría Ejecutiva** (⚡)
- Presidencia SE
- Coordinación General SE

**Gobernanza** (🛡️)
- Coordinación General, Eventos, Comunicación, Sponsoreo
- Gastronomía y Recepción, Administración, Compras
- Intendencia, Sistemas, Atención al Socio
- Estandarización de Procesos
- Tordos TV, Diseño, Redes, Fotografía, Filmación, Edición, Prensa, Creatividad
- Asesoría Comunicación, Tesorería, Finanzas, Financiamiento, Tordos Shop

**Deportiva** (🏉)
- Academia Tordos, Soporte Administrativo del Deporte, Mejora Continua

**Social** (🤝)
- Solidario, Conecta, Captación, Club del Ex

**Infraestructura** (🔧)
- Anexo, Estacionamiento Cancha 2, Plan Estratégico
- Luces Cancha 2/3/4, Cantina: Ampliación y Tribunas, Vestuarios y Depósito
- Dormy's, Espacio Madre Selva, Ingreso Urquiza, Luces Anexo, Molinetes, Club del Ex (Infra)

---

### Ciclo de gobernanza en la plataforma

#### 1. Planificación estratégica
- **Plan 2035**: Los hitos estratégicos del club se cargan con fases, periodos y % de avance
- El Super Admin y Administradores actualizan el progreso de cada hito
- Visible para todos los miembros como referencia del rumbo del club

#### 2. Ciclo de reuniones

El sistema soporta tres niveles de reuniones, cada uno con su estructura predefinida:

**Comisión Directiva (mensual, 2hs)**
```
1. Apertura (quórum + aprobación OD)
2. Informe de Secretaría Ejecutiva (avances + resoluciones)
3. Informe de Tesorería (estado financiero + presupuesto vs ejecución)
4. Informe de Áreas Estratégicas (Institucional, Deportivo, Social, Infraestructura)
5. Proyectos Especiales (estado, hitos, decisiones)
6. Mociones y temas a resolver (votaciones)
7. Cierre (síntesis + próxima fecha)
```

**Secretaría Ejecutiva (quincenal, 1h30)**
```
1. Repaso breve de pendientes
2. Informe de Áreas
3. Resoluciones rápidas operativas
4. Agenda próxima quincena
5. Definición de temas a elevar a CD
```

**Área / Departamento (quincenal, 1 hora)**
```
1. Qué hicimos
2. Qué estamos haciendo
3. Stoppers
4. Próximos hitos
5. Necesidades a elevar a SE
```

**Flujo**:
1. El coordinador o admin crea la **Orden del Día** (borrador)
2. Completa los temas a tratar en cada sección
3. **Envía** la OD → se genera automáticamente una **Minuta** vinculada
4. Después de la reunión, se completa la minuta (presentes, ausentes, hora, lugar, resoluciones)
5. Se registran las **tareas surgidas** con responsable y fecha
6. Se toca **Generar Tareas** → se crean automáticamente en el sistema y se asignan

Este flujo asegura trazabilidad: de cada reunión salen tareas concretas con responsable y fecha, y cada tarea queda vinculada a la reunión de origen.

#### 3. Gestión de tareas

Las tareas son la unidad de trabajo del club. Flujo completo:

```
CREACIÓN → ASIGNACIÓN → EJECUCIÓN → COMPRAS (opcional) → VALIDACIÓN → CIERRE
```

- **Creación**: Cualquier miembro puede crear una tarea
- **Asignación**: Coordinadores y admins asignan a responsables
- **Ejecución**: El responsable trabaja, deja mensajes de avance
- **Compras**: Si requiere gasto, pasa por aprobación de Compras/Tesorería
- **Validación**: El creador o un coordinador valida que se completó correctamente
- **Cierre**: Tarea completada con todo el historial registrado

**Escalamiento automático**: El sistema detecta tareas "trabadas" (sin avance por más de 7 días) y las muestra como alerta a coordinadores y admins.

**Tareas recurrentes**: Templates que generan tareas automáticamente (semanal, quincenal, mensual, trimestral). Útil para tareas de mantenimiento, informes periódicos, etc.

#### 4. Gestión financiera

**Presupuestos**: Cada gasto del club se registra como presupuesto asociado a una tarea.
- El solicitante carga el presupuesto con proveedor, monto, cotización
- Compras/Tesorería revisa y aprueba o rechaza
- Se puede asociar un canje de sponsor (el sistema trackea el uso vs. el acuerdo)

**Sponsors (CRM)**: Gestión de la relación con sponsors del club.
- Tiers: Oro, Plata, Bronce, Colaborador
- Datos de contacto, tipo de pago, montos acordados
- Seguimiento de canjes utilizados vs. disponibles

#### 5. Control de activos

**Inventario**: Todo el equipamiento del club registrado.
- Categorías: Deportivo, Indumentaria, Infraestructura, Tecnología, Mobiliario
- Estado de cada item: Nuevo, Bueno, Regular, A Reparar, De Baja
- Responsable asignado
- Cuando se completa una tarea de "Material deportivo", se genera automáticamente un item en inventario

**Espacios**: Reserva de instalaciones del club.
- 6 canchas de rugby, 2 de hockey, pileta, gimnasio, salón, cantina, pajarera, pérgola
- Reserva por fecha y horario con estados (pendiente, confirmada, cancelada)

---

### Reportes y seguimiento

El Super Admin tiene acceso a reportes completos:

**Dashboard con KPIs**
- Total de tareas, completadas, pendientes, vencidas, con gasto
- Anillos de progreso por área (% de tareas completadas)
- Drill-down: Área → Departamentos → Tareas individuales

**Reportes exportables** (PDF)
- **Semanal**: Estado general de la última semana
- **Mensual**: Resumen del mes
- Incluyen: estadísticas de tareas, top áreas, presupuesto ejecutado vs. aprobado

**Feed de actividad**
- Timeline cronológico de toda la actividad: tareas creadas, asignadas, completadas, mensajes, etc.
- Filtrable por tipo de actividad

---

### Configuración inicial (Super Admin)

Para poner en marcha la plataforma:

1. **Crear usuarios**: Perfiles → Agregar → completar datos y asignar rol
2. **Verificar organigrama**: Organigrama → verificar que la estructura refleja la realidad
3. **Cargar Plan 2035**: Plan 2035 → actualizar hitos y % de avance
4. **Configurar tareas recurrentes**: Recurrentes → crear templates para tareas periódicas
5. **Cargar inventario**: Inventario → registrar el equipamiento existente
6. **Registrar sponsors**: Sponsors → cargar datos de sponsors activos
7. **Primera reunión**: Reuniones → crear la primera OD y arrancar el ciclo

### Mantenimiento (Super Admin)

Tareas periódicas recomendadas:
- **Semanal**: Revisar dashboard de KPIs, verificar tareas vencidas, exportar reporte semanal
- **Quincenal**: Verificar que las reuniones generan tareas, revisar avance del Plan 2035
- **Mensual**: Exportar reporte mensual, revisar estado de sponsors, actualizar inventario
- **Trimestral**: Revisar y actualizar roles de usuarios, limpiar tareas obsoletas, evaluar métricas de productividad por área

---

# PARTE 4 — MÓDULO DEPORTIVO

**URL**: https://los-tordos.vercel.app/deportivo

Módulo separado para la gestión deportiva del club. Requiere un **rol deportivo** asignado por el Director Deportivo.

### Tabs
| Tab | Descripción |
|-----|-------------|
| Dashboard | Semáforo de bienestar por jugador (verde/amarillo/rojo) + indicador de lesión activa |
| Plantel | Lista de atletas con ficha completa (datos + historial lesiones + wellness) |
| Lesiones | Lista de lesiones activas/recuperación/alta, crear nueva, cambiar estado |
| Wellness | Check-in diario: 5 dimensiones (sueño, fatiga, estrés, dolor, ánimo) de 1 a 5 |
| Staff | Gestión de roles deportivos (solo Director Deportivo / Director de Rugby) |

### Semáforo de bienestar
Promedio de 5 dimensiones del último check-in (fatiga, estrés y dolor se invierten):
- **Rojo** (Alerta): promedio ≤ 2.5
- **Amarillo** (Precaución): promedio ≤ 3.5
- **Verde** (Óptimo): promedio > 3.5

Jugadores sin check-in en más de 2 días muestran alerta.

### Divisiones
Plantel Superior, M19, M17

### Roles deportivos
| Rol | Ver todas div | Crear jugador | Lesiones | Wellness | Staff |
|-----|:---:|:---:|:---:|:---:|:---:|
| Director Deportivo | x | x | x | x | x |
| Director de Rugby | x | x | x | x | x |
| Coordinador PF | x | - | - | x | - |
| Entrenador | sus div | x | - | - | - |
| Preparador Físico | sus div | - | - | x | - |
| Kinesiólogo | x | - | x | - | - |
| Médico | x | - | x | - | - |

---

# PARTE 5 — RESUMEN RÁPIDO DE PERMISOS

### Sistema de Gestión
| Acción | Super Admin | Admin | Coordinador | Compras | Usuario | Enlace |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboard general | x | x | x | x | - | - |
| Mis Tareas | x | x | x | x | x | x |
| Kanban | x | x | x | x | - | - |
| Actividad (feed) | x | x | x | x | - | - |
| Calendario | x | x | x | x | x | x |
| Crear tarea | x | x | x | x | x | x |
| Editar tarea | x | x | - | - | - | - |
| Eliminar tarea | x | - | - | - | - | - |
| Asignar tarea | x | x | x | - | - | - |
| Tomar tarea | x | x | x | - | x | x |
| Aprobar gastos | x | x | - | x | - | - |
| Presupuestos | x | x | x | x | - | - |
| Reuniones (OD/Minuta) | x | x | x | - | - | - |
| Tareas recurrentes | x | x | x | - | - | - |
| Comunicar | x | x | x | - | - | - |
| Inventario | x | x | x | - | - | - |
| Sponsors | x | x | x | x | - | - |
| Espacios/Reservas | x | x | x | x | x | x |
| Proyectos | x | x | x | x | x | x |
| Plan 2035 (ver) | x | x | x | x | x | x |
| Plan 2035 (editar) | x | x | - | - | - | - |
| Gestionar usuarios | x | x | - | - | - | - |
| Eliminar usuarios | x | - | - | - | - | - |
| Reordenar organigrama | x | - | - | - | - | - |
| Exportar reportes PDF | x | x | x | x | - | - |
