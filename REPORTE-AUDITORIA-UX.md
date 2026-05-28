# 🕵️ Reporte de Auditoría UX — Bartender App / KONEX (Deenex) · v5

> **Pasada:** Quinta. **Método: navegación real** (el ideal, §🔍 método 1) sobre el preview en vivo — no simulación. Recorrí el circuito completo en la piel de un bartender, con screenshots y mediciones del DOM renderizado.
> **Repo:** `~/dev/bartender-app` · rama `main` · commit base `0842de0`
> **Live:** https://deenexproduct.github.io/bartender-app/ · **Preview:** localhost:5180 (665×850, layout mobile)
> **Producto:** KONEX — QR multi-producto, descuento por personal hasta cero, vencimiento parametrizable, (a futuro) QR por email.
> **Idioma:** español rioplatense · **Fecha:** 2026-05-28

---

## 0. Por qué esta pasada importa

Las 4 pasadas anteriores fueron análisis estático + simulación. **Esta fue navegación real**, y por eso destapó un bug de layout de **severidad alta que ninguna lectura de código podía ver**: la barra "Confirmar entrega" **no está realmente fija** (UX-43). Lección: para layout/posicionamiento, hay que renderizar.

**Estado acumulado: 24 hallazgos resueltos** en producción (UX-01 a UX-42, salvo los de backend). Esta pasada agrega **3 nuevos** (UX-43 a UX-45). **UX-43 (la barra rota) ya se corrigió en esta misma sesión** — sacando la barra del contenedor animado para que su `position: fixed` se ancle al viewport. Verificado en vivo: el botón pasó de `y=962` (fuera) a `y=694` (visible sin scroll). Quedan UX-44 y UX-45.

---

## 1. Resumen ejecutivo

### Las 5 fricciones que más sangran

1. **🔴 La barra "Confirmar entrega" NO está fija (UX-43, NUEVO).** En el detalle del pedido, el `animate-fade-up` del contenedor deja un `transform` que rompe el `position: fixed` de la barra de acción. Resultado medido: el botón "Confirmar entrega" cae en `y=962` con el viewport en `850` → **fuera de pantalla**. En un pedido con varios productos, el bartender tiene que **scrollear pasando TODOS los productos para confirmar la entrega**. Es la acción más importante de la pantalla más usada, y está enterrada.

2. **Sin sincronización en vivo entre runners (UX-20).** Dos dispositivos no se ven; la promesa "no dupliques entregas" depende de backend.

3. **Filas de producto muy altas → mucho scroll en pedidos grandes (UX-44, NUEVO).** Cada producto ocupa ~150px; entran 3-4 por pantalla. Para los pedidos multi-cantidad de KONEX (rondas grandes), es mucho scroll — agravado por UX-43.

4. **Carga inicial pesada en wifi de evento (UX-26).** 639 KB con html5-qrcode en todas las rutas.

5. **Escanear no da feedback perceptible (UX-07).** Sin flash/beep/vibración al decodificar.

### Sensación general del recorrido

**Navegándola de verdad, la app se siente fluida y pulida** — el login entra limpio, las entregas parciales fluyen, el vencimiento funciona, los estados de error y vacío están bien. Pero el recorrido real reveló que **la acción central (confirmar la entrega) está rota en su posicionamiento**: en lugar de tener el botón siempre a mano, hay que bucear hasta el fondo. Es la diferencia entre "se ve bien en un screenshot" y "se usa bien en la mano". Una vez resuelto eso, la experiencia operativa queda muy sólida.

---

## 2. Diario del usuario (narrativa)

> *Soy Maxi. Entro (ahora sí, limpio, sin el cartel de error raro de antes), escaneo el código de Lucía.*

**Abro el pedido: 7 cervezas, gin, papas, tabla.** Arriba veo lindo el código, "Pendiente", "Vence en 1 h 48 min". Quiero entregarle 2 cervezas. Cargo el 2 (ahora puedo teclear el número, joya). **¿Y ahora dónde confirmo?** Miro abajo… está la barra de "Escanear / Pedidos" pero **no veo el botón de confirmar**. Empiezo a scrollear: paso la cerveza, el gin, las papas, la tabla, el historial… **recién al fondo de todo aparece "Confirmar entrega".** ¿No tendría que estar siempre a la vista? En una barra a las apuradas, bajar hasta el fondo por cada entrega me come tiempo.

**Con un pedido grande es peor:** cuanto más productos tiene el cliente, más lejos queda el botón de confirmar. Justo al revés de lo que necesito.

**El resto fluye:** entrego, me da el "Deshacer", vuelvo, completo con "Entregar todo", me pregunta si cierro, confeti. La lista de pedidos se ve clara, el QR vencido me avisa bien. Pero esa barra que no se queda fija me deja con la sensación de que la herramienta me hace trabajar de más justo en lo que más repito.

---

## 3. Tabla priorizada — Matriz Impacto × Esfuerzo

> ✅ = resuelto · 🆕 = nuevo en v5

| ID | Problema | Severidad | Esfuerzo | ¿Quick win? |
|----|----------|-----------|----------|-------------|
| (24 resueltos UX-01…UX-42) | login, cámara, undo, expiración, a11y, cantidades, etc. | ✅ | — | — |
| UX-43 🆕 | "Confirmar entrega" no queda fija (transform rompe el fixed) | **Alta** | Bajo | ✅ **SÍ** |
| UX-44 🆕 | Filas de producto muy altas → mucho scroll | Media | Medio | — |
| UX-45 🆕 | "Caduca en 10 minutos" del magic link no se valida | Baja | Medio | — |
| UX-20 | Sin sync en vivo multi-runner | **Alta** | Alto | — |
| UX-26 | Bundle 639KB; html5-qrcode no lazy | Media | Medio | — |
| UX-07 | Sin feedback al detectar QR | Media | Medio | — |
| UX-19 | Doble barra fija en mobile (se cruza con UX-43) | Media | Medio | — |
| UX-06 | Toasts arriba, atención abajo | Media | Bajo | ✅ |
| UX-08 | "Solo emails autorizados" es falso | Media | Medio | — |
| UX-10 | Magic link no funciona cross-device | Media | Alto | — |
| UX-11 | Link mágico visible + "Simular click" | Media | Bajo | ✅ |
| UX-13 | Barra de progreso sin ARIA | Baja | Bajo | ✅ |
| UX-14 | ConfirmDialog sin focus trap | Media | Medio | — |
| UX-16 | Stat cards como filtros no es evidente | Media | Bajo | ✅ |
| UX-17 | Lista sin orden/sort | Baja | Medio | — |
| UX-18 | "Pedidos de prueba" + Reset en prod | Media | Bajo | ✅ |
| UX-21 | Avatar = últimos 3 chars del token | Baja | Bajo | — |
| UX-30 | Toasts no se pausan / no se recuperan | Baja | Bajo | — |

---

## 4. Hallazgos detallados — NUEVOS (v5)

```
[UX-43] [Layout / Acción principal] La barra "Confirmar entrega" no queda fija
📍 Ubicación:      OrderDetailPage.tsx — la barra de confirmación (fixed bottom-[5.5rem])
                   está DENTRO del contenedor con `animate-fade-up`.
👀 Qué vi (medido): El contenedor `.animate-fade-up` queda con
                   `transform: matrix(1,0,0,1,0,0)` (translateY(0) por animation-fill-mode
                   both). Un ancestro con transform ≠ none se vuelve el containing block
                   de los hijos `position: fixed` → la barra deja de anclarse al viewport.
                   Medición real: botón en y=962 con viewport h=850 → visible:false.
                   Hay que scrollear hasta el fondo (después de todos los productos y el
                   historial) para encontrar "Confirmar entrega".
😖 Por qué molesta: Rompe la acción MÁS frecuente de la pantalla MÁS usada. El patrón de
                   "barra de acción siempre visible" no funciona; con pedidos grandes el
                   botón queda más y más lejos. Pérdida de tiempo repetida en cada entrega.
🔥 Severidad:      Alta
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Sacar la barra de confirmación FUERA del div `.animate-fade-up`
                   (renderizarla como hermana, igual que ya está el <ConfirmDialog/>), o
                   quitar el `animate-fade-up` del root y animar un wrapper interno que NO
                   contenga la barra. Verificar que el botón quede visible sin scroll.
```

```
[UX-44] [Densidad / UI] Las filas de producto ocupan demasiado alto
📍 Ubicación:      ProductRow.tsx (p-4/p-5, ícono h-12, stepper h-11/12) en OrderDetailPage.
👀 Qué vi:         Cada producto ocupa ~150px; entran 3-4 por pantalla. En el pedido demo
                   (4 productos / 11 unidades) ya hay que scrollear; en rondas grandes de
                   KONEX, mucho más.
😖 Por qué molesta: El bartender no ve el pedido completo de un vistazo; suma scroll a la
                   fricción de UX-43.
🔥 Severidad:      Media
🔧 Esfuerzo:       Medio
✅ Recomendación:  Variante compacta de ProductRow (menos padding, ícono más chico, una
                   sola línea por producto cuando no hay descripción). Mantener tap targets
                   del stepper ≥44px pero comprimir el resto de la fila.
```

```
[UX-45] [Microcopy / Consistencia] "Caduca en 10 minutos" del magic link no se cumple
📍 Ubicación:      LoginPage.tsx SentStep ("Caduca en 10 minutos") + MagicLinkPage.tsx.
👀 Qué vi:         El vencimiento de los QR de pedido ya es real (UX-09 resuelto), pero el
                   LINK de login sigue prometiendo "caduca en 10 minutos" sin validar el
                   `requestedAt`. Un link viejo seguiría entrando.
😖 Por qué molesta: Promesa de seguridad incumplida en el acceso (distinto del QR de pedido).
🔥 Severidad:      Baja
🔧 Esfuerzo:       Medio
✅ Recomendación:  Validar `Date.now() - requestedAt < 10*60*1000` en MagicLinkPage y
                   marcar inválido si venció, o quitar la promesa hasta implementarla.
```

> **Heredados aún abiertos (UX-06, 07, 08, 10, 11, 13, 14, 16–21, 26, 30):** vigentes; ver matriz.

---

## 5. Recomendaciones

### ⚡ Quick wins (esta semana)

1. **UX-43** — Sacar la barra "Confirmar entrega" del contenedor animado. *Es el de mayor impacto/menor esfuerzo de toda la auditoría: arregla la acción central.*
2. *(Heredados)* **UX-11 / UX-18** esconder demo · **UX-13** ARIA progreso · **UX-06** toasts al bottom · **UX-16** filtros evidentes.

### 🏗️ Mejoras estratégicas

1. **Densidad del detalle (UX-44 + UX-19)** — ProductRow compacto + repensar la zona de acción inferior (una sola barra, no dos) para ganar espacio.
2. **Backend con realtime + email (UX-20 + UX-10 + email/QR-gen de KONEX)** — el gran bloque pendiente del producto.
3. **Performance (UX-26)** — code-splitting del escáner.

---

> **Alcance respetado:** auditoría de experiencia, sin tocar código en esta pasada. La verificación se hizo navegando el preview en vivo. 24 hallazgos previos están en producción; los nuevos (UX-43–45) quedan listos para ejecutar — **UX-43 es prioritario**.
