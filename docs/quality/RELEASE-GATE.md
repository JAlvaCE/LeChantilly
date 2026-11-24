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

## v0.8 — Customer Journey (2026-11-24)
- Producto: tres entradas por intención, consulta conjunta, productos personalizados separados, fecha deseada y entrega sin prometer disponibilidad.
- Diseño: wizard de cuatro pasos y boceto en tiempo real, navegación móvil, bolsa, contacto, formularios reducidos. Fotos originales pendientes. QA visual y accesibilidad manual pendientes.
- Arquitectura: frontend y backend independientes, POST /api/v1/basket-preview y contrato OpenAPI. No pedidos ni reservas reales.
- Seguridad: solo IDs/cantidades y preferencias de diseño/porciones en sessionStorage. No guardar textos, fechas, fotos ni PII. Backend rechaza productos desconocidos, duplicados, personalizados, precios inyectados, cantidades fuera de rango y datos ajenos al contrato. WAF anterior se conserva.
- QA: 10/10 pruebas de servicio ejecutadas, 16/16 comprobaciones de sintaxis/IDs y saneamiento de bolsa, referencias locales de los 23 archivos verificadas. Cinco consultas HTTP públicas correctas. No se ejecutó suite Node/CI completa ni E2E en navegador; no afirmar conformidad WCAG ni seguridad certificada.
- DevOps: backend dpl_ARjvqzveWQ3wJBVvS5id1MZxVLGN, frontend dpl_8sMrx2YMgZacrxZGa98Xgf8B1QVV, READY y smoke tests públicos. Despliegue directo de vista previa no comercial; staging separado no verificado. Rollback anterior frontend dpl_GDSCzdustSVUktN37Rt64CjJoAH6, backend dpl_2hAiezz9JDivrtTxFZ77XtqvbNyT. Commit desplegado fff2c3b92fa4569594c523a2e9b5a4f8978de956. Pendiente CI obligatorio, observabilidad, DB, autenticación, WhatsApp, fotos, precio/stock confirmados; checkout, seguimiento, reseñas verificadas y pagos fuera de alcance hasta infraestructura autorizada.
