# Le Chantilly v0.7 — Monorepositorio

Dos aplicaciones y despliegues independientes. Frontend: https://lechantilly.vercel.app/ · Backend: https://lechantilly-api.vercel.app/api/v1/health.

- apps/frontend: HTML/CSS/ES modules; API client único, catálogo vía HTTP, consulta validada por el servidor, herramientas Studio locales. No se despliega el catálogo JSON ni el dominio de negocio en el frontend; referencias históricas en HTML como fallback de presentación.
- apps/backend: Node.js 22, API REST v1, dominio, repositorio versionado de catálogo, validación, adaptadores HTTP y pruebas; sin dependencias externas de ejecución. No hay base de datos, cuentas, pagos ni persistencia de pedidos.
- packages/contracts/openapi.json: contrato HTTP versionado.
- docs/adr/0001-independent-apps.md: decisiones y límites de esta etapa.

## Desarrollo y entrega
`cd apps/backend && npm test` ejecuta pruebas de servicio (Node 22+); `cd apps/frontend && npm run check` revisa sintaxis. Desde apps/frontend, `python -m http.server 8000` permite probar el frontend con la API pública de previsualización. No incluir datos privados. Para Vercel desplegar cada subdirectorio de manera independiente en su proyecto correspondiente; actualmente la conexión Git automática no está verificada y el despliegue se realiza con archivos de cada aplicación. No subir credenciales. Estado no comercial.

## Siguiente etapa
Migración gradual a Next.js + TypeScript / NestJS + TypeScript, PostgreSQL y Prisma, identidad y administración autenticada, CI obligatorio y pruebas E2E, previo a habilitar comercio. Shopify/pagos aplazados. Las fotos reales y la confirmación de datos comerciales siguen pendientes.

## Verificación desde la raíz
`npm run verify` ejecuta validación de sintaxis del cliente, pruebas de dominio, API/HTTP y estructura. Los tests HTTP usan Request/Response de Node sin llamadas a producción. La suite está preparada para CI; no confundir su presencia en el repositorio con una ejecución remota exitosa. La versión anterior permanece recuperable en el commit `2f6e55fabe5bdd72d2cea0fe44dce3fc5fa7ddee`.

## Gobernanza obligatoria
Consultar [AGENTS.md](AGENTS.md), [SECURITY.md](SECURITY.md) y [release gate](docs/quality/RELEASE-GATE.md) para todas las modificaciones. La versión 0.7.1 endurece API y límites; el frontend/backend siguen independientes y sin comercio habilitado.

## v0.8 Customer Journey
Inicio por intención, /personaliza.html (wizard de cuatro pasos y boceto), /bolsa.html (consulta conjunta), /contacto.html. API POST /api/v1/basket-preview. No pedidos, pagos ni reservas. Preferencias e IDs/cantidades de sesión; fotos solo locales. Consulte el release gate para evidencias y limitaciones.

## v0.10 — Atelier Collection y Gift Studio
/personaliza.html: cuatro conceptos seleccionables y guía orientativa de porciones. /regalos.html: caja de 6/12 piezas con opciones históricas del catálogo; API valida la suma y los productos. Fichas con complementos sugeridos. No implica disponibilidad, precio, pedido ni pago. Consultar release gate.

## v0.10.1 — Viabilidad operativa
Reglas en [PRODUCTION-RULES.md](docs/business/PRODUCTION-RULES.md). Gift Studio limita composiciones a bloques provisionales de 6 por variedad de una familia. Toda consulta requiere revisión manual. No son mínimos comerciales aprobados. AGENTS.md exige revisión de operaciones antes de nuevas funciones comerciales.

## v0.12.0 — Laboratorio de operaciones
[Modelo operativo](docs/business/OPERATING-MODEL.md). /produccion.html ofrece un simulador local de lotes completos, mermas, costos, utilidad por hora y presupuestos de recursos, con 4 escenarios ficticios. No se envían ni guardan entradas; exportación manual de escenarios de prueba. No es aprobación de producción ni cotización. Backend conserva v0.10.1 y restricciones de Gift Studio. Las recetas reales deben capturarse en privado cuando exista Studio autenticado.

## v0.13 — Preparación de Mi negocio
/mi-negocio.html es una práctica pública sin datos reales. Migración SQL propuesta en database/migrations, no aplicada. Ver docs/adr/0002-owner-first-studio.md. Autenticación, DB y hosting comercial pendientes de autorización y pruebas.

## v0.13.1 — Base dinámica en desarrollo
Supabase lechantilly-dev: esquema versionado de catálogo, familias productivas independientes, presentaciones, publicación transaccional y borradores privados de recetas. No se ha conectado al sitio público ni habilitado autenticación real. Ver ADR 0003 y database/tests/development_catalog_regression.sql. El frontend en código genera productos y categorías de API sin fallback histórico. Integración de desarrollo solo lectura, bloqueada en producción; datos de prueba revertidos.

## v0.14.0-dev — Studio de desarrollo
Editor guiado de catálogo, presentaciones, colecciones y familias. Práctica temporal sin almacenamiento. BFF conectado a Supabase por clave pública de Preview, acceso real bloqueado hasta onboarding seguro. Ver ADR 0004. No comercial.
