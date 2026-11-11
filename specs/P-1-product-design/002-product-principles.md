# Product Principles

Reglas inmutables que ningún desarrollador, PM o stakeholder puede romper sin una revisión explícita del equipo.

---

### PR-001 — El core nunca contiene legislación

El núcleo del sistema no contendrá reglas específicas de ningún país. Toda la lógica fiscal, laboral o contable que varíe por jurisdicción vivirá en el Localization Engine.

*Rationale: Permitir que el mismo ERP opere en Venezuela, Colombia, España y EE.UU. sin bifurcar el código.*

---

### PR-002 — Todo debe poder des/habilitarse por configuración

Toda funcionalidad debe poder habilitarse o deshabilitarse mediante configuración o módulos, siempre que sea técnicamente viable.

*Rationale: Cada empresa usa un subconjunto diferente del ERP. Nunca obligar a un cliente a pagar o navegar por funcionalidades que no usa.*

---

### PR-003 — Toda operación importante es auditable

Toda operación que modifique datos críticos (crear, actualizar, eliminar, cambiar estado) debe generar un registro de auditoría con: quién, qué, cuándo, valor anterior y valor nuevo.

*Rationale: Cumplimiento legal, trazabilidad y depuración.*

---

### PR-004 — No se eliminan datos críticos

No se eliminarán registros críticos del sistema. Se conservará el historial cuando sea necesario por razones legales o de negocio (soft delete, tablas de historial, eventos inmutables).

*Rationale: Una factura cancelada no desaparece. Un empleado despedido no se borra. Un salario modificado se conserva en historial.*

---

### PR-005 — Configuración > Código

Si una diferencia entre empresas puede resolverse mediante configuración, no debe requerir una bifurcación del software ni un desarrollo personalizado.

*Rationale: Escalar a cientos de empresas sin multiplicar el mantenimiento.*

---

### PR-006 — API First

Toda funcionalidad del frontend debe poder realizarse mediante la API interna. La API pública para terceros se expondrá cuando el producto sea estable, pero la arquitectura debe soportarlo desde el día uno.

*Rationale: Evitar romper contratos externos durante la fase de maduración, pero no tener que reescribir el backend para exponer una API pública.*

---

### PR-007 — Multi-tenant por diseño

Toda funcionalidad debe ser multiempresa (multi-tenant) desde su creación, no agregada después.

Cada "empresa" es un tenant. Los tenants son estrictamente independientes (datos aislados, sin fuga entre ellos).

*Rationale: Agregar multi-tenancy después de construir el producto es costoso, riesgoso y propenso a errores.*

---

### PR-008 — Mantenibilidad sobre velocidad

Las decisiones de arquitectura deben priorizar mantenibilidad y extensibilidad sobre la velocidad de implementación.

*Rationale: Este producto aspira a una década de vida. Lo que hoy ahorra una semana, mañana cuesta meses.*

---

### PR-009 — Los módulos se comunican por eventos

Ningún módulo dependerá directamente de otro. La comunicación entre módulos será mediante servicios (API interna) o eventos (cola de mensajes).

*Rationale: Un módulo debe poder extraerse, reemplazarse o venderse por separado sin romper el sistema.*

---

### PR-010 — UX de alta densidad

El ERP está diseñado para uso intensivo diario — cajeros que procesan 200 transacciones por turno, contadores que revisan cientos de documentos, gerentes de inventario que operan en tiempo real. La interfaz priorizará eficiencia sobre ornamentación.

*Rationale: Nuestros usuarios no configuran el ERP una vez al año. Lo usan 8 horas al día.*

---

### PR-011 — 90% configuración, 10% extensibilidad

El ERP debe resolver el 90% de las necesidades de personalización mediante configuración (campos personalizados, módulos activables, catálogos configurables, preferencias por entidad) y el 10% restante mediante extensibilidad, nunca mediante modificaciones al núcleo.

*Rationale: Un núcleo estable y configurable escala a cientos de clientes. Las excepciones en el core son deuda técnica que se paga con intereses cada vez que un nuevo cliente llega.*

---

### PR-012 — Monolito modular como arquitectura inicial

El sistema comenzará como un monolito modular donde los bounded contexts están separados por capas de dominio, no por procesos. La comunicación entre contextos será mediante interfaces e inyección de dependencias, no por llamadas de red. Solo cuando un contexto requiera escalar o desplegarse de forma independiente se extraerá como servicio.

*Rationale: Un equipo pequeño no necesita la complejidad operativa de microservicios. Un monolito bien modularizado puede migrarse gradualmente cuando el producto lo justifique.*

---

### PR-013 — Cada producto de ODALX debe poder vivir por sí solo

Atrio, Argos, y cualquier producto futuro de ODALX deben ser independientes: cada uno con su propio modelo de datos, autenticación y despliegue. Las integraciones entre productos serán mediante APIs, no mediante dependencias directas.

*Rationale: Un cliente debe poder comprar solo Atrio, solo Argos, o la suite completa. Ningún producto debe requerir otro para funcionar.*
