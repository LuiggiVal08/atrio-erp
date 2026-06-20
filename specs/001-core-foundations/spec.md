# Especificación: Core Foundations (Multi-Tenant, Auth, RBAC)

**Feature Branch**: `001-core-foundations`

**Created**: 2026-06-19

**Status**: Draft

**Input**: Inicializar el diseño del Core de Atrio. Definir el sistema Multi-Tenant (Gestión de Empresas), la Autenticación Base y el sistema de Roles y Permisos (RBAC), separando conceptualmente Usuarios de Empleados, de acuerdo a la Constitución v1.1.0.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gestión Multi-Tenant (Registro y Onboarding de Empresas) (Priority: P1)

El super-admin de la plataforma debe poder registrar una nueva empresa (tenant) con su configuración base. Cada tenant debe operar de forma completamente aislada: sus datos, usuarios, módulos y configuraciones no deben ser accesibles desde otros tenants. El admin del tenant recibe credenciales iniciales para gestionar su instancia.

**Why this priority**: El modelo multi-tenant es la base arquitectónica de Atrio. Sin esta capacidad no existe el producto SaaS; todas las demás funcionalidades dependen de que los datos estén correctamente aislados por compañía.

**Independent Test**: Registrar una nueva empresa con datos mínimos (razón social, RIF/Jurisdicción, moneda base, plan de suscripción). Verificar que se crea un entorno aislado, que su admin puede iniciar sesión, y que un usuario de otro tenant no puede acceder a sus datos.

**Acceptance Scenarios**:

1. **Given** que soy super-admin de la plataforma, **When** registro una nueva empresa con nombre "Acme Corp", RIF J-12345678-0, moneda base VED, **Then** el sistema crea un tenant aislado, asigna un admin inicial y envía credenciales de acceso.
2. **Given** que existen dos tenants (Acme Corp y Beta SA), **When** un usuario autenticado en Acme Corp intenta acceder a un recurso de Beta SA, **Then** el sistema rechaza la solicitud con error de autorización.

---

### User Story 2 - Autenticación Base (Login y Sesión) (Priority: P1)

Los usuarios de la plataforma deben poder autenticarse en el sistema dentro del contexto de su tenant. La autenticación debe ser segura, validar credenciales contra el tenant correspondiente y mantener una sesión que permita al usuario navegar entre funcionalidades autorizadas sin reautenticarse.

**Why this priority**: Sin autenticación no hay acceso al sistema. Es el punto de entrada obligatorio para cualquier interacción con la plataforma.

**Independent Test**: Un usuario registrado en un tenant específico inicia sesión con sus credenciales, accede a recursos del tenant, y al cerrar sesión pierde el acceso. Un usuario con credenciales inválidas recibe un error de autenticación.

**Acceptance Scenarios**:

1. **Given** un usuario registrado en el tenant Acme Corp con email admin@acme.com y contraseña válida, **When** inicia sesión con esas credenciales, **Then** el sistema le otorga un token de sesión y redirige al dashboard del tenant.
2. **Given** un usuario registrado en Acme Corp, **When** intenta iniciar sesión con contraseña incorrecta en 5 intentos consecutivos, **Then** el sistema bloquea la cuenta temporalmente y registra el evento de seguridad.
3. **Given** un usuario con sesión activa, **When** cierra sesión explícitamente, **Then** el sistema invalida el token de sesión y requiere autenticación para cualquier nueva solicitud.

---

### User Story 3 - RBAC (Roles y Permisos) (Priority: P2)

El administrador de cada tenant debe poder definir roles con permisos granulares y asignarlos a los usuarios de su empresa. Cada permiso debe controlar el acceso a acciones específicas dentro de los módulos del sistema (ej: crear facturas, aprobar órdenes de compra, ver reportes de inventario). El sistema debe enforcear estos permisos en cada punto de entrada.

**Why this priority**: El control de acceso granular es esencial para empresas con múltiples departamentos y niveles jerárquicos. Sin RBAC, todos los usuarios tendrían el mismo nivel de acceso, lo que es inseguro e inmanejable en organizaciones reales.

**Independent Test**: El admin del tenant crea un rol "Contador" con permisos de lectura en facturación y escritura en libros contables. Asigna el rol a un usuario. Verificar que el usuario puede ejecutar las acciones permitidas y recibe error de autorización en acciones no permitidas.

**Acceptance Scenarios**:

1. **Given** un admin de tenant autenticado, **When** crea un rol "Auditor" con permiso de solo lectura en facturación, **Then** el rol se guarda y está disponible para asignación.
2. **Given** un usuario con rol "Auditor" (solo lectura en facturación), **When** intenta crear una factura nueva, **Then** el sistema rechaza la operación con error de permisos insuficientes.
3. **Given** un usuario sin rol asignado, **When** intenta acceder a cualquier funcionalidad del sistema, **Then** el sistema deniega el acceso por defecto (principio de mínimo privilegio).

---

### User Story 4 - Separación Usuario vs Empleado (Priority: P3)

El sistema debe mantener una separación conceptual y estructural entre Usuarios (identidades de plataforma con credenciales y roles) y Empleados (registros de personas dentro de la estructura de negocio del tenant, con datos laborales, salariales y de nómina). Un Usuario puede estar vinculado a un Empleado, pero son entidades independientes: se debe poder eliminar un Usuario sin afectar el registro del Empleado y viceversa.

**Why this priority**: La Constitución v1.1.0 lo exige explícitamente. En la práctica, una empresa puede tener empleados que no usan el sistema (ej: operarios de fábrica) y contratistas externos que sí necesitan acceso como Usuarios pero no son Empleados.

**Independent Test**: Crear un Empleado "Juan Pérez" con datos de nómina. Crear un Usuario "jperez" vinculado a ese Empleado. Eliminar el Usuario y verificar que el Empleado permanece intacto con todos sus datos laborales. Luego crear un nuevo Usuario y vincularlo al mismo Empleado.

**Acceptance Scenarios**:

1. **Given** que existe un Empleado "María López" con datos de nómina (salario, fecha ingreso, departamento), **When** se crea un Usuario "mlopez" con email mlopez@acme.com y se vincula al Empleado, **Then** ambas entidades existen de forma independiente pero vinculadas.
2. **Given** un Usuario "jperez" vinculado a un Empleado "Juan Pérez", **When** se elimina el Usuario "jperez", **Then** el Empleado "Juan Pérez" conserva todos sus datos laborales intactos.
3. **Given** un Empleado "Carlos Ruiz", **When** se intenta crear un segundo Empleado con el mismo documento de identidad en el mismo tenant, **Then** el sistema rechaza la operación por duplicado.

---

### Edge Cases

- ¿Qué ocurre cuando un super-admin intenta eliminar un tenant que tiene datos transaccionales activos? El sistema debe rechazar la eliminación o requerir un proceso de migración/respaldo.
- ¿Cómo maneja el sistema la desactivación temporal de un tenant por impago? El bloqueo debe impedir el acceso de todos sus usuarios preservando la integridad de los datos.
- ¿Qué sucede cuando se elimina un rol que está asignado a usuarios activos? El sistema debe reasignar esos usuarios a un rol por defecto o notificar al admin antes de la eliminación.
- ¿Cómo se comporta la autenticación cuando un tenant es desactivado? El login debe fallar con un mensaje claro indicando que la empresa está suspendida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir el registro de nuevos tenants (empresas) con datos mínimos: nombre legal, identificación fiscal, moneda base, zona horaria, y plan de suscripción.
- **FR-002**: El sistema MUST garantizar aislamiento completo de datos entre tenants. Cada consulta, escritura y operación MUST estar scoped al tenant autenticado.
- **FR-003**: El sistema MUST proveer autenticación segura mediante email y contraseña, con sesión basada en tokens.
- **FR-004**: El sistema MUST bloquear temporalmente una cuenta después de N intentos fallidos de login consecutivos (N configurable por tenant).
- **FR-005**: El sistema MUST permitir a los usuarios restablecer su contraseña mediante un flujo seguro de recuperación.
- **FR-006**: El sistema MUST permitir la creación, edición y eliminación de roles con permisos granulares asociados.
- **FR-007**: El sistema MUST validar permisos del usuario en cada operación y denegar acceso si el permiso es insuficiente.
- **FR-008**: El sistema MUST implementar el principio de mínimo privilegio: por defecto, un usuario sin rol asignado no tiene acceso a ninguna funcionalidad.
- **FR-009**: El sistema MUST mantener Usuarios y Empleados como entidades de datos separadas con esquemas independientes.
- **FR-010**: El sistema MUST permitir vincular opcionalmente un Usuario a un Empleado existente, y desvincularlos sin pérdida de datos en ninguna de las dos entidades.
- **FR-011**: El sistema MUST auditar todas las operaciones de creación, modificación y eliminación de: tenants, usuarios, roles, asignaciones de roles, y empleados.
- **FR-012**: El sistema MUST permitir la desactivación/reactivación de un tenant por parte del super-admin, bloqueando todo acceso durante el período de suspensión.

### Key Entities

- **Tenant (Compañía)**: Representa una empresa cliente de la plataforma SaaS. Contiene configuración base (moneda, zona horaria, jurisdicción fiscal), plan de suscripción, y estado (activo/suspendido). Es el contenedor raíz de todos los demás datos.
- **User (Usuario)**: Identidad digital de una persona física dentro de un tenant. Posee credenciales de acceso (email, hash de contraseña), roles asignados, y estado (activo/bloqueado/inactivo). No contiene datos laborales.
- **Employee (Empleado)**: Registro de una persona dentro de la estructura organizacional del tenant. Contiene datos laborales (salario, fecha de ingreso, departamento, cargo), datos personales (nombre, documento identidad), y estado (activo/inactivo). Puede estar vinculado opcionalmente a un User.
- **Role (Rol)**: Colección nombrada de permisos que puede ser asignada a uno o varios Users dentro de un tenant. Ej: "Administrador", "Contador", "Auditor", "Vendedor".
- **Permission (Permiso)**: Derecho granular para ejecutar una acción específica sobre un recurso o módulo del sistema. Ej: "facturacion.crear", "facturacion.ver", "inventario.ajustar", "reportes.exportar".

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un super-admin puede completar el registro y aprovisionamiento de un nuevo tenant en menos de 2 minutos, incluyendo la generación de credenciales del admin inicial.
- **SC-002**: Un usuario puede completar el flujo de inicio de sesión en menos de 2 segundos en el percentil 95, medida desde el envío de credenciales hasta la recepción del token de sesión.
- **SC-003**: El sistema verifica permisos en el 100% de las operaciones que modifican o acceden a datos de negocio, sin puntos de entrada que omitan la validación RBAC.
- **SC-004**: La separación entre Usuario y Empleado se verifica mediante pruebas de integración que demuestren: (a) eliminación de User no afecta Employee, (b) eliminación de Employee no afecta User, (c) un Employee puede existir sin User asociado.
- **SC-005**: El sistema soporta al menos 100 tenants activos concurrentes sin degradación en los tiempos de respuesta de autenticación y autorización.

## Assumptions

- El método de autenticación base será email y contraseña con hash bcrypt, sesión mediante JWT, y soporte futuro para 2FA.
- El aprovisionamiento de tenants será gestionado inicialmente por un super-admin de plataforma (no autoservicio público).
- Los permisos RBAC se definirán a nivel de acción por módulo (ej: `modulo.accion`), consistentes con la arquitectura de dominio y plug-in de la Constitución v1.1.0.
- La vinculación entre User y Employee será opcional y uno-a-uno: un User puede vincularse a cero o un Employee, y un Employee puede vincularse a cero o un User.
- El sistema operará inicialmente como API RESTful con sesión stateless para facilitar integraciones futuras con clientes web y móviles.
- Los datos de empleados incluirán al menos: nombres, apellidos, documento de identidad, fecha de ingreso, departamento, cargo, y salario base.
