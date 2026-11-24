# Arquitectura y entrega — Le Chantilly v0.6
Estado: preview no comercial. Proyecto único JAlvaCE/LeChantilly, Vercel lechantilly. No se activa Shopify, checkout, pagos, cuentas, ni se crean otros proyectos.

## Arquitectura actual
Monolito frontend modular estático sin dependencias de ejecución de terceros excepto fuentes e imágenes de ambientación etiquetadas. HTML semántico + CSS compartido. / index editorial, /catalogo.html colecciones, /producto.html?id=slug detalle, /personaliza.html configurador, /studio.html herramientas locales de planificación sin autenticación. Studio NO es un panel administrativo en producción: no almacena información personal ni tiene acceso a pedidos. No expone claves ni datos privados. El catálogo público es la única fuente remota de datos. El editor solo genera borradores descargables.

Dominio puro (domain.mjs): reglas de validación catálogo, búsqueda, precios, cotización, capacidad y costos. Adaptadores UI: pages-shared.mjs, catalog-page.mjs, product-page.mjs, studio.mjs. Catálogo JSON versionado, IDs estables, fuentes originales, precio y disponibilidad pendientes, checkout deshabilitado. Los IDs de colecciones son relaciones a productos. HTML ofrece un fallback navegable, no un checkout alternativo.

## Arquitectura objetivo, pendiente de proveedor/autorización
Monolito modular backend con dominios Catalog, Quote, Orders, Production, Customer, Inventory, Accounting. Persistencia relacional gestionada, transacciones ACID y migraciones versionadas. Identidad de propietaria y colaboradores con autorización de mínimo privilegio por servidor, MFA cuando sea posible. Frontend administrativo nunca comunica directamente con la base de datos usando credenciales privilegiadas. Datos personales aislados del catálogo público. API valida en servidor toda entrada, precios, descuentos, impuestos, disponibilidad y transiciones; evitar confiar en cliente. Prohibido almacenar PAN/CVV.
Flujo estándar: catálogo activo → carrito → checkout del proveedor → webhook autenticado e idempotente → orden confirmada. Personalizado: solicitud → propuesta versionada con precio/vencimiento → aprobación explícita → anticipo según condiciones → producción. No afirmar pago hasta conciliación del proveedor.
Capacidad: reservas temporales con expiración y bloqueo transaccional de cupo; calendario local actual solo simula minutos. Inventario: lotes, recetas, unidades, movimientos y trazabilidad; costos: ingredientes, mano de obra, empaque, indirectos, comisiones e impuestos. Studio autenticado: gestión de productos, fotos, agenda, cotizaciones, pedidos, clientes, finanzas; analítica respetuosa de privacidad tras consentimiento aplicable. No usar números ficticios como métricas reales.
Modelo objetivo: products, variants, media, seasonal_collections, recipes, inventory_movements, customers, quotes, quote_versions, orders, order_items, payment_events, capacity_slots, reservations, audit_events. Identificadores no predecibles para entidades privadas; money entero COP; timestamps UTC y agenda America/Bogota. Backups y restauración probada; retención y eliminación de datos; redacción de PII en logs.

## Puertas de calidad y lanzamiento
1. node --test tests/*.test.mjs; pruebas unitarias de dominio; inspección de referencias y validación catálogo. Configurar CI y reglas de protección de rama. No confundir tests unitarios con pruebas E2E.
2. QA navegador real móvil y escritorio: navegación, filtros, URL inexistente, teclado, modal, formulario, import/export, contraste WCAG AA, zoom 200%, errores de red, LCP <=2.5s, CLS <=0.1, INP <=200ms; Lighthouse móvil >=90 como objetivo, no resultado. Pruebas de accesibilidad manuales.
3. Fotos propias optimizadas WebP/AVIF con alt, dimensiones y derechos; validación de precios, alérgenos, conservación, fechas, entrega, WhatsApp; revisión propietaria. No inferir disponibilidad por publicación histórica.
4. Provisionar almacenamiento y autenticación reales antes de construir y activar administración comercial; pruebas de autorización y aislamiento, auditoría, recuperación ante fallos. Configurar proveedor de pago solo cuando la propietaria lo autorice.
5. Hosting comercial permitido, políticas de protección de datos, términos, devoluciones y cumplimiento local revisados. Retirar noindex solo tras aprobación.
6. CI con despliegue de staging, pruebas E2E y promoción revisada; rollback al último despliegue estable. Verificar conexión automática Git/Vercel antes de habilitar despliegues por commit.
7. Observabilidad: uptime y métricas agregadas, logs sin PII, alertas y presupuestos de errores; no hay instrumentación operativa en esta versión.

## Handoff
Transferir proyecto, dominio y proveedor comercial a cuenta de propietaria cuando esté listo; credenciales separadas, mínimo privilegio, guía de operación y copia de seguridad. Ninguna dependencia de la cuenta personal para recaudar ventas.
