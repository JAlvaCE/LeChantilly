# AGENTS.md — Instrucciones obligatorias para Le Chantilly
Ámbito: todo el repositorio JAlvaCE/LeChantilly y solo sus dos proyectos Vercel y el proyecto Supabase dedicado lechantilly-dev (desarrollo). Aplicar en toda modificación, incluso sin petición explícita. No tocar otros proyectos. No confundir estas instrucciones con controles técnicos ya activos.

## Roles y Definition of Done
1. Product Manager: problema, usuario, valor, alcance, criterios de aceptación, impacto y métricas sin inventar datos; priorizar P0 sobre adornos. No habilitar comercio sin aprobación de propietaria.
2. Product Designer/UI/UX: identidad rosa artesanal, fotos auténticas autorizadas, estados carga/vacío/error/éxito, móvil primero, accesibilidad WCAG AA como objetivo, acciones claras y honestas; no fingir fotos, disponibilidad ni precios.
3. Arquitectura: monorepo, frontend/backend desplegables separados, contratos versionados, dominio y autoridad de negocio en servidor, persistencia relacional y migraciones revisadas al integrar DB. ADR para cambios significativos; sin microservicios innecesarios.
4. Ciberseguridad/privacidad: amenaza y superficie de ataque, mínimos privilegios, validación servidor, prevención abuso, secretos fuera de Git, autorización por recurso, sesiones y MFA antes de datos privados, datos mínimos, registros sin PII, ASVS L2 como objetivo; PCI/privacidad Colombia según alcance. No activar pagos, registro de clientes, administración real o almacenamiento privado sin controles aprobados. CORS no es autenticación. No aceptar gastos o servicios pagos sin autorización.
5. Ingeniería/QA: prueba unitaria y de integración según riesgo, casos negativos, regresión, accesibilidad, rendimiento, revisión de dependencias, contrato y documentación. Ejecutar npm run verify y pruebas relevantes; declarar las no ejecutadas. No inventar resultados.
6. DevOps/SRE: verificar equipo, proyecto y commit; staging y smoke tests antes de promoción, controles CI y rollback, telemetría sin PII, límites y alertas. Nunca tocar credenciales ni otros proyectos. Entregar URLs y evidencia; distinguir READY de una prueba funcional.

## Gate obligatorio
Antes de cambios: revisar documentos, alcance, dependencias, riesgos, capacidad de rollback. Antes de publicación: revisión de los seis roles, pruebas verificadas, aprobación del responsable si hay datos privados/pagos/costos, no hallazgos críticos/altos abiertos relacionados con el release comercial. Si algún criterio no puede verificarse, limitar el despliegue a preview no comercial o conservar versión previa; registrar deuda y no afirmar conformidad. Actualizar docs/quality/RELEASE-GATE.md con evidencia y limitaciones. Mantener Shopify aplazado hasta instrucción expresa.

## Regla obligatoria de viabilidad de negocio
Antes de implementar cambios comerciales revisar [reglas de producción](docs/business/PRODUCTION-RULES.md). La revisión de producto incluye el rol de responsable de operaciones/producción: recetas, lotes, formatos, capacidad, conservación, alérgenos, costo total, mermas y margen. La validación técnica no equivale a factibilidad. Datos operativos desconocidos bloquean aprobación automática; no inventar reglas comerciales ni presentar propuestas como confirmadas.

## Revisión de operaciones ampliada
Incluir analista financiero (costo integral y utilidad/hora), calidad alimentaria (alérgenos, vida útil y trazabilidad), analista de procesos (tiempo, recursos y simplificación) y QA independiente (supuestos, casos frontera y evidencia). Usar [modelo operativo](docs/business/OPERATING-MODEL.md) y no promover escenarios ficticios a reglas aprobadas. Preservar descanso y revisión manual de propietaria.

## Experiencia de propietaria
Priorizar tareas cotidianas, acceso móvil, español sencillo y pasos guiados. No mostrar herramientas de desarrollo en Studio privado. Probar con la propietaria; no aprobar interfaz por estética solamente. Ver ADR 0002.

## Publicación del catálogo
Categorías y referencias dinámicas; no identificadores comerciales fijos como reglas de negocio. Borradores inmutables, publicación atómica, autorización por negocio y MFA, control de concurrencia. Ver ADR 0003 y regression SQL. No conectar entorno de desarrollo a producción ni admitir datos reales hasta completar gates.

## Studio de desarrollo
`apps/studio` solo en Vercel Preview protegido, separado de la tienda pública. No activar acceso privado ni introducir datos reales sin confirmar invitación, registro cerrado, OTP/SMTP, MFA, recuperación, pruebas de permisos extremo a extremo y copias de seguridad. Ver ADR 0004. Distinguir práctica temporal de persistencia autenticada.
