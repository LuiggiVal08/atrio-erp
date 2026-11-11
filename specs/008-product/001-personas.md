# Personas

> Atrio no tiene "usuarios".
> Tiene personas con trabajos distintos, frustraciones distintas y objetivos distintos.
> Cada decisión de producto debe responder a al menos una de ellas.

---

## Persona 1: Carlos — El Cajero

| Atributo | Detalle |
|----------|---------|
| Edad | 24 años |
| Experiencia | 2 años como cajero en tienda de conveniencia |
| Equipo | Teclado, escáner de código de barras, impresora térmica |
| Turno | 8 horas, 6 días a la semana |

**Objetivos**
- Cobrar rápido para no acumular fila
- Equivocarse lo menos posible (los descuadres le descuentan del salario)
- Poder pausar una venta cuando un cliente no encuentra su dinero
- No tener que llamar al supervisor por cada problema

**Frustraciones**
- Sistemas lentos que hacen esperar al cliente
- Pantallas que cambian solas o pierden la venta
- Tener que usar el mouse para todo (lento, impreciso)
- Mensajes de error que no entiende ("NullPointerException" en pantalla)
- No poder anular una línea sin reiniciar toda la venta

**Lo que valora**
- Que el sistema responda al instante
- Poder hacer todo con el teclado
- Que el cambio se calcule solo
- Poder imprimir comprobante rápido

**Escenario típico**

> Son las 6 PM, hora pico. Llegan 5 personas a la vez. Carlos necesita cobrar una venta de 12 productos en menos de 20 segundos. No puede permitirse errores. No tiene tiempo de buscar productos en menús. Necesita que el sistema sea tan rápido como sus manos.

---

## Persona 2: Marina — La Administradora

| Atributo | Detalle |
|----------|---------|
| Edad | 38 años |
| Experiencia | 10 años administrando pequeñas empresas |
| Equipo | Laptop, monitor externo, celular |
| Uso del sistema | Configuración, reportes, solución de problemas |

**Objetivos**
- Configurar el sistema sin llamar a un técnico
- Ver qué está pasando en el negocio en tiempo real
- Detectar problemas (empleado que no cierra caja, producto sin stock)
- Generar reportes para el dueño

**Frustraciones**
- Tener que entrar a configuración para cambiar cosas simples
- Reportes que requieren combinaciones de teclas crípticas
- No poder ver el estado de todas las cajas desde una sola pantalla
- Que el cajero llame por cada problema que podría resolver solo

**Lo que valora**
- Poder crear usuarios y roles sin leer un manual
- Dashboard con lo esencial: ventas del día, cajas abiertas, productos críticos
- Exportar reportes a Excel

**Escenario típico**

> Son las 9 AM. Marina abre el sistema antes de que lleguen los cajeros. Revisa que todas las cajas estén cerradas del día anterior. Crea un nuevo usuario para el cajero que empieza mañana. Cambia el precio de un producto que llegó con aumento. Todo en menos de 10 minutos.

---

## Persona 3: Don Roberto — El Dueño

| Atributo | Detalle |
|----------|---------|
| Edad | 55 años |
| Experiencia | 30 años dueño de ferretería |
| Equipo | Celular, a veces una tablet |
| Uso del sistema | Consultas rápidas, nunca configura nada |

**Objetivos**
- Saber cuánto vendió hoy sin llamar a nadie
- Saber si un empleado está robando (descuadres, devoluciones sospechosas)
- Entender por qué bajaron las ventas este mes
- No depender de nadie para ver sus números

**Frustraciones**
- Sistemas complicados que requieren "usuario administrador" para todo
- Tener que pedir ayuda para ver una simple cifra
- Gráficos bonitos que no le dicen lo que necesita
- No poder ver las ventas desde su celular

**Lo que valora**
- Una cifra grande: "Ventas de hoy: $12,430"
- Poder ver lo mismo en el celular que en la computadora
- Que el sistema le avise si algo anda mal

**Escenario típico**

> Son las 10 PM. Don Roberto está en su casa y quiere saber cómo le fue hoy. Abre el sistema en el celular. Ve: "Ventas del día: $8,230. 3 cajas cerradas. 0 descuadres." Cierra y se va a dormir tranquilo.

---

## Persona 4: Laura — La Contadora

| Atributo | Detalle |
|----------|---------|
| Edad | 42 años |
| Experiencia | 15 años en despacho contable, 5 clientes como Atrio |
| Equipo | Laptop con Excel siempre abierto |
| Uso del sistema | Cierre de mes, conciliación, reportes fiscales |

**Objetivos**
- Cerrar el mes sin tener que perseguir a nadie por facturas
- Conciliar los movimientos del POS con el banco
- Generar reportes fiscales (IVA, ISLR) sin copiar datos a mano
- Que TODO quede registrado (no puede haber ventas "invisibles")

**Frustraciones**
- Sistemas que permiten borrar facturas (deberían anular, no borrar)
- Reportes que no cuadran porque alguien modificó algo directo en DB
- Tener que esperar al dueño para que le dé acceso a lo que necesita
- Exportaciones que pierden formato o datos

**Lo que valora**
- Que no se pueda eliminar ningún documento, solo anular
- Pista de auditoría completa: quién, cuándo, qué cambió
- Exportación que abra directo en Excel sin ajustes
- IVA calculado automáticamente por período

**Escenario típico**

> Es 1 de febrero. Laura necesita cerrar enero. Abre Atrio, genera el reporte de ventas mensual. Descarga el libro de IVA. Todo cuadra con los totales del banco. Cierra el período y lo firma digitalmente. 20 minutos.

---

## Persona 5: Sergio — El Supervisor de Tienda

| Atributo | Detalle |
|----------|---------|
| Edad | 30 años |
| Experiencia | 5 años en retail, supervisa 3 tiendas |
| Equipo | Tablet, celular |
| Uso del sistema | Monitoreo en tiempo real, autorizaciones, solución de problemas |

**Objetivos**
- Saber si todas las cajas están operando sin tener que ir a cada tienda
- Autorizar devoluciones o descuentos grandes sin estar físicamente presente
- Detectar empleados con bajo rendimiento (ventas lentas, muchas anulaciones)
- Resolver problemas de cajeros de forma remota

**Frustraciones**
- Tener que ir a la tienda para autorizar cosas simples
- No poder ver el estado de las cajas en tiempo real
- Que los cajeros no usen los shortcuts y pierdan tiempo
- No tener métricas para evaluar desempeño

**Lo que valora**
- Dashboard en tiempo real: cajas abiertas, ventas por hora, alertas
- Poder forzar cierre de caja desde su dispositivo
- Reporte de velocidad por cajero

**Escenario típico**

> Sergio está en la tienda 2 cuando le llega una notificación: "Cajero bloqueado en Tienda 1 — descuadre > $50." Abre la tablet, revisa el detalle: un pago en efectivo donde el cajero registró $500 pero el conteo da $540. Autoriza el ajuste de 40 centésimos. 2 minutos, nunca tuvo que moverse.
