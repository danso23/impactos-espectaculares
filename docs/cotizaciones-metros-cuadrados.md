# Propuesta: metros cuadrados en cotizaciones

## Objetivo

Agregar soporte para servicios cotizados por metros cuadrados, con un precio base configurable desde backend, y simplificar la captura de la cotizacion quitando las fechas de inicio y fin en la parte de servicios.

## Recomendacion de nombres

- Tabla nueva: `configurations`
- Campo global: `price_per_square_meter`
- Campo en el item de cotizacion: `square_meters`
- Etiqueta UI: `Metros cuadrados`
- Etiqueta UI: `Precio por m2`

## Alcance funcional

- Al agregar un servicio, precargar el valor de `price_per_square_meter` como precio por defecto.
- Permitir que el usuario edite los metros cuadrados y el precio por m2 en cada renglon.
- Calcular el subtotal del servicio con `square_meters * unit_price`.
- Quitar las fechas de inicio y fin del flujo de servicios en la cotizacion.
- Mantener rentas y otros modulos sin cambios hasta confirmar si tambien deben ajustarse.

## Propuesta de modelo de datos

### Nueva tabla `configurations`

Para empezar, una tabla simple con un valor global es suficiente:

- `id`
- `price_per_square_meter` decimal(12,2) not null default 0
- `created_at`
- `updated_at`

Si despues queremos mas configuraciones, esta misma tabla puede evolucionar a un esquema tipo llave/valor.

### Cambios a `quote_items`

Agregar:

- `square_meters` decimal(12,2) nullable default 1

Mantener:

- `unit_price` como precio por m2

## Ajustes en pantalla de cotizacion

- Eliminar las columnas o inputs de `Desde` y `Hasta` en servicios.
- Mostrar `Metros cuadrados` como campo editable.
- Mostrar `Precio por m2` como campo editable.
- Dejar el subtotal visible y recalculado al editar cualquiera de los dos campos.
- Tomar el precio inicial desde la configuracion global.

## Ajustes en backend

- Actualizar validacion de `QuoteController`.
- Actualizar el calculo en `QuoteCalculator`.
- Actualizar el payload y los tipos del frontend.
- Actualizar PDF y vista previa para reflejar el nuevo esquema.
- Crear migracion inicial y un seed con el valor default de `price_per_square_meter`.

## Orden sugerido de implementacion

1. Crear `configurations` con el precio default del m2.
2. Agregar `square_meters` a `quote_items`.
3. Ajustar calculo y validaciones del backend.
4. Cambiar la UI para servicios.
5. Actualizar PDF, preview y tipos.

## Puntos a confirmar

- Si las fechas de inicio y fin desaparecen solo de servicios o de toda la cotizacion.
- Si `configurations` sera una tabla de un solo registro o una tabla extensible tipo llave/valor.
- Si el nombre final del campo debe ser `price_per_square_meter` o prefieren otro equivalente.

## Recomendacion final

La opcion mas limpia para este caso es:

- usar `configurations.price_per_square_meter` como valor global por defecto
- usar `quote_items.square_meters` como cantidad editable del servicio
- mantener `unit_price` como precio por m2
