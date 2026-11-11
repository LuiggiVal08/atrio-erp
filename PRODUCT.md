# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary product priority is the cashier/POS experience. Atrio also serves administrators, owners, accountants, and store supervisors:

- Carlos, the cashier: completes fast, low-error sales with keyboard and scanner hardware, often during peak traffic.
- Marina, the administrator: configures the system and monitors daily operational health.
- Don Roberto, the owner: reviews sales and exceptions from phone or tablet without configuration work.
- Laura, the accountant: reconciliates documents, taxes, and monthly periods.
- Sergio, the store supervisor: monitors stores, authorizes exceptions, and resolves operational problems remotely.

## Product Purpose

Atrio is a modular ERP for small and medium-sized Latin American businesses. It reduces operational complexity by helping operators complete work with fewer steps, fewer errors, and less cognitive load.

Success means operators can work quickly and reliably in high-frequency workflows, administrators can configure and monitor the business without technical assistance, and owners and accountants can inspect clear operational and fiscal evidence.

## Positioning

Atrio is a modern, configurable, high-density ERP for Latinoamerican SMEs. It combines real modularity, native localization, and multi-country rules in one codebase without becoming a low-code platform, a generic all-in-one suite, or a collection of customer-specific forks.

## Operating Context

- Cashiers operate from point-of-sale terminals with keyboards, barcode scanners, thermal printers, and peak-hour time pressure.
- Administrators use laptops with external monitors for configuration, reporting, and troubleshooting.
- Owners, supervisors, and accountants use phones, tablets, or laptops for monitoring and reconciliation.
- Current operational areas include POS and sales, inventory, purchasing, cash and payments, reports, payroll, users and RBAC, settings, localization, and business partners.
- Atrio runs as a configurable multi-tenant web application and supports Spanish and English interfaces.

## Capabilities and Constraints

- Existing implementation: React 19, TypeScript, Vite 6, and Tailwind CSS 4 in the web application.
- API implementation: NestJS 11, TypeScript, PostgreSQL 16, and Prisma.
- The application uses a modular monolith with independently separated bounded contexts.
- Modules communicate through APIs and events rather than direct cross-module coupling.
- The web application supports module activation, role-based permissions, multi-currency behavior, soft deletion, audit trails, and keyboard-first POS workflows.
- Atrio prioritizes simplicity, speed, configuration, localization, keyboard-first operation, and evidence-based backlog changes.
- Product flows should use configuration rather than customer-specific source-code customization.
- High-frequency operations must remain fast; the written product charter requires flows over 30 seconds to be redesigned.

## Brand Commitments

- Atrio is part of the ODALX product ecosystem; the parent brand does not make the products operationally dependent on each other.
- Existing application copy is available in Spanish and English.
- Preserve evidence-based product terminology already used in specs and the operational product charter.

## Evidence on Hand

- Product charter and vision: `specs/000-product-charter.md`, `specs/P-1-product-design/001-product-vision.md`
- Personas and operating scenarios: `specs/008-product/001-personas.md`
- Product principles: `specs/P-1-product-design/002-product-principles.md`
- POS journeys and accessibility requirements: `specs/007-pos-experience/`
- Usability observations and debt: `specs/009-usability/`
- Implemented web routes and modules: `apps/web/src/routes/AppRoutes.tsx`
- Implemented React web application: `apps/web/src/`
- Implemented NestJS API modules: `apps/api/src/`

The repository contains illustrative landing-page content and real product specs. Future visual work must not present speculative metrics, customers, testimonials, pricing, or deployment claims as real evidence.

## Product Principles

1. Optimize the cashier/POS experience first, because speed and accuracy in peak-hour sales are the strongest product priority.
2. Prefer fewer steps and familiar operational patterns over decorative complexity.
3. Resolve differences through configuration, localization, and modules rather than code forks.
4. Make important operations auditable, reversible, and recoverable without destructive deletion.
5. Use evidence and explicit product constraints to decide what deserves to be built.

## Accessibility & Inclusion

- Keyboard-first operation is a core product requirement, including POS workflows and shortcuts.
- Interfaces must preserve usability across desktop, tablet, and mobile contexts documented by the personas.
- Errors should be understandable to operators and should not expose implementation details.
