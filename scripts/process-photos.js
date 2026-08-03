import { readdir, mkdir, writeFile, stat } from "node:fs/promises";
import { join, extname, parse } from "node:path";
import process from "node:process";
import sharp from "sharp";

// ─── Configuración ────────────────────────────────────────────────────────────
const SOURCE_ROOT = "F:\\2025\\Octubre\\Viaje Familiar de 30 dias por Argentina";
const OUTPUT_ROOT = "public/gallery";
const GALLERY_JSON = "src/data/gallery.json";

const MAX_WIDTH_FULL = 1920;
const QUALITY_FULL = 80;
const MAX_WIDTH_THUMB = 400;
const QUALITY_THUMB = 70;

const SUPPORTED_EXT = [".jpg", ".jpeg", ".png", ".heic"];

// ─── Mapa de carpetas hebreas → cityId (src/data/cities.json) ────────────────
// cityId: 1=Buenos Aires, 2=Rosario, 3=Bariloche, 4=Mendoza, 5=Jujuy, 6=Puerto Iguazú, 7=Corrientes
const HEBREW_FOLDER_MAP = {
  "יום 5 - רוסאריו Costanera": 2, // Rosario
  "יום 6 - רוסאריו Costanera": 2, // Rosario
  "יום 7 - רוסאריו Costanera": 2, // Rosario
  "יום 9 - וילה טראפול ושבעת האגמים": 3, // Villa Traful / 7 Lagos → Bariloche
  "יום 10 - וילה טראפול ושבעת האגמים": 3, // Villa Traful / 7 Lagos → Bariloche
  "יום 11 - ברילוצ'ה מרכז": 3, // Bariloche centro
  "יום 12 - וילה טראפול ושבעת האגמים": 3, // Villa Traful / 7 Lagos → Bariloche
  "יום 13 - אל בולסון - ריו אזול": 3, // El Bolsón / Río Azul → Bariloche
  "יום 14 - ברילוצ'ה מרכז": 3, // Bariloche centro
  "יום 15 - mendoza": 4, // Mendoza
  "יום 16 - mendoza": 4, // Mendoza
  "יום 17 - פואנטה דל אינקה ואנדים": 4, // Puente del Inca / Andes → Mendoza
  "יום 19 - סלטה מרכז - סן לורנסו": 5, // Salta / San Lorenzo → Jujuy
  "יום 20 - סלטה מרכז - סן לורנסו": 5, // Salta / San Lorenzo → Jujuy
  "יום 21 - סלינאס גרנדס וקואסטה דל ליפאן": 5, // Salinas Grandes → Jujuy
  "יום 22 - סלטה מרכז - סן לורנסו": 5, // Salta / San Lorenzo → Jujuy
  "יום 23 - נסיעה לאיגואסו - צ'אקו": 6, // Viaje a Iguazú / Chaco → Puerto Iguazú
  "יום 24 - מפלי איגואסו": 6, // Cataratas Iguazú
  "יום 25 - מפלי איגואסו": 6, // Cataratas Iguazú
  "יום 26 - אסטרוס דל איברה": 7, // Esteros del Iberá → Corrientes
  "יום 27 - אסטרוס דל איברה": 7, // Esteros del Iberá → Corrientes
  "יום 28 - קוריינטס קוסטנרה": 7, // Corrientes costanera
  "יום 29 - קוריינטס קוסטנרה": 7, // Corrientes costanera
  "יום 30 - קוריינטס קוסטנרה": 7, // Corrientes costanera
  "יום 31 - בואנוס איירס לה בוקה - קמיניטו": 1, // Buenos Aires La Boca / Caminito
};

// ─── Utilidades ───────────────────────────────────────────────────────────────
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─── Procesamiento ────────────────────────────────────────────────────────────
async function processFolder(folderName, cityId, gallery) {
  const folderPath = join(SOURCE_ROOT, folderName);
  const outDir = join(OUTPUT_ROOT, String(cityId));
  const thumbsDir = join(outDir, "thumbs");

  await mkdir(outDir, { recursive: true });
  await mkdir(thumbsDir, { recursive: true });

  const files = await readdir(folderPath);
  const images = files.filter((f) => SUPPORTED_EXT.includes(extname(f).toLowerCase()));

  console.log(`\n📁 ${folderName} → cityId ${cityId} (${images.length} imágenes)`);

  let processed = 0;
  for (const file of images) {
    const srcPath = join(folderPath, file);
    const base = parse(file).name;
    const slug = slugify(base);
    const outName = `${slug}.webp`;
    const thumbName = `${slug}.webp`;

    const fullPath = join(outDir, outName);
    const thumbPath = join(thumbsDir, thumbName);

    try {
      const srcStats = await stat(srcPath);

      // Imagen completa (máx 1920px, calidad 80%)
      await sharp(srcPath, { failOn: "none" })
        .rotate()
        .resize({ width: MAX_WIDTH_FULL, withoutEnlargement: true })
        .webp({ quality: QUALITY_FULL })
        .toFile(fullPath);

      // Miniatura (máx 400px, calidad 70%)
      await sharp(srcPath, { failOn: "none" })
        .rotate()
        .resize({ width: MAX_WIDTH_THUMB, withoutEnlargement: true })
        .webp({ quality: QUALITY_THUMB })
        .toFile(thumbPath);

      const fullStats = await stat(fullPath);
      const thumbStats = await stat(thumbPath);

      gallery.push({
        id: `${cityId}-${slug}`,
        cityId,
        folder: folderName,
        filename: outName,
        src: `/gallery/${cityId}/${outName}`,
        thumb: `/gallery/${cityId}/thumbs/${thumbName}`,
        original: file,
        originalSize: srcStats.size,
        size: fullStats.size,
        thumbSize: thumbStats.size,
        width: MAX_WIDTH_FULL,
        height: null,
        date: null,
      });

      processed++;
    } catch (err) {
      console.warn(`  ⚠️ Error procesando ${file}: ${err.message}`);
    }
  }

  console.log(`  ✅ ${processed}/${images.length} procesadas`);
  return processed;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🖼️  Procesando fotos del viaje...");
  console.log(`📂 Origen: ${SOURCE_ROOT}`);
  console.log(`📂 Destino: ${OUTPUT_ROOT}`);

  const folders = await readdir(SOURCE_ROOT, { withFileTypes: true });
  const gallery = [];
  let total = 0;

  for (const entry of folders) {
    if (!entry.isDirectory()) continue;

    const cityId = HEBREW_FOLDER_MAP[entry.name];
    if (!cityId) {
      console.warn(`\n⚠️  Carpeta sin mapeo (omitida): ${entry.name}`);
      continue;
    }

    total += await processFolder(entry.name, cityId, gallery);
  }

  // Ordenar por cityId y nombre
  gallery.sort((a, b) => a.cityId - b.cityId || a.filename.localeCompare(b.filename));

  // Escribir gallery.json
  await mkdir("src/data", { recursive: true });
  await writeFile(GALLERY_JSON, JSON.stringify(gallery, null, 2), "utf-8");

  console.log("\n════════════════════════════════════════════");
  console.log(`✅ Procesadas ${total} fotos en total`);
  console.log(`📄 Metadatos: ${GALLERY_JSON}`);
  console.log(`📦 Tamaño total: ${formatBytes(gallery.reduce((s, p) => s + p.size, 0))}`);
  console.log("════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});