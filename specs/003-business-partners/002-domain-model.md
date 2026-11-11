# Domain Model — Business Partners

> Modelo de dominio del Bounded Context Business Partners.
> Define las entidades, value objects y agregados que gobiernan la gestión de terceros.

---

## Agregado raíz: `Partner`

```text
Partner (Aggregate Root)
├── id: PartnerId (UUID v7)
├── type: PartnerType [PERSON | COMPANY]
├── legalName: string
├── taxId: TaxId (value object)
├── commercialName?: string
├── website?: string
├── status: PartnerStatus [ACTIVE | INACTIVE | BLOCKED]
├── tags: Tag[] (value object)
├── contacts: Contact[] (entidad hija)
├── addresses: Address[] (entidad hija)
├── roles: PartnerRole[] (entidad hija)
├── metadata: PartnerMetadata (value object)
├── audit: AuditInfo (value object)
└── createdAt, updatedAt, deletedAt
```

### Invariantes

- `legalName` es requerido siempre
- `taxId` es requerido para COMPANY, opcional para PERSON
- Si `deletedAt` no es null, el Partner está desactivado globalmente
- Un Partner debe tener al menos un rol para ser considerado operativo

---

## Value Objects

### `PartnerId`
- UUID v7, generado por la aplicación (no la BD)

### `TaxId`
```text
TaxId
├── value: string          // ej: J-12345678-0
├── country: CountryCode   // ej: VE, CO
└── type: TaxIdType        // RIF, NIT, CI, RUC, etc.
```

### `PartnerType`
```typescript
enum PartnerType {
  PERSON  = 'PERSON',
  COMPANY = 'COMPANY',
}
```

### `PartnerStatus`
```typescript
enum PartnerStatus {
  ACTIVE   = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED  = 'BLOCKED',
}
```

### `PartnerRole`
```typescript
enum PartnerRole {
  CUSTOMER     = 'CUSTOMER',
  SUPPLIER     = 'SUPPLIER',
  PROSPECT     = 'PROSPECT',
  DISTRIBUTOR  = 'DISTRIBUTOR',
  CARRIER      = 'CARRIER',
  MANUFACTURER = 'MANUFACTURER',
  CREDITOR     = 'CREDITOR',
}
```

### `Tag`
```typescript
interface Tag {
  value: string;   // libre, sin jerarquía, sin ID fijo
}
```

### `AuditInfo`
```typescript
interface AuditInfo {
  createdBy: UserId;
  updatedBy: UserId;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### `PartnerMetadata`
```typescript
interface PartnerMetadata {
  source?: string;         // ej: 'import', 'manual', 'web'
  externalId?: string;     // ID en sistema externo
  notes?: string;
}
```

---

## Entidades hijas del agregado

### `Contact`

```text
Contact
├── id: ContactId (UUID v7)
├── partnerId: PartnerId
├── fullName: string
├── position?: string      // cargo
├── email?: Email (value object)
├── phone?: Phone (value object)
├── mobile?: Phone (value object)
├── isPrimary: boolean
├── audit: AuditInfo
└── deletedAt?: DateTime
```

### `Address`

```text
Address
├── id: AddressId (UUID v7)
├── partnerId: PartnerId
├── type: AddressType [FISCAL | SHIPPING | BILLING | PRIMARY | OTHER]
├── line1: string
├── line2?: string
├── city: string
├── state: string
├── country: CountryCode
├── postalCode?: string
├── isPrimary: boolean
├── audit: AuditInfo
└── deletedAt?: DateTime
```

---

## Reglas de negocio

| # | Regla | Justificación |
|---|-------|---------------|
| 1 | Un Partner puede tener 0..n roles simultáneos | Un tercero puede ser cliente y proveedor |
| 2 | Un Partner sin roles está inactivo operativamente pero no se elimina | Preserva historial; reactivable agregando rol |
| 3 | Un Partner no puede tener dos direcciones `PRIMARY` del mismo tipo | Consistencia de domicilio principal |
| 4 | Solo un `Contact` puede ser `isPrimary` por Partner | Facilita comunicación por defecto |
| 5 | Si `type = COMPANY`, `taxId` es obligatorio | Requisito fiscal |
| 6 | Los `tags` no tienen catálogo fijo — el usuario los crea libremente | Flexibilidad sin burocracia |
| 7 | La eliminación es lógica (`deletedAt`) para todos los agregados | Trazabilidad y no pérdida de historial |

---

## Modelo Prisma propuesto

```prisma
enum PartnerType { PERSON COMPANY }
enum PartnerStatus { ACTIVE INACTIVE BLOCKED }
enum PartnerRoleType { CUSTOMER SUPPLIER PROSPECT DISTRIBUTOR CARRIER MANUFACTURER CREDITOR }
enum AddressType { FISCAL SHIPPING BILLING PRIMARY OTHER }

model Partner {
  id             String         @id @default(uuid()) @db.Uuid
  type           PartnerType
  legalName      String         @map("legal_name")
  taxIdValue     String?        @map("tax_id_value")
  taxIdCountry   String?        @map("tax_id_country") @db.Char(2)
  taxIdType      String?        @map("tax_id_type")
  commercialName String?        @map("commercial_name")
  website        String?
  status         PartnerStatus  @default(ACTIVE)
  metadataSource String?        @map("metadata_source")
  metadataNotes  String?        @map("metadata_notes")
  externalId     String?        @map("external_id")
  createdById    String         @map("created_by_id") @db.Uuid
  updatedById    String         @map("updated_by_id") @db.Uuid
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")
  deletedAt      DateTime?      @map("deleted_at")

  contacts   Contact[]
  addresses  Address[]
  roles      PartnerRole[]
  tags       PartnerTag[]
  createdBy  User    @relation("PartnerCreatedBy", fields: [createdById], references: [id])
  updatedBy  User    @relation("PartnerUpdatedBy", fields: [updatedById], references: [id])

  @@map("partners")
}

model PartnerRole {
  partnerId String         @map("partner_id") @db.Uuid
  role      PartnerRoleType
  assignedAt DateTime      @default(now()) @map("assigned_at")
  partner   Partner        @relation(fields: [partnerId], references: [id], onDelete: Cascade)

  @@id([partnerId, role])
  @@map("partner_roles")
}

model PartnerTag {
  partnerId String   @map("partner_id") @db.Uuid
  value     String
  partner   Partner  @relation(fields: [partnerId], references: [id], onDelete: Cascade)

  @@id([partnerId, value])
  @@map("partner_tags")
}

model Contact {
  id         String    @id @default(uuid()) @db.Uuid
  partnerId  String    @map("partner_id") @db.Uuid
  fullName   String    @map("full_name")
  position   String?
  email      String?
  phone      String?
  mobile     String?
  isPrimary  Boolean   @default(false) @map("is_primary")
  createdById String   @map("created_by_id") @db.Uuid
  updatedById String   @map("updated_by_id") @db.Uuid
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")
  deletedAt  DateTime? @map("deleted_at")

  partner   Partner @relation(fields: [partnerId], references: [id], onDelete: Cascade)
  createdBy User    @relation("ContactCreatedBy", fields: [createdById], references: [id])
  updatedBy User    @relation("ContactUpdatedBy", fields: [updatedById], references: [id])

  @@map("contacts")
}

model Address {
  id         String      @id @default(uuid()) @db.Uuid
  partnerId  String      @map("partner_id") @db.Uuid
  type       AddressType
  line1      String
  line2      String?
  city       String
  state      String
  country    String      @db.Char(2)
  postalCode String?     @map("postal_code")
  isPrimary  Boolean     @default(false) @map("is_primary")
  createdById String     @map("created_by_id") @db.Uuid
  updatedById String     @map("updated_by_id") @db.Uuid
  createdAt  DateTime    @default(now()) @map("created_at")
  updatedAt  DateTime    @updatedAt @map("updated_at")
  deletedAt  DateTime?   @map("deleted_at")

  partner   Partner @relation(fields: [partnerId], references: [id], onDelete: Cascade)
  createdBy User    @relation("AddressCreatedBy", fields: [createdById], references: [id])
  updatedBy User    @relation("AddressUpdatedBy", fields: [updatedById], references: [id])

  @@map("addresses")
}
```
