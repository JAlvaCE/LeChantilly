# Inventario funcional obligatorio de Le Chantilly
Baseline: tienda pública v0.13, backend v0.10.1, Studio preview v0.14.0-dev. Conservar hasta autorización explícita.
| Capacidad | Ruta anterior | Ruta consolidada / estado |
|---|---|---|
| Editor histórico, importación/exportación JSON, alérgenos, disponibilidad, precio | /studio.html | /herramientas.html#borrador-historico (local) |
| Presupuesto por lote, margen, precio unitario | /studio.html | /herramientas.html#costos (local, misma fórmula) |
| Capacidad por fecha, tareas, quitar, exportar | /studio.html | /herramientas.html#agenda (local, misma fórmula) |
| Simulación lotes/merma/recursos/utilidad/hora, exportar, cuatro escenarios incluidas galletas | /produccion.html | /produccion.html (mismo motor y UI) |
| Editor categorías/productos/presentaciones/colecciones/familias, borradores/publicación/restauración | Studio Preview / | / (conservado) |
| Recetas, inventario, pedidos, finanzas persistentes | Mi negocio | Pendientes, no fingir disponibilidad |
| Catálogo 17 referencias, 5 categorías, 3 colecciones | /catalogo.html | Storefront anterior intacto; /historico.html y editor histórico preservan fuente; mapa UUID para importación de borrador |
| Atelier, guía porciones, bolsa, contacto, Gift Studio y restricciones | storefront público | Rutas anteriores intactas; no sustituir hasta paridad y datos aprobados |
| API pública: health/catalog/product/quote-preview/basket-preview/capacity-preview/cost-preview | backend anterior | Sin cambios en este release |
## Gate de regresión
Comparar catálogo histórico completo, identificadores, slugs, fuentes, relaciones y reglas; probar fórmulas, los cuatro escenarios y navegación; conservar exportaciones. Las funciones con datos reales solo pueden habilitarse tras identidad, MFA, RLS, copias y pruebas E2E. Verificar rutas antiguas y preview, documentar pruebas no ejecutadas. No promover si no hay evidencia. En futuras migraciones conservar metadatos y enlaces; no inventar variantes ni activar productos sin aprobación.

## v0.15.0-dev
Fuente canónica de dominio y copias generadas comprobadas por npm run check. Nueva página /galletas.html y filtro /catalogo.html?categoria=galletas, no eliminar rutas previas. Guardado de borrador vacío permitido, publicación vacía bloqueada en interfaz y PostgreSQL. Bolsa conserva límite explícito y no trunca adiciones silenciosamente. Ver INTERVENTION-STATUS.md.
