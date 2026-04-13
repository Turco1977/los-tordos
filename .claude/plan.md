# Informe de Usabilidad y Permisos — Los Tordos App

## Estado actual

La app maneja ~20 módulos (Tareas, Reuniones, Sponsors, Inventario, Reservas, Presupuestos, Proyectos, Torneos, Becas, Atención Socio, etc.) con 7 roles y ~48 slices de Zustand. Funciona, pero tiene gaps de UX y permisos que afectan la experiencia diaria.

---

## PARTE 1: PROBLEMAS DE PERMISOS

### P1. Dependencia de nombres hardcodeados
- **Tesorero** y **aprobadores de alquileres** (Victoria Brandi, Lucía Gil, Bautista Pontis) están hardcodeados por nombre.
- Si alguien cambia de cargo o de nombre, los permisos se rompen silenciosamente.
- **Fix**: Agregar flags en `profiles` (ej: `is_tesorero`, `can_approve_rentals`) o un campo `special_permissions jsonb`.

### P2. RLS demasiado permisivo
- La tabla `tasks` permite UPDATE a cualquier usuario autenticado a nivel DB.
- `minutas`, `agendas`, `inventory` confían 100% en la lógica del frontend.
- **Fix**: Reforzar RLS policies para que el DB valide al menos el rol del usuario.

### P3. Editar minutas cerradas sin re-aprobación
- Cualquier coordinador puede editar una minuta aprobada sin que se reinicie el flujo de aprobación.
- **Fix**: Si se edita una minuta aprobada, resetear status a "final" y limpiar approvals, o agregar campo `edited_after_approval`.

### P4. Sin granularidad en Sponsors
- Todos los coordinadores/embudo pueden editar todos los sponsors.
- **Fix**: Restringir por área o agregar un campo `owner_id` al sponsor.

### P5. Inventario legible sin RLS
- Enlace/manager ven solo sus distribuciones en el frontend, pero la DB no restringe reads.
- **Fix**: Agregar RLS policy que filtre por `user_id` para rol enlace/manager.

---

## PARTE 2: PROBLEMAS DE USABILIDAD

### U1. Sin indicadores de carga
- No hay spinners, skeletons ni "Cargando..." en ninguna vista.
- El usuario no sabe si la app está trabajando o colgada.
- **Fix**: Agregar estado `loading` al fetch y mostrar skeleton/spinner.

### U2. Validación de formularios silenciosa
- Los botones se deshabilitan pero no se explica por qué.
- El usuario no sabe qué campo falta.
- **Fix**: Mostrar mensajes inline bajo cada campo requerido faltante.

### U3. Sin breadcrumbs
- Navegación profunda (Sidebar → Sección → Lista → Detalle → Modal) sin indicar dónde estás.
- **Fix**: Agregar breadcrumbs en vistas con más de 2 niveles de profundidad.

### U4. Error handling pobre
- Muchas operaciones fallan silenciosamente.
- No hay botón de "Reintentar".
- No hay indicador de conexión offline.
- **Fix**: Error boundary global + indicador de conexión + retry en toasts.

### U5. Búsqueda limitada
- Solo busca en Tareas, Usuarios y Presupuestos.
- No busca en Minutas, Sponsors, Inventario, Archivos.
- **Fix**: Expandir useSearch.ts para indexar más entidades.

### U6. Inconsistencias de UI
- Botones inline `<button>` que no usan el componente `Btn`.
- Font sizes sin jerarquía clara (9px a 16px mezclados).
- Gaps y paddings inconsistentes (4/6/8/10/12px).
- **Fix**: Definir un sistema de diseño con tokens (spacing, typography, colors).

### U7. Accesibilidad básica
- Faltan `htmlFor` en labels, alt text, focus indicators.
- Sin navegación por teclado documentada.
- **Fix**: Pasar por todos los forms y agregar aria-labels, htmlFor, focus-visible.

### U8. Mobile inconsistente
- Algunos componentes se adaptan bien, otros no.
- Tablas en mobile difíciles de leer.
- Search bar se achica a 100px en mobile.
- **Fix**: Auditar cada vista en mobile y arreglar caso por caso.

---

## PARTE 3: PLAN DE MEJORAS (priorizado)

### FASE 1 — Críticos (esta semana)
1. **Loading states**: Agregar spinner/skeleton al fetch inicial y a cada operación async
2. **Validación visible**: Mensajes inline en NewPedido, Reuniones, y formularios de Sponsors
3. **Re-aprobación de minutas editadas**: Resetear approvals si se edita post-aprobación
4. **Error boundary global**: Catch-all para errores de React con pantalla amigable

### FASE 2 — Importantes (próxima semana)
5. **Permisos hardcodeados → flags en DB**: Migrar Tesorero y aprobadores de alquileres a campo en profiles
6. **RLS reforzado**: Policies más estrictas en tasks, minutas, inventory
7. **Breadcrumbs**: En vistas con navegación profunda (Det, Reuniones, Sponsors)
8. **Indicador offline**: Componente que muestre "Sin conexión" + queue de cambios pendientes
9. **Búsqueda expandida**: Agregar Minutas, Sponsors, Inventario a useSearch

### FASE 3 — Mejoras de calidad (semana 3)
10. **Design system tokens**: Definir scale de spacing (4/8/12/16/24), typography (xs/sm/md/lg/xl), y usarlos consistentemente
11. **Unificar botones**: Reemplazar todos los `<button>` inline con `<Btn>`
12. **Accesibilidad**: htmlFor en labels, focus-visible, aria-labels
13. **Mobile audit**: Revisar cada vista en 375px y arreglar
14. **Granularidad Sponsors**: owner_id o restricción por área

### FASE 4 — Nice to have (mes 2)
15. **Virtualización**: react-window para listas largas (Tareas, Inventario)
16. **Code splitting**: Lazy load módulos por ruta
17. **Persistencia de sidebar**: Guardar estado colapsado/expandido
18. **Search history**: Búsquedas recientes
19. **Tooltips de ayuda**: En features complejas (aprobación, presupuestos)

---

## Resumen ejecutivo

| Categoría | Crítico | Importante | Mejora | Nice to have |
|-----------|---------|------------|--------|-------------|
| Permisos | 1 (minutas) | 3 (RLS, hardcode, sponsors) | 1 (inventory RLS) | - |
| UX/UI | 3 (loading, validation, errors) | 3 (breadcrumbs, offline, search) | 4 (design system, buttons, a11y, mobile) | 4 (virtual, split, sidebar, tooltips) |
| **Total** | **4** | **6** | **5** | **4** |
