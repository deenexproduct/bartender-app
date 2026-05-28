# 🕵️ Reporte de Auditoría UX — Bartender App (Deenex) · v2

> **Pasada:** Segunda (re-auditoría sobre el estado actual, post quick wins de la v1).
> **Método:** Análisis estático + simulación de flujos (lectura completa de las 19 pantallas/componentes + verificación de assets, manifest y build).
> **Repo auditado:** `~/dev/bartender-app` · rama `main` · commit base `54baec7`
> **Stack:** React 19 + Vite 7 + Tailwind 4 + React Router 7 (HashRouter) + vite-plugin-pwa + html5-qrcode
> **Live:** https://deenexproduct.github.io/bartender-app/
> **Idioma del producto:** español rioplatense
> **Fecha:** 2026-05-28

---

## 0. Qué cambió desde la v1 (verificado)

La primera pasada dejó 23 hallazgos. Se implementaron y deployaron **4 quick wins**, verificados en el código actual:

| ID | Estado | Verificación |
|----|--------|--------------|
| UX-01 — Cámara no se reanudaba | ✅ **Resuelto** | `ScanPage.tsx` arranca en `mode='camera'` si el operador ya la usó (flag en `localStorage`). *Nota: ahora el permiso de cámara se pide al aterrizar en la pantalla; aceptable, pero es un efecto nuevo.* |
| UX-03 — "Volver" iba siempre a Escanear | ✅ **Resuelto** | `OrderDetailPage.tsx` usa `goBack()` = `navigate(-1)` salvo entrada directa por URL. |
| UX-05 — Banner offline prometía sync | ✅ **Resuelto** | `OfflineBanner.tsx`: "los retiros se guardan en este dispositivo". |
| UX-12 — Enter confirmaba acción destructiva | ✅ **Resuelto** | `ConfirmDialog.tsx` enfoca Cancelar y quitó el atajo Enter→confirmar. |

**Los otros 19 hallazgos de la v1 siguen abiertos** (ver matriz). Esta pasada agrega **7 hallazgos nuevos** (UX-24 a UX-30), varios con evidencia concreta del build y del manifest.

---

## 1. Resumen ejecutivo

### Las 5 fricciones que más sangran (estado actual)

1. **Entregas parciales sin confirmación ni undo (UX-02).** Sigue siendo lo más riesgoso del producto: la acción que toca inventario real se ejecuta al instante, sin diálogo y sin reversa. Un dedo mal puesto queda firmado para siempre.

2. **Un tap accidental en la nav inferior borra la selección en curso (UX-04).** Con cantidades ya cargadas, tocar "Escanear/Pedidos" descarta todo sin aviso.

3. **La PWA se instala con el ícono roto (UX-24, NUEVO).** El manifest pide `icon-192.png`, `icon-512.png` y `icon-512-maskable.png`, pero **esos archivos no existen** (en `public/` solo hay SVGs). "Instalar la app en la mano del operador" es la promesa central de una PWA y hoy llega con el ícono ausente.

4. **El zoom está desactivado (UX-25, NUEVO).** `maximum-scale=1` en el viewport impide el pinch-zoom: un operador con baja visión no puede agrandar nada. Barrera de accesibilidad real.

5. **Carga inicial pesada en wifi de evento (UX-26, NUEVO).** El bundle es **639 KB (192 KB gzip)** y `html5-qrcode` viaja en el bundle principal en TODAS las rutas, aunque solo lo use Escanear. La primera carga en la red saturada de un local se siente lenta.

### Sensación general del recorrido

**Mejoró respecto de la v1.** El bucle central ahora fluye: la cámara queda lista entre clientes y "Volver" te devuelve a donde estabas. La app sigue viéndose premium y consistente. Pero quedan dos clases de problema sin tocar: **(a) la falta de red de seguridad en la acción más sensible** (entregas sin undo, selección que se pierde) y **(b) detalles de "producto real"** que la primera pasada no cubrió —PWA instalable de verdad, accesibilidad de zoom, peso de carga—. Es una demo linda y ya más usable; todavía no está blindada para el caos de una barra ni para instalarse como app seria.

---

## 2. Diario del usuario (narrativa)

> *Soy Maxi. Otra noche, misma barra. Vengo de la última vez que usé esto.*

**Entro y agarro la cámara al toque** — ahora arranca sola, ya no tengo que prenderla en cada cliente. Eso me cambió la noche, en serio. Escaneo, entrego todo, confeti, "Escanear otro", y la cámara **ya está lista de nuevo**. Fluye.

**Entrega parcial otra vez.** Dos de cuatro. Cargo el stepper, "Confirmar entrega"… y de nuevo, **listo, sin red**. Me quedé con la duda de si puse 2 o 3 y no hay forma de deshacer. Esto sigue sin estar.

**Toco sin querer "Pedidos" abajo** mientras armaba un pedido grande. **Se borró toda la selección.** Igual que la otra vez. Ya aprendí a tener cuidado, pero no debería tener que tener cuidado.

**Voy a la lista y busco "Lucía".** Aparece su pedido… pero arriba sigue diciendo "3 pedidos en total". ¿3? Si veo uno. Por un segundo dudo si el buscador filtró bien.

**Quiero instalar la app en la tablet** para tenerla como ícono. La agrego a la pantalla de inicio y… **el ícono sale en blanco/roto**. Para algo que se vende como "la app del operador", queda berreta apenas la instalás.

**Intento agrandar** un texto chico con los dedos (la luz del lugar es un desastre) y **no me deja hacer zoom**. Nada. Me jode los ojos.

**Vuelvo a un pedido desde la lista, "Volver"** — ahora sí me devuelve a la lista, no a la cámara. Eso lo arreglaron, bien.

**Balance:** la uso más cómodo que antes. Las cosas que me siguen sangrando son las de confianza (entregar sin poder deshacer, perder lo que cargué) y las de "esto es una app de verdad" (que se instale bien, que pueda hacer zoom, que cargue rápido en el wifi del local).

---

## 3. Tabla priorizada — Matriz Impacto × Esfuerzo

> ✅ = resuelto en v1 · 🆕 = nuevo en v2

| ID | Problema | Severidad | Esfuerzo | ¿Quick win? |
|----|----------|-----------|----------|-------------|
| UX-01 | Cámara no se reanudaba | ✅ Resuelto | — | — |
| UX-03 | "Volver" iba a Escanear | ✅ Resuelto | — | — |
| UX-05 | Banner offline prometía sync | ✅ Resuelto | — | — |
| UX-12 | Enter confirmaba destructivo | ✅ Resuelto | — | — |
| UX-02 | Entrega parcial sin undo | **Alta** | Medio | — |
| UX-04 | Nav borra la selección | **Alta** | Medio | — |
| UX-24 🆕 | Íconos PWA no existen (install roto) | Media | Bajo | ✅ **SÍ** |
| UX-25 🆕 | `maximum-scale=1` desactiva el zoom | Media | Bajo | ✅ **SÍ** |
| UX-26 🆕 | Bundle 639KB; html5-qrcode no lazy | Media | Medio | — |
| UX-27 🆕 | Header "N en total" no refleja búsqueda/filtro | Media | Bajo | ✅ |
| UX-28 🆕 | Falta meta description | Baja | Bajo | ✅ |
| UX-29 🆕 | autoFocus en login abre teclado tapando contenido | Baja | Bajo | ✅ |
| UX-30 🆕 | Toasts no se pausan / no se recuperan | Baja | Bajo | — |
| UX-06 | Toasts arriba, atención abajo | Media | Bajo | ✅ |
| UX-07 | Sin feedback al detectar QR (háptico/sonoro) | Media | Medio | — |
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
| UX-19 | Doble barra fija en mobile | Media | Medio | — |
| UX-20 | Sin sync en vivo multi-runner | **Alta** | Alto | — |
| UX-21 | Avatar = últimos 3 chars del token | Baja | Bajo | — |
| UX-22 | Botón de login sin estado de carga | Baja | Bajo | ✅ |
| UX-23 | Confirmación no lista qué se entregó | Baja | Bajo | ✅ |

---

## 4. Hallazgos detallados — NUEVOS (v2)

```
[UX-24] [PWA / Primera impresión] La PWA se instala con el ícono roto
📍 Ubicación:      vite.config.ts (manifest.icons) vs client/public/
👀 Qué vi:         El manifest declara icon-192.png, icon-512.png y icon-512-maskable.png.
                   En public/ solo existen favicon.svg e icons.svg — ninguno de esos PNG.
                   El build no emite PNGs.
😖 Por qué molesta: Al "Agregar a pantalla de inicio" (la promesa central de una PWA), el
                   ícono sale vacío/genérico. Abarata el producto justo en el momento de
                   mayor compromiso del usuario (instalarlo).
🔥 Severidad:      Media
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Generar los 3 PNG (192, 512, 512-maskable) desde el SVG de marca y
                   ponerlos en public/. Sugerencia: fondo violeta #695ede con el glifo
                   del logo centrado; el maskable con padding de safe-zone (~20%).
```

```
[UX-25] [Accesibilidad] El viewport desactiva el zoom
📍 Ubicación:      index.html → <meta name="viewport" ... maximum-scale=1>
👀 Qué vi:         `maximum-scale=1` (y el implícito user-scalable bloqueado) impide el
                   pinch-zoom en toda la app.
😖 Por qué molesta: Un operador con baja visión, o cualquiera bajo mala luz, no puede
                   agrandar texto/códigos. Es una barrera de accesibilidad (WCAG 1.4.4).
🔥 Severidad:      Media
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Quitar `maximum-scale=1`: dejar
                   `width=device-width, initial-scale=1, viewport-fit=cover`.
                   Mantener viewport-fit=cover para el safe-area; el zoom no rompe el layout.
```

```
[UX-26] [Performance percibida] Carga inicial pesada; el escáner viaja en todas las rutas
📍 Ubicación:      ScanPage.tsx (import estático de html5-qrcode) → bundle principal
👀 Qué vi:         Build: dist/assets/index-*.js = 639 KB (192 KB gzip), con warning de
                   chunk >500KB. html5-qrcode se importa estático, así que se descarga
                   también en Login, Lista y Detalle, donde no se usa.
😖 Por qué molesta: En el wifi saturado de un evento, la primera pantalla (Login) tarda más
                   de lo necesario. El operador percibe la app como "lenta para abrir".
🔥 Severidad:      Media
🔧 Esfuerzo:       Medio
✅ Recomendación:  Lazy-load de la pantalla de escaneo y/o `import()` dinámico de
                   html5-qrcode dentro del efecto de cámara. Con React.lazy + Suspense se
                   saca ~la mitad del peso de la carga inicial.
```

```
[UX-27] [Consistencia / Feedback] El contador del header no refleja la búsqueda ni el filtro
📍 Ubicación:      OrdersListPage.tsx (header "N pedidos en total" usa stats.total global)
👀 Qué vi:         Al buscar "Lucía" o filtrar por estado, la lista se reduce pero el header
                   sigue diciendo el total global (p. ej. "3 pedidos en total"). Las stat
                   cards también muestran conteos globales, no del subconjunto filtrado.
😖 Por qué molesta: Genera una duda de "¿filtró bien?". El número de arriba contradice lo
                   que el usuario ve en la lista.
🔥 Severidad:      Media
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Cuando hay query/filtro activo, mostrar "Mostrando X de N" usando
                   `filtered.length`. Mantener el total global como referencia secundaria.
```

```
[UX-28] [Microcopy / Compartir] Falta meta description
📍 Ubicación:      index.html (<head>)
👀 Qué vi:         No hay <meta name="description">. Al compartir el link o guardarlo, no
                   hay resumen; el preview queda pobre.
😖 Por qué molesta: Menor, pero afecta cómo se ve el producto cuando se comparte el enlace
                   (demo a stakeholders, mensaje de WhatsApp con el live).
🔥 Severidad:      Baja
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Agregar <meta name="description" content="Retiro de productos por QR —
                   entregá pedidos en segundos. Por Deenex."> y, idealmente, tags
                   Open Graph (og:title, og:description, og:image).
```

```
[UX-29] [Mobile] autoFocus en el login abre el teclado y tapa contenido
📍 Ubicación:      LoginPage.tsx (input email con autoFocus)
👀 Qué vi:         Al cargar el login en mobile, el teclado salta solo y cubre el CTA y el
                   texto de ayuda; hay que cerrarlo para ver el botón.
😖 Por qué molesta: Arranque incómodo en el primer contacto del turno; sensación de salto.
🔥 Severidad:      Baja
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Quitar autoFocus en mobile (o condicionarlo a viewport ancho). El campo
                   ya es lo primero y obvio; no necesita robar el foco al montar.
```

```
[UX-30] [Feedback] Los toasts no se pausan al pasar por encima ni se pueden recuperar
📍 Ubicación:      Toast.tsx (auto-dismiss por setTimeout, sin pausa en hover/focus)
👀 Qué vi:         Un toast de error dura 6s y desaparece; si el usuario estaba leyéndolo o
                   se distrajo, no hay forma de traerlo de vuelta.
😖 Por qué molesta: Mensajes importantes (p. ej. "No pudimos confirmar: …") se pierden.
🔥 Severidad:      Baja
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Pausar el timer en hover/focus del toast; opcional: un pequeño centro de
                   "últimas notificaciones". Para errores, considerar que requieran cierre
                   manual en vez de auto-dismiss.
```

> **Hallazgos heredados de la v1 (UX-02, UX-04, UX-06–UX-23):** siguen vigentes con el detalle ya documentado. No se repiten acá para no inflar; ver la matriz para severidad/esfuerzo y el historial git del reporte v1 para el detalle completo.

---

## 5. Recomendaciones

### ⚡ Quick wins (esta semana — alto impacto, bajo esfuerzo)

1. **UX-24** — Generar y agregar los 3 PNG de ícono. Destraba la instalación de la PWA como producto serio. *El de mayor ROI de esta pasada.*
2. **UX-25** — Quitar `maximum-scale=1` para habilitar el zoom (accesibilidad).
3. **UX-27** — "Mostrando X de N" cuando hay búsqueda/filtro.
4. **UX-28 / UX-29** — Meta description + sacar el autoFocus en mobile.
5. *(Heredados)* **UX-11 / UX-18** — Esconder afordances de demo tras flag · **UX-13** — ARIA en la barra de progreso · **UX-06** — toasts al bottom en mobile.

### 🏗️ Mejoras estratégicas (rediseño / fondo)

1. **Red de seguridad en entregas (UX-02 + UX-04)** — Undo en el toast de éxito + protección de la selección sin guardar. *La inversión que más confianza operativa agrega; sigue siendo la #1 estratégica.*
2. **Performance (UX-26)** — Code-splitting de la pantalla de escaneo / `import()` dinámico de html5-qrcode. Mejora la carga inicial en redes de evento.
3. **Backend real con realtime (UX-20 + UX-10 + UX-09)** — Sync multi-runner verdadero, magic links cross-device y expiración efectiva de links.
4. **Modo "foco en la tarea" en el detalle (UX-19)** — Ocultar la nav inferior durante la entrega para ganar espacio y evitar taps accidentales (se solapa con UX-04).

---

> **Alcance respetado:** auditoría de experiencia, no de seguridad. En esta pasada no se modificó código de la app — solo se regeneró este reporte. Los 4 fixes de la v1 ya están en `main`/`gh-pages`. Los quick wins de la v2 quedan listos para ejecutar cuando se indique.
