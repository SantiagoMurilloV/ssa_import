# SSA Import · Tienda

Vitrina pública: catálogo, carrito, checkout por transferencia con subida de
comprobante, encargos a pedido y newsletter.

Es un SPA estático más funciones serverless que **hacen de proxy** hacia el API de
`ssa_admin`. La tienda no tiene base de datos ni credenciales: todo lo que
muestra viene del admin, y lo único que guarda en el navegador es el carrito.

## Stack

- **Client**: React 19 + Vite 7 + React Router 7, CSS propio
- **API**: Vercel Functions (`api/*.js`) con validación Zod 4
- **Deploy**: Vercel (`vercel.json`)

## Puesta en marcha

```bash
npm install
cp server/.env.example server/.env    # ADMIN_API_URL apunta al admin
npm run dev                           # proxy :4000 · tienda :5173
```

Necesita el admin corriendo (`ssa_admin`, puerto 4500). En desarrollo, `server/`
replica localmente lo que hacen las funciones de Vercel; en producción ese
servidor **no se despliega**, solo se usan sus archivos compartidos.

## Funciones serverless

Todas reenvían la IP y el user-agent reales del comprador
(`X-Store-Client-IP` / `X-Store-Client-UA`) para que el rate limiting del admin
no agrupe a todos bajo la IP de salida de Vercel. Timeout de 8 s.

| Ruta | Qué hace |
|---|---|
| `GET /api/catalog` | Proxy a `/public/catalog`. Cache de edge 10 s; si el admin no responde, sirve `DEFAULT_CATALOG` |
| `GET /api/site-content` | Proxy a `/public/site-content`, mismo cache y fallback |
| `POST /api/orders` | Valida con Zod y crea el pedido. Relaya 201/422/429; cualquier otra cosa → 502 |
| `POST /api/receipt?reference=SSA-xxxxxx` | Reenvía el multipart del comprobante |
| `POST /api/encargos` | Reenvía el multipart del encargo |
| `POST /api/subscribe` | Alta en el newsletter |
| `POST /api/events` | Analítica fire-and-forget: responde 202 aunque el admin esté caído |

## Páginas

| Ruta | Contenido |
|---|---|
| `/` | Hero con globo 3D, cómo funciona, quiénes somos, destacados, encargos, newsletter |
| `/catalogo` | Catálogo completo con filtros por categoría / stock / preventa |
| `/checkout` | Datos de envío + elección del canal de transferencia |
| `/gracias?ref=SSA-xxxxxx` | Referencia, datos de la cuenta con botón copiar y subida del comprobante |

El orden y la visibilidad de las secciones del home se controlan desde
**Contenido → Orden y visibilidad** en el admin.

## Cómo funciona el pago

No hay pasarela. El flujo es:

1. El comprador llena sus datos y elige uno de los canales configurados en el admin.
2. Se crea el pedido (`pending` / `awaiting_receipt`) y se le entrega una **referencia
   `SSA-######`** junto con un **token de comprobante** que queda en `sessionStorage`.
3. En `/gracias` ve el número de cuenta, transfiere y sube la foto del comprobante
   (se comprime en el navegador antes de subir).

   La referencia es corta y se muestra en pantalla, así que **no autoriza nada por sí
   sola**: subir el comprobante exige el token. Sin él (por ejemplo abriendo el enlace
   en otro navegador) la página pide enviar la foto por WhatsApp. Así nadie puede
   recorrer referencias ajenas y reemplazar el comprobante de otro cliente.
4. El pedido pasa a `in_review`; el admin lo revisa, confirma el pago (`paid`) y luego
   marca el envío (`shipped`) con transportadora y guía.

Los precios, el descuento vigente y el costo de envío **siempre los recalcula el
admin**: lo que el navegador manda es solo qué producto y cuántas unidades.

## Diseño

Portado del proyecto de Claude Design "SSA Tienda v6" (ver
`../design_reference/`). Paleta hueso `#FAF7F4` con lavanda, salvia y durazno;
tipografías Italiana, Cormorant Garamond, Instrument Serif y Geist.

Dos custom elements de canvas viven en `client/src/lib/`:

- `globe-3d.js` — globo terráqueo con la ruta EE. UU. → Colombia (necesita d3 y topojson, cargados en `index.html`). Se puede arrastrar para girar.
- `sky-descent.js` — fondo animado de nubes y paquetes en paracaídas. Se monta solo en pantallas ≥760 px y si el usuario no pidió reducir movimiento.

## Deploy

Proyecto de Vercel apuntando a la raíz del repo (`vercel.json` ya define build y
output). Configura dos variables de entorno:

```
ADMIN_API_URL=https://tu-admin.up.railway.app
STORE_PROXY_SECRET=<el mismo valor que en el admin>
```

El secreto autentica a estas funciones ante el admin. Sin él, el admin no puede
confiar en la IP del comprador que le reenviamos y el rate limit de los endpoints
públicos aplica a la IP de salida de Vercel, que todos los compradores comparten.

> La carpeta `server/` debe subirse al deploy: las funciones de `api/` importan
> desde `../server/src/config` y `../server/src/schemas`.

## Archivos espejo

`server/src/config/default-site-content.js`, `server/src/schemas/order.schema.js`
y `client/src/utils/shipping.js` tienen su contraparte en `ssa_admin` y deben
mantenerse sincronizados a mano.
