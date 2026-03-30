-- Migrar tareas que tienen assigned_to pero siguen en 'pend'
-- Esto pasa con tareas viejas creadas antes de la lógica de auto-pasar a 'curso'

UPDATE tasks
SET status = 'curso'
WHERE assigned_to IS NOT NULL
  AND status = 'pend';

-- Verificar resultado
SELECT COUNT(*) AS tareas_actualizadas
FROM tasks
WHERE assigned_to IS NOT NULL
  AND status = 'curso';
