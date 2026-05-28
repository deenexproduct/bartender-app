# 🕵️ Reporte de Auditoría UX — Bartender App / KONEX (Deenex) · v4

> **Pasada:** Cuarta. Foco: auditar lo construido desde la v3 — el **vencimiento de QR parametrizable** recién hecho — y la mecánica de **cantidades grandes** que es central a KONEX y que ninguna pasada previa había mirado a fondo.
> **Método:** Análisis estático + simulación de flujos sobre el código actual.
> **Repo:** `~/dev/bartender-app` · rama `main` · commit base `8e3a1c0`
> **Producto:** KONEX — QR único multi-producto, el personal descuenta cantidades hasta cero; vencimiento parametrizable; (a futuro) QR por email.
> **Stack:** React 19 + Vite 7 + Tailwind 4 + React Router 7 (HashRouter) + vite-plugin-pwa + html5-qrcode
> **Live:** https://deenexproduct.github.io/bartender-app/
> **Idioma del producto:** español rioplatense
> **Fecha:** 2026-05-28

---

## 0. Estado acumulado (verificado en código)

**18 hallazgos resueltos y en producción** a lo largo de 4 pasadas:

| Tanda | Resueltos |
|---|---|
| v1 | UX-01 cámara · UX-03 volver · UX-05 copy offline · UX-12 confirm seguro |
| v2 | UX-24 íconos PWA · UX-25 zoom · UX-27 contador · UX-28 meta · UX-29 autoFocus |
| Estratégicos | UX-02 undo · UX-04 selección persistente |
| v3 a11y | UX-31 contraste · UX-32 placeholders · UX-33 reduced-motion · UX-34 stepper aria · UX-35 search clear · UX-36 cámara label |
| KONEX | **UX-09** vencimiento parametrizable (era stub → ahora real) |

Esta pasada agrega **4 hallazgos nuevos** (UX-37 a UX-40), surgidos del feature de vencimiento y de la mecánica de cantidades de KONEX.

---

## 1. Resumen ejecutivo

### Las 5 fricciones que más sangran (estado actual)

1. **Sin sincronización en vivo entre runners (UX-20).** Sigue siendo el gran gap: dos dispositivos no se ven. La promesa "no dupliques entregas" depende de esto. Necesita backend.

2. **El stepper es lento para cantidades grandes (UX-39, NUEVO).** KONEX es justamente multi-cantidad ("piden 7 cervezas… escanean 2, después 3"). Si un cliente quiere retirar 11 de 20, hay que tocar **+** once veces. No hay ingreso numérico directo. La mecánica central del producto tiene fricción cuando los números crecen.

3. **Cambiar el vencimiento es global y retroactivo (UX-38, NUEVO).** La ventana de expiración es un setting global que se aplica hacia atrás: pasar de "2 h" a "30 min" a mitad de servicio **vence al instante QRs de clientes que estaban activos**. Riesgo operativo real.

4. **Carga inicial pesada en wifi de evento (UX-26).** 639 KB con `html5-qrcode` en todas las rutas. Primera pantalla lenta en redes saturadas.

5. **Escanear no da feedback perceptible (UX-07).** Sin flash/beep/vibración al decodificar; en un lugar ruidoso no sabés si "agarró".

### Sensación general del recorrido

**La app ya se siente un producto, no una demo.** El bucle central fluye, las acciones sensibles tienen red, es accesible y el vencimiento de QR funciona de verdad y es configurable. Lo que queda es de tres tipos: **(a)** el salto a backend (sync, email, generación de QR), **(b)** afinar la mecánica de cantidades para volúmenes reales de KONEX, y **(c)** madurar el vencimiento de un "toggle global de demo" a una política por pedido. Es sólida y confiable; ahora el techo está en decisiones de producto, no en pulido.

---

## 2. Diario del usuario (narrativa)

> *Soy Maxi. La app ya la siento mía, la uso fluido.*

**Escaneo, entrego, todo rápido.** El vencimiento ahora funciona: si un QR ya pasó su tiempo, me lo marca y no me deja entregar — bien, antes era de mentira.

**Viene un grupo grande:** piden 20 cervezas y se quieren llevar 11 ahora. Toco **+**… +, +, +… *once veces*. Para una cantidad así se hace eterno. O uso "Entregar todo" (pero quieren 11, no 20) o me siento tipeando con el dedo. Para un boliche con rondas grandes, esto me frena.

**El dueño tocó la config de vencimiento** y la bajó a 30 minutos para "apurar la rotación". De golpe, **varios QR de clientes que estaban esperando quedaron vencidos** y me empezaron a reclamar. Nadie avisó que cambiar ese número afecta a los pedidos que ya están dando vueltas.

**Encima esa config está enterrada** en la tarjeta de "Pedidos de prueba", mezclada con los botones de demo y el "Reset". Cuando esto sea producto de verdad y saquen los botones de prueba, ¿dónde va a quedar el vencimiento? Se siente fuera de lugar.

**Un detalle menor:** abrí un pedido que vencía en 1 minuto, me distraje, y cuando volví el cartelito seguía diciendo "Vence en 1 min" — no se actualiza solo. Recién al querer confirmar me saltó "El QR venció".

**Balance:** la mecánica está, el vencimiento está. Lo que me haría la noche más fácil: **cargar cantidades grandes rápido**, que **cambiar el vencimiento no me reviente los pedidos activos**, y que esa config viva en un lugar serio.

---

## 3. Tabla priorizada — Matriz Impacto × Esfuerzo

> ✅ = resuelto · 🆕 = nuevo en v4

| ID | Problema | Severidad | Esfuerzo | ¿Quick win? |
|----|----------|-----------|----------|-------------|
| (18 resueltos v1–v3 + KONEX) | UX-01/02/03/04/05/09/12/24/25/27/28/29/31/32/33/34/35/36 | ✅ | — | — |
| UX-39 🆕 | Stepper lento para cantidades grandes (sin ingreso directo) | Media | Medio | — |
| UX-38 🆕 | Vencimiento global y retroactivo expira QRs activos | Media | Medio | — |
| UX-37 🆕 | Config de vencimiento vive en el panel demo | Media | Bajo | ✅ |
| UX-40 🆕 | "Vence en X" no es countdown en vivo | Baja | Medio | — |
| UX-20 | Sin sync en vivo multi-runner | **Alta** | Alto | — |
| UX-26 | Bundle 639KB; html5-qrcode no lazy | Media | Medio | — |
| UX-07 | Sin feedback al detectar QR | Media | Medio | — |
| UX-19 | Doble barra fija en mobile | Media | Medio | — |
| UX-06 | Toasts arriba, atención abajo | Media | Bajo | ✅ |
| UX-08 | "Solo emails autorizados" es falso | Media | Medio | — |
| UX-10 | Magic link no funciona cross-device | Media | Alto | — |
| UX-11 | Link mágico visible + "Simular click" | Media | Bajo | ✅ |
| UX-13 | Barra de progreso sin ARIA | Baja | Bajo | ✅ |
| UX-14 | ConfirmDialog sin focus trap | Media | Medio | — |
| UX-15 | "Cambiar email"/"Reenviar" tap chicos | Baja | Bajo | ✅ |
| UX-16 | Stat cards como filtros no es evidente | Media | Bajo | ✅ |
| UX-17 | Lista sin orden/sort | Baja | Medio | — |
| UX-18 | "Pedidos de prueba" + Reset en prod | Media | Bajo | ✅ |
| UX-21 | Avatar = últimos 3 chars del token | Baja | Bajo | — |
| UX-22 | Botón de login sin estado de carga | Baja | Bajo | ✅ |
| UX-23 | Confirmación no lista qué se entregó | Baja | Bajo | ✅ |
| UX-30 | Toasts no se pausan / no se recuperan | Baja | Bajo | — |

---

## 4. Hallazgos detallados — NUEVOS (v4)

```
[UX-39] [Fricción / Mecánica central] Cargar cantidades grandes con el stepper es lento
📍 Ubicación:      QuantityStepper.tsx (solo +/-), usado en OrderDetailPage / ProductRow.
👀 Qué vi:         Para retirar 11 de 20 hay que tocar "+" once veces. Solo existe "Entregar
                   todo" (todo el restante) o el incremento de a uno. No hay ingreso directo.
😖 Por qué molesta: KONEX es multi-cantidad por diseño (el ejemplo del cliente son 7 cervezas
                   en tandas). En rondas grandes, el conteo a dedo es tedioso y propenso a
                   error. Es fricción en la acción MÁS frecuente del producto.
🔥 Severidad:      Media
🔧 Esfuerzo:       Medio
✅ Recomendación:  Hacer el número editable (tap → input numérico con teclado numérico
                   inputMode="numeric", clamp a remaining). Opcional: presets rápidos
                   (+5 / la mitad / todo) cuando el restante es alto.
```

```
[UX-38] [Producto / Riesgo operativo] El vencimiento es global y retroactivo
📍 Ubicación:      lib/config.ts (qrExpiryMinutes global) + isOrderExpired (createdAt + ventana).
👀 Qué vi:         La ventana de expiración es un único valor global aplicado a TODOS los
                   pedidos según su createdAt. Bajarla de 2 h a 30 min vence al instante
                   pedidos que ya estaban activos y dando vueltas.
😖 Por qué molesta: Cambiar un ajuste "para adelante" tiene efecto retroactivo invisible:
                   clientes con QR válido quedan vencidos sin aviso. Riesgo de reclamos.
🔥 Severidad:      Media
🔧 Esfuerzo:       Medio
✅ Recomendación:  Fijar `expiresAt` por pedido EN EL MOMENTO de su creación (createdAt +
                   ventana vigente entonces). El setting global pasa a ser el default de los
                   NUEVOS QR, no una regla retroactiva. Si se quiere mantener el toggle de
                   demo, avisar "afecta pedidos existentes" antes de aplicar.
```

```
[UX-37] [Producto / Arquitectura de info] El ajuste de vencimiento vive en el panel de demo
📍 Ubicación:      ScanPage.tsx — selector "Vencimiento del QR" dentro de la tarjeta
                   "Pedidos de prueba" (junto a los tokens de prueba y "Reset").
👀 Qué vi:         Un setting real de producto está mezclado con afordances de demo que,
                   según UX-18, deberían ocultarse en producción. Si se ocultan, el control
                   de vencimiento desaparece con ellos.
😖 Por qué molesta: Mezcla "config seria" con "juguetes de demo"; en prod el operador/admin
                   no tendría dónde configurar el vencimiento.
🔥 Severidad:      Media
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Mover "Vencimiento del QR" a una zona de Ajustes (p. ej. dentro del
                   UserMenu o una pantalla de configuración), separada de los datos de prueba.
```

```
[UX-40] [Feedback] "Vence en X" no se actualiza en vivo
📍 Ubicación:      OrderDetailPage.tsx — chip venceLabel (calculado una vez por render).
👀 Qué vi:         El contador no decrementa solo; un QR puede vencer con el detalle abierto
                   sin que la UI cambie. El "El QR venció" recién aparece al intentar confirmar.
😖 Por qué molesta: El operador puede confiar en un "Vence en 1 min" que ya quedó viejo y
                   sorprenderse al confirmar.
🔥 Severidad:      Baja
🔧 Esfuerzo:       Medio
✅ Recomendación:  Tick cada 30–60 s (setInterval que refresque `now`) para actualizar el
                   chip y, si cruza el umbral, mostrar el estado vencido sin esperar al confirm.
```

> **Hallazgos heredados aún abiertos (UX-06, 07, 08, 10, 11, 13–23, 26, 30):** vigentes con el detalle ya documentado en pasadas anteriores. Ver la matriz.

---

## 5. Recomendaciones

### ⚡ Quick wins (esta semana — alto impacto, bajo esfuerzo)

1. **UX-37** — Mover el ajuste de vencimiento a una zona de Ajustes real (sacarlo del panel demo).
2. *(Heredados de alto valor/bajo costo)* **UX-11 / UX-18** — esconder afordances de demo tras flag · **UX-13** ARIA en progreso · **UX-06** toasts al bottom en mobile · **UX-16** filtros evidentes · **UX-22/23** loading en login + detalle de lo entregado.

### 🏗️ Mejoras estratégicas (rediseño / fondo)

1. **Mecánica de cantidades para volumen (UX-39)** — Número editable + presets. Es la fricción de la acción más usada de KONEX; impacto directo en la velocidad de servicio.
2. **Vencimiento por pedido, no global retroactivo (UX-38 + UX-40)** — `expiresAt` congelado al crear el QR; el setting global como default de nuevos QR; countdown en vivo. Convierte el vencimiento en una política seria.
3. **Backend con realtime + email (UX-20 + UX-10 + email/QR-gen de KONEX)** — Sync multi-runner, magic links cross-device, generación de pedido + QR + envío por correo. Es el gran bloque que falta de KONEX.
4. **Performance (UX-26)** — Code-splitting del escáner para aligerar la carga inicial.

---

> **Alcance respetado:** auditoría de experiencia, no de seguridad. En esta pasada no se modificó código — solo se regeneró el reporte. 18 hallazgos previos están en `main`/`gh-pages`. Los nuevos (UX-37–40) quedan listos para ejecutar cuando se indique.
