import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import itinerary from "../../data/itinerary.json";
import cities from "../../data/cities.json";
import { enrichPhotosWithGeoAsync } from "../../services/photoGeoService";

// Ícono personalizado para los marcadores de región
const customIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path fill="#0B5ED7" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`
    ),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Ícono para fotos geolocalizadas
const photoIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28"><circle cx="12" cy="12" r="11" fill="#10B981" stroke="white" stroke-width="2"/><path fill="white" d="M12 7.5c-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5 4.5-2 4.5-4.5-2-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5S10.62 9.5 12 9.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`
    ),
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

// Regiones con coordenadas centrales
const REGION_COORDS = {
  1: { lat: -34.6037, lng: -58.3816, name: "Buenos Aires" },
  2: { lat: -32.9442, lng: -60.6503, name: "Rosario" },
  3: { lat: -41.1335, lng: -71.3103, name: "Bariloche / Patagonia" },
  4: { lat: -32.8895, lng: -68.8458, name: "Mendoza / Cuyo" },
  5: { lat: -24.7821, lng: -65.4232, name: "Salta / Norte" },
  6: { lat: -25.6953, lng: -54.4367, name: "Puerto Iguazú" },
  7: { lat: -27.4698, lng: -58.8308, name: "Corrientes / Litoral" },
};

export default function InteractiveMap() {
  const [geoPhotos, setGeoPhotos] = useState([]);

  // Cargar galería y enriquecer con geolocalización temporal (vouchers/itinerario + IndexedDB).
  useEffect(() => {
    let cancelled = false;
    requestAnimationFrame(() => {
      import("../../data/gallery.json")
        .then(async (mod) => {
          if (cancelled) return;
          const raw = mod.default || mod;
          const enriched = await enrichPhotosWithGeoAsync(raw);
          const seen = new Set();
          const unique = enriched.filter((p) => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          });
          setGeoPhotos(unique.filter((p) => p.lat !== undefined && p.lng !== undefined));
        })
        .catch((err) => {
          console.error("Mapa: Error al cargar fotos para geolocalizar:", err);
        });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Centro de Argentina
  const center = [-34.6037, -64.0];
  const zoom = 4;

  return (
    <div
      style={{
        background: "#FFFFFF",
        padding: "20px",
        borderRadius: "14px",
        boxShadow: "0 4px 12px rgba(0,0,0,.08)",
      }}
    >
      <h2 style={{ margin: "0 0 16px", fontSize: "22px" }}>
        🗺️ Mapa Interactivo del Viaje
      </h2>
      <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#6B7280" }}>
        {itinerary.length} días · 7 regiones · Haz clic en los marcadores para ver los detalles
      </p>

      <div style={{ height: "500px", borderRadius: "10px", overflow: "hidden" }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Marcadores de fotos geolocalizadas */}
          {geoPhotos.map((photo) => {
            const city = cities.find((c) => c.id === photo.cityId);
            return (
              <Marker
                key={photo.id}
                position={[photo.lat, photo.lng]}
                icon={photoIcon}
              >
                <Popup>
                  <div style={{ minWidth: "180px", textAlign: "center" }}>
                    <img
                      src={photo.thumb}
                      alt={photo.filename}
                      style={{ width: "100%", maxHeight: "120px", objectFit: "cover", borderRadius: "8px", marginBottom: "6px" }}
                    />
                    <strong style={{ fontSize: "13px" }}>🖼️ {city ? city.name : ""}</strong>
                    {photo.matchedEvent && (
                      <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#059669", fontWeight: 700 }}>
                        🎯 {photo.matchedEvent.name}
                      </p>
                    )}
                    <p style={{ margin: "4px 0 0", fontSize: "10px", color: "#9CA3AF", fontFamily: "monospace" }}>
                      {photo.lat.toFixed(4)}, {photo.lng.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Marcadores de regiones */}
          {Object.entries(REGION_COORDS).map(([id, region]) => {
            const days = itinerary.filter((d) => d.regionId === parseInt(id));
            return (
              <Marker
                key={id}
                position={[region.lat, region.lng]}
                icon={customIcon}
              >
                <Popup>
                  <div style={{ minWidth: "180px" }}>
                    <strong style={{ fontSize: "14px" }}>📍 {region.name}</strong>
                    <p style={{ margin: "6px 0 4px", fontSize: "12px", color: "#6B7280" }}>
                      {days.length} días · Días {days.length > 0 ? `${days[0].day}-${days[days.length - 1].day}` : "-"}
                    </p>
                    <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px" }}>
                      {days.slice(0, 3).map((d) => (
                        <li key={d.day}>
                          Día {d.day} ({d.date}): {d.title}
                        </li>
                      ))}
                      {days.length > 3 && <li>... y {days.length - 3} más</li>}
                    </ul>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}