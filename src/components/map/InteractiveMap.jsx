import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import itinerary from "../../data/itinerary.json";

// Ícono personalizado para los marcadores
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