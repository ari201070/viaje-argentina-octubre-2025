# Handoff Oficial — Versión v0.6

**Fecha:** 08 de agosto de 2026
**Rama:** `develop`
**Commit HEAD:** `cc588001`
**Tag:** `v0.6` — "Version 0.6 - Documentos e IndexedDB offline, Handoff e integracion Wikiloc"

---

## 1. Estado General del PWA Core

La aplicación es una **PWA (Progressive Web App)** de viaje por Argentina con 30 días de recorrido familiar.

### Service Worker — Cache-First offline
Archivo: [`public/sw.js`](../public/sw.js)

- **Cache name:** `argentina-viaje-cache-v1`
- **App shell cacheado individualmente** durante `install` (evita fallos transaccionales):
  - `./`, `./index.html`, `./favicon.svg`, `./manifest.json`
- **Estrategia Cache-First (stale-while-revalidate)** para:
  - Assets estáticos del app shell (`.html`, `.css`, `.js`, `.json`, imágenes, fuentes)
  - Recursos CDN (unpkg.com, googleapis.com, gstatic.com)
- **Estrategia Network-First con fallback a caché** para otras peticiones GET (datos de API).
- **Bypass** del SW en `localhost` para permitir live reload en desarrollo.
- **Protección de tipos:** Evita cachear fallbacks HTML como si fueran assets CSS/JS.
- **Limpieza de caché legacy:** El evento `activate` elimina versiones anteriores del cache name.

### Manifiesto
- `public/manifest.json` — Nombre, tema, íconos, modo standalone (`display: minimal-ui`).
- Íconos SVG vectoriales en `public/icons.svg` y favicon en `public/favicon.svg`.

---

## 2. Explorador de Ciudades e Itinerario

### Datos maestros
Archivo: [`src/data/cities.json`](../src/data/cities.json)

Lista de **7 ciudades** del itinerario de 30 días, cada una con:
- `id`, `name`, `days`, `region`
- `highlights` — Lista de atractivos principales
- `wikilocRoutes` *(opcional)* — Rutas de senderismo enlace a Wikiloc

### Ciudades con rutas Wikiloc (senderismo/trekking)

| Ciudad | Región | Rutas Wikiloc |
|---|---|---|
| San Carlos de Bariloche | Patagonia | 🥾 Refugio Frey desde Cerro Catedral, Circuito Chico · Mirador Lago Nahuel Huapi |
| Mendoza | Cuyo | 🥾 Mirador Aconcagua · Puente del Inca, Cerro de la Gloria · Parque San Martín |
| Jujuy | Norte | 🥾 Quebrada de Humahuocha · Purmamarca, Parque Nacional Calilegua · Sendero |
| Puerto Iguazú | Litoral | 🥾 Sendero Macuco · Parque Nacional Iguazú |

### Componente Wikiloc
Archivo: [`src/components/cities/WikilocLink.jsx`](../src/components/cities/WikilocLink.jsx)

- Props: `routes` (`Array<{title: string, url: string}>`)
- Renderiza un bloque "🥾 Rutas de Wikiloc" con enlaces externos (`target="_blank"`, `rel="noopener noreferrer"`).
- Integrado en `CityCard.jsx` para renderizar las `wikilocRoutes` de cada ciudad directamente en la tarjeta.

### Grid de ciudades
Archivo: [`src/components/cities/CityGrid.jsx`](../src/components/cities/CityGrid.jsx)

- Muestra tarjetas por ciudad con highlights, días, región.
- Soporte de notas persistidas por ciudad (localStorage).

### Roadmap
Archivo: [`src/components/dashboard/Roadmap.jsx`](../src/components/dashboard/Roadmap.jsx)

- Visualización cronológica del itinerario de 30 días.

---

## 3. Módulo de Presupuesto Multi-moneda

### Monedas y conversiones
- **Monedas soportadas:** USD ($), ARS ($), ILS (₪)
- **Conversiones puente** configurables en `App.jsx` vía `DEFAULT_BUDGET_CONFIG`:
  - `baseCurrency: "USD"`
  - `arsToUsd: 1000` (1 USD ≈ 1000 ARS)
  - `ilsToUsd: 3.7` (1 USD ≈ 3.7 ILS)

### Componentes del módulo
| Archivo | Función |
|---|---|
| `BudgetDashboard.jsx` | Dashboard con gráfico de gastos, totales y conversión multi-moneda. Categorías: Vuelos, Alojamiento, Gastronomía, Actividades, Varios |
| `BudgetBackup.jsx` | Exportación e importación de datos en **JSON y CSV** (`downloadBlob`). Respaldo completo de gastos + configuración de moneda |
| `ExpenseForm.jsx` | Formulario de alta de gasto (monto, moneda, categoría, ciudad, notas) |
| `ExpenseList.jsx` | Lista de gastos con filtro por ciudad y eliminación |

### Presupuesto base configurado
```js
const DEFAULT_BUDGET_CONFIG = {
  baseCurrency: "USD",
  arsToUsd: 1000,
  ilsToUsd: 3.7,
};
```

---

## 4. Módulo de Vouchers y Documentos (v0.6)

### Almacenamiento: IndexedDB

- **Base de datos:** `argentina_trip_db` (versión 1)
- **Object Store:** `documents`
- **Key path:** `id` (autoincrement)
- **Índices:** `category`, `cityId`, `createdAt`

Archivo: [`src/utils/idbStorage.js`](../src/utils/idbStorage.js)

Wrapper nativo de IndexedDB con Promises:
- `openDB()` — Abre/crea la base de datos
- `putItem(store, item)` — Guarda o actualiza un documento
- `getAllItems(store)` — Lista todos los documentos
- `getItem(store, id)` — Obtiene un documento por ID
- `deleteItem(store, id)` — Elifica un documento
- `clearStore(store)` — Borra todos los documentos

### Hook de gestión
Archivo: [`src/hooks/useDocuments.js`](../src/hooks/useDocuments.js)

Custom hook con API CRUD asíncrona:
- `documents` — Array de documentos en estado
- `loading` — Boolean de carga
- `saveDocument(doc)` — Guarda Blob + metadata, refresca la lista
- `deleteDocument(id)` — Elimina y refresca
- `getDocumentUrl(id)` — Crea URL temporal con `URL.createObjectURL`
- `revokeUrl(url)` — Libera memoria con `URL.revokeObjectURL`

### Estructura de un documento
```js
{
  id: Number,          // auto-generado
  name: String,        // nombre original del archivo
  type: String,        // MIME (application/pdf, image/jpeg, etc.)
  size: Number,        // tamaño en bytes
  blob: Blob,          // archivo binario
  category: String,    // Vuelos | Alojamiento | Excursiones | Seguro | Cambio | Varios
  cityId: Number|null, // ciudad asociada (opcional)
  notes: String,       // notas del usuario
  createdAt: String,   // ISO timestamp
}
```

### Componentes

#### `DocumentDashboard.jsx`
Contenedor principal con filtros por categoría y ciudad, contador de documentos, integración de Uploader + List + Viewer. El hook `useDocuments` se inicializa aquí.

#### `DocumentUploader.jsx`
Formulario de carga:
- Input file: `.pdf, .png, .jpg, .jpeg` (máx 10 MB)
- Selector de categoría: ✈️ Vuelos, 🏨 Alojamiento, 🥾 Excursiones, 🛡️ Seguro, 💱 Cambio, 📎 Varios
- Selector de ciudad desde `cities.json`
- Campo de notas opcional

#### `DocumentList.jsx`
Grid de tarjetas con:
- Ícono según tipo (📄 PDF / 🖼️ imagen)
- Badge de categoría con color
- Tamaño formateado (B/KB/MB)
- Ciudad asociada
- Botones Ver y Eliminar (con confirmación)

#### `DocumentViewer.jsx`
Modal visor:
- PDFs en `<iframe>`
- Imágenes en `<img>` alta resolución
- `URL.revokeObjectURL` al cerrar para liberar memoria
- Badge de categoría con color
- Fallback para tipos no soportados

### Categorías y colores del módulo de documentos

| Categoría | Color Hex | Ícono |
|---|---|---|
| Vuelos | `#0EA5E9` | ✈️ |
| Alojamiento | `#8B5CF6` | 🏨 |
| Excursiones | `#10B981` | 🥾 |
| Seguro | `#F59E0B` | 🛡️ |
| **Cambio** | `#14B8A6` | 💱 |
| Varios | `#6B7280` | 📎 |

### Integración en App.jsx
- Nueva pestaña **"📄 Vouchers"** en la navegación
- Vista `documents` renderiza `<DocumentDashboard cities={cities} />`

### Consideraciones offline
- IndexedDB funciona completamente offline
- Los Blob se almacenan localmente en el navegador
- `URL.createObjectURL` funciona offline
- El Service Worker no intercepta `blob:` URLs (comportamiento correcto)
- Los datos persisten entre sesiones

### Limitaciones
- Máximo 10 MB por archivo
- Cuota de almacenamiento del navegador (50-80% del espacio disponible)
- Sin sincronización con la nube (futuro)

---

## 5. Inventario y Relevamiento de Vouchers Reales

### Fuentes escaneadas

| Ruta | Contenido | Uso |
|---|---|---|
| `F:\2025\Octubre` | Álbum de fotos familiar (11+ GB, ~2500 archivos JPG/HEIC organizados por día en hebreo) | Archivo multimedia; no versionado en Git |
| `C:\Users\flier\GitHub\Travel-Booking-Document-Hub` | Proyecto MCP de código (photo-catalog, mcp-server; ~23000 archivos node_modules) | Código; no es fuente de vouchers |
| `public/travel-documents/` | **Vouchers reales importados** | ✅ Fuente principal del módulo |
| `public/travel-references/` | Capturas de referencia | ✅ Referencias de apoyo |

### Vouchers en `public/travel-documents/` (6 archivos)

| Archivo | Tipo | Tamaño | Categoría |
|---|---|---|---|
| `itinerary_Y0HBMB59-1.pdf` | PDF | 421 KB | ✈️ Vuelos |
| `ticket_NTTZSH47.pdf` | PDF | 178 KB | ✈️ Vuelos |
| `Booking_Argentina_2025_Hoteles.png` | PNG | 133 KB | 🏨 Alojamiento |
| `Confirmación_Fuente Mayor Hotel Centro.pdf` | PDF | 184 KB | 🏨 Alojamiento |
| `Screenshot_20251011_142528_Bookingcom.jpg` | JPG | 575 KB | 🏨 Alojamiento |
| `Screenshot_20251018_181403_Bookingcom.jpg` | JPG | 393 KB | 🏨 Alojamiento |

### Referencias en `public/travel-references/` (6 archivos)

| Archivo | Tipo | Tamaño | Categoría |
|---|---|---|---|
| `Screenshot_20251014_151643_Xe.jpg` | JPG | 330 KB | 💱 Cambio de moneda |
| `Screenshot_20251014_151959_Xe.jpg` | JPG | 328 KB | 💱 Cambio de moneda |
| `Screenshot_20251014_141216_Chrome.jpg` | JPG | 309 KB | 💱 Cambio de moneda |
| `Screenshot_20251014_151450_Chrome.jpg` | JPG | 268 KB | 💱 Cambio de moneda |
| `Screenshot_20251028_112431_Maps.jpg` | JPG | 806 KB | 🗺️ Mapas |
| `IMG-20251025-WA0014.jpg` | JPG | 418 KB | 🖼️ Fotos |

> **Nota:** Los archivos de `F:\2025\Octubre` (11+ GB de fotos) **no se copian al repo**. El sistema de IndexedDB permite al usuario subir sus propios vouchers y fotos desde el dispositivo para uso offline durante el viaje.

---

## 6. Arquitectura de Archivos

```
src/
├── App.jsx                          # Navegación: Ciudades, Presupuesto, Vouchers
├── main.jsx                         # Entry point + PWA registration
├── data/cities.json                 # Itinerario de 30 días (7 ciudades)
├── hooks/
│   ├── useLocalStorage.js           # Hook localStorage genérico
│   └── useDocuments.js              # ✅ Hook CRUD IndexedDB (v0.6)
├── utils/
│   └── idbStorage.js                # ✅ Wrapper IndexedDB con Promises (v0.6)
├── components/
│   ├── cities/
│   │   ├── CityGrid.jsx             # Grid de tarjetas de ciudades
│   │   ├── CityCard.jsx             # Tarjeta individual con Wikiloc
│   │   └── WikilocLink.jsx          # Enlaces a rutas de trekking
│   ├── budget/
│   │   ├── BudgetDashboard.jsx      # Gráfico + conversión multi-moneda
│   │   ├── BudgetBackup.jsx         # Export/Import JSON + CSV
│   │   ├── ExpenseForm.jsx          # Formulario de gasto
│   │   └── ExpenseList.jsx          # Lista de gastos
│   ├── documents/                   # ✅ Módulo de vouchers (v0.6)
│   │   ├── DocumentDashboard.jsx    # Contenedor + filtros
│   │   ├── DocumentUploader.jsx     # Carga de archivos
│   │   ├── DocumentList.jsx         # Grid de vouchers
│   │   └── DocumentViewer.jsx      # Visor PDF/imagen modal
│   └── layout/
│       └── Header.jsx, Layout.jsx   # Estructura visual
└── locales/                         # i18n (es, en)
public/
├── sw.js                            # Service Worker Cache-First offline
├── manifest.json                    # PWA manifest
├── icons.svg                        # Íconos vectoriales
├── travel-documents/                # Vouchers reales del viaje
└── travel-references/               # Capturas de referencia
```

---

## 7. Estado del Deploy

- **Build:** Vite 8.1.5, 33 módulos transformados ✓
- **Lint:** ESLint sin errores ✓
- **Branch:** `develop` (HEAD)
- **Tag:** `v0.6` — "Version 0.6 - Documentos e IndexedDB offline, Handoff e integracion Wikiloc"

### Comandos de verificación
```bash
npm run build   # vite build
npm run lint    # eslint .
npm run dev     # vite dev
```

---

## 8. Próximos pasos sugeridos (v0.7)

1. **Import de datos existentes** — Cargar los vouchers reales de `public/travel-documents/` vía el uploader de IndexedDB (o script de importación).
2. **Miniaturas de imágenes** — Generar thumbnails de baja resolución para previews rápidos.
3. **Sincronización en la nube** — Backup/restore de IndexedDB via exportación (JSON con Blobs en base64).
4. **OCR de tickets** — Extracción automática de montos y fechas de vouchers de imágenes.
5. **Integración con Google Photos** — Import de fotos de `F:\2025\Octubre` vía API de Picasa/Web Albums.
