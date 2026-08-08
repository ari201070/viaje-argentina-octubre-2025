import { useTripStore } from '../store/useTripStore';
import type { Photo } from '../types';

/**
 * photoGeoService.ts — Geolocalización Temporal de Fotos por Vouchers
 *
 * Regla de negocio:
 * 1. Si la foto TIENE coordenadas EXIF/GPS, se conservan tal cual.
 * 2. Si NO tiene GPS pero tiene timestamp (fecha/hora):
 *    a. Se buscan Vouchers/Reservas/Actividades (del store `useTripStore`
 *       o de los datos del itinerario en `localStorage` `travel_bookings`)
 *       para la misma fecha.
 *    b. Se evalúa si el timestamp de la foto coincide con el horario del
 *       voucher/actividad dentro de un margen flexible de ±1 hora.
 *    c. Si hay coincidencia, se asignan las coordenadas del Voucher/Lugar.
 */

/** Margen flexible de coincidencia temporal en milisegundos (±1 hora). */
export const TIME_MATCH_WINDOW_MS = 60 * 60 * 1000;

/** Clave usada por el módulo booking-hub para persistir los vouchers. */
export const TRAVEL_BOOKINGS_STORAGE_KEY = 'travel_bookings';

/** Origen de la resolución de coordenadas. */
export type GeoResolutionSource = 'exif' | 'voucher' | 'activity' | 'itinerary';

/** Evento temporal unificado (voucher, actividad, lugar, transporte, etc.). */
export interface GeoEvent {
  id: string;
  name: string;
  /** Fecha del evento en formato YYYY-MM-DD. */
  date: string;
  /** Hora de inicio en formato HH:MM (opcional). */
  startTime?: string;
  /** Hora de fin en formato HH:MM (opcional). */
  endTime?: string;
  lat?: number;
  lng?: number;
  source: GeoResolutionSource;
}

/** Contexto opcional para inyectar datos (facilita testing y desacoplamiento). */
export interface PhotoGeoContext {
  /** Vouchers/reservas del módulo booking-hub (TravelBooking[]). */
  bookings?: Array<{
    id: string;
    title?: string;
    supplier?: string;
    fileName?: string;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    location?: string;
    coordinates?: { lat: number; lng: number };
  }>;
  /** Trips del store useTripStore. */
  trips?: ReturnType<typeof useTripStore.getState>['trips'];
}

/** Resultado del enriquecimiento de una foto. */
export interface EnrichedPhoto extends Photo {
  /** Coordenadas finales (EXIF o inferidas). */
  lat?: number;
  lng?: number;
  /** Nombre del lugar/voucher que aportó las coordenadas. */
  locationName?: string;
  /** Origen de la resolución. */
  resolutionSource?: GeoResolutionSource;
  /** Evento que coincidió (para trazabilidad). */
  matchedEvent?: GeoEvent;
}

/* ------------------------------------------------------------------ */
/* Utilidades de fecha                                                 */
/* ------------------------------------------------------------------ */

/**
 * Normaliza una fecha de foto a timestamp (ms).
 * Soporta timestamps numéricos, ISO strings y formato EXIF
 * "YYYY:MM:DD HH:MM:SS". Devuelve null si no se puede parsear.
 */
export function normalizePhotoDate(date?: number | string): number | null {
  if (date === undefined || date === null || date === "") return null;

  // Ya es timestamp numérico.
  if (typeof date === "number") {
    return Number.isFinite(date) && date > 0 ? date : null;
  }

  const str = date.trim();

  // Formato EXIF: "2025:10:27 12:33:28"
  const exifMatch = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(str);
  if (exifMatch) {
    const [, y, mo, d, h, mi, s] = exifMatch.map(Number);
    const ts = new Date(y, mo - 1, d, h, mi, s).getTime();
    return Number.isFinite(ts) ? ts : null;
  }

  // ISO o cualquier formato parseable por Date.
  const ts = new Date(str).getTime();
  return Number.isFinite(ts) ? ts : null;
}

/** Convierte un timestamp (ms) a fecha local YYYY-MM-DD. */
export function toDateKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Convierte un timestamp (ms) a hora local HH:MM. */
export function toTimeKey(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Convierte "HH:MM" a minutos desde medianoche. Devuelve null si es inválido. */
export function timeToMinutes(time?: string): number | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

/* ------------------------------------------------------------------ */
/* Recolección de eventos                                              */
/* ------------------------------------------------------------------ */

/** Lee los vouchers del módulo booking-hub desde localStorage. */
export function loadBookingsFromStorage(): PhotoGeoContext['bookings'] {
  try {
    const raw = localStorage.getItem(TRAVEL_BOOKINGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('[photoGeoService] Error leyendo travel_bookings:', e);
    return [];
  }
}

/** Convierte un voucher de booking-hub en un GeoEvent. */
export function bookingToEvent(booking: NonNullable<PhotoGeoContext['bookings']>[number]): GeoEvent | null {
  const date = booking.startDate || booking.endDate;
  if (!date) return null;
  const coords = booking.coordinates;
  return {
    id: booking.id,
    name: booking.supplier || booking.title || booking.fileName || 'Voucher',
    date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    lat: coords?.lat,
    lng: coords?.lng,
    source: 'voucher',
  };
}

/** Convierte un destino del store en GeoEvents (actividades, lugares, alojamiento, transporte). */
export function destinationToEvents(dest: {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  startDate?: string;
  endDate?: string;
  activities?: string[];
  placesList?: Array<{ id: string; name: string; lat?: number; lng?: number }>;
  lodgings?: Array<{ id: string; name: string; lat?: number; lng?: number }>;
  transports?: Array<{ id: string; type: string; provider: string; departureTime?: string; arrivalTime?: string }>;
}): GeoEvent[] {
  const events: GeoEvent[] = [];
  const date = dest.startDate || dest.endDate;

  // El propio destino como evento (si tiene fecha y coordenadas).
  if (date && dest.lat !== undefined && dest.lng !== undefined) {
    events.push({
      id: `dest-${dest.id}`,
      name: dest.name,
      date,
      lat: dest.lat,
      lng: dest.lng,
      source: 'itinerary',
    });
  }

  // Lugares (placesList) con coordenadas propias.
  (dest.placesList || []).forEach((place) => {
    if (date && place.lat !== undefined && place.lng !== undefined) {
      events.push({
        id: `place-${place.id}`,
        name: place.name,
        date,
        lat: place.lat,
        lng: place.lng,
        source: 'activity',
      });
    }
  });

  // Alojamientos con coordenadas propias.
  (dest.lodgings || []).forEach((lodging) => {
    if (date && lodging.lat !== undefined && lodging.lng !== undefined) {
      events.push({
        id: `lodging-${lodging.id}`,
        name: lodging.name,
        date,
        lat: lodging.lat,
        lng: lodging.lng,
        source: 'activity',
      });
    }
  });

  // Transportes con coordenadas propias.
  (dest.transports || []).forEach((transport) => {
    if (date && transport.lat !== undefined && transport.lng !== undefined) {
      events.push({
        id: `transport-${transport.id}`,
        name: `${transport.provider} (${transport.type})`,
        date,
        startTime: transport.departureTime,
        endTime: transport.arrivalTime,
        lat: transport.lat,
        lng: transport.lng,
        source: 'activity',
      });
    }
  });

  return events;
}

/** Recolecta todos los eventos disponibles (vouchers + itinerario del store). */
export function collectGeoEvents(context?: PhotoGeoContext): GeoEvent[] {
  const events: GeoEvent[] = [];

  // 1) Vouchers del módulo booking-hub.
  const bookings = context?.bookings ?? loadBookingsFromStorage();
  (bookings || []).forEach((b) => {
    const ev = bookingToEvent(b);
    if (ev) events.push(ev);
  });

  // 2) Itinerario del store useTripStore.
  const trips = context?.trips ?? useTripStore.getState().trips;
  (trips || []).forEach((trip) => {
    (trip.destinations || []).forEach((dest) => {
      events.push(...destinationToEvents(dest));
    });
  });

  return events;
}

/* ------------------------------------------------------------------ */
/* Lógica de coincidencia temporal                                     */
/* ------------------------------------------------------------------ */

/**
 * Determina si un timestamp de foto coincide con un evento dentro del
 * margen flexible de ±1 hora.
 *
 * - Si el evento tiene startTime/endTime, se compara contra esa ventana
 *   (ampliada ±1h en cada extremo).
 * - Si el evento solo tiene fecha (sin hora), se considera que coincide
 *   cualquier hora de ese día.
 */
export function matchesEventWindow(photoTs: number, event: GeoEvent): boolean {
  const photoMinutes = timeToMinutes(toTimeKey(photoTs));
  const startMinutes = timeToMinutes(event.startTime);
  const endMinutes = timeToMinutes(event.endTime);

  // Evento sin hora: coincide cualquier momento del día.
  if (startMinutes === null && endMinutes === null) {
    return true;
  }

  if (photoMinutes === null) {
    return false;
  }

  const windowStart = (startMinutes ?? 0) - 60; // ±1h
  const windowEnd = (endMinutes ?? startMinutes ?? 0) + 60; // ±1h

  return photoMinutes >= windowStart && photoMinutes <= windowEnd;
}

/**
 * Encuentra el mejor evento para una foto según su timestamp.
 * Prioriza eventos con coordenadas y con la coincidencia temporal más cercana.
 */
export function findBestEvent(photoTs: number, events: GeoEvent[]): GeoEvent | null {
  const sameDate = events.filter((ev) => ev.date === toDateKey(photoTs));
  if (sameDate.length === 0) return null;

  const withCoords = sameDate.filter((ev) => ev.lat !== undefined && ev.lng !== undefined);
  const candidates = withCoords.length > 0 ? withCoords : sameDate;

  const matching = candidates.filter((ev) => matchesEventWindow(photoTs, ev));
  if (matching.length === 0) return null;

  // Elegir el evento con la ventana temporal más cercana al timestamp de la foto.
  const photoMinutes = timeToMinutes(toTimeKey(photoTs)) ?? 0;
  return matching.sort((a, b) => {
    const aStart = timeToMinutes(a.startTime) ?? 0;
    const bStart = timeToMinutes(b.startTime) ?? 0;
    return Math.abs(aStart - photoMinutes) - Math.abs(bStart - photoMinutes);
  })[0];
}

/* ------------------------------------------------------------------ */
/* Función principal                                                   */
/* ------------------------------------------------------------------ */

/**
 * Enriquece la metadata de una foto con coordenadas inferidas por timestamp.
 *
 * Reglas:
 * 1. Si la foto ya tiene lat/lng (EXIF/GPS), se conservan y se marca
 *    `resolutionSource: 'exif'`.
 * 2. Si no tiene GPS pero tiene `date`, se buscan vouchers/actividades
 *    para la misma fecha y se evalúa la coincidencia de ±1 hora.
 * 3. Si hay coincidencia, se asignan las coordenadas del voucher/lugar.
 *
 * @param photo Foto a enriquecer.
 * @param context Contexto opcional (vouchers/trips) para testing o inyección.
 * @returns La foto enriquecida (nueva referencia, no muta la original).
 */
export function enrichPhotoWithGeo(photo: Photo, context?: PhotoGeoContext): EnrichedPhoto {
  const enriched: EnrichedPhoto = { ...photo };

  // 1) GPS/EXIF presente → conservar.
  if (photo.lat !== undefined && photo.lng !== undefined) {
    enriched.resolutionSource = 'exif';
    return enriched;
  }

  // 2) Sin GPS pero con timestamp → intentar inferir.
  const photoTs = normalizePhotoDate(photo.date as number | string | undefined);
  if (photoTs !== null) {
    const events = collectGeoEvents(context);
    const best = findBestEvent(photoTs, events);

    if (best && best.lat !== undefined && best.lng !== undefined) {
      enriched.lat = best.lat;
      enriched.lng = best.lng;
      enriched.locationName = best.name;
      enriched.resolutionSource = best.source;
      enriched.matchedEvent = best;
    }
  }

  return enriched;
}

/**
 * Enriquece un lote de fotos. Devuelve un nuevo array con las fotos
 * enriquecidas (no muta el original).
 */
export function enrichPhotosWithGeo(photos: Photo[], context?: PhotoGeoContext): EnrichedPhoto[] {
  return photos.map((photo) => enrichPhotoWithGeo(photo, context));
}