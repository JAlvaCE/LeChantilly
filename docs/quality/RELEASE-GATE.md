# Quality and security release gate — v0.7.1
Fecha: 2026-11-24. Vista previa no comercial. No contiene cuentas, pedidos persistentes ni pagos.
| Rol | Evidencia / criterio | Estado |
|---|---|---|
| Producto | 17 referencias, no precios ni disponibilidad inventados, consultas no son pedidos | conservar |
| Diseño | mantener identidad y estados claros; mensaje de rate limit y aviso de privacidad en Studio | revisión código; QA visual pendiente |
| Arquitectura | aplicaciones y API versionada separadas; contrato de margen actualizado; proyección pública explícita | implementado |
| Seguridad | CORS producción exacto, límite body, validación query, encabezados, correlation ID y logs sin cuerpo; regla WAF activa 120/min/IP excepto OPTIONS | configuración verificada, sin prueba de saturación |
| QA | pruebas negativas HTTP nuevas; suite npm run verify; CI definido por separado | ejecutar y registrar resultados; no confundir pruebas escritas con aprobadas |
| DevOps | dos proyectos exclusivos; preservar commits/deploys anteriores; comprobar endpoints publicados | ver evidencia de despliegue |
Bloqueantes comerciales: MFA/RBAC, autorización por recurso, DB y backups probados, políticas/consentimiento, pagos/conciliación, monitoreo y alertas con retención adecuada, E2E/ASVS, revisión de dependencias, hosting comercial permitido, fotos/stock/precios/WhatsApp confirmados. No hay certificación. Rate limiting del proveedor tiene límites de plan; revisar consumo, no contratar upgrades automáticamente. Cálculos Studio transmiten importes de prueba, no datos privados.
