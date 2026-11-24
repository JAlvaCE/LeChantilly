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
