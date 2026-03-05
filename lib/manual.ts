/**
 * Manual de Procedimiento — Los Tordos Rugby Club
 * Genera HTML completo y lo abre en ventana de impresión.
 */

export function openManual() {
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Manual de Procedimiento — Los Tordos RC</title>
<style>
  @page { size: A4 portrait; margin: 18mm 15mm; }
  @media print {
    .no-print { display: none !important; }
    h2 { page-break-before: always; }
    h2:first-of-type { page-break-before: avoid; }
    table { page-break-inside: avoid; }
  }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 11px; color: #1a1a1a; line-height: 1.6; max-width: 210mm; margin: 0 auto; padding: 20px 24px; }
  h1 { font-size: 22px; color: #0A1628; margin: 0 0 4px; border-bottom: 3px solid #0A1628; padding-bottom: 8px; }
  h2 { font-size: 16px; color: #0A1628; margin: 28px 0 10px; border-bottom: 2px solid #e5e5e5; padding-bottom: 4px; }
  h3 { font-size: 13px; color: #1E40AF; margin: 16px 0 6px; }
  h4 { font-size: 11px; color: #374151; margin: 10px 0 4px; }
  .subtitle { color: #666; font-size: 12px; margin-bottom: 16px; }
  .toc { background: #F7F8FA; border-radius: 8px; padding: 14px 18px; margin: 16px 0 24px; }
  .toc-title { font-weight: 700; font-size: 13px; margin-bottom: 8px; color: #0A1628; }
  .toc a { color: #1E40AF; text-decoration: none; font-size: 11px; display: block; padding: 2px 0; }
  .toc a:hover { text-decoration: underline; }
  .toc .part { font-weight: 700; font-size: 12px; margin-top: 8px; color: #0A1628; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-size: 10px; }
  th { background: #0A1628; color: #fff; padding: 5px 8px; text-align: left; font-weight: 700; }
  td { padding: 4px 8px; border-bottom: 1px solid #e5e5e5; }
  tr:nth-child(even) { background: #f9f9f9; }
  code { background: #F3F4F6; padding: 1px 5px; border-radius: 3px; font-size: 10px; font-family: "SF Mono", Menlo, monospace; }
  .badge { display: inline-block; padding: 1px 7px; border-radius: 10px; font-size: 9px; font-weight: 700; }
  .tip { background: #EFF6FF; border-left: 3px solid #3B82F6; padding: 8px 12px; margin: 8px 0; border-radius: 0 6px 6px 0; font-size: 10px; }
  .warn { background: #FEF3C7; border-left: 3px solid #F59E0B; padding: 8px 12px; margin: 8px 0; border-radius: 0 6px 6px 0; font-size: 10px; }
  ul, ol { padding-left: 20px; margin: 4px 0; }
  li { margin: 2px 0; }
  .flow { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin: 6px 0; font-size: 10px; }
  .flow span { background: #E5E7EB; padding: 3px 10px; border-radius: 12px; }
  .flow .arrow { background: none; font-weight: 700; color: #6B7280; }
  .print-btn { position: fixed; top: 12px; right: 16px; background: #0A1628; color: #fff; border: none; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; z-index: 999; }
  .print-btn:hover { background: #1E40AF; }
  .header-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
  .header-logo span.emoji { font-size: 28px; }
</style></head><body>
<button class="print-btn no-print" onclick="window.print()">🖨️ Imprimir / PDF</button>

<div class="header-logo"><span class="emoji">🏉</span><div><h1>Manual de Procedimiento</h1><div class="subtitle">Los Tordos Rugby Club — Sistema de Gestión Integral</div></div></div>
<div style="font-size:10px;color:#999;margin-bottom:16px;">Generado el ${new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })} · Versión 2.0</div>

<!-- TABLE OF CONTENTS -->
<div class="toc">
<div class="toc-title">Índice</div>
<div class="part">PARTE 1 — GUÍA DE USUARIO</div>
<a href="#s1">1. Introducción</a>
<a href="#s2">2. Roles y Permisos</a>
<a href="#s3">3. Dashboard Principal</a>
<a href="#s4">4. Tareas (Pedidos)</a>
<a href="#s5">5. Presupuestos</a>
<a href="#s6">6. Reuniones</a>
<a href="#s7">7. Sponsors</a>
<a href="#s8">8. Inventario</a>
<a href="#s9">9. Reservas / Espacios</a>
<a href="#s10">10. Torneos</a>
<a href="#s11">11. Fixtures</a>
<a href="#s12">12. Proyectos</a>
<a href="#s13">13. Becas</a>
<a href="#s14">14. Atención al Socio</a>
<a href="#s15">15. Comunicar</a>
<a href="#s16">16. Mensajes Directos</a>
<a href="#s17">17. Archivos</a>
<a href="#s18">18. Organigrama</a>
<a href="#s19">19. Perfiles (Solo Superadmin)</a>
<div class="part">PARTE 2 — DOCUMENTACIÓN TÉCNICA</div>
<a href="#s20">20. Stack Tecnológico</a>
<a href="#s21">21. Estructura de Archivos</a>
<a href="#s22">22. Base de Datos (Supabase)</a>
<a href="#s23">23. Patrones de Desarrollo</a>
<a href="#s24">24. Deploy y Mantenimiento</a>
</div>

<!-- ═══════════════════════════════════════════ -->
<!-- PARTE 1 — GUÍA DE USUARIO                  -->
<!-- ═══════════════════════════════════════════ -->

<h2 id="s1">1. Introducción</h2>
<h3>¿Qué es el sistema?</h3>
<p>El Sistema de Gestión de Los Tordos RC es una aplicación web que centraliza la administración del club: tareas, presupuestos, reuniones, sponsors, inventario, reservas, torneos, fixtures, proyectos, becas, atención al socio, comunicaciones y más.</p>

<h3>Acceso</h3>
<table>
<tr><th>Concepto</th><th>Detalle</th></tr>
<tr><td>URL de producción</td><td><code>https://los-tordos.vercel.app</code></td></tr>
<tr><td>Navegadores compatibles</td><td>Chrome, Safari, Firefox, Edge (últimas 2 versiones)</td></tr>
<tr><td>Móvil</td><td>Responsive — funciona en celular y tablet</td></tr>
<tr><td>Login</td><td>Email + contraseña. Al primer ingreso el superadmin puede solicitar cambio de contraseña.</td></tr>
</table>

<h3>Estructura general</h3>
<p>La interfaz consta de:</p>
<ul>
<li><b>Sidebar izquierdo:</b> Navegación por áreas/departamentos y secciones del sistema.</li>
<li><b>Contenido principal:</b> Vista activa (dashboard, detalle de tarea, módulo, etc.).</li>
<li><b>Header superior:</b> Búsqueda global, notificaciones, tema claro/oscuro, perfil.</li>
</ul>
<div class="tip">💡 El sidebar se puede colapsar haciendo click en el botón ◀ para ganar espacio de pantalla.</div>

<!-- ─── 2. ROLES ─── -->
<h2 id="s2">2. Roles y Permisos</h2>
<p>Cada usuario tiene un rol que define qué puede ver y hacer en el sistema.</p>
<table>
<tr><th>Rol</th><th>Nivel</th><th>Descripción</th><th>Permisos principales</th></tr>
<tr><td><b>Super Admin</b></td><td>7</td><td>Control total del sistema</td><td>Todo: crear/editar/eliminar en todos los módulos, gestionar perfiles, ver auditoría</td></tr>
<tr><td><b>Admin</b></td><td>6</td><td>Administrador general</td><td>Igual que superadmin excepto gestión de perfiles</td></tr>
<tr><td><b>Coordinador</b></td><td>5</td><td>Coordina un área</td><td>CRUD de tareas, presupuestos, reuniones, sponsors, inventario, torneos, fixtures</td></tr>
<tr><td><b>Embudo</b></td><td>4</td><td>Validación de compras</td><td>Aprobar/rechazar tareas en estado "Compras", gestión presupuestos</td></tr>
<tr><td><b>Usuario</b></td><td>3</td><td>Miembro estándar</td><td>Ver sus tareas, crear pedidos, usar mensajería, ver organigrama</td></tr>
<tr><td><b>Enlace</b></td><td>2</td><td>Enlace de división</td><td>Vista limitada de inventario, fixtures, tareas propias</td></tr>
<tr><td><b>Manager</b></td><td>1</td><td>Gestión operativa</td><td>Inventario (vista limitada)</td></tr>
</table>

<h3>Roles especiales (por persona)</h3>
<table>
<tr><th>Función</th><th>Descripción</th></tr>
<tr><td><b>Tesorero</b></td><td>Valida gastos en tareas con monto. Ve badge de "pendientes de validación tesorero" en presupuestos.</td></tr>
<tr><td><b>Rental Approvers</b></td><td>Aprueban alquileres de espacios. Primer aprobador (Vie-Sáb), segundo aprobador (otros días), aprobador final.</td></tr>
<tr><td><b>Brandi / Gil</b></td><td>Aprobadores de reservas de espacios del club (viernes/sábado vs otros días).</td></tr>
</table>

<!-- ─── 3. DASHBOARD ─── -->
<h2 id="s3">3. Dashboard Principal</h2>
<h3>KPIs</h3>
<p>El dashboard muestra 4 indicadores clave al tope:</p>
<table>
<tr><th>KPI</th><th>Icono</th><th>Descripción</th></tr>
<tr><td>Completadas</td><td>✅</td><td>Tareas en estado "Completada"</td></tr>
<tr><td>Pendientes</td><td>🔴</td><td>Tareas en estado "Pendiente"</td></tr>
<tr><td>Vencidas</td><td>⏰</td><td>Tareas no completadas cuya fecha requerida ya pasó</td></tr>
<tr><td>Con Gasto</td><td>💰</td><td>Tareas que tienen un monto asociado</td></tr>
</table>
<p>Click en cualquier KPI filtra la lista de tareas por esa categoría.</p>

<h3>Filtros</h3>
<ul>
<li><b>Por área:</b> Click en un área del sidebar para ver solo sus departamentos y tareas.</li>
<li><b>Por departamento:</b> Click en un departamento para ver solo las tareas de ese depto.</li>
<li><b>Búsqueda global:</b> Escribir en la barra de búsqueda del header filtra tareas por nombre, descripción o asignado.</li>
</ul>

<h3>Vistas disponibles</h3>
<ul>
<li><b>Dashboard personalizado:</b> Widgets configurables con métricas del club.</li>
<li><b>Calendario:</b> Vista mensual con tareas, reuniones, reservas y fixtures.</li>
<li><b>Kanban:</b> Tablero visual con columnas por estado.</li>
<li><b>Feed de actividad:</b> Historial cronológico de acciones recientes.</li>
</ul>

<!-- ─── 4. TAREAS ─── -->
<h2 id="s4">4. Tareas (Pedidos)</h2>
<h3>Crear tarea nueva</h3>
<ol>
<li>Click en <b>"+ Tarea"</b> en el header o sidebar.</li>
<li>Completar el wizard de Nuevo Pedido (NP):
  <ul>
  <li>Título y descripción</li>
  <li>Área y departamento destino</li>
  <li>Prioridad: Baja, Media, Alta, Urgente</li>
  <li>Fecha requerida</li>
  <li>Monto estimado (opcional)</li>
  <li>Asignar a usuario(s)</li>
  <li>Adjuntar archivos</li>
  </ul>
</li>
<li>Click "Enviar" para crear la tarea.</li>
</ol>

<h3>Estados de una tarea</h3>
<div class="flow">
<span>📋 Pendiente</span><span class="arrow">→</span>
<span>🔨 En Curso</span><span class="arrow">→</span>
<span>🛒 Compras</span><span class="arrow">→</span>
<span>✔️ Validación</span><span class="arrow">→</span>
<span>✅ Completada</span>
</div>

<h3>Acciones sobre tareas</h3>
<table>
<tr><th>Acción</th><th>Cómo</th></tr>
<tr><td>Ver detalle</td><td>Click en la tarea de la lista</td></tr>
<tr><td>Cambiar estado</td><td>Botones de estado en el detalle de la tarea</td></tr>
<tr><td>Asignar</td><td>Seleccionar usuario en el campo "Asignado a"</td></tr>
<tr><td>Mensajes</td><td>Sección de mensajes dentro del detalle. Usar @nombre para mencionar.</td></tr>
<tr><td>Adjuntos</td><td>Arrastrar archivo o click en "Adjuntar"</td></tr>
<tr><td>Priorizar</td><td>Seleccionar nivel de prioridad</td></tr>
</table>
<div class="tip">💡 Las menciones (@usuario) generan notificaciones push y en la app.</div>

<!-- ─── 5. PRESUPUESTOS ─── -->
<h2 id="s5">5. Presupuestos</h2>
<h3>Crear presupuesto</h3>
<ol>
<li>Ir a <b>Presupuestos</b> en el sidebar.</li>
<li>Click "Nuevo Presupuesto".</li>
<li>Completar: nombre, área, período, moneda (ARS o USD).</li>
<li>Agregar rubros con montos.</li>
<li>Enviar para aprobación.</li>
</ol>

<h3>Flujo de aprobación</h3>
<div class="flow">
<span>Borrador</span><span class="arrow">→</span>
<span>Enviado</span><span class="arrow">→</span>
<span>En Revisión</span><span class="arrow">→</span>
<span>Aprobado / Rechazado</span>
</div>

<h3>Funcionalidades</h3>
<ul>
<li>Soporte para monedas ARS y USD</li>
<li>Rubros desglosados por categoría</li>
<li>Exportar a PDF con detalle completo</li>
<li>Vinculación con tareas que tienen gasto</li>
<li>El Tesorero valida gastos pendientes</li>
</ul>

<!-- ─── 6. REUNIONES ─── -->
<h2 id="s6">6. Reuniones</h2>
<h3>Tipos de reunión</h3>
<table>
<tr><th>Tipo</th><th>Frecuencia</th><th>Participantes</th></tr>
<tr><td><b>CD</b> (Comisión Directiva)</td><td>Mensual</td><td>Miembros de CD</td></tr>
<tr><td><b>SE</b> (Subcomisión Ejecutiva)</td><td>Quincenal</td><td>Miembros de SE</td></tr>
<tr><td><b>Área</b></td><td>Quincenal</td><td>Coordinador + miembros del área</td></tr>
</table>

<h3>Flujo de reunión</h3>
<ol>
<li><b>Crear agenda:</b> Definir temas a tratar, fecha, participantes.</li>
<li><b>Durante la reunión:</b> Registrar asistencia, tomar notas por tema.</li>
<li><b>Minuta:</b> Se genera automáticamente. Agregar decisiones y responsables.</li>
<li><b>Aprobación:</b> Los participantes aprueban la minuta.</li>
<li><b>Exportar:</b> Descargar en formato Word o PDF.</li>
</ol>

<!-- ─── 7. SPONSORS ─── -->
<h2 id="s7">7. Sponsors</h2>
<p>Módulo completo para gestión de patrocinadores del club.</p>

<h3 id="s7-1">7.1 Dashboard de Sponsors</h3>
<ul>
<li><b>Camiseta SVG:</b> Visualización interactiva de ubicaciones en la camiseta.</li>
<li><b>KPIs:</b> Total sponsors, ingreso total, contratos por vencer, health score promedio.</li>
<li><b>Alertas:</b> Contratos próximos a vencer, pagos pendientes, entregas retrasadas.</li>
<li><b>Calendario:</b> Fechas clave de contratos y pagos.</li>
</ul>

<h3 id="s7-2">7.2 Clientes (Lista de Sponsors)</h3>
<ul>
<li>Listar todos los sponsors con búsqueda y filtros (estado, categoría, health score).</li>
<li><b>Health Score:</b> Indicador 0-100 que mide la salud de la relación con el sponsor (pagos al día, entregas, actividad, hospitalidad).</li>
<li>Crear, editar y eliminar sponsors.</li>
</ul>

<h3 id="s7-3">7.3 Detalle de Sponsor — 8 Tabs</h3>
<table>
<tr><th>Tab</th><th>Contenido</th></tr>
<tr><td><b>General</b></td><td>Datos del sponsor, categoría, estado, contrato vigente, notas</td></tr>
<tr><td><b>Contactos</b></td><td>Personas de contacto del sponsor (nombre, email, teléfono, cargo)</td></tr>
<tr><td><b>Canjes</b></td><td>Registro de canjes/beneficios entregados al sponsor</td></tr>
<tr><td><b>Hospitalidad</b></td><td>Invitaciones a partidos, asistencia, zona VIP, estacionamiento</td></tr>
<tr><td><b>Pagos</b></td><td>Registro de pagos recibidos, montos, fechas, estado</td></tr>
<tr><td><b>Galería</b></td><td>Fotos y documentos asociados al sponsor</td></tr>
<tr><td><b>Mensajes</b></td><td>Comunicación interna sobre el sponsor</td></tr>
<tr><td><b>Timeline</b></td><td>Historial cronológico de todas las acciones</td></tr>
</table>

<h3 id="s7-4">7.4 Propuestas</h3>
<ul>
<li>Crear propuestas comerciales para potenciales sponsors.</li>
<li>Sistema de votación entre coordinadores.</li>
<li>Comparar propuestas lado a lado.</li>
<li>Formalizar propuesta aprobada en contrato.</li>
</ul>

<h3 id="s7-5">7.5 Tarifario</h3>
<ul>
<li>Ubicaciones disponibles (camiseta, cancha, palco, etc.) con precios.</li>
<li>Asignar sponsor a ubicación específica.</li>
<li>Gestión de disponibilidad.</li>
</ul>

<h3 id="s7-6">7.6 Materiales</h3>
<ul>
<li>Repositorio centralizado de brochures, fotos, documentos comerciales.</li>
<li>Categorización y búsqueda.</li>
<li>Subida y descarga de archivos.</li>
</ul>

<h3 id="s7-7">7.7 Hospitalidad</h3>
<ul>
<li>Crear invitaciones vinculadas a partidos/fixtures.</li>
<li>Registrar asistencia, cantidad de entradas, zona VIP, estacionamiento.</li>
<li>Exportar informe PDF con estadísticas de hospitalidad.</li>
</ul>

<h3 id="s7-8">7.8 Import Excel</h3>
<ol>
<li>Descargar template Excel desde el módulo.</li>
<li>Completar datos de sponsors en la planilla.</li>
<li>Subir el archivo Excel.</li>
<li>El sistema parsea y previsualiza los datos.</li>
<li>Confirmar para importar los sponsors.</li>
</ol>

<!-- ─── 8. INVENTARIO ─── -->
<h2 id="s8">8. Inventario</h2>
<h3>Categorías</h3>
<table>
<tr><th>Categoría</th><th>Ejemplos</th></tr>
<tr><td>Deportivo</td><td>Pelotas, conos, palos, tackles</td></tr>
<tr><td>Indumentaria</td><td>Camisetas, shorts, medias</td></tr>
<tr><td>Infraestructura</td><td>Maquinaria, herramientas, materiales</td></tr>
<tr><td>Tecnología</td><td>Computadoras, proyectores, cámaras</td></tr>
<tr><td>Mobiliario</td><td>Mesas, sillas, pizarras</td></tr>
</table>

<h3>Funcionalidades</h3>
<ul>
<li><b>Registrar item:</b> Nombre, categoría, cantidad, condición (nuevo/bueno/regular/malo).</li>
<li><b>Mantenimiento programado:</b> Registrar fecha y tipo de mantenimiento. El sistema alerta cuando se acerca la fecha.</li>
<li><b>Distribución a divisiones:</b> Asignar items a divisiones específicas del club.</li>
<li><b>Importación masiva:</b> Importar items desde CSV/Excel.</li>
</ul>

<h3>Vista Enlace (limitada)</h3>
<p>Los usuarios con rol "Enlace" o "Manager" ven una vista simplificada del inventario asignado a su división, sin poder editar items de otras divisiones.</p>

<!-- ─── 9. RESERVAS ─── -->
<h2 id="s9">9. Reservas / Espacios</h2>
<h3>Espacios disponibles</h3>
<ul>
<li>Canchas (rugby, fútbol, hockey)</li>
<li>Pileta</li>
<li>Gimnasio</li>
<li>Salones (eventos, reuniones)</li>
</ul>

<h3>Tipos de reserva</h3>
<table>
<tr><th>Tipo</th><th>Descripción</th><th>Aprobación</th></tr>
<tr><td><b>Interna</b></td><td>Reserva para actividades del club</td><td>Automática (admin/coordinador)</td></tr>
<tr><td><b>Alquiler</b></td><td>Alquiler a terceros</td><td>Requiere flujo de aprobación</td></tr>
</table>

<h3>Flujo de aprobación de alquileres</h3>
<div class="flow">
<span>Solicitado</span><span class="arrow">→</span>
<span>Aprobado (1er nivel)</span><span class="arrow">→</span>
<span>Pendiente Pago</span><span class="arrow">→</span>
<span>Pago Recibido</span><span class="arrow">→</span>
<span>Aprobado Final</span>
</div>
<p>El primer aprobador depende del día: Brandi/Gil para viernes y sábado, otro aprobador para los demás días. La aprobación final es de Pontis.</p>

<!-- ─── 10. TORNEOS ─── -->
<h2 id="s10">10. Torneos</h2>
<h3>Crear torneo</h3>
<ol>
<li>Ir a <b>Torneos</b> en el sidebar.</li>
<li>Click "Nuevo Torneo".</li>
<li>Completar: nombre, fecha, categoría, tipo.</li>
<li>Se genera automáticamente un checklist de 17 hitos a completar.</li>
</ol>

<h3>Checklist de hitos (17 items)</h3>
<p>Cada torneo incluye un checklist predefinido que cubre desde la planificación hasta el cierre:</p>
<ul>
<li>Definición de formato, inscripción de equipos, designación de árbitros</li>
<li>Logística: canchas, vestuarios, ambulancia, seguridad</li>
<li>Comunicación: difusión, credenciales, señalética</li>
<li>Post-torneo: resultados, fotos, balance</li>
</ul>

<h3>Presupuesto por torneo</h3>
<p>Cada torneo puede tener un presupuesto asociado desglosado por rubros (arbitraje, premios, logística, etc.).</p>

<h3>Clubes invitados</h3>
<p>Registrar clubes participantes con datos de contacto, confirmación y logística.</p>

<!-- ─── 11. FIXTURES ─── -->
<h2 id="s11">11. Fixtures</h2>
<h3>Crear partido</h3>
<ul>
<li>Fecha, hora, rival, cancha (local/visitante).</li>
<li>Categoría / división.</li>
<li>Resultado (se completa post-partido).</li>
</ul>

<h3>Vinculación con Sponsors</h3>
<p>Cada fixture puede tener invitaciones de hospitalidad asociadas. Al crear un partido, se puede generar el listado de invitados VIP de sponsors.</p>

<!-- ─── 12. PROYECTOS ─── -->
<h2 id="s12">12. Proyectos</h2>
<h3>Crear proyecto</h3>
<ol>
<li>Ir a <b>Proyectos</b> en el sidebar.</li>
<li>Click "Nuevo Proyecto".</li>
<li>Definir nombre, descripción, responsable.</li>
<li>Agregar tareas al proyecto.</li>
</ol>

<h3>Estados de proyecto</h3>
<div class="flow">
<span>Backlog</span><span class="arrow">→</span>
<span>To Do</span><span class="arrow">→</span>
<span>In Progress</span><span class="arrow">→</span>
<span>Review</span><span class="arrow">→</span>
<span>Done</span>
</div>

<h3>Presupuesto por proyecto</h3>
<p>Los proyectos pueden tener presupuestos asociados con rubros y seguimiento de gastos.</p>

<!-- ─── 13. BECAS ─── -->
<h2 id="s13">13. Becas</h2>
<h3>Registrar becario</h3>
<ul>
<li>Nombre completo, división, motivo de la beca.</li>
<li>Documentación de respaldo.</li>
<li>Evaluación socioeconómica.</li>
</ul>

<h3>Flujo de aprobación</h3>
<div class="flow">
<span>Nueva</span><span class="arrow">→</span>
<span>Evaluando</span><span class="arrow">→</span>
<span>Propuesta</span><span class="arrow">→</span>
<span>Deliberación CD</span><span class="arrow">→</span>
<span>Aprobada / Rechazada</span>
</div>

<h3>Votación</h3>
<p>Se requiere quorum de <b>5 votos de miembros CD</b> para aprobar una beca. Cada miembro puede votar una sola vez. Al alcanzar quorum, la beca se aprueba automáticamente.</p>

<!-- ─── 14. ATENCIÓN AL SOCIO ─── -->
<h2 id="s14">14. Atención al Socio</h2>
<h3>Registrar caso</h3>
<ul>
<li>Nombre del socio, motivo, descripción detallada.</li>
<li>Categoría del reclamo/solicitud.</li>
<li>Asignar responsable.</li>
</ul>

<h3>Flujo</h3>
<div class="flow">
<span>Nuevo</span><span class="arrow">→</span>
<span>En Análisis</span><span class="arrow">→</span>
<span>Escalado a SE</span><span class="arrow">→</span>
<span>Deliberación SE</span><span class="arrow">→</span>
<span>Aprobado / Rechazado</span>
</div>

<p>Los casos escalados a SE requieren <b>3 votos</b> de miembros de la Subcomisión Ejecutiva para ser aprobados.</p>

<!-- ─── 15. COMUNICAR ─── -->
<h2 id="s15">15. Comunicar</h2>
<h3>Solicitudes de comunicación</h3>
<p>Cualquier coordinador o admin puede solicitar la publicación de comunicados.</p>

<h3>Vistas</h3>
<table>
<tr><th>Vista</th><th>Descripción</th></tr>
<tr><td><b>Coordinador</b></td><td>Crear y gestionar solicitudes, asignar responsable de comunicación, definir canales</td></tr>
<tr><td><b>Usuario</b></td><td>Ver comunicados publicados y su estado</td></tr>
</table>

<!-- ─── 16. MENSAJES DIRECTOS ─── -->
<h2 id="s16">16. Mensajes Directos</h2>
<ul>
<li>Chat 1-a-1 entre usuarios del sistema.</li>
<li>Badge de mensajes no leídos en el sidebar.</li>
<li>Soporte para menciones (@usuario) que generan notificaciones.</li>
<li>Se pueden eliminar mensajes individuales o conversaciones completas.</li>
</ul>

<!-- ─── 17. ARCHIVOS ─── -->
<h2 id="s17">17. Archivos</h2>
<ul>
<li>Repositorio centralizado de documentos del club.</li>
<li>Categorización por tipo (documento, imagen, planilla, etc.).</li>
<li>Búsqueda por nombre y categoría.</li>
<li>Subida y descarga directa.</li>
<li>Almacenamiento en Supabase Storage.</li>
</ul>

<!-- ─── 18. ORGANIGRAMA ─── -->
<h2 id="s18">18. Organigrama</h2>
<p>Vista jerárquica de la estructura del club:</p>
<ul>
<li><b>6 áreas principales</b> (CD, SE, Deportiva, Social, Infraestructura, Administrativa).</li>
<li><b>~40 departamentos</b> organizados bajo cada área.</li>
<li>Departamentos con sub-departamentos (jerarquía de 2 niveles).</li>
<li>Muestra los miembros asignados a cada departamento.</li>
</ul>

<!-- ─── 19. PERFILES ─── -->
<h2 id="s19">19. Perfiles (Solo Superadmin)</h2>
<div class="warn">⚠️ Solo accesible para usuarios con rol <b>Superadmin</b>.</div>
<ul>
<li><b>Crear usuario:</b> Nombre, apellido, email, contraseña inicial, rol, área/departamento.</li>
<li><b>Cambiar rol:</b> Modificar el rol de un usuario existente.</li>
<li><b>Resetear contraseña:</b> Generar nueva contraseña para un usuario.</li>
<li><b>Eliminar perfil:</b> Eliminar usuario del sistema.</li>
</ul>

<!-- ═══════════════════════════════════════════ -->
<!-- PARTE 2 — DOCUMENTACIÓN TÉCNICA            -->
<!-- ═══════════════════════════════════════════ -->

<h2 id="s20">20. Stack Tecnológico</h2>
<table>
<tr><th>Tecnología</th><th>Versión</th><th>Uso</th></tr>
<tr><td><b>Next.js</b></td><td>16.1.6</td><td>Framework React con Turbopack como bundler</td></tr>
<tr><td><b>Supabase</b></td><td>—</td><td>PostgreSQL, Auth, Storage, Realtime</td></tr>
<tr><td><b>Zustand</b></td><td>—</td><td>State management global (store.ts)</td></tr>
<tr><td><b>Vercel</b></td><td>—</td><td>Deploy automático desde GitHub</td></tr>
<tr><td><b>CSS-in-JS</b></td><td>Inline</td><td>Estilos inline sin Tailwind ni CSS modules</td></tr>
<tr><td><b>TypeScript</b></td><td>—</td><td>Todo el código es .ts/.tsx</td></tr>
</table>

<h3>Hosting & CI/CD</h3>
<ul>
<li>GitHub repo: <code>github.com/Turco1977/los-tordos</code></li>
<li>Cada push a <code>main</code> trigger auto-deploy en Vercel (~30-60s).</li>
<li>Sin pipeline CI separado — Vercel build = producción.</li>
</ul>

<!-- ─── 21. ESTRUCTURA ─── -->
<h2 id="s21">21. Estructura de Archivos</h2>
<table>
<tr><th>Ruta</th><th>Descripción</th></tr>
<tr><td><code>app/page.tsx</code></td><td>Componente principal. Contiene TODOS los handlers CRUD, routing por vw, e integración de vistas.</td></tr>
<tr><td><code>components/main/</code></td><td>~45 vistas por módulo (SponsorsView, InventarioView, Reuniones, etc.)</td></tr>
<tr><td><code>components/ui.tsx</code></td><td>Componentes UI reutilizables: Btn, Card, Ring, Badge, Bread, Toast</td></tr>
<tr><td><code>components/ErrorBoundary.tsx</code></td><td>Error boundary global</td></tr>
<tr><td><code>lib/constants.ts</code></td><td>Constantes: AREAS, DEPTOS, ROLES, ST (estados), SC, PST, colores</td></tr>
<tr><td><code>lib/store.ts</code></td><td>Zustand store global con todos los datos</td></tr>
<tr><td><code>lib/export.ts</code></td><td>Funciones de exportación: CSV, PDF (tablas), iCal, minutas Word/PDF</td></tr>
<tr><td><code>lib/mappers.ts</code></td><td>Transformaciones DB ↔ UI (taskToDB, presuToDB, etc.)</td></tr>
<tr><td><code>lib/theme.ts</code></td><td>Sistema de temas claro/oscuro</td></tr>
<tr><td><code>lib/theme-context.tsx</code></td><td>Context <code>useC()</code> → {colors, isDark, cardBg}</td></tr>
<tr><td><code>lib/mentions.ts</code></td><td>Parser de menciones (@usuario)</td></tr>
<tr><td><code>lib/supabase/</code></td><td>Cliente Supabase (client.ts, server.ts)</td></tr>
<tr><td><code>lib/storage.ts</code></td><td>Upload/download de archivos a Supabase Storage</td></tr>
<tr><td><code>hooks/useAuth.ts</code></td><td>Autenticación, login, logout, session</td></tr>
<tr><td><code>hooks/useDataFetch.ts</code></td><td>Carga de datos en 3 lotes (batch fetching)</td></tr>
<tr><td><code>hooks/useViews.ts</code></td><td>Estado de vistas, navegación, sidebar</td></tr>
<tr><td><code>hooks/useRealtimeSetup.ts</code></td><td>Suscripciones Supabase Realtime</td></tr>
<tr><td><code>hooks/useNotifications.ts</code></td><td>Push notifications + in-app notifications</td></tr>
<tr><td><code>hooks/useTaskHandlers.ts</code></td><td>Handlers CRUD de tareas (add, update, delete, bulk)</td></tr>
<tr><td><code>hooks/useSearch.ts</code></td><td>Búsqueda global</td></tr>
<tr><td><code>hooks/useKeyboard.ts</code></td><td>Atajos de teclado</td></tr>
<tr><td><code>hooks/useCommandPalette.ts</code></td><td>Command palette (Cmd+K)</td></tr>
<tr><td><code>hooks/useRecurringTasks.ts</code></td><td>Tareas recurrentes automáticas</td></tr>
<tr><td><code>app/api/</code></td><td>API routes: upload, notifications, cron, admin, parse-excel, push, etc.</td></tr>
</table>

<!-- ─── 22. BASE DE DATOS ─── -->
<h2 id="s22">22. Base de Datos (Supabase)</h2>
<h3>Tablas principales (~35)</h3>
<table>
<tr><th>Tabla</th><th>Descripción</th></tr>
<tr><td><code>profiles</code></td><td>Usuarios del sistema (nombre, email, rol, departamento)</td></tr>
<tr><td><code>tasks</code></td><td>Tareas/pedidos (título, estado, prioridad, asignado, monto, etc.)</td></tr>
<tr><td><code>task_messages</code></td><td>Mensajes dentro de una tarea</td></tr>
<tr><td><code>task_templates</code></td><td>Templates de tareas recurrentes</td></tr>
<tr><td><code>presupuestos</code></td><td>Presupuestos con rubros y montos</td></tr>
<tr><td><code>proveedores</code></td><td>Proveedores vinculados a presupuestos</td></tr>
<tr><td><code>agendas</code></td><td>Agendas de reuniones</td></tr>
<tr><td><code>minutas</code></td><td>Minutas de reuniones</td></tr>
<tr><td><code>sponsors</code></td><td>Sponsors del club</td></tr>
<tr><td><code>sponsor_contacts</code></td><td>Contactos de sponsors</td></tr>
<tr><td><code>sponsor_contracts</code></td><td>Contratos vigentes</td></tr>
<tr><td><code>sponsor_pipeline</code></td><td>Pipeline comercial (prospectos)</td></tr>
<tr><td><code>sponsor_propuestas</code></td><td>Propuestas comerciales</td></tr>
<tr><td><code>sponsor_propuestas_votos</code></td><td>Votos en propuestas</td></tr>
<tr><td><code>sponsor_propuestas_mensajes</code></td><td>Mensajes en propuestas</td></tr>
<tr><td><code>sponsor_deliveries</code></td><td>Entregas de beneficios a sponsors</td></tr>
<tr><td><code>sponsor_messages</code></td><td>Mensajes internos sobre sponsors</td></tr>
<tr><td><code>sponsor_materiales</code></td><td>Materiales comerciales</td></tr>
<tr><td><code>sponsor_pagos</code></td><td>Pagos de sponsors</td></tr>
<tr><td><code>sponsor_contactos</code></td><td>Contactos de sponsors</td></tr>
<tr><td><code>hospitalidad_invitaciones</code></td><td>Invitaciones VIP a partidos</td></tr>
<tr><td><code>tarifario</code></td><td>Precios de ubicaciones publicitarias</td></tr>
<tr><td><code>inventory</code></td><td>Items de inventario</td></tr>
<tr><td><code>inventory_maintenance</code></td><td>Mantenimientos programados</td></tr>
<tr><td><code>inventory_distributions</code></td><td>Distribución de items a divisiones</td></tr>
<tr><td><code>bookings</code></td><td>Reservas de espacios</td></tr>
<tr><td><code>rental_config</code></td><td>Configuración de alquileres (precios, reglas)</td></tr>
<tr><td><code>torneos</code></td><td>Torneos organizados</td></tr>
<tr><td><code>torneo_hitos</code></td><td>Checklist de hitos por torneo</td></tr>
<tr><td><code>torneo_clubes</code></td><td>Clubes invitados a torneos</td></tr>
<tr><td><code>fixtures</code></td><td>Partidos programados</td></tr>
<tr><td><code>becas</code></td><td>Solicitudes de becas</td></tr>
<tr><td><code>atencion_socio_casos</code></td><td>Casos de atención al socio</td></tr>
<tr><td><code>projects</code></td><td>Proyectos</td></tr>
<tr><td><code>project_tasks</code></td><td>Tareas dentro de proyectos</td></tr>
<tr><td><code>project_budgets</code></td><td>Presupuestos de proyectos</td></tr>
<tr><td><code>dm_messages</code></td><td>Mensajes directos entre usuarios</td></tr>
<tr><td><code>archivos</code></td><td>Archivos del repositorio centralizado</td></tr>
<tr><td><code>reminders</code></td><td>Recordatorios programados</td></tr>
<tr><td><code>org_members</code></td><td>Membresía en el organigrama</td></tr>
<tr><td><code>milestones</code></td><td>Hitos del Plan 2035</td></tr>
<tr><td><code>notification_preferences</code></td><td>Preferencias de notificación por usuario</td></tr>
<tr><td><code>viajes</code></td><td>Gestión de viajes del club</td></tr>
</table>

<h3>RLS (Row Level Security)</h3>
<p>Supabase usa RLS para control de acceso a nivel de fila. Las políticas están configuradas en el dashboard de Supabase. Generalmente:</p>
<ul>
<li>Lectura: habilitada para usuarios autenticados.</li>
<li>Escritura: restringida según rol (admin puede todo, otros roles según tabla).</li>
<li>DM messages: solo sender o receiver pueden leer sus mensajes.</li>
</ul>

<h3>Storage Buckets</h3>
<table>
<tr><th>Bucket</th><th>Uso</th></tr>
<tr><td><code>attachments</code></td><td>Adjuntos de tareas, archivos generales, materiales de sponsors</td></tr>
</table>

<!-- ─── 23. PATRONES ─── -->
<h2 id="s23">23. Patrones de Desarrollo</h2>

<h3>Optimistic Updates</h3>
<p>Patrón estándar para CRUD en <code>page.tsx</code>:</p>
<ol>
<li>Actualizar el estado local inmediatamente (optimistic).</li>
<li>Hacer la llamada a Supabase en background.</li>
<li>Si falla, mostrar toast de error (el estado ya se actualizó visualmente).</li>
</ol>

<h3>⚠️ Rules of Hooks — CRÍTICO</h3>
<div class="warn">⚠️ En <code>app/page.tsx</code>, TODOS los hooks (useState, useEffect, useRef, useMemo, useCallback) DEBEN estar ANTES de los early returns en líneas ~136-137 (<code>if(!authChecked) return</code> y <code>if(!user) return &lt;Login/&gt;</code>). Colocar hooks después de estos returns causará crashes en producción.</div>

<h3>Batch Fetching (useDataFetch)</h3>
<p>La carga de datos se hace en 3 lotes paralelos para optimizar el tiempo de carga inicial:</p>
<ul>
<li><b>Lote 1:</b> profiles, tasks, org_members, milestones, presupuestos, proveedores, reminders</li>
<li><b>Lote 2:</b> agendas, minutas, projects, project_tasks, templates, bookings, rental_config, dm_messages</li>
<li><b>Lote 3:</b> inventory, sponsors, project_budgets, maintenance, distributions, deliveries, archivos, torneos, fixtures, becas, etc.</li>
</ul>

<h3>Cache Offline (IndexedDB)</h3>
<p>El hook <code>useOfflineData</code> guarda los datos en IndexedDB para acceso offline. Al reconectar, sincroniza cambios pendientes.</p>

<h3>Theme System</h3>
<ul>
<li><code>useC()</code> retorna <code>{colors, isDark, cardBg}</code>.</li>
<li><code>colors</code>: objeto con colores del tema (nv, g1, g3, g4, rd, gn, yl, bl, pr, etc.).</li>
<li>Toggle: <code>toggleTheme()</code> en el header.</li>
</ul>

<h3>Componentes UI reutilizables</h3>
<table>
<tr><th>Componente</th><th>Uso</th></tr>
<tr><td><code>Btn</code></td><td>Botón con variantes (primary, secondary, danger, ghost)</td></tr>
<tr><td><code>Card</code></td><td>Contenedor con sombra y bordes redondeados</td></tr>
<tr><td><code>Ring</code></td><td>Indicador circular de progreso</td></tr>
<tr><td><code>Badge</code></td><td>Badge numérico o de texto</td></tr>
<tr><td><code>Bread</code></td><td>Breadcrumbs de navegación</td></tr>
<tr><td><code>Toast</code></td><td>Notificaciones temporales (ok/err)</td></tr>
</table>

<h3>Realtime</h3>
<p><code>useRealtimeSetup</code> suscribe a canales de Supabase Realtime para recibir cambios en tiempo real (INSERT, UPDATE, DELETE) en las tablas principales.</p>

<!-- ─── 24. DEPLOY ─── -->
<h2 id="s24">24. Deploy y Mantenimiento</h2>

<h3>Deploy automático</h3>
<ol>
<li>Hacer cambios en el código local.</li>
<li><code>git add .</code> + <code>git commit</code> + <code>git push</code></li>
<li>Vercel detecta el push y ejecuta <code>npm run build</code>.</li>
<li>Si el build pasa, despliega automáticamente (~30-60s).</li>
<li>Si falla, el deploy anterior permanece activo.</li>
</ol>

<h3>Variables de entorno</h3>
<table>
<tr><th>Variable</th><th>Descripción</th></tr>
<tr><td><code>NEXT_PUBLIC_SUPABASE_URL</code></td><td>URL del proyecto Supabase</td></tr>
<tr><td><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></td><td>Clave anónima de Supabase</td></tr>
<tr><td><code>SUPABASE_SERVICE_ROLE_KEY</code></td><td>Clave de servicio (solo server-side)</td></tr>
</table>
<div class="warn">⚠️ Nunca exponer SUPABASE_SERVICE_ROLE_KEY en código del cliente. Solo usarla en API routes.</div>

<h3>Cómo agregar un módulo nuevo</h3>
<ol>
<li><b>Crear la vista:</b> Nuevo archivo en <code>components/main/NuevoModuloView.tsx</code>.</li>
<li><b>Importar en page.tsx:</b> Usar <code>dynamic()</code> para lazy loading si es pesado.</li>
<li><b>Agregar nav item:</b> En <code>Sidebar.tsx</code>, agregar al array de secciones con <code>k</code> (key), <code>l</code> (label), <code>icon</code> y <code>show</code> (condición de visibilidad).</li>
<li><b>Agregar vista:</b> En <code>page.tsx</code>, agregar <code>{vw === "mi-modulo" && &lt;MiModulo .../&gt;}</code>.</li>
<li><b>CRUD handlers:</b> Agregar las funciones onAdd/onUpd/onDel en page.tsx con el patrón de optimistic update.</li>
<li><b>Store:</b> Si necesita estado global, agregar al Zustand store en <code>lib/store.ts</code>.</li>
<li><b>Data fetch:</b> Agregar la query a uno de los lotes en <code>hooks/useDataFetch.ts</code>.</li>
<li><b>Realtime:</b> Si necesita updates en tiempo real, agregar suscripción en <code>hooks/useRealtimeSetup.ts</code>.</li>
</ol>

<h3>Cómo agregar una tabla nueva</h3>
<ol>
<li><b>Crear tabla en Supabase:</b> Dashboard → SQL Editor o Table Editor.</li>
<li><b>Configurar RLS:</b> Agregar políticas de lectura/escritura.</li>
<li><b>Agregar al store:</b> Nuevo campo en <code>lib/store.ts</code>.</li>
<li><b>Fetch:</b> Agregar la query en <code>hooks/useDataFetch.ts</code> al lote correspondiente.</li>
<li><b>Mappers:</b> Si la data necesita transformación, agregar funciones en <code>lib/mappers.ts</code>.</li>
<li><b>Realtime:</b> Suscribir al canal en <code>hooks/useRealtimeSetup.ts</code>.</li>
</ol>

<div style="margin-top: 40px; padding-top: 16px; border-top: 2px solid #e5e5e5; text-align: center; color: #999; font-size: 10px;">
  🏉 Los Tordos Rugby Club — Sistema de Gestión v2.0<br>
  Manual generado el ${new Date().toLocaleDateString("es-AR")} · ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
</div>
</body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}
