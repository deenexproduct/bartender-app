# 🕵️ Reporte de Auditoría UX — Bartender App (Deenex)

> **Método:** Análisis estático + simulación de flujos (lectura completa de las 19 pantallas/componentes del cliente).
> **Repo auditado:** `~/dev/bartender-app` · commit `57a41e2` · rama `main`
> **Stack:** React 19 + Vite 7 + Tailwind 4 + React Router 7 (HashRouter)
> **Live:** https://deenexproduct.github.io/bartender-app/
> **Idioma del producto:** español rioplatense
> **Fecha:** 2026-05-28

---

## ⚙️ Configuración usada

| Campo | Valor |
|---|---|
| Plataforma | Bartender App — retiro de productos por QR en barra/cocina/takeaway |
| Usuario simulado | "Maxi", runner/bartender. Usa la app cada turno, varias noches por semana. Entorno ruidoso, una mano ocupada, teléfono o tablet POS. Cero paciencia para la fricción. |
| Jobs to be done | Loguearse al turno · escanear QR · entregar todo · entregar parcial · manejar QR vencido · buscar un pedido sin escanear · evitar duplicar entregas con otro runner · cerrar sesión |

---

## 1. Resumen ejecutivo

### Las 5 fricciones que más sangran

1. **La cámara no se reanuda sola para el próximo cliente** (`ScanPage`). Después de entregar, "Escanear otro" te deja en la pantalla con la cámara **apagada**: hay que volver a tocar "Activar cámara" por **cada** cliente. En una fila de viernes a la noche, eso es un tap extra por persona y segundos perdidos en el bucle central del producto.

2. **Las entregas parciales se confirman sin red de seguridad** (`OrderDetailPage`). Si la entrega no cierra el pedido, "Confirmar entrega" ejecuta el retiro **al instante, sin diálogo y sin undo**. Un número mal cargado queda grabado en el historial para siempre. Es la acción más sensible del producto (toca inventario real) y es la que menos protección tiene.

3. **"Volver" desde el detalle siempre te tira a Escanear** (`OrderDetailPage`). Si llegaste al pedido desde la lista (`/pedidos`), esperás volver a la lista; en cambio aterrizás en la cámara. Te perdés y tenés que re-navegar.

4. **El banner de offline promete un sync que no existe** (`OfflineBanner`). Dice *"los retiros se sincronizarán cuando vuelva el wifi"*, pero no hay cola de sincronización: todo vive solo en `localStorage`. Si un runner confía en eso, puede creer que un retiro hecho sin señal "ya va a subir" cuando en realidad nunca sale del dispositivo.

5. **La navegación inferior sigue activa durante la entrega y un tap accidental borra la selección** (`AppShell` + `OrderDetailPage`). Mientras cargás cantidades, la barra "Escanear / Pedidos" sigue ahí abajo; un toque sin querer descarta toda la selección en curso, sin aviso.

### Sensación general del recorrido

La plataforma **se siente cuidada y premium**: sistema visual consistente (violeta Deenex, esquinas redondeadas, sombras escalonadas), microcopy cálido y rioplatense, y estados vacíos/error bien resueltos. Transmite producto terminado. Pero **la capa de confianza operativa flaquea justo donde más importa**: el bucle de escaneo tiene fricción repetitiva, las acciones irreversibles no tienen freno, y hay copy que promete capacidades (sync offline, links que caducan, emails autorizados) que el sistema no cumple. Es una app linda que todavía no está blindada para el caos de una barra real.

---

## 2. Diario del usuario (narrativa)

> *Soy Maxi. Viernes, 23:40, el lugar explotado. Agarro la tablet del turno.*

**Entro.** Pantalla de login limpia, "Entrá a tu turno", me gusta. Pongo mi mail, "Mandame el link". Aparece una pantalla "Revisá tu mail"… pero el link **está acá mismo en la pantalla**, con un botón "Simular click en el link". Ok, es la demo. En la vida real esto me confundiría: ¿reviso el mail o toco acá? Toco, entro, "Bienvenido a tu turno". Bien.

**Primer cliente.** Me muestra una pantalla "Listo para escanear" pero la cámara está apagada. Toco "Activar cámara", apunto al QR del pibe, lo agarra al toque y me lleva al pedido. Bien rápido. Tres cervezas y unas papas. Toco "Entregar todo", "Confirmar entrega", confeti, "¡Pedido completo!". Lindo.

**Segundo cliente.** Toco "Escanear otro"… y otra vez la cámara apagada. Otra vez "Activar cámara". *¿En serio voy a tener que prender la cámara para cada uno?* Con la fila que tengo, esto me va a matar.

**Tercer cliente, entrega parcial.** Se lleva 2 de 4 Aperol ahora, el resto después. Cargo "2" en el stepper, "Confirmar entrega". **Listo, sin preguntarme nada.** Quedó grabado. Pero me quedó la duda: ¿puse 2 o 3? No hay forma de revisar ni deshacer. Si me equivoqué, ya está, quedó en el historial con mi nombre.

**Me distraigo.** Mientras cargo otro pedido, sin querer toco "Pedidos" en la barra de abajo. **Se borró todo lo que había seleccionado.** Vuelvo, empiezo de nuevo, puteo.

**Busco un pedido sin escanear.** Voy a "Pedidos". Hay tres tarjetas arriba con números. Toco "Pendientes" para ver cuáles me faltan… ah, **filtra la lista**. No sabía que eran botones, parecían stats. Igual zafó. Busco por nombre, lo encuentro, entro. Cuando termino toco "Volver" esperando la lista… **y me tira a la cámara.** ¿Y la lista? Tengo que ir de nuevo.

**Se cae el wifi.** Aparece una franja amarilla: "los retiros se sincronizarán cuando vuelva el wifi". Ah, bueno, sigo entregando tranquilo entonces. *(Spoiler: no se sincroniza nada, queda todo en esta tablet nomás. Si mañana entro de otra tablet, no está.)*

**Otro runner.** Entro a un pedido y me avisa "Lucas acaba de retirar productos en Barra principal — revisá el historial". **Eso está buenísimo**, me salva de entregar dos veces. Lo único: es el único momento donde siento que la app me cuida de verdad en el laburo en equipo.

**Cierro turno.** Menú de usuario, "Cerrar sesión", me pregunta "¿Cerrar sesión?" antes de salir. Bien, eso sí tiene confirmación. Irónico que cerrar sesión me pregunte y entregar productos no.

---

## 3. Tabla priorizada — Matriz Impacto × Esfuerzo

| ID | Problema | Severidad | Esfuerzo | ¿Quick win? |
|----|----------|-----------|----------|-------------|
| UX-01 | Cámara no se reanuda para el próximo escaneo | **Crítica** | Bajo | ✅ **SÍ** |
| UX-02 | Entrega parcial sin confirmación ni undo | **Alta** | Medio | — |
| UX-03 | "Volver" en detalle siempre va a Escanear | Media | Bajo | ✅ |
| UX-04 | Nav inferior borra la selección con tap accidental | **Alta** | Medio | — |
| UX-05 | Banner offline promete sync inexistente | Media | Bajo | ✅ |
| UX-06 | Toasts arriba, atención del usuario abajo | Media | Bajo | ✅ |
| UX-07 | Sin confirmación visual/sonora al detectar QR | Media | Medio | — |
| UX-08 | "Solo emails autorizados" es falso | Media | Medio | — |
| UX-09 | "Caduca en 10 minutos" no se valida | Baja | Medio | — |
| UX-10 | Magic link no funciona cross-device | Media | Alto | — |
| UX-11 | Link mágico visible + "Simular click" en prod | Media | Bajo | ✅ |
| UX-12 | ConfirmDialog: Enter confirma acción destructiva | **Alta** | Bajo | ✅ **SÍ** |
| UX-13 | Barra de progreso sin roles ARIA | Baja | Bajo | ✅ |
| UX-14 | ConfirmDialog sin focus trap | Media | Medio | — |
| UX-15 | "Cambiar email"/"Reenviar": tap targets chicos | Baja | Bajo | ✅ |
| UX-16 | Stat cards como filtros: no es evidente | Media | Bajo | ✅ |
| UX-17 | Lista de pedidos sin orden/sort | Baja | Medio | — |
| UX-18 | "Pedidos de prueba" + Reset visibles en prod | Media | Bajo | ✅ |
| UX-19 | Doble barra fija (confirmar + nav) en mobile | Media | Medio | — |
| UX-20 | Sin sync en vivo multi-runner | **Alta** | Alto | — |
| UX-21 | Avatar = últimos 3 chars del token | Baja | Bajo | — |
| UX-22 | Botón de login sin estado de carga | Baja | Bajo | ✅ |
| UX-23 | Confirmación no lista qué productos se entregaron | Baja | Bajo | ✅ |

---

## 4. Hallazgos detallados

### 🔁 Bucle central (escaneo → entrega)

```
[UX-01] [Fricción] La cámara no se reanuda para el siguiente cliente
📍 Ubicación:      ScanPage.tsx (estado `mode`) + ConfirmationPage "Escanear otro" → "/"
👀 Qué vi:         Tras una entrega, volver a Escanear deja `mode='idle'` con la cámara
                   apagada. Hay que tocar "Activar cámara" en cada cliente.
😖 Por qué molesta: Es el bucle que se repite 100+ veces por turno. Un tap extra por
                   persona + el delay de re-inicializar la cámara mata el throughput
                   justo en la hora pico.
🔥 Severidad:      Crítica
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Recordar la preferencia del operador (p. ej. `localStorage
                   'scan.autostart'`) y arrancar en `mode='camera'` al volver a "/".
                   Idealmente, mantener el escáner vivo y mostrar un overlay de
                   "entregado ✓" 1.5s sin desmontar la cámara.
```

```
[UX-02] [Fricción / Integridad de datos] Entrega parcial sin confirmación ni undo
📍 Ubicación:      OrderDetailPage.tsx → handleConfirmClick() / finalizeDelivery()
👀 Qué vi:         Si la entrega NO completa el pedido, se ejecuta directo sin diálogo.
                   Solo hay ConfirmDialog cuando `wouldComplete === true`. No existe
                   ningún mecanismo de deshacer: el RetrievalEvent se agrega al historial.
😖 Por qué molesta: Es la acción que toca inventario real y queda firmada con el nombre
                   del operador. Una cantidad mal cargada es un error permanente. En un
                   entorno rápido, los errores de dedo son inevitables.
🔥 Severidad:      Alta
🔧 Esfuerzo:       Medio
✅ Recomendación:  (a) Toast de éxito con acción "Deshacer" durante ~6s que revierta el
                   último RetrievalEvent (el store ya tiene el event id). (b) Mini-resumen
                   antes de confirmar incluso en parciales ("Vas a entregar: 2× Aperol").
```

```
[UX-04] [Fricción / Pérdida de trabajo] Tap accidental en la nav borra la selección
📍 Ubicación:      AppShell.tsx (bottom nav fixed) + OrderDetailPage (selection en estado local)
👀 Qué vi:         La barra inferior "Escanear / Pedidos" sigue activa dentro del detalle.
                   `selection` es estado local; al navegar se pierde sin aviso.
😖 Por qué molesta: Con cantidades ya cargadas, un toque sin querer descarta todo. No hay
                   confirmación "tenés cambios sin guardar".
🔥 Severidad:      Alta
🔧 Esfuerzo:       Medio
✅ Recomendación:  Si `selectedItems > 0`, interceptar la navegación con un confirm
                   ("Tenés N productos sin confirmar, ¿salir igual?") o atenuar la barra
                   inferior mientras hay selección activa.
```

```
[UX-07] [Feedback] Sin confirmación perceptible al detectar el QR
📍 Ubicación:      ScanPage.tsx → callback de Html5Qrcode.start()
👀 Qué vi:         Al decodificar, navega directo. No hay flash, beep ni vibración.
😖 Por qué molesta: En una barra ruidosa y con poca luz, el runner no sabe si "agarró"
                   hasta que cambia la pantalla. Genera reintentos innecesarios.
🔥 Severidad:      Media
🔧 Esfuerzo:       Medio
✅ Recomendación:  `navigator.vibrate(40)` + flash verde de 150ms + beep corto opcional
                   antes de navegar. Refuerza el "lo agarré".
```

### 🧭 Navegación

```
[UX-03] [Navegación] "Volver" en el detalle siempre va a Escanear
📍 Ubicación:      OrderDetailPage.tsx → botón "Volver" → navigate('/')
👀 Qué vi:         Hardcodea "/" en vez de respetar de dónde viniste (lista vs escaneo).
😖 Por qué molesta: Si entraste desde /pedidos, esperás volver a la lista; aterrizás en
                   la cámara y tenés que re-navegar y re-buscar.
🔥 Severidad:      Media
🔧 Esfuerzo:       Bajo
✅ Recomendación:  `navigate(-1)` cuando hay historial, o pasar `state={{ from }}` al
                   navegar y usarlo en "Volver". Default a "/" solo si no hay origen.
```

```
[UX-16] [Descubrimiento] Las stat cards no parecen filtros
📍 Ubicación:      OrdersListPage.tsx → componente StatCard
👀 Qué vi:         "Pendientes / En curso / Completos" son botones (aria-pressed) que
                   filtran, pero visualmente leen como tarjetas de métrica.
😖 Por qué molesta: El usuario no descubre el filtrado, o lo activa sin querer y no
                   entiende por qué "desaparecieron" pedidos.
🔥 Severidad:      Media
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Señal de affordance: ícono de filtro al hover/activo, cursor-pointer
                   explícito, y micro-label "Tocá para filtrar" la primera vez. El chip
                   "Quitar filtro" ya ayuda — reforzar el estado activo con más contraste.
```

```
[UX-17] [Funcionalidad] La lista de pedidos no tiene orden configurable
📍 Ubicación:      OrdersListPage.tsx → `filtered` (orden = inserción del array)
👀 Qué vi:         No hay control de orden (más nuevo, por estado, por punto de retiro).
😖 Por qué molesta: Con volumen real, encontrar "el último que entró" o "los pendientes
                   más viejos" se vuelve scroll a ciegas.
🔥 Severidad:      Baja
🔧 Esfuerzo:       Medio
✅ Recomendación:  Orden por `createdAt` desc por defecto + un selector simple
                   (Recientes / Antiguos / Por estado).
```

### 🔐 Login y acceso

```
[UX-08] [Microcopy / Confianza] "Solo emails autorizados del equipo" es falso
📍 Ubicación:      LoginPage.tsx (texto bajo el form) + auth.tsx signIn()
👀 Qué vi:         El copy afirma una allowlist, pero CUALQUIER email válido entra y se
                   le deriva un nombre. No hay verificación de equipo.
😖 Por qué molesta: Promesa de seguridad incumplida. Mina la confianza si alguien lo nota,
                   y da una falsa sensación de control de acceso.
🔥 Severidad:      Media
🔧 Esfuerzo:       Medio
✅ Recomendación:  En demo: cambiar el copy a "Demo — cualquier email entra". En prod:
                   implementar la allowlist real (o mensaje honesto de invitación).
```

```
[UX-09] [Consistencia] "Caduca en 10 minutos" no se cumple
📍 Ubicación:      LoginPage.tsx SentStep ("Caduca en 10 minutos") vs MagicLinkPage.tsx
👀 Qué vi:         MagicLinkPage valida solo que token+email matcheen el pending; nunca
                   compara `requestedAt` contra una ventana de expiración.
😖 Por qué molesta: Copy que promete algo que el sistema no hace. Erosiona credibilidad.
🔥 Severidad:      Baja
🔧 Esfuerzo:       Medio
✅ Recomendación:  Validar `Date.now() - requestedAt < 10*60*1000` y marcar `invalid`
                   si venció, o quitar la promesa del copy hasta implementarla.
```

```
[UX-10] [Concepto] El magic link no funciona en otro dispositivo
📍 Ubicación:      MagicLinkPage.tsx → readPendingMagicLink() (localStorage del device)
👀 Qué vi:         La validación exige que el pending link esté en el localStorage del
                   MISMO dispositivo. Abrir el link en otro = siempre "inválido".
😖 Por qué molesta: Rompe la promesa básica del magic link (abrirlo desde el mail en
                   cualquier device). Aceptable como demo de un solo equipo, no en prod.
🔥 Severidad:      Media (limitación de demo)
🔧 Esfuerzo:       Alto
✅ Recomendación:  Requiere backend (token server-side). Documentar como limitación
                   conocida de la demo para no sorprender a stakeholders.
```

```
[UX-11] [Demo affordance] Link mágico y "Simular click" expuestos
📍 Ubicación:      LoginPage.tsx SentStep (caja "Demo · link generado")
👀 Qué vi:         Se muestra la URL completa del link y un botón "Simular click".
😖 Por qué molesta: Rompe la ilusión de producto terminado frente a un cliente real;
                   confunde al operador sobre dónde tocar.
🔥 Severidad:      Media
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Ocultar tras un flag `import.meta.env.DEV` o `?demo=1`. En prod, solo
                   "Revisá tu mail".
```

### ♿ Accesibilidad y seguridad de acción

```
[UX-12] [A11y / Riesgo operativo] Enter confirma la acción destructiva
📍 Ubicación:      ConfirmDialog.tsx → useEffect (Enter ⇒ onConfirm) + autofocus al confirm
👀 Qué vi:         Al abrir, se enfoca el botón de confirmar y Enter dispara onConfirm.
                   En una barra con lectores de código por hardware (que emiten Enter al
                   final del escaneo), un scan con el diálogo abierto = cierra el pedido.
😖 Por qué molesta: Confirma sin intención una acción irreversible ("cerrar el pedido").
🔥 Severidad:      Alta
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Enfocar el botón CANCELAR por defecto (no el destructivo) y/o quitar
                   el atajo Enter para acciones `danger`/cierre de pedido. Mantener Escape.
```

```
[UX-13] [A11y] La barra de progreso no expone su valor a lectores de pantalla
📍 Ubicación:      OrderDetailPage.tsx → div de progreso (solo visual, width %)
👀 Qué vi:         No hay role="progressbar" ni aria-valuenow/min/max.
😖 Por qué molesta: Un operador con lector de pantalla no percibe el avance del retiro.
🔥 Severidad:      Baja
🔧 Esfuerzo:       Bajo
✅ Recomendación:  role="progressbar" aria-valuenow={progress} aria-valuemin={0}
                   aria-valuemax={100} + aria-label.
```

```
[UX-14] [A11y] El ConfirmDialog no atrapa el foco
📍 Ubicación:      ConfirmDialog.tsx
👀 Qué vi:         Hay Escape/Enter y autofocus, pero el Tab puede salir del diálogo a
                   la página de fondo. No hay focus trap.
😖 Por qué molesta: Navegación por teclado confusa; foco "perdido" detrás del backdrop.
🔥 Severidad:      Media
🔧 Esfuerzo:       Medio
✅ Recomendación:  Trap de foco entre los dos botones (o usar un primitivo accesible tipo
                   Radix Dialog) y restaurar el foco al cerrar.
```

```
[UX-15] [Touch] "Cambiar email" y "Reenviar" tienen áreas de toque chicas
📍 Ubicación:      LoginPage.tsx SentStep (botones px-2 py-1)
👀 Qué vi:         Padding mínimo; quedan por debajo del objetivo táctil ~44px.
😖 Por qué molesta: Difícil de acertar en mobile, sobre todo apurado.
🔥 Severidad:      Baja
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Subir a min-h-11 / padding mayor, manteniendo el estilo "text button".
```

### 💬 Feedback y comunicación

```
[UX-05] [Microcopy / Confianza] El banner offline promete un sync inexistente
📍 Ubicación:      OfflineBanner.tsx + ordersStore.ts (solo localStorage)
👀 Qué vi:         "los retiros se sincronizarán cuando vuelva el wifi" — pero no hay cola
                   ni backend; todo queda local en ese dispositivo.
😖 Por qué molesta: Falsa promesa peligrosa: el runner cree que su trabajo offline "va a
                   subir" y puede no existir en ningún otro lado.
🔥 Severidad:      Media
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Copy honesto: "Sin conexión — los retiros se guardan en este
                   dispositivo". Si se implementa sync real, recién ahí prometerlo.
```

```
[UX-06] [Feedback] Los toasts aparecen arriba; la atención está abajo
📍 Ubicación:      Toast.tsx ToastViewport (top-center mobile / top-right desktop)
👀 Qué vi:         Mobile muestra toasts en el top. En el flujo de entrega, manos y vista
                   del runner están abajo (botón escanear, barra "Confirmar").
😖 Por qué molesta: Mensajes de éxito/error fáciles de no ver en pleno apuro.
🔥 Severidad:      Media
🔧 Esfuerzo:       Bajo
✅ Recomendación:  En mobile, posicionar los toasts arriba de la barra inferior (bottom)
                   donde ya está el foco visual, respetando safe-area.
```

```
[UX-22] [Feedback] El botón de login no tiene estado de carga
📍 Ubicación:      LoginPage.tsx submit()
👀 Qué vi:         "Mandame el link" cambia de paso al instante (es local). Sin spinner.
😖 Por qué molesta: Hoy no se nota (demo local), pero al conectar backend el doble-tap y
                   la falta de feedback van a generar reintentos.
🔥 Severidad:      Baja
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Estado `loading` con spinner + disabled al enviar (dejarlo listo para
                   cuando haya request real).
```

```
[UX-23] [Información] La confirmación no dice QUÉ se entregó
📍 Ubicación:      ConfirmationPage.tsx (solo muestra el conteo "N productos")
👀 Qué vi:         "Entregaste N productos del pedido X" sin el desglose por ítem.
😖 Por qué molesta: Un runner que quiere chequear lo que acaba de dar no tiene el detalle.
🔥 Severidad:      Baja
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Listar los ítems del último RetrievalEvent ("3× Cerveza, 1× Papas").
```

### 📱 Layout y multi-runner

```
[UX-19] [Layout] Doble barra fija en mobile come espacio vertical
📍 Ubicación:      OrderDetailPage.tsx (barra "Confirmar" fixed bottom-[5.5rem]) +
                   AppShell.tsx (bottom nav fixed bottom-3)
👀 Qué vi:         En el detalle conviven la barra de confirmar y la nav inferior,
                   apiladas, más un spacer h-32. En pantallas chicas aprieta el contenido.
😖 Por qué molesta: Menos lista de productos visible; sensación de UI amontonada abajo.
🔥 Severidad:      Media
🔧 Esfuerzo:       Medio
✅ Recomendación:  Ocultar la nav inferior dentro del detalle (modo "foco en la tarea")
                   o fusionar ambas barras en una sola zona de acción.
```

```
[UX-20] [Concepto] No hay sincronización en vivo entre runners
📍 Ubicación:      ordersStore.ts (instancia en memoria por tab; sin storage events ni backend)
👀 Qué vi:         El banner de concurrencia ("X acaba de retirar…") se calcula solo
                   sobre el `history` mock. Dos dispositivos reales no se ven entre sí.
😖 Por qué molesta: La propuesta de valor "no dupliques entregas" depende de ver en vivo
                   lo que hizo el otro. Hoy es un efecto de demo, no protección real.
🔥 Severidad:      Alta (para producción; aceptable como demo)
🔧 Esfuerzo:       Alto
✅ Recomendación:  Backend con realtime (websocket/polling). Mínimo viable intermedio:
                   escuchar `window 'storage'` para sincronizar pestañas del mismo device.
```

```
[UX-18] [Demo affordance] "Pedidos de prueba" + "Reset" visibles como si fueran producto
📍 Ubicación:      ScanPage.tsx (sección inferior con tokens demo, DNX-EXPIRED y Reset)
👀 Qué vi:         Botonera de tokens de prueba y un "Reset" de la demo en la pantalla
                   principal de escaneo.
😖 Por qué molesta: Frente a un cliente real confunde y abarata la percepción; un Reset
                   accidental borra el estado.
🔥 Severidad:      Media
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Ocultar tras flag de demo (`import.meta.env.DEV` / `?demo=1`).
```

```
[UX-21] [Cosmético] El avatar usa los últimos 3 caracteres del token
📍 Ubicación:      OrdersListPage.tsx (avatar = o.token.slice(-3))
👀 Qué vi:         Para DNX-A1B2C3 muestra "2C3" — poco memorable/significativo.
😖 Por qué molesta: No aporta identidad ni ayuda a reconocer el pedido de un vistazo.
🔥 Severidad:      Baja
🔧 Esfuerzo:       Bajo
✅ Recomendación:  Usar iniciales del cliente (ya se calculan en UserMenu) o un ícono por
                   estado; reservar el token para su línea mono dedicada.
```

---

## 5. Recomendaciones

### ⚡ Quick wins (esta semana — alto impacto, bajo esfuerzo)

1. **UX-01** — Auto-reanudar la cámara al volver a Escanear. *Es el arreglo de mayor ROI: destraba el bucle central.*
2. **UX-12** — Enfocar "Cancelar" (no el destructivo) y sacar el atajo Enter en diálogos `danger`. *Evita cierres de pedido accidentales.*
3. **UX-05** — Copy honesto del banner offline ("se guardan en este dispositivo").
4. **UX-03** — "Volver" con `navigate(-1)` para respetar el origen.
5. **UX-11 / UX-18** — Esconder afordances de demo (link visible, pedidos de prueba, reset) tras flag.
6. **UX-06** — Mover los toasts al bottom en mobile, donde está la atención.
7. **UX-13 / UX-15** — ARIA en la barra de progreso + agrandar tap targets de login.
8. **UX-16** — Hacer evidente que las stat cards filtran.
9. **UX-23** — Listar los ítems entregados en la confirmación.

### 🏗️ Mejoras estratégicas (rediseño / fondo)

1. **Red de seguridad en entregas (UX-02 + UX-04)** — Undo en el toast de éxito + protección de selección sin guardar. Es la inversión que más confianza operativa agrega.
2. **Backend real con realtime (UX-20 + UX-10 + UX-09)** — Habilita: sync multi-runner verdadero, magic links cross-device, y expiración de links efectiva. Convierte la demo en producto.
3. **Modo "foco en la tarea" en el detalle (UX-19)** — Ocultar la nav inferior durante la entrega y consolidar la zona de acción para ganar espacio y evitar taps accidentales.
4. **Sync offline real (UX-05)** — Cola de retiros con reintento al recuperar conexión; recién ahí el banner puede prometer sincronización.

---

> **Alcance respetado:** esto es auditoría de experiencia, no de seguridad. No se modificó código de la app — solo se generó este reporte. Los arreglos quedan listos para una próxima sesión si los querés ejecutar.
