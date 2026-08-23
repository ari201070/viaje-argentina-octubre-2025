import { useTripStore } from '../store/useTripStore';
import type { Photo } from '../types';
import { getAllItems } from '../utils/idbStorage';

/**
 * photoGeoService.ts — Geolocalización Temporal de Fotos por Vouchers
 *
 * Regla de negocio:
 * 1. Si la foto TIENE coordenadas EXIF/GPS, se conservan tal cual.
 * 2. Si NO tiene GPS pero tiene timestamp (fecha/hora):
 *    a. Se buscan Vouchers/Reservas/Actividades/Documentos (de 3 fuentes):
 *       - IndexedDB (documentos procesados con coordenadas)
 *       - localStorage (travel_bookings del módulo booking-hub)
 *       - useTripStore (itinerario base)
 *    b. Se evalúa si el timestamp de la foto coincide con el horario del
 *       voucher/actividad/documento dentro de un margen flexible de ±1 hora.
 *    c. Si hay coincidencia, se asignan las coordenadas del Voucher/Lugar.
 */

/** Margen flexible de coincidencia temporal en milisegundos (±1 hora). */
export const TIME_MATCH_WINDOW_MS = 60 * 60 * 1000;

/**
 * Offset de zona horaria de la cámara en horas.
 * Por defecto 0 (asume que la cámara está configurada a la hora local de Argentina GMT-3).
 * Cambiar a -6 si la cámara grabó en hora de Israel (GMT+3) y se debe ajustar a Argentina.
 * Ejemplo: Si la cámara estaba en Israel (GMT+3) y viajás a Argentina (GMT-3), usar -6.
 */
export const CAMERA_TZ_OFFSET_HOURS = 0;

/** Zona horaria de Argentina (UTC-3). */
export const ARGENTINA_TZ_OFFSET_HOURS = -3;

/** Clave usada por el módulo booking-hub para persistir los vouchers. */
export const TRAVEL_BOOKINGS_STORAGE_KEY = 'travel_bookings';

// Caché singleton asíncrono en memoria para documentos de IndexedDB
let idbDocumentsCache: Promise<any[]> | null = null;

/**
 * Carga documentos desde IndexedDB de forma asíncrona.
 * Implementa caché singleton para evitar lecturas repetidas.
 * @returns Promise con array de documentos enriquecidos
 */
export async function loadDocumentsFromIDB(): Promise<Array<{
  id: number;
  title?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  category?: string;
  cityId?: string;
  createdAt?: string;
}>> {
  if (!idbDocumentsCache) {
    idbDocumentsCache = new Promise(async (resolve) => {
      try {
        const items = await getAllItems();
        // Filtrar solo documentos con coordenadas válidas
        const docsWithCoords = items.filter(
          (item) =>
            item.latitude != null &&
            item.longitude != null &&
            item.latitude !== 0 &&
            item.longitude !== 0
        );
        resolve(docsWithCoords);
      } catch (e) {
        console.error('[photoGeoService] Error leyendo IndexedDB:', e);
        resolve([]);
      }
    });
  }
  return idbDocumentsCache;
}

/** Invalida la caché de documentos IndexedDB (útil después de agregar/eliminar documentos). */
export function invalidateIDBCache(): void {
  idbDocumentsCache = null;
}

/** Origen de la resolución de coordenadas. */
export type GeoResolutionSource = 'exif' | 'voucher' | 'activity' | 'itinerary' | 'idb_document';

/** Evento temporal unificado (voucher, actividad, lugar, transporte, documento, etc.). */
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

/** Documento enriquecido desde IndexedDB (estructura esperada). */
export interface IDBDocument {
  id: number;
  title?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  category?: string;
  cityId?: string;
  createdAt?: string;
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
  /** Documentos pre-cargados desde IndexedDB (opcional). */
  documents?: IDBDocument[];
}

/** Resultado del enriquecimiento de una foto con motor de herencia espacio-temporal. */
export interface EnrichedPhoto extends Photo {
  lat?: number;
  lng?: number;
  locationName?: string;
  resolutionSource?: GeoResolutionSource | 'EXIF_GPS' | 'VOUCHER_INHERITANCE';
  matchedEvent?: GeoEvent;
  location_source?: 'EXIF_GPS' | 'VOUCHER_INHERITANCE';
  inherited_from_voucher_id?: string;
}

/* ------------------------------------------------------------------ */
/* Funciones de carga asíncrona de eventos                             */
/* ------------------------------------------------------------------ */

/** Convierte un documento de IndexedDB en un GeoEvent. */
export function documentToEvent(doc: IDBDocument): GeoEvent | null {
  // Usar start_date como fecha principal, fallback a end_date
  const date = doc.start_date || doc.end_date;
  if (!date) return null;

  // Extraer solo la parte de fecha (YYYY-MM-DD) si viene con hora
  const dateOnly = date.includes('T') ? date.split('T')[0] : date.split(' ')[0];

  // endDate: solo si es distinto de start_date
  let endDate: string | undefined;
  if (doc.end_date) {
    const endOnly = doc.end_date.includes('T') ? doc.end_date.split('T')[0] : doc.end_date.split(' ')[0];
    if (endOnly !== dateOnly) endDate = endOnly;
  }

  return {
    id: `idb-${doc.id}`,
    name: doc.title || doc.city || 'Documento',
    date: dateOnly,
    endDate,
    startTime: doc.start_time,
    endTime: doc.end_time,
    lat: doc.latitude,
    lng: doc.longitude,
    source: 'idb_document',
  };
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
    endDate: booking.endDate !== booking.startDate ? booking.endDate : undefined,
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

/* ------------------------------------------------------------------ */
/* Recolección de eventos (síncrona - sin IndexedDB)                   */
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

/** Recolecta eventos de forma síncrona (sin IndexedDB). */
export function collectGeoEventsSync(context?: PhotoGeoContext): GeoEvent[] {
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

  // 3) Documentos pre-cargados del contexto (si se proporcionan).
  const docs = context?.documents ?? [];
  (docs || []).forEach((doc) => {
    const ev = documentToEvent(doc);
    if (ev) events.push(ev);
  });

  return events;
}

/* ------------------------------------------------------------------ */
/* Recolección de eventos (asíncrona - con IndexedDB)                  */
/* ------------------------------------------------------------------ */

/**
 * Recolecta todos los eventos disponibles de forma asíncrona.
 * Fuentes: IndexedDB (documentos) + localStorage (vouchers) + useTripStore (itinerario).
 * Lee IndexedDB de forma no bloqueante.
 */
export async function collectGeoEventsAsync(context?: PhotoGeoContext): Promise<GeoEvent[]> {
  const events: GeoEvent[] = [];

  // 1) Documentos desde IndexedDB (lectura asíncrona no bloqueante).
  const idbDocs = context?.documents ?? await loadDocumentsFromIDB();
  (idbDocs || []).forEach((doc) => {
    const ev = documentToEvent(doc);
    if (ev) events.push(ev);
  });

  // 2) Vouchers del módulo booking-hub (localStorage, síncrono).
  const bookings = context?.bookings ?? loadBookingsFromStorage();
  (bookings || []).forEach((b) => {
    const ev = bookingToEvent(b);
    if (ev) events.push(ev);
  });

  // 3) Itinerario del store useTripStore (síncrono).
  const trips = context?.trips ?? useTripStore.getState().trips;
  (trips || []).forEach((trip) => {
    (trip.destinations || []).forEach((dest) => {
      events.push(...destinationToEvents(dest));
    });
  });

  return events;
}

/** Recolecta eventos disponibles (alias síncrono para compatibilidad). */
export function collectGeoEvents(context?: PhotoGeoContext): GeoEvent[] {
  return collectGeoEventsSync(context);
}

/* ------------------------------------------------------------------ */
/* Utilidades de fecha                                                 */
/* ------------------------------------------------------------------ */

/**
 * Normaliza una fecha de foto a timestamp (ms) en UTC.
 * Soporta timestamps numéricos, ISO strings y formato EXIF
 * "YYYY:MM:DD HH:MM:SS". Aplica offset de zona horaria de cámara si se configura.
 *
 * Conversión:
 *   Argentina_time = Camera_time + CAMERA_TZ_OFFSET_HOURS
 *   UTC = Argentina_time - ARGENTINA_TZ_OFFSET_HOURS (Argentina = UTC-3 → UTC = local + 3)
 *
 * @param date Fecha de la foto (timestamp numérico, string ISO, o formato EXIF)
 * @param cameraTzOffset Offset de zona horaria de la cámara en horas (opcional, usa CAMERA_TZ_OFFSET_HOURS por defecto)
 * @returns Timestamp en UTC (ms) o null si no se puede parsear
 */
export function normalizePhotoDate(date?: number | string, cameraTzOffset?: number): number | null {
  if (date === undefined || date === null || date === "") return null;

  const offsetHours = cameraTzOffset ?? CAMERA_TZ_OFFSET_HOURS;

  // Ya es timestamp numérico (asumido UTC).
  if (typeof date === "number") {
    return Number.isFinite(date) && date > 0 ? date : null;
  }

  const str = date.trim();

  // Formato EXIF: "2025:10:27 12:33:28" (hora local de la cámara)
  const exifMatch = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(str);
  if (exifMatch) {
    const [, y, mo, d, h, mi, s] = exifMatch.map(Number);
    // Usar Date.UTC() para evitar que la timezone local de la máquina interfiera
    // h + offsetHours = hora en Argentina, luego convertir a UTC
    const utcTs = Date.UTC(y, mo - 1, d, h + offsetHours, mi, s) - (ARGENTINA_TZ_OFFSET_HOURS * 3600000);
    return Number.isFinite(utcTs) ? utcTs : null;
  }

  // Formato ISO con Z explícito: "2025-10-27T12:33:28Z" (ya es UTC)
  if (str.endsWith('Z')) {
    const ts = new Date(str).getTime();
    return Number.isFinite(ts) ? ts : null;
  }

  // Formato ISO con offset: "2025-10-27T12:33:28-03:00"
  const isoWithOffset = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.exec(str);
  if (isoWithOffset) {
    const ts = new Date(str).getTime();
    return Number.isFinite(ts) ? ts : null;
  }

  // Formato ISO sin offset: "2025-10-27T12:33:28" o "2025-10-27 12:33:28"
  // Se interpreta como hora Argentina y se convierte a UTC
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(str);
  if (isoMatch) {
    const [, y, mo, d, h, mi, s] = isoMatch.map(Number);
    const utcTs = Date.UTC(y, parseInt(mo) - 1, parseInt(d), parseInt(h), parseInt(mi), parseInt(s)) - (ARGENTINA_TZ_OFFSET_HOURS * 3600000);
    return Number.isFinite(utcTs) ? utcTs : null;
  }

  // Último recurso: intentar parsear directamente (asume UTC)
  const ts = new Date(str).getTime();
  return Number.isFinite(ts) ? ts : null;
}

/**
 * Convierte una cadena de fecha (YYYY-MM-DD) y hora (HH:MM) a timestamp UTC.
 * Asume que la fecha/hora está en la zona horaria de Argentina (UTC-3).
 *
 * @param dateStr Fecha en formato YYYY-MM-DD
 * @param timeStr Hora en formato HH:MM (opcional)
 * @returns Timestamp UTC (ms) o null si no se puede parsear
 */
export function dateTimeToUTC(dateStr: string, timeStr?: string): number | null {
  if (!dateStr) return null;

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!dateMatch) return null;

  const [, y, mo, d] = dateMatch.map(Number);
  let h = 0, mi = 0;

  if (timeStr) {
    const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
    if (timeMatch) {
      h = parseInt(timeMatch[1]);
      mi = parseInt(timeMatch[2]);
    }
  }

  // Usar Date.UTC() para evitar interferencia de timezone local
  // Argentina es UTC-3, así que UTC = local + 3
  const utcTs = Date.UTC(y, mo - 1, d, h, mi, 0) - (ARGENTINA_TZ_OFFSET_HOURS * 3600000);
  return Number.isFinite(utcTs) ? utcTs : null;
}

/**
 * Obtiene la fecha UTC (YYYY-MM-DD) desde un timestamp.
 * @param ts Timestamp en UTC (ms)
 * @returns Fecha en formato YYYY-MM-DD
 */
export function toDateKeyUTC(ts: number): string {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Obtiene la hora UTC (HH:MM) desde un timestamp.
 * @param ts Timestamp en UTC (ms)
 * @returns Hora en formato HH:MM
 */
export function toTimeKeyUTC(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

/** Convierte un timestamp (ms) a fecha local YYYY-MM-DD (compatibilidad). */
export function toDateKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Convierte un timestamp (ms) a hora local HH:MM (compatibilidad). */
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
/* Lógica de coincidencia temporal                                     */
/* ------------------------------------------------------------------ */

/**
 * Determina si un timestamp de foto coincide con un evento dentro del
 * margen flexible de ±1 hora. Usa comparación UTC para evitar problemas
 * de zona horaria del navegador.
 *
 * - Si el evento tiene startTime/endTime, se compara contra esa ventana
 *   (ampliada ±1h en cada extremo).
 * - Si el evento solo tiene fecha (sin hora), se considera que coincide
 *   cualquier hora de ese día (en UTC).
 */
export function matchesEventWindow(photoTs: number, event: GeoEvent): boolean {
  const photoDateStr = toDateKeyUTC(photoTs);

  // Evento multi-día: si la foto cae dentro del rango de fechas, coincide
  if (event.endDate && photoDateStr >= event.date && photoDateStr <= event.endDate) {
    return true;
  }

  // Convertir timestamp de foto a minutos desde medianoche UTC
  const photoMinutes = timeToMinutes(toTimeKeyUTC(photoTs));
  const startMinutes = timeToMinutes(event.startTime);
  const endMinutes = timeToMinutes(event.endTime);

  // Evento sin hora: coincide cualquier momento del día.
  if (startMinutes === null && endMinutes === null) {
    return true;
  }

  if (photoMinutes === null) {
    return false;
  }

  // Ventana de ±1 hora alrededor del rango del evento
  const windowStart = (startMinutes ?? 0) - 60; // ±1h
  const windowEnd = (endMinutes ?? startMinutes ?? 0) + 60; // ±1h

  return photoMinutes >= windowStart && photoMinutes <= windowEnd;
}

/**
 * Determina si una foto coincide con un evento usando comparación absoluta en UTC.
 * Más preciso que matchesEventWindow para ventanas que cruzan medianoche.
 *
 * @param photoTs Timestamp de la foto en UTC (ms)
 * @param eventDate Fecha del evento (YYYY-MM-DD)
 * @param eventStartTime Hora de inicio (HH:MM, opcional)
 * @param eventEndTime Hora de fin (HH:MM, opcional)
 * @returns true si la foto está dentro de la ventana temporal del evento
 */
export function matchesEventWindowUTC(
  photoTs: number,
  eventDate: string,
  eventStartTime?: string,
  eventEndTime?: string
): boolean {
  // Si no hay horas definidas, cualquier momento del mismo día coincide
  if (!eventStartTime && !eventEndTime) {
    const photoDateKey = toDateKeyUTC(photoTs);
    return photoDateKey === eventDate;
  }

  // Convertir fecha del evento + horas a timestamps UTC absolutos
  const eventStartTs = eventStartTime
    ? dateTimeToUTC(eventDate, eventStartTime)
    : dateTimeToUTC(eventDate, '00:00');

  const eventEndTs = eventEndTime
    ? dateTimeToUTC(eventDate, eventEndTime)
    : dateTimeToUTC(eventDate, '23:59');

  if (eventStartTs === null || eventEndTs === null) {
    return false;
  }

  // Aplicar margen de ±1 hora
  const marginMs = 60 * 60 * 1000; // 1 hora en ms
  const windowStart = eventStartTs - marginMs;
  const windowEnd = eventEndTs + marginMs;

  return photoTs >= windowStart && photoTs <= windowEnd;
}

/**
 * Encuentra el mejor evento para una foto según su timestamp.
 * Prioriza eventos con coordenadas y con la coincidencia temporal más cercana.
 */
export function findBestEvent(photoTs: number, events: GeoEvent[]): GeoEvent | null {
  const photoDateStr = toDateKeyUTC(photoTs);

  // Un evento "cubre" la foto si su ventana [date..endDate] incluye la fecha de la foto
  const covering = events.filter((ev) => {
    if (!ev.endDate) {
      // Evento de un solo día: misma fecha exacta
      return ev.date === photoDateStr;
    }
    // Evento multi-día: foto dentro del rango [date, endDate] inclusive
    return photoDateStr >= ev.date && photoDateStr <= ev.endDate;
  });
  if (covering.length === 0) return null;

  const withCoords = covering.filter((ev) => ev.lat !== undefined && ev.lng !== undefined);
  const candidates = withCoords.length > 0 ? withCoords : covering;

  const matching = candidates.filter((ev) => matchesEventWindow(photoTs, ev));
  if (matching.length === 0) return null;

  // Elegir el evento con la ventana temporal más cercana al timestamp de la foto.
  const photoMinutes = timeToMinutes(toTimeKeyUTC(photoTs)) ?? 0;
  return matching.sort((a, b) => {
    const aStart = timeToMinutes(a.startTime) ?? 0;
    const bStart = timeToMinutes(b.startTime) ?? 0;
    return Math.abs(aStart - photoMinutes) - Math.abs(bStart - photoMinutes);
  })[0];
}

/* ------------------------------------------------------------------ */
/* Funciones de enriquecimiento                                       */
/* ------------------------------------------------------------------ */

/**
 * Enriquece una foto con coordenadas de forma síncrona (sin IndexedDB).
 * Usa eventos pre-cargados del contexto.
 */
export function enrichPhotoWithGeo(photo: Photo, context?: PhotoGeoContext): EnrichedPhoto {
  const enriched: EnrichedPhoto = { ...photo };

  // 1) GPS/EXIF directo presente
  if (photo.lat !== undefined && photo.lng !== undefined && photo.lat !== null && photo.lng !== null) {
    enriched.resolutionSource = 'exif';
    enriched.location_source = 'EXIF_GPS';
    return enriched;
  }

  // 2) Sin GPS directo -> Motor de herencia espacio-temporal por vouchers
  const photoTs = normalizePhotoDate(photo.date as number | string | undefined);
  if (photoTs !== null) {
    const events = collectGeoEventsSync(context);
    const best = findBestEvent(photoTs, events);

    if (best && best.lat !== undefined && best.lng !== undefined) {
      enriched.lat = best.lat;
      enriched.lng = best.lng;
      enriched.locationName = best.name;
      enriched.resolutionSource = best.source;
      enriched.matchedEvent = best;
      enriched.location_source = 'VOUCHER_INHERITANCE';
      enriched.inherited_from_voucher_id = best.id;
    }
  }

  return enriched;
}

/**
 * Enriquece una foto con coordenadas de forma asíncrona (con IndexedDB).
 * Lee documentos de IndexedDB de forma no bloqueante.
 *
 * @param photo Foto a enriquecer.
 * @param context Contexto opcional (vouchers/trips/documents) para testing o inyección.
 * @returns Promise con la foto enriquecida.
 */
export async function enrichPhotoWithGeoAsync(photo: Photo, context?: PhotoGeoContext): Promise<EnrichedPhoto> {
  const enriched: EnrichedPhoto = { ...photo };

  // 1) GPS/EXIF directo presente
  if (photo.lat !== undefined && photo.lng !== undefined && photo.lat !== null && photo.lng !== null) {
    enriched.resolutionSource = 'exif';
    enriched.location_source = 'EXIF_GPS';
    return enriched;
  }

  // 2) Sin GPS directo -> Motor de herencia espacio-temporal
  const photoTs = normalizePhotoDate(photo.date as number | string | undefined);
  if (photoTs !== null) {
    const events = await collectGeoEventsAsync(context);
    const best = findBestEvent(photoTs, events);

    if (best && best.lat !== undefined && best.lng !== undefined) {
      enriched.lat = best.lat;
      enriched.lng = best.lng;
      enriched.locationName = best.name;
      enriched.resolutionSource = best.source;
      enriched.matchedEvent = best;
      enriched.location_source = 'VOUCHER_INHERITANCE';
      enriched.inherited_from_voucher_id = best.id;
    }
  }

  return enriched;
}

/**
 * Enriquece un lote de fotos de forma síncrona (sin IndexedDB).
 * Devuelve un nuevo array con las fotos enriquecidas (no muta el original).
 */
export function enrichPhotosWithGeo(photos: Photo[], context?: PhotoGeoContext): EnrichedPhoto[] {
  return photos.map((photo) => enrichPhotoWithGeo(photo, context));
}

/**
 * Enriquece un lote de fotos de forma asíncrona (con IndexedDB).
 * Lee documentos de IndexedDB una sola vez y reutiliza para todas las fotos.
 * No bloquea el hilo principal de renderizado.
 *
 * @param photos Fotos a enriquecer.
 * @param context Contexto opcional para testing o inyección.
 * @returns Promise con las fotos enriquecidas.
 */
export async function enrichPhotosWithGeoAsync(photos: Photo[], context?: PhotoGeoContext): Promise<EnrichedPhoto[]> {
  // Pre-cargar eventos una sola vez para todo el lote
  const events = await collectGeoEventsAsync(context);

  return photos.map((photo) => {
    const enriched: EnrichedPhoto = { ...photo };

    // 1) GPS/EXIF directo presente
    if (photo.lat !== undefined && photo.lng !== undefined && photo.lat !== null && photo.lng !== null) {
      enriched.resolutionSource = 'exif';
      enriched.location_source = 'EXIF_GPS';
      return enriched;
    }

    // 2) Sin GPS directo -> Motor de herencia espacio-temporal
    const photoTs = normalizePhotoDate(photo.date as number | string | undefined);
    if (photoTs !== null) {
      const best = findBestEvent(photoTs, events);

      if (best && best.lat !== undefined && best.lng !== undefined) {
        enriched.lat = best.lat;
        enriched.lng = best.lng;
        enriched.locationName = best.name;
        enriched.resolutionSource = best.source;
        enriched.matchedEvent = best;
        enriched.location_source = 'VOUCHER_INHERITANCE';
        enriched.inherited_from_voucher_id = best.id;
      }
    }

    return enriched;
  });
}
