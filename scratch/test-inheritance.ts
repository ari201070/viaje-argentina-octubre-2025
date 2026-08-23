/**
 * test-inheritance.ts — Prueba del Motor de Herencia Espacio-Temporal
 *
 * Verifica que photoGeoService.ts asigne correctamente coordenadas
 * a fotos sin GPS usando vouchers/documentos como fuente de geo.
 *
 * Ejecutar: npx tsx scratch/test-inheritance.ts
 */

import {
  normalizePhotoDate,
  enrichPhotoWithGeo,
  enrichPhotoWithGeoAsync,
  collectGeoEventsAsync,
  collectGeoEventsSync,
  findBestEvent,
  matchesEventWindow,
  matchesEventWindowUTC,
  dateTimeToUTC,
  toDateKeyUTC,
  toTimeKeyUTC,
  CAMERA_TZ_OFFSET_HOURS,
  ARGENTINA_TZ_OFFSET_HOURS,
  type Photo,
  type PhotoGeoContext,
  type IDBDocument,
} from '../src/services/photoGeoService';

// ─────────────────────────────────────────────────────────
// Datos de prueba
// ─────────────────────────────────────────────────────────

/** Coordenadas reales del Hotel Concorde, Bariloche */
const HOTEL_CONCORDE = {
  id: 'hotel-concorde-001',
  name: 'Hotel Concorde, Bariloche',
  lat: -41.13343,
  lng: -71.31141,
  startDate: '2025-10-05',
  endDate: '2025-10-08',
  startTime: '14:00',
  endTime: '12:00',
};

/** Vouchers de prueba (simulan datos de IndexedDB) */
const TEST_DOCUMENTS: IDBDocument[] = [
  {
    id: 1,
    title: 'Hotel Concorde, Bariloche',
    city: 'San Carlos de Bariloche',
    latitude: HOTEL_CONCORDE.lat,
    longitude: HOTEL_CONCORDE.lng,
    start_date: HOTEL_CONCORDE.startDate,
    end_date: HOTEL_CONCORDE.endDate,
    start_time: HOTEL_CONCORDE.startTime,
    end_time: HOTEL_CONCORDE.endTime,
    category: 'alojamiento',
    cityId: '3',
  },
  {
    id: 2,
    title: 'Excursión Circuito Chico',
    city: 'San Carlos de Bariloche',
    latitude: -41.12500,
    longitude: -71.28000,
    start_date: '2025-10-06',
    end_date: '2025-10-06',
    start_time: '09:00',
    end_time: '13:00',
    category: 'actividad',
    cityId: '3',
  },
];

/** Contexto de prueba */
const TEST_CONTEXT: PhotoGeoContext = {
  documents: TEST_DOCUMENTS,
  bookings: [],
  trips: [],
};

// ─────────────────────────────────────────────────────────
// Foto de prueba: Bariloche sin GPS
// ─────────────────────────────────────────────────────────

const TEST_PHOTO: Photo = {
  id: 'test-photo-001',
  url: '/photos/vista_lago_concorde.jpg',
  date: undefined, // Se establecerá en cada prueba
  lat: null as unknown as number,
  lng: null as unknown as number,
};

// ─────────────────────────────────────────────────────────
// Utilidades de prueba
// ─────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    failed++;
  }
}

function assertApprox(actual: number, expected: number, tolerance: number, label: string): void {
  const diff = Math.abs(actual - expected);
  const ok = diff <= tolerance;
  if (ok) {
    console.log(`  ✅ ${label}: ${actual} (≈${expected}, diff: ${diff.toFixed(6)})`);
    passed++;
  } else {
    console.log(`  ❌ ${label}: ${actual} (esperado ~${expected}, diff: ${diff.toFixed(6)})`);
    failed++;
  }
}

// ─────────────────────────────────────────────────────────
// Pruebas
// ─────────────────────────────────────────────────────────

async function runTests(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  PRUEBA: Motor de Herencia Espacio-Temporal');
  console.log('═══════════════════════════════════════════════════\n');

  // ─────────────────────────────────────────────────
  // Prueba 1: Normalización de fecha EXIF
  // ─────────────────────────────────────────────────
  console.log('📸 Prueba 1: Normalización de fecha EXIF');

  const exifDate = '2025:10:06 16:30:00';
  const ts = normalizePhotoDate(exifDate);
  assert(ts !== null, `Fecha EXIF parseada: ${exifDate} → ${ts}`);

  if (ts !== null) {
    const dateKey = toDateKeyUTC(ts);
    const timeKey = toTimeKeyUTC(ts);
    assert(dateKey === '2025-10-06', `Fecha UTC correcta: ${dateKey} === 2025-10-06`);
    assert(timeKey === '19:30', `Hora UTC correcta: ${timeKey} === 19:30 (16:30 ARG + 3h)`);
  }

  // ─────────────────────────────────────────────────
  // Prueba 2: Enriquecimiento con voucher (Hotel Concorde)
  // ─────────────────────────────────────────────────
  console.log('\n🏨 Prueba 2: Enriquecimiento con Hotel Concorde');

  const photoInHotel: Photo = {
    ...TEST_PHOTO,
    id: 'test-hotel-001',
    date: '2025:10:06 16:30:00' as unknown as number,
  };

  const enriched = enrichPhotoWithGeo(photoInHotel, TEST_CONTEXT);

  assert(enriched.lat !== undefined && enriched.lat !== null, `Latitud asignada: ${enriched.lat}`);
  assert(enriched.lng !== undefined && enriched.lng !== null, `Longitud asignada: ${enriched.lng}`);

  if (enriched.lat !== undefined && enriched.lng !== undefined) {
    assertApprox(enriched.lat, HOTEL_CONCORDE.lat, 0.001, 'Latitud Hotel Concorde');
    assertApprox(enriched.lng, HOTEL_CONCORDE.lng, 0.001, 'Longitud Hotel Concorde');
  }

  assert(
    enriched.location_source === 'VOUCHER_INHERITANCE',
    `location_source: ${enriched.location_source} === VOUCHER_INHERITANCE`
  );

  assert(
    enriched.inherited_from_voucher_id === 'idb-1',
    `inherited_from_voucher_id: ${enriched.inherited_from_voucher_id} === idb-1`
  );

  assert(
    enriched.locationName === 'Hotel Concorde, Bariloche',
    `locationName: ${enriched.locationName}`
  );

  // ─────────────────────────────────────────────────
  // Prueba 3: Foto CON GPS (no debe heredar)
  // ─────────────────────────────────────────────────
  console.log('\n📍 Prueba 3: Foto con GPS propio (no hereda)');

  const photoWithGPS: Photo = {
    ...TEST_PHOTO,
    id: 'test-gps-001',
    date: '2025:10:06 16:30:00' as unknown as number,
    lat: -34.6037,
    lng: -58.3816,
  };

  const enrichedGPS = enrichPhotoWithGeo(photoWithGPS, TEST_CONTEXT);

  assert(enrichedGPS.lat === -34.6037, `Latitud conservada: ${enrichedGPS.lat}`);
  assert(enrichedGPS.lng === -58.3816, `Longitud conservada: ${enrichedGPS.lng}`);
  assert(
    enrichedGPS.location_source === 'EXIF_GPS',
    `location_source: ${enrichedGPS.location_source} === EXIF_GPS`
  );

  // ─────────────────────────────────────────────────
  // Prueba 4: Foto fuera de rango temporal
  // ─────────────────────────────────────────────────
  console.log('\n⏰ Prueba 4: Foto fuera de rango temporal');

  const photoOutOfRange: Photo = {
    ...TEST_PHOTO,
    id: 'test-out-001',
    date: '2025:10:10 16:30:00' as unknown as number, // 4 días después del checkout
  };

  const enrichedOut = enrichPhotoWithGeo(photoOutOfRange, TEST_CONTEXT);

  assert(!enrichedOut.lat, `Sin latitud (fuera de rango): ${enrichedOut.lat}`);
  assert(!enrichedOut.lng, `Sin longitud (fuera de rango): ${enrichedOut.lng}`);

  // ─────────────────────────────────────────────────
  // Prueba 5: matchesEventWindow con evento multi-día
  // ─────────────────────────────────────────────────
  console.log('\n🌐 Prueba 5: Comparación UTC con evento multi-día');

  const photoTs = dateTimeToUTC('2025-10-06', '16:30');
  assert(photoTs !== null, `Timestamp UTC calculado: ${photoTs}`);

  if (photoTs !== null) {
    // Foto del 6/10 a las 16:30 →Hotel Concorde (5/10 14:00 – 8/10 12:00)
    const hotelEvent = {
      id: 'hotel-test',
      name: 'Hotel Concorde',
      date: '2025-10-05',
      endDate: '2025-10-08',
      startTime: '14:00',
      endTime: '12:00',
      lat: -41.13,
      lng: -71.31,
      source: 'idb_document' as const,
    };
    const matchInWindow = matchesEventWindow(photoTs, hotelEvent);
    assert(matchInWindow === true, `Foto dentro de ventana del hotel: ${matchInWindow}`);

    // Foto del 10/10 → fuera del rango del hotel
    const photoOutOfRangeTs = dateTimeToUTC('2025-10-10', '16:30')!;
    const matchOutside = matchesEventWindow(photoOutOfRangeTs, hotelEvent);
    assert(matchOutside === false, `Foto fuera de ventana: ${matchOutside}`);
  }

  // ─────────────────────────────────────────────────
  // Prueba 6: Simulación de desfase de zona horaria
  // ─────────────────────────────────────────────────
  console.log('\n🌍 Prueba 6: Desfase de zona horaria de cámara');

  // Simular cámara con hora de Israel (GMT+3) → offset -6 para llegar a Argentina (GMT-3)
  const photoWithOffset: Photo = {
    ...TEST_PHOTO,
    id: 'test-offset-001',
    date: '2025:10:06 19:30:00' as unknown as number, // 19:30 en Israel = 16:30 en Argentina
  };

  const enrichedWithOffset = normalizePhotoDate(
    '2025:10:06 19:30:00',
    -6 // Camera TZ offset: Israel (GMT+3) → Argentina (GMT-3)
  );

  assert(enrichedWithOffset !== null, `Fecha con offset parseada: ${enrichedWithOffset}`);

  if (enrichedWithOffset !== null) {
    const timeKey = toTimeKeyUTC(enrichedWithOffset);
    assert(timeKey === '16:30', `Hora UTC ajustada: ${timeKey} === 16:30 (19:30 - 3h = 16:30)`);
  }

  // ─────────────────────────────────────────────────
  // Prueba 7: Enriquecimiento asíncrono (sin IndexedDB real)
  // ─────────────────────────────────────────────────
  console.log('\n⚡ Prueba 7: Enriquecimiento asíncrono con contexto inyectado');

  const photoAsync: Photo = {
    ...TEST_PHOTO,
    id: 'test-async-001',
    date: '2025:10:06 11:00:00' as unknown as number, // Durante excursión Circuito Chico
  };

  // Usar collectGeoEventsAsync con contexto inyectado
  const events = await collectGeoEventsAsync(TEST_CONTEXT);
  assert(events.length >= 2, `Eventos recolectados: ${events.length}`);

  // Verificar que los documentos están en los eventos
  const idbEvents = events.filter((e) => e.source === 'idb_document');
  assert(idbEvents.length === 2, `Eventos de IDB: ${idbEvents.length}`);

  // ─────────────────────────────────────────────────
  // Resumen
  // ─────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  RESULTADO: ${passed} pasaron, ${failed} fallaron`);
  console.log('═══════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

// Ejecutar pruebas
runTests().catch((err) => {
  console.error('Error ejecutando pruebas:', err);
  process.exit(1);
});
