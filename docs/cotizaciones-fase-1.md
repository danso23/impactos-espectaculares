# Cotizaciones Fase 1

## Objetivo

Convertir el flujo actual de cotización en un módulo persistente y auditable que soporte:

- descuento porcentual aplicado solo a rentas
- exclusión de servicios del descuento
- selección de empresa emisora
- selección de hoja membretada
- condiciones por empresa y override por cotización
- guardado completo con historial y re-descarga
- agencias con reglas distintas de descuento y comisión

## Estado actual

- El frontend crea la cotización solo en memoria y descarga el PDF localmente.
- No existe API de cotizaciones expuesta en rutas.
- La base ya tiene `quotes`, `quote_items`, `quote_status` y `quote_status_history`.
- `quotes` hoy depende de `leads`, mientras que el módulo operativo existente usa `clientes`.

## Decisiones de Fase 1

1. La cotización será una entidad persistente en backend y el backend será la fuente de verdad de cálculos.
2. La cotización podrá apuntar a un `lead` o a un `cliente` legado.
3. Cada renglón de cotización tendrá un tipo explícito: `rental` o `service`.
4. Las reglas de agencia se copiarán a snapshot al guardar la cotización.
5. El PDF se considerará un artefacto versionado de la cotización y se guardará con ruta pública.
6. La aceptación de cotización hacia renta real queda fuera de Fase 1, pero el modelo quedará listo para ello.

## Modelo de datos

### Nuevas tablas

#### `companies`

Catálogo de empresas emisoras.

- `id`
- `key` string unique
- `name` string
- `legal_name` string
- `rfc` string nullable
- `tax_regime` string nullable
- `address_line` string nullable
- `neighborhood` string nullable
- `city` string nullable
- `state` string nullable
- `postal_code` string nullable
- `country` string default `MX`
- `phone` string nullable
- `email` string nullable
- `website` string nullable
- `logo_path` string nullable
- `default_terms_html` text nullable
- `is_active` boolean default true
- timestamps

#### `company_letterheads`

Plantillas o variantes de hoja membretada por empresa.

- `id`
- `company_id` fk
- `name` string
- `code` string nullable
- `description` string nullable
- `template_key` string
- `header_image_path` string nullable
- `footer_image_path` string nullable
- `watermark_image_path` string nullable
- `primary_color` string nullable
- `secondary_color` string nullable
- `is_default` boolean default false
- `is_active` boolean default true
- timestamps

#### `agencies`

Reglas comerciales para agencias o intermediarios.

- `id`
- `name` string
- `legal_name` string nullable
- `contact_name` string nullable
- `email` string nullable
- `phone` string nullable
- `discount_type` enum `none|percent|fixed`
- `discount_value` decimal(12,2) default 0
- `discount_applies_to` enum `rentals_only|all_items`
- `commission_type` enum `none|percent|fixed`
- `commission_value` decimal(12,2) default 0
- `commission_applies_to` enum `rentals_only|subtotal_after_discount`
- `notes` text nullable
- `is_active` boolean default true
- timestamps

#### `services`

Catálogo de conceptos de servicio.

- `id`
- `key` string unique
- `name` string
- `description` string nullable
- `base_price` decimal(12,2) default 0
- `tax_rate` decimal(5,2) default 16.00
- `is_active` boolean default true
- timestamps

### Cambios a tablas existentes

#### `quotes`

Agregar:

- `customer_type` enum `lead|cliente`
- `customer_id` unsignedBigInteger
- `agency_id` unsignedBigInteger nullable
- `issuer_company_id` unsignedBigInteger
- `letterhead_id` unsignedBigInteger nullable
- `version` unsignedInteger default 1
- `includes_tax` boolean default true
- `tax_rate` decimal(5,2) default 16.00
- `rentals_subtotal` decimal(12,2) default 0
- `services_subtotal` decimal(12,2) default 0
- `discount_type` enum `none|percent|fixed` default `none`
- `discount_value` decimal(12,2) default 0
- `discount_amount` decimal(12,2) default 0
- `commission_type` enum `none|percent|fixed` default `none`
- `commission_value` decimal(12,2) default 0
- `commission_amount` decimal(12,2) default 0
- `terms_html` longText nullable
- `pdf_path` string nullable
- `pdf_generated_at` timestamp nullable
- `snapshot_json` json nullable

Mantener:

- `lead_id` solo para migración o compatibilidad temporal

Resultado esperado:

- en una migración posterior, `lead_id` debe quedar obsoleto y la app debe usar `customer_type` + `customer_id`

#### `quote_items`

Cambio propuesto:

- `space_id` nullable
- `service_id` unsignedBigInteger nullable
- `item_type` enum `rental|service`
- `concept` string
- `description` text nullable
- `sort_order` unsignedInteger default 0
- `discount_applies` boolean default true
- `tax_rate` decimal(5,2) default 16.00
- `tax_amount` decimal(12,2) default 0
- `total` decimal(12,2) default 0

Reglas:

- si `item_type = rental`, `space_id` es requerido y `service_id` es null
- si `item_type = service`, `service_id` puede ser null si el concepto es libre
- en servicios, `discount_applies` normalmente será false

#### `quote_status_history`

Ya existe y sirve. Solo definimos convención para `meta`:

- `meta.snapshot_version`
- `meta.totals`
- `meta.changed_fields`
- `meta.pdf_path`

## Relaciones de negocio

### Cliente cotizable

Para evitar bloquear Fase 1 por la coexistencia `leads` y `clientes`, la cotización manejará:

- `customer_type = lead` con id en tabla `leads`
- `customer_type = cliente` con id en tabla `clientes`

El API devolverá además un `customer_snapshot` con nombre, negocio, RFC, email y teléfono para no depender del registro vivo al reimprimir históricos.

### Agencia

Una cotización puede no tener agencia.

Si tiene agencia:

- la agencia propone descuento y comisión por defecto
- el usuario puede ajustarlos en la cotización
- al guardar, los valores efectivos se copian a la cotización y al snapshot

## Reglas de cálculo

### Subtotales

- `rentals_subtotal` = suma de items `rental`
- `services_subtotal` = suma de items `service`
- `subtotal` = `rentals_subtotal + services_subtotal`

### Descuento

- Si `discount_type = percent`, el descuento se calcula solo sobre `rentals_subtotal`
- Si `discount_type = fixed`, por defecto también se descuenta de `rentals_subtotal`
- Ningún servicio participa en descuento salvo que en futuro se habilite una regla explícita

Fórmula base:

- `discount_base = sum(item.subtotal where discount_applies = true)`
- `discount_amount = percent ? discount_base * discount_value / 100 : min(discount_value, discount_base)`

### Comisión de agencia

Fase 1 la deja como dato comercial visible y persistido, no suma al total del cliente salvo que negocio lo confirme.

Se calculan y guardan:

- `commission_base`
- `commission_amount`

Base sugerida:

- `rentals_subtotal - discount_amount`

### IVA

- IVA se calcula después del descuento
- IVA aplica por renglón
- `tax_amount` por item = `(item.subtotal - item.discount_allocated) * tax_rate`
- `tax` en cotización = suma de `tax_amount`

### Total

- `total = subtotal - discount_amount + tax`

## API propuesta

Prefijo: `/api`

### Catálogos

#### `GET /quote-catalogs`

Devuelve catálogos necesarios para la pantalla:

- companies
- letterheads
- agencies
- services
- quote_status

#### `GET /customers/search?q=...&type=lead|cliente`

Búsqueda para selector de cliente.

Respuesta:

```json
{
  "data": [
    {
      "type": "lead",
      "id": 12,
      "display_name": "Comercializadora ABC",
      "contact_name": "Juan Perez",
      "email": "ventas@abc.com",
      "phone": "9991234567",
      "rfc": "ABC123456789"
    }
  ]
}
```

### Cotizaciones

#### `GET /quotes`

Listado paginado con filtros:

- `status`
- `customer_type`
- `customer_id`
- `agency_id`
- `issuer_company_id`
- `folio`
- `date_from`
- `date_to`
- `q`

#### `GET /quotes/{id}`

Detalle completo para edición, consulta o reimpresión.

#### `POST /quotes`

Crea la cotización y opcionalmente genera PDF.

Payload propuesto:

```json
{
  "customer": {
    "type": "lead",
    "id": 15
  },
  "issuer_company_id": 1,
  "letterhead_id": 2,
  "agency_id": 3,
  "valid_until": "2026-04-30",
  "includes_tax": true,
  "tax_rate": 16,
  "discount": {
    "type": "percent",
    "value": 10
  },
  "commission": {
    "type": "percent",
    "value": 12
  },
  "terms_html": "<p>Pago 50% anticipo...</p>",
  "notes": "Cotizacion para campaña abril",
  "items": [
    {
      "item_type": "rental",
      "space_id": 44,
      "concept": "Espectacular Av. Colon",
      "start_date": "2026-04-01",
      "end_date": "2026-04-30",
      "qty": 1,
      "unit_price": 18000,
      "faces": 2,
      "discount_applies": true
    },
    {
      "item_type": "service",
      "service_id": 2,
      "concept": "Instalacion",
      "qty": 1,
      "unit_price": 1500,
      "discount_applies": false
    }
  ],
  "generate_pdf": true
}
```

Respuesta:

```json
{
  "data": {
    "id": 101,
    "folio": "COT-2026-00101",
    "status": "draft",
    "pdf_url": "/storage/quotes/COT-2026-00101-v1.pdf",
    "totals": {
      "rentals_subtotal": 18000,
      "services_subtotal": 1500,
      "subtotal": 19500,
      "discount_amount": 1800,
      "tax": 2832,
      "total": 20532
    }
  }
}
```

#### `PUT /quotes/{id}`

Actualiza cotización en borrador.

Reglas:

- solo editable en `draft`
- si cambia estructura comercial, incrementa `version`
- si `generate_pdf = true`, reemplaza `pdf_path` por nueva versión

#### `POST /quotes/{id}/status`

Cambia estatus.

Payload:

```json
{
  "to_status": "sent",
  "reason": "Enviada por correo",
  "notes": "Se comparte version final con membrete corporativo"
}
```

#### `POST /quotes/{id}/regenerate-pdf`

Regenera PDF de la versión actual.

#### `GET /quotes/{id}/download`

Devuelve o redirige al PDF guardado.

#### `GET /quotes/{id}/history`

Devuelve historial de cambios de estatus y eventos importantes.

### Validación previa opcional

#### `POST /quotes/preview`

Calcula totales sin guardar. Útil para recalcular en frontend.

Payload igual a `POST /quotes`.

## Reglas de backend

### Servicio de dominio sugerido

Crear un servicio tipo `QuoteCalculator` responsable de:

- validar reglas por item
- separar rentas y servicios
- aplicar descuento
- prorratear descuento a items descontables
- calcular IVA por item
- calcular comisión
- devolver snapshot de totales

Crear `QuotePdfBuilder` responsable de:

- tomar snapshot de cotización
- aplicar membrete y empresa
- devolver archivo PDF y nombre final

### Estados

Usar los ya sembrados:

- `draft`
- `sent`
- `accepted`
- `rejected`
- `expired`
- `cancelled`

### Historial mínimo

Registrar en `quote_status_history` al menos:

- creación inicial
- cambio de estatus
- regeneración de PDF
- incremento de versión

## UI propuesta

### Pantalla `Nueva cotización`

Bloques:

1. Cliente
2. Empresa emisora
3. Hoja membretada
4. Agencia
5. Vigencia
6. Items de renta
7. Items de servicio
8. Condiciones
9. Resumen comercial

### Comportamiento

- Los espacios seleccionados desde `Espacios` entran precargados como `rental`
- Los servicios se agregan desde catálogo o concepto libre
- Al elegir agencia se precargan descuento y comisión
- Al cambiar empresa se precargan condiciones y membrete por default
- El resumen muestra:
  - subtotal rentas
  - subtotal servicios
  - descuento sobre rentas
  - IVA
  - total
  - comisión de agencia como dato informativo

### Pantalla `Cotizaciones`

Listado con:

- folio
- cliente
- empresa emisora
- agencia
- estatus
- total
- fecha de creación
- acciones: ver, editar, descargar PDF, cambiar estatus

## Plan de implementación

### Backend

1. Migraciones para catálogos y ampliación de `quotes` y `quote_items`
2. Modelos Eloquent nuevos
3. `QuoteController`
4. `QuoteCalculator`
5. `QuotePdfBuilder`
6. Rutas y validaciones
7. Seeders para estados, empresas, membretes y servicios base

### Frontend

1. Tipos TS para quote, quote item, catalogs y customer search
2. `quoteService.ts`
3. hooks React Query para catalogs, search, create, update, list y detail
4. refactor de `quoteCreatePage.tsx`
5. nueva página de listado `quotesPage.tsx`
6. descarga desde URL persistida, no solo blob local

## Riesgos a cuidar

- coexistencia de `leads` y `clientes`
- prorrateo correcto del descuento para cálculo de IVA
- congelar snapshot para históricos y re-descarga
- no mezclar comisión de agencia con total al cliente sin validación de negocio
- migrar `quote_items.space_id` a nullable sin romper datos ya sembrados

## Dudas de negocio que conviene cerrar antes de codificar

1. La comisión de agencia, ¿solo se informa o también altera el total facturable?
2. El descuento fijo, ¿siempre aplica solo a rentas igual que el porcentual?
3. ¿Una cotización puede tener más de una empresa emisora o siempre exactamente una?
4. ¿Se necesita conservar todas las versiones PDF o solo la vigente?
5. ¿La aceptación de cotización debe crear renta automáticamente en Fase 2?

## Recomendación de arranque

Si vamos a empezar a construir ya, el primer corte más seguro es:

1. migraciones
2. catálogos
3. `POST /quotes/preview`
4. `POST /quotes`
5. refactor de la pantalla de nueva cotización

Con ese corte ya resolvemos el núcleo delicado del negocio sin esperar el listado completo.
