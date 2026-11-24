# LeChantilly

Prototipo personal no comercial de un atelier de pastelería. HTML, CSS y JavaScript sin dependencias de compilación.

## Ejecutar
Abre index.html o inicia un servidor local: `python -m http.server 8000`.

## Estado
Colecciones filtrables, diseño responsive, fichas interactivas. Fotos externas de Unsplash como inspiración, no inventario real. No se reciben pedidos ni pagos. El sitio está excluido de indexación mientras sea una demostración.

## Siguiente fase
Configurar plataforma de comercio, catálogo real, hosting apto para comercio y pasarela habilitada para Colombia. Validar el checkout y la confirmación de pedidos antes de aceptar pagos. No publicar credenciales en GitHub.

## v0.3 — Atelier creativo
Identidad original SVG, boceto vectorial de torta configurable en 24 combinaciones (4 paletas, 2 siluetas, 3 decoraciones), exportación local de SVG, contador accesible de colecciones, preguntas frecuentes y mejoras responsive. No transmite información ni procesa pagos. La indexación permanece deshabilitada mientras se trate de una demo no comercial.

## Puertas de lanzamiento comercial
- Instalar Shopify en el proyecto Vercel: https://vercel.com/marketplace/shopify
- Configurar Wompi en Shopify: https://docs.wompi.co/docs/colombia/wompi-shopify-plugin/
- Definir fotos propias, productos, precios COP, variantes, alérgenos, cobertura y políticas.
- Habilitar hosting comercial; probar checkout de prueba y confirmación de pedidos, luego activar pagos reales.
- Conectar GitHub al proyecto Vercel existente; evitar duplicados. No activar robots hasta confirmar catálogo y políticas.

## v0.4 — Catálogo basado en Instagram
17 referencias documentadas con enlaces a las publicaciones originales. Las ilustraciones son decorativas y no representan fotografías de producto. No se utilizan enlaces CDN temporales de Instagram; se requieren archivos originales aprobados para el lanzamiento. No se confirma disponibilidad actual ni se inventan precios.

## v0.5 — Identidad, fichas y consultas
`catalog.json` contiene 17 referencias, precios COP pendientes, variantes, alérgenos, fuentes y configuración de contacto. Búsqueda, filtro, detalle y borrador local; Instagram disponible y WhatsApp condicionado a confirmación. Sin Shopify ni pagos. Ver `UX-AUDIT.md`. HTML conserva fallback: sincronizar las tarjetas si se cambia el conjunto de IDs.
