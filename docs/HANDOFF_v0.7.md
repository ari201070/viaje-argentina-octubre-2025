# Handoff Oficial — Versión v0.7

**Fecha:** 03 de agosto de 2026
**Rama:** `develop`
**Commit base:** `4b5b32c7` — "feat(gallery): release v0.7 base with 2247 photos and offline lightbox"

---

## 1. Módulo de Galería de Fotos

### Total final de fotos procesadas: **2552**

| Ciudad | ID | Fotos |
|---|---|---|
| Buenos Aires | 1 | 16 |
| Rosario | 2 | 223 |
| Bariloche / Villa Traful / 7 Lagos | 3 | 753 |
| Mendoza / Puente del Inca | 4 | 248 |
| Salta / Jujuy / Salinas Grandes | 5 | 467 |
| Puerto Iguazú / Cataratas | 6 | 567 |
| Corrientes / Esteros del Iberá | 7 | 278 |

**Total: 2552 fotos** (2247 JPG/PNG + 305 HEIC convertidas)

### Procesamiento de fotos

#### Script: `scripts/process-photos.js`

- **Mapa `HEBREW_FOLDER_MAP`**: 25 carpetas en hebreo de `F:\2025\Octubre` mapeadas a `cityId` de `cities.json`
- **Formatos soportados**: `.jpg`, `.jpeg`, `.png`, `.heic`
- **Imagen completa**: WebP máx 1920px, calidad 80% → `public/gallery/[cityId]/`
- **Miniatura**: WebP máx 400px, calidad 70% → `public/gallery/[cityId]/thumbs/`
- **Metadatos**: `src/data/gallery.json` con id, cityId, folder, src, thumb, original, tamaños

#### Soporte HEIC (v0.7 final)

- **`heic-convert`** instalado como devDependency
- Si `sharp` falla con un archivo `.heic` (límites de seguridad/header corrupto), el script:
  1. Lee el buffer del archivo HEIC
  2. Convierte a JPEG con `heic-convert` (`format: "JPEG"`)
  3. Procesa el buffer JPEG resultante con `sharp`
- **Omitir re-procesamiento**: Si el WebP (versión + thumbnail) ya existe en `public/gallery/`, el script lo omite y solo agrega sus metadatos a `gallery.json`
- Resultado: **305 fotos HEIC adicionales** procesadas en la segunda ejecución

### Dependencias nuevas

```json
"devDependencies": {
  "heic-convert": "^2.1.0",
  "sharp": "^0.35.3"
}
```

### Script npm

```json
"process-photos": "node scripts/process-photos.js"
```

---

## 2. Componentes de la Galería

### `src/components/gallery/GalleryDashboard.jsx`
- Vista principal con encabezado gradient azul
- Filtro por ciudad (dropdown desde `cities.json`)
- Contador de fotos totales y mostradas
- Integración de Grid + Lightbox

### `src/components/gallery/GalleryGrid.jsx`
- Grid responsive `repeat(auto-fill, minmax(180px, 1fr))`
- Miniaturas WebP con `loading="lazy"` nativo
- Badge de ciudad en cada foto
- Botón click para abrir lightbox

### `src/components/gallery/PhotoLightbox.jsx`
- Modal fullscreen con overlay negro 90%
- Botones Anterior/Siguiente con navegación circular
- **Atajos de teclado**: Esc (cerrar), ← (anterior), → (siguiente)
- Muestra ciudad, índice y nombre de archivo
- `useEffect` con cleanup del event listener

---

## 3. Integración en la App

### `src/App.jsx`
- Import de `GalleryDashboard` y `galleryPhotos` desde `gallery.json`
- Nueva pestaña **"Galeria"** en la navegación
- Vista `gallery` renderiza `<GalleryDashboard photos={galleryPhotos} />`

### `public/sw.js` (Service Worker)
- Agregado `.webp` a las extensiones cacheadas
- Agregado `url.pathname.includes('/gallery/')` para cachear todas las rutas de galería
- Estrategia Cache-First (stale-while-revalidate) para imágenes WebP offline

---

## 4. Arquitectura Offline

```
public/gallery/
├── 1/                    # Buenos Aires (16 fotos)
│   ├── *.webp            # Imágenes completas (1920px, q80)
│   └── thumbs/*.webp     # Miniaturas (400px, q70)
├── 2/                    # Rosario (223 fotos)
├── 3/                    # Bariloche (753 fotos)
├── 4/                    # Mendoza (248 fotos)
├── 5/                    # Salta/Jujuy (467 fotos)
├── 6/                    # Iguazú (567 fotos)
└── 7/                    # Corrientes (278 fotos)

src/data/gallery.json     # Metadatos de las 2552 fotos
```

### Flujo offline
1. El Service Worker cachea las imágenes WebP de `/gallery/` con estrategia Cache-First
2. `gallery.json` se incluye en el bundle de Vite (import estático)
3. Las miniaturas se cargan con `loading="lazy"` para rendimiento
4. El lightbox usa la imagen completa desde caché

---

## 5. Verificación

- `npm run build`: ✓ **37 módulos** transformados, built en 6m 42s
- `npm run lint`: ✓ ESLint sin errores
- Bundle: 1.30 MB (gzip: 182 KB) — incluye gallery.json con 2552 fotos

---

## 6. Estado de Git

```
4b5b32c7 (HEAD -> develop) feat(gallery): release v0.7 base with 2247 photos and offline lightbox
cc588001 (tag: v0.6) feat(v0.6): modulo de documentos y vouchers con IndexedDB offline
```

### Cambios pendientes de commit (v0.7 final)
- `scripts/process-photos.js` — Soporte HEIC + omitir existentes
- `package.json` / `package-lock.json` — `heic-convert` agregado
- `src/data/gallery.json` — Actualizado a 2552 fotos
- `public/gallery/` — 305 WebP nuevos (HEIC convertidas)
- `docs/HANDOFF_v0.7.md` — Este documento

---

## 7. Próximos pasos sugeridos (v0.8)

1. **Code-splitting** — Cargar `gallery.json` con `import()` dinámico para reducir el bundle inicial
2. **Miniaturas en el grid** — Usar `srcset` para responsive images
3. **Búsqueda por fecha** — Agregar filtro por día del viaje
4. **Mapa de fotos** — Integrar con Leaflet para ver fotos por ubicación GPS
5. **Exportar galería** — Descargar selección de fotos como ZIP