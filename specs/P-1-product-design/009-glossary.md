# Glossary

Términos y definiciones usados en los documentos de producto y arquitectura. Este glosario debe mantenerse actualizado y alineado con el [Ubiquitous Language](/specs/002-domain/ubiquitous-language.md).

| Término | Definición |
|---------|-----------|
| **Atrio** | Producto ERP de ODALX. Del latín *atrium* — el patio central alrededor del cual se organiza una casa romana. Metáfora del núcleo alrededor del cual se organizan los módulos. |
| **ODALX** | Marca matriz que agrupa todos los productos y proyectos de la compañía (ERP, ATS, CRM, Help Desk, BI, E-commerce, API Marketplace). No es un producto; es la organización que los construye. Atrio es el primer producto de ODALX. |
| **Tenant** | Una empresa o cliente que usa el sistema. Equivale a una organización. Cada tenant tiene sus propios datos aislados. |
| **Usuario** | Persona que accede al sistema. Pertenece a un tenant primario y puede tener acceso a otros mediante UserAccess. |
| **UserAccess** | Relación que permite a un usuario acceder a múltiples tenants sin cambiar de cuenta. |
| **Módulo** | Componente funcional independiente que puede activarse o desactivarse por tenant. Ej: Ventas, Compras, Inventario, RRHH. |
| **Core** | Núcleo del sistema que gestiona auth, multi-tenant, módulos, auditoría, y la infraestructura base. No contiene lógica de negocio específica. |
| **Localization Engine** | Motor de localización que aplica reglas fiscales, laborales y contables específicas de cada país sobre las operaciones del core. |
| **Plan** | Nivel de suscripción (Free, Starter, Professional, Enterprise) que determina qué módulos y límites tiene un tenant. |
| **Complemento** | Módulo muy especializado que se vende por separado de los planes. Ej: Nómina, Localización Avanzada. |
| **API First** | Principio de diseño donde toda funcionalidad está disponible mediante API antes de construir la UI correspondiente. |
| **Multi-tenant** | Arquitectura donde múltiples clientes (tenants) comparten la misma instancia de software pero con datos completamente aislados. |
| **Slug** | Identificador humanamente legible de un tenant (ej: `mi-empresa`). Se usa en lugar de UUID para login y URLs. |
| **PYME** | Pequeña y mediana empresa. Segmento objetivo del producto. 3-200 empleados, facturación $50K-$10M. |
| **Monolito Modular** | Arquitectura donde los bounded contexts están separados por capas de dominio dentro de un mismo proceso, no por servicios independientes. Permite extraer contextos a microservicios cuando sea necesario. |
| **Bounded Context** | Límite explícito dentro del cual un modelo de dominio es consistente. Cada contexto tiene su propio lenguaje ubicuo, entidades y reglas, sin ambigüedad con otros contextos. |
| **Business Capability** | Capacidad del negocio que el sistema debe soportar. Ej: "Gestionar clientes", "Gestionar existencias". Los módulos son el empaquetamiento comercial de las capacidades. |
| **Custom Field** | Campo definido por el usuario sobre una entidad estándar (ej: "Zona Comercial" en Cliente). Se almacena como metadato, no como columna de base de datos. |
| **UPAR** | Módulo de Compras (UPAR: *Unidad de Producción, Abastecimiento y Recepción*). |
| **RRHH** | Módulo de Recursos Humanos. Base organizacional empleados, cargos, contratos, historial. |
| **Nómina** | Módulo de liquidación de nómina. Depende de RRHH. Incluye conceptos, períodos, cálculos, recibos. |
| **UPAR** | Compras |
| **SERVI** | Servicios |
| **VENTAS** | Ventas |
| **CAJA** | Caja / POS |
| **INVENTARIO** | Inventario y almacenes |
| **PEDIDOS** | Pedidos / Órdenes |
| **REPORTES** | Reportes e indicadores |
| **DOCUMENT** | Motor de documentos (Document Engine) |
| **Contabilidad** | Módulo contable (plan de cuentas, libro diario, balances) |
| **IGTF** | Impuesto a las Grandes Transacciones Financieras (Venezuela) |
| **IVA** | Impuesto al Valor Agregado |
| **ISLR** | Impuesto Sobre la Renta |
| **CFDI** | Comprobante Fiscal Digital por Internet (México) |
| **DIAN** | Dirección de Impuestos y Aduanas Nacionales (Colombia) |
