# Business Capabilities

> Las capacidades del negocio representan **lo que el sistema debe poder hacer**, independientemente de cómo se empaqueten en módulos o se implementen técnicamente. Los bounded contexts implementan estas capacidades; los módulos son el empaquetamiento comercial para venderlas.

---

## Capabilities por contexto

### Catalog
- Gestionar listas de precios por moneda y vigencia
- Gestionar impuestos y alícuotas

### Customer Management
- Gestionar contactos de clientes y proveedores
- Geolocalizar direcciones
- Gestionar segmentos y clasificaciones
- Ver historial de transacciones del cliente

### Inventory
- Gestionar múltiples almacenes
- Registrar movimientos de entrada y salida
- Realizar ajustes y regularizaciones de inventario
- Transferir existencias entre almacenes
- Alertar sobre stock mínimo y máximo
- Gestionar lotes y números de serie
- Realizar conteos cíclicos y tomas físicas

### Sales
- Crear cotizaciones y convertirlas en pedidos
- Facturar (a crédito o contado)
- Emitir notas de crédito y débito
- Gestionar condiciones de pago
- Registrar despachos parciales o totales
- Consultar disponibilidad de productos

### Purchasing
- Crear órdenes de compra
- Recepcionar mercancía parcial o totalmente
- Gestionar condiciones de pago con proveedores
- Registrar costos de importación

### Cash Management
- Abrir y cerrar caja por turno
- Registrar cobros en múltiples medios de pago (efectivo, transferencia, punto, cripto)
- Arqueo de caja y detección de diferencias
- Registrar pagos a proveedores
- Registrar gastos menores

### Financials
- Mantener plan de cuentas contable
- Generar asientos automáticos desde transacciones operativas
- Consultar libro diario y libro mayor
- Generar balances de comprobación
- Gestionar años fiscales y cierres
- Conciliar cuentas bancarias
- Gestionar cuentas por cobrar y por pagar
- Gestionar centros de costo

### Human Resources
- Registrar empleados con su información personal y documental
- Definir estructura organizacional (departamentos, áreas, cargos)
- Gestionar contratos y sus modificaciones
- Mantener historial laboral completo
- Registrar novedades (vacaciones, permisos, incapacidades)
- Gestionar documentos adjuntos (CV, constancias, titulos)

### Payroll
- Configurar conceptos de nómina (ingresos, deducciones, provisiones)
- Definir periodicidad de nómina (semanal, quincenal, mensual)
- Calcular nómina de un período completo
- Generar recibos de pago
- Calcular provisiones de prestaciones sociales
- Procesar liquidaciones (renuncia, despido, jubilación)
- Gestionar incidencias que afectan el cálculo (faltas, horas extras)

### Localization
- Configurar reglas fiscales por país (IVA, IGTF, retenciones)
- Configurar reglas de facturación electrónica (documentos fiscales, timbres)
- Configurar reglas de nómina por país (prestaciones sociales, utilidades, parafiscales)
- Configurar plan de cuentas contable por país
- Configurar formatos de documentos fiscales

### Configuration
- Activar o desactivar módulos por tenant
- Definir campos personalizados por entidad
- Configurar preferencias del sistema
- Definir estados configurables para procesos
- Gestionar roles y permisos
- Gestionar usuarios y accesos multi-tenant
- Configurar medios de pago habilitados
- Definir numeraciones automáticas por tipo de documento

---

## Matriz capacidad vs. plan

| Capability | Free | Starter | Professional | Enterprise |
|-----------|------|---------|-------------|------------|
| Gestionar productos | ✓ | ✓ | ✓ | ✓ |
| Gestionar categorías | ✓ | ✓ | ✓ | ✓ |
| Gestionar precios | básico | ✓ | ✓ | ✓ |
| Gestionar impuestos | básico | ✓ | ✓ | ✓ |
| Gestionar clientes | ✓ | ✓ | ✓ | ✓ |
| Gestionar proveedores | — | ✓ | ✓ | ✓ |
| Gestionar contactos | — | ✓ | ✓ | ✓ |
| Ver historial del cliente | — | — | ✓ | ✓ |
| Gestionar 1 almacén | ✓ | ✓ | ✓ | ✓ |
| Gestionar 3+ almacenes | — | ✓ | ✓ | ✓ |
| Transferencias entre almacenes | — | — | ✓ | ✓ |
| Lotes y series | — | — | ✓ | ✓ |
| Cotizar | básico | ✓ | ✓ | ✓ |
| Facturar | ✓ | ✓ | ✓ | ✓ |
| Notas de crédito/débito | — | ✓ | ✓ | ✓ |
| Compras | — | ✓ | ✓ | ✓ |
| Recepción de compras | — | ✓ | ✓ | ✓ |
| Caja básico (1 caja) | ✓ | ✓ | ✓ | ✓ |
| Múltiples cajas | — | — | ✓ | ✓ |
| Arqueo de caja | — | — | ✓ | ✓ |
| Múltiples medios de pago | básico | ✓ | ✓ | ✓ |
| Crypto como medio de pago | — | — | ✓ | ✓ |
| Dashboard básico | ✓ | ✓ | ✓ | ✓ |
| Reportes avanzados | — | — | ✓ | ✓ |
| Localización fiscal V1 | — | — | ✓ | ✓ |
| Campos personalizados | — | — | ✓ | ✓ |
| Workflows | — | — | — | ✓ |
| API para integraciones | — | — | ✓ | ✓ |
| API pública | — | — | — | ✓ |
| RRHH básico | — | — | ✓ | ✓ |
| Nómina | — | — | — | ✓ |
| Contabilidad | — | — | ✓ | ✓ |
| Multi-tenant (grupo empresarial) | — | — | — | ✓ |
| Auditoría completa | — | ✓ | ✓ | ✓ |

---

## Capacidades futuras (productos ODALX independientes)

| Capacidad | Producto ODALX | ¿Atrio tendrá algo similar? |
|-----------|---------------|---------------------------|
| Automatización de marketing | CRM | No. Solo historial de transacciones. |
| Embudos de venta complejos | CRM | No. Solo oportunidades simples. |
| Reclutamiento y selección | Argos (ATS) | No. Ya existe como producto separado. |
| Tracking de candidatos | Argos (ATS) | No. Producto separado. |
| Tickets de soporte | Help Desk | No. Producto futuro separado. |
| Base de conocimiento | Help Desk | No. Producto futuro separado. |
| BI con dashboards personalizados | BI | Dashboards operativos sí. BI completo no. |
| Tienda online | E-commerce | No. Producto futuro separado. |
| Marketplace de integraciones | API Marketplace | No. Producto futuro separado. |
