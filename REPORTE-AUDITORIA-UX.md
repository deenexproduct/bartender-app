# 🕵️ Reporte de Auditoría UX — Bartender App (Deenex) · v3

> **Pasada:** Tercera. Foco de esta corrida: **accesibilidad medible** (contraste, motion, lectores de pantalla) + edge cases que las pasadas anteriores no cubrieron.
> **Método:** Análisis estático + simulación + medición (ratios de contraste WCAG calculados, manifest/build verificados).
> **Repo:** `~/dev/bartender-app` · rama `main` · commit base `db6e3c7`
> **Stack:** React 19 + Vite 7 + Tailwind 4 + React Router 7 (HashRouter) + vite-plugin-pwa + html5-qrcode
> **Live:** https://deenexproduct.github.io/bartender-app/
> **Idioma del producto:** español rioplatense
> **Fecha:** 2026-05-28

---

## 0. Estado acumulado (verificado en código)

**11 de los 30 hallazgos previos están resueltos y en producción:**

| Resueltos v1 | Resueltos v2 (quick wins) | Resueltos (estratégicos) |
|---|---|---|
| UX-01 cámara se reanuda | UX-24 íconos PWA reales | UX-02 undo en entregas |
| UX-03 "Volver" al origen | UX-25 zoom habilitado | UX-04 selección persistente |
| UX-05 copy offline honesto | UX-27 contador "X de N" | |
| UX-12 confirm seguro | UX-28 meta description | |
| | UX-29 autoFocus desktop | |

Esta pasada detectó **6 hallazgos nuevos** (UX-31 a UX-36) y, a pedido, **se implementaron los 6** en la misma sesión:

| ID | Fix aplicado |
|----|--------------|
| UX-31 | Texto secundario subido de `neutral-400` (3.2–3.6:1) a `neutral-500` (5.0:1, AA ✓) en 12 lugares; íconos decorativos quedan en 400 |
| UX-32 | Placeholder del código manual subido de `neutral-300` (2.2:1) a `neutral-400` |
| UX-33 | `@media (prefers-reduced-motion: reduce)` global en index.css |
| UX-34 | QuantityStepper con `role="group"`, valor `role="status" aria-live`, y aria-labels contextuales (nombre del producto) |
| UX-35 | Oculto el `::-webkit-search-cancel-button` nativo |
| UX-36 | Visor de cámara con `role="img"` + aria-label que ofrece la entrada manual como alternativa |

**Total resuelto: 17 de 36 hallazgos.** El resto del reporte (abajo) queda como registro de detección.

---

## 1. Resumen ejecutivo

### Las 5 fricciones que más sangran (estado actual)

1. **No hay sincronización en vivo entre runners (UX-20).** La promesa "no dupliques entregas" sigue dependiendo de un banner calculado sobre datos mock; dos dispositivos reales no se ven. Es el gap que separa la demo del producto.

2. **Carga inicial pesada en el wifi del local (UX-26).** 639 KB de JS (192 KB gzip) con `html5-qrcode` viajando en todas las rutas. La primera pantalla tarda más de lo que debería en una red saturada de evento.

3. **El texto secundario no llega a contraste AA (UX-31, NUEVO).** Los grises chicos (`neutral-400`) dan **3.2–3.6:1** sobre blanco — debajo del mínimo 4.5:1. Son los timestamps, "Faltan X", captions, "por Deenex". Irónico: la propia app le pide al cliente *subir el brillo de la pantalla*, pero su texto chico es difícil de leer justo en el ambiente brillante de una barra.

4. **Escanear no da feedback perceptible (UX-07).** Al decodificar el QR navega sin flash, beep ni vibración. En un lugar ruidoso y oscuro, el runner no sabe si "agarró".

5. **El detalle del pedido se siente apretado en mobile (UX-19).** La barra "Confirmar entrega" y la nav inferior conviven apiladas, comiendo espacio de la lista de productos.

### Sensación general del recorrido

**La app está notablemente mejor que en las primeras pasadas.** El bucle central fluye (cámara lista, "Volver" correcto), las acciones sensibles ya tienen red (undo, selección persistente) y se instala como PWA con su ícono. Lo que queda es de dos tipos: **(a) el salto a producto real** (sync multi-runner, performance) y **(b) una capa de accesibilidad fina** que recién ahora se audita en profundidad —contraste de texto, respeto por `prefers-reduced-motion`, anuncios para lectores de pantalla—. Se siente cuidada y confiable; todavía no del todo *inclusiva* ni *liviana*.

---

## 2. Diario del usuario (narrativa)

> *Soy Maxi. Van varias noches ya con esto y se nota que lo fueron puliendo.*

**Abro la app en la tablet** y tarda un toque de más en cargar la pantalla de login —en el wifi del local todo va lento, pero igual, son segundos que se sienten. Entro, la cámara ya está lista, escaneo, entrego. Si me equivoco ahora me sale un **"Deshacer"** en el cartelito — eso me da tranquilidad que antes no tenía.

**Cargo un pedido grande, toco sin querer "Pedidos"** abajo… vuelvo y **la selección sigue ahí**. Antes se borraba. Ahora no. Alivio.

**Donde sufro es leyendo.** Con las luces del lugar y la pantalla a contraluz, los datos chicos —la hora del pedido, el "Faltan 2", los textitos grises— **los tengo que forzar la vista para leerlos**. Es gracioso porque la app me dice "decile al cliente que suba el brillo", pero la letra gris finita de la propia app es lo que menos se lee acá adentro.

**Un compañero me comentó** que a él las animaciones —el confeti, los pulsos que laten— lo marean un poco. Tiene activado en el celu eso de "reducir movimiento" y la app igual le tira todo el show. No le hace caso a esa preferencia.

**Cuando le presto la tablet a alguien que no ve bien**, me doy cuenta que con el lector de pantalla el +/- de las cantidades no le canta el número: toca "sumar", "sumar", y no escucha en cuánto va. Tiene que adivinar.

**Balance:** la uso cómodo, ya le tengo confianza. Lo que me queda es que **cargue más rápido**, que **la letra chica se lea de una** bajo cualquier luz, y que **el laburo con otro runner se vea en vivo** —hoy sigo cruzando los dedos para no entregar dos veces.

---

## 3. Tabla priorizada — Matriz Impacto × Esfuerzo

> ✅ = resuelto · 🆕 = nuevo en v3

| ID | Problema | Severidad | Esfuerzo | ¿Quick win? |
|----|----------|-----------|----------|-------------|
| UX-01/02/03/04/05/12/24/25/27/28/29 | (11 resueltos) | ✅ | — | — |
| UX-20 | Sin sync en vivo multi-runner | **Alta** | Alto | — |
| UX-26 | Bundle 639KB; html5-qrcode no lazy | Media | Medio | — |
| UX-31 🆕 | Texto `neutral-400` no llega a AA (3.2–3.6:1) | Media | Medio | — |
| UX-32 🆕 | Placeholder `neutral-300` ~2:1 | Baja | Bajo | ✅ |
| UX-33 🆕 | Sin `prefers-reduced-motion` (9 animaciones) | Media | Bajo | ✅ **SÍ** |
| UX-34 🆕 | QuantityStepper no anuncia el valor (lector) | Media | Bajo | ✅ **SÍ** |
| UX-35 🆕 | `type="search"` + X custom → doble clear | Baja | Bajo | ✅ |
| UX-36 🆕 | Región de cámara sin label para AT | Baja | Bajo | ✅ |
| UX-07 | Sin feedback al detectar QR | Media | Medio | — |
| UX-19 | Doble barra fija en mobile | Media | Medio | — |
| UX-06 | Toasts arriba, atención abajo | Media | Bajo | ✅ |
| UX-08 | "Solo emails autorizados" es falso | Media | Medio | — |
| UX-09 | "Caduca en 10 min" no se valida | Baja | Medio | — |
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

## 4. Hallazgos detallados — NUEVOS (v3)

```
[UX-31] [Accesibilidad / Legibilidad] El texto secundario no llega a contraste AA
📍 Ubicación:      Token neutral-400 (#8b8589). Usos: timestamps en lista y detalle,
                   "Entregados X · Faltan Y" (ProductRow), captions, "por Deenex" en el
                   logo, descripciones de eyebrow, labels de "Pedidos de prueba".
👀 Qué vi (medido): Ratios calculados:
                   - neutral-400 sobre blanco      = 3.61:1  (AA pide 4.5:1)  ✗
                   - neutral-400 sobre primary-50   = 3.43:1  ✗
                   - neutral-400 sobre accent-50     = 3.16:1  ✗
                   - neutral-300 sobre blanco        = 2.19:1  ✗  (ver UX-32)
                   neutral-500+ sí pasan (5.0–12.9:1).
😖 Por qué molesta: En la barra, con poca luz o pantalla a contraluz, los datos chicos
                   (hora, faltantes) cuestan leerse. Afecta a cualquiera, no solo a baja
                   visión. Choca con el propio "Tip" de la app sobre el brillo de pantalla.
🔥 Severidad:      Media
🔧 Esfuerzo:       Medio (cambio de token, revisar dónde es texto vs. decorativo)
✅ Recomendación:  Para TEXTO, subir el mínimo a neutral-500 (#706a6e, 5.28:1). Reservar
                   neutral-400 solo para íconos decorativos o bordes. Regla: si es legible,
                   neutral-500 o más oscuro.
```

```
[UX-32] [Accesibilidad] Placeholders con contraste muy bajo
📍 Ubicación:      ScanPage input manual (placeholder:text-neutral-300) y similares.
👀 Qué vi:         neutral-300 (#b2aeb1) sobre blanco = 2.19:1. El placeholder "DNX-XXXXXX"
                   casi no se distingue del fondo.
😖 Por qué molesta: La pista de formato del código (lo que ayuda a tipear bien) es lo que
                   menos se ve.
🔥 Severidad:      Baja
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Subir placeholders a neutral-400 como mínimo (idealmente 500), o usar un
                   hint persistente debajo del campo en vez de depender del placeholder.
```

```
[UX-33] [Accesibilidad / Motion] No se respeta prefers-reduced-motion
📍 Ubicación:      index.css (9 @keyframes: fade-up, fade-in, scan-line, pulse-soft,
                   glow-pulse, confetti, toast-in, toast-in-mobile, shake). Sin media query.
👀 Qué vi:         No existe `@media (prefers-reduced-motion: reduce)`. El confeti de
                   confirmación, los pulsos que "laten" (glow-pulse/pulse-soft) y la línea
                   de escaneo corren siempre, ignorando la preferencia del sistema.
😖 Por qué molesta: Usuarios con sensibilidad vestibular (mareo/náusea) reciben todo el
                   movimiento aunque hayan pedido reducirlo a nivel SO.
🔥 Severidad:      Media
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Agregar al final de index.css:
                   @media (prefers-reduced-motion: reduce) {
                     *, *::before, *::after {
                       animation-duration: .01ms !important;
                       animation-iteration-count: 1 !important;
                       transition-duration: .01ms !important;
                     }
                   }
                   Y omitir el confeti cuando la preferencia esté activa.
```

```
[UX-34] [Accesibilidad] El selector de cantidad no anuncia el valor a lectores de pantalla
📍 Ubicación:      QuantityStepper.tsx (botones con aria-label "Restar"/"Sumar"; el número
                   es un <div> sin rol ni aria-live).
👀 Qué vi:         Un lector de pantalla anuncia "Restar, botón" / "Sumar, botón" pero
                   nunca el valor resultante. El usuario no escucha en cuánto va.
😖 Por qué molesta: Una persona con baja visión no puede saber cuántas unidades seleccionó
                   antes de confirmar la entrega.
🔥 Severidad:      Media
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Exponer el grupo como spinbutton: envolver con role="group"
                   aria-label="Cantidad a entregar" y dar al número
                   role="status" aria-live="polite" (o usar aria-valuenow/min/max).
                   Incluir el contexto del producto en los aria-label de +/-.
```

```
[UX-35] [UI] Doble botón de limpiar en la búsqueda
📍 Ubicación:      OrdersListPage.tsx (input type="search" + botón X custom).
👀 Qué vi:         En navegadores WebKit, type="search" agrega su propia "x" nativa cuando
                   hay texto, que convive con la "x" custom del diseño. Dos limpiadores.
😖 Por qué molesta: Inconsistencia visual menor; puede confundir cuál tocar.
🔥 Severidad:      Baja
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Ocultar el control nativo con
                   `input[type="search"]::-webkit-search-cancel-button { display:none }`
                   o usar type="text" inputMode="search".
```

```
[UX-36] [Accesibilidad] La región de la cámara no tiene etiqueta ni instrucciones para AT
📍 Ubicación:      ScanPage.tsx (<div id="qr-reader">), sin role/aria-label.
👀 Qué vi:         El visor de cámara es un contenedor sin texto alternativo ni instrucción.
                   Con lector de pantalla, el modo cámara es "silencioso".
😖 Por qué molesta: No hay guía para quien no ve el visor; la entrada manual (la vía
                   accesible) existe pero no se señaliza como alternativa desde el visor.
🔥 Severidad:      Baja
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Dar al contenedor role="img" aria-label="Visor de cámara para escanear
                   el QR del cliente" y un texto visible/SR "¿No podés escanear? Cargá el
                   código a mano" enlazado al modo manual.
```

> **Hallazgos heredados aún abiertos (UX-06–11, 13–23, 26, 30):** vigentes con el detalle ya documentado en pasadas anteriores. Ver matriz para severidad/esfuerzo.

---

## 5. Recomendaciones

### ⚡ Quick wins (esta semana — alto impacto, bajo esfuerzo)

1. **UX-33** — `prefers-reduced-motion` global (5 líneas de CSS) + omitir confeti. Accesibilidad real, costo casi cero.
2. **UX-34** — `aria-live` en el QuantityStepper para anunciar la cantidad.
3. **UX-32 / UX-36** — subir contraste de placeholders + etiquetar la región de cámara.
4. **UX-35** — ocultar el clear nativo de la búsqueda.
5. *(Heredados de alto valor/bajo costo)* **UX-13** ARIA en progreso · **UX-06** toasts al bottom · **UX-11/18** esconder afordances de demo · **UX-16** filtros evidentes.

### 🏗️ Mejoras estratégicas (rediseño / fondo)

1. **Legibilidad sistémica (UX-31 + UX-32)** — Reauditar la escala de grises de texto: piso en neutral-500 para todo lo legible. Es transversal a toda la app y mejora la experiencia bajo la luz real de una barra.
2. **Performance (UX-26)** — Code-splitting de la pantalla de escaneo / `import()` dinámico de html5-qrcode. Aligera la primera carga en redes de evento.
3. **Backend real con realtime (UX-20 + UX-10 + UX-09)** — Sync multi-runner verdadero, magic links cross-device, expiración efectiva.
4. **Feedback de escaneo + modo foco (UX-07 + UX-19)** — Vibración/beep/flash al detectar el QR y ocultar la nav inferior durante la entrega para ganar espacio y evitar taps.

---

> **Alcance respetado:** auditoría de experiencia, no de seguridad. En esta pasada no se modificó código de la app — solo se regeneró este reporte. Los 11 fixes previos están en `main`/`gh-pages`. Los quick wins de la v3 (especialmente UX-33 y UX-34) quedan listos para ejecutar cuando se indique.
