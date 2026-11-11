# Product Vision

## ¿Qué es?

**Atrio** es un ERP modular, parte del ecosistema **ODALX** — la marca matriz que agrupa todos los productos de la compañía ninguno depende de otro para funcionar.

Atrio está orientado inicialmente a pequeñas y medianas empresas de Latinoamérica, diseñado para adaptarse mediante configuración y módulos, no mediante desarrollos específicos por cliente.

## ¿Qué NO es Atrio?

Atrio NO es una plataforma empresarial todo-en-uno.
Atrio NO es CRM, ni Help Desk, ni BI, ni E-commerce.

**Atrio es un ERP especializado.** Contendrá las capacidades de gestión de clientes, dashboards y reportes que todo ERP necesita, pero esas capacidades estarán limitadas al contexto del ERP — no pretenderán reemplazar productos dedicados.

La plataforma que agrupa todos los productos es **ODALX**.

```
ODALX
├── Atrio (ERP)
├── Argos (ATS)
├── CRM (futuro)
├── Help Desk (futuro)
├── BI (futuro)
├── E-commerce (futuro)
```

## ¿Qué problema resuelve?

Muchos ERP disponibles para el mercado latinoamericano son:

- **Demasiado complejos** — requieren consultoría costosa para implementarse.
- **Demasiado caros** — los modelos de licenciamiento tradicionales excluyen a las PYMES.
- **Poco adaptados a la realidad local** — ignoran multi-moneda, regímenes fiscales como IVA/IGTF, y regulaciones laborales específicas.
- **Difíciles de personalizar** — cualquier cambio requiere desarrollos a medida o módulos propietarios caros.
- **Pensados para un solo país** — un ERP venezolano no sirve en Colombia, y viceversa.

Nuestro objetivo es ofrecer una plataforma moderna que combine:

| Atributo | Cómo lo logramos |
|----------|-----------------|
| **Simplicidad** | Interfaz de alta densidad pensada para uso diario intensivo (cajeros, contadores, gerentes de inventario). |
| **Arquitectura robusta** | NestJS + React + PostgreSQL, con principios DDD y eventos. |
| **Escalabilidad** | Multi-tenant nativo, API First, módulos independientes. |
| **Localización como pilar** | Las reglas de cada país viven en el Localization Engine, no en el core. |

## ¿Qué NO queremos construir?

TAN IMPORTANTE COMO LO QUE SÍ:

- No desarrollaremos funcionalidades exclusivas para un solo cliente.
- No crearemos un ERP diferente para cada país (un solo código base, múltiples localizaciones).
- No llenaremos el sistema de opciones innecesarias que nadie usa.
- No hardcodearemos reglas fiscales en el núcleo.
- No competiremos con SAP Enterprise desde la V1.
- No sacrificaremos mantenibilidad por velocidad de implementación.
- No diseñaremos microservicios antes de tener la tracción que los justifique.
- No convertiremos Atrio en una plataforma todopoderosa — cada producto de ODALX vive por sí solo.

## ¿Por qué alguien elegiría Atrio?

Frente a opciones como Odoo, Alegra, Siigo, Profit o Contasis, Atrio se diferencia por:

1. **Modularidad real** — activa solo lo que necesitas, nada más.
2. **Localización nativa** — no es un plugin, es un pilar de la arquitectura.
3. **Multi-país desde el día uno** — un solo código base sirve a Venezuela, Colombia y más.
4. **Alta densidad** — interfaz pensada para uso intensivo diario, no para demostraciones de venta.
5. **Modernidad técnica** — stack actual (2026) con TypeScript, React 19, NestJS 11, PostgreSQL 16.

## Nuestra tesis

> Las PYMES latinoamericanas merecen un ERP moderno, modular y accesible que entienda su realidad sin pedirles que se adapten a un software extranjero. Y las empresas de software merecen una plataforma que no les exija reescribir el sistema por cada país al que quieran expandirse.
