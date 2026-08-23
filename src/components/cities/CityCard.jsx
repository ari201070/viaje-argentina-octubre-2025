import { useState } from "react";
import WikilocLink from "./WikilocLink";

export default function CityCard({ city, note, onNoteChange }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note || "");

  const handleSave = () => {
    onNoteChange?.(city.id, draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(note || "");
    setEditing(false);
  };

  // Coordenadas aproximadas por defecto para cada ciudad si no están explícitas
  const CITY_COORDS = {
    1: { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
    2: { lat: -32.9442, lng: -60.6505 }, // Rosario
    3: { lat: -41.1335, lng: -71.3103 }, // Bariloche
    4: { lat: -32.8908, lng: -68.8272 }, // Mendoza
    5: { lat: -24.1858, lng: -65.2995 }, // Jujuy
    6: { lat: -25.5972, lng: -54.5766 }, // Iguazú
    7: { lat: -27.4692, lng: -58.8306 }, // Corrientes
  };

  const coords = city.coords || CITY_COORDS[city.id] || { lat: -34.6037, lng: -58.3816 };
  const cityNameEnc = encodeURIComponent(city.name);

  const handleAction = (type) => {
    // Ejecución asíncrona no bloqueante para evitar violaciones de rendimiento en UI / clics
    setTimeout(() => {
      if (type === "Mapa") {
        window.open(`https://www.openstreetmap.org/?mlat=${coords[0] || coords.lat}&mlon=${coords[1] || coords.lng}#map=14/${coords[0] || coords.lat}/${coords[1] || coords.lng}`, "_blank");
      } else if (type === "Restaurantes") {
        window.open(`https://www.openstreetmap.org/search?query=restaurantes+en+${cityNameEnc},+Argentina`, "_blank");
      } else if (type === "Actividades") {
        window.open(`https://www.openstreetmap.org/search?query=atracciones+en+${cityNameEnc},+Argentina`, "_blank");
      } else if (type === "Hotel") {
        try {
          const raw = localStorage.getItem("travel_bookings");
          if (raw) {
            const bookings = JSON.parse(raw);
            const match = bookings.find(b => b.category === "hotel" && (b.location?.toLowerCase().includes(city.name.toLowerCase()) || b.title?.toLowerCase().includes(city.name.toLowerCase())));
            if (match) {
              window.location.hash = "#documents";
              return;
            }
          }
        } catch (e) {
          console.error(e);
        }
        window.open(`https://www.openstreetmap.org/search?query=hotel+en+${cityNameEnc},+Argentina`, "_blank");
      }
    }, 0);
  };

  const BUTTONS = [
    { icon: "📍", label: "Actividades" },
    { icon: "🍴", label: "Restaurantes" },
    { icon: "🏨", label: "Hotel" },
    { icon: "🗺️", label: "Mapa" },
  ];

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "18px",
        overflow: "hidden",
        boxShadow: "0 8px 20px rgba(0,0,0,.12)",
      }}
    >
      <div
        style={{
          height: "180px",
          background: "linear-gradient(135deg,#90CAF9,#1976D2)",
        }}
      />

      <div style={{ padding: "25px" }}>
        <h2>{city.name}</h2>

        <p>
          <b>Fechas:</b> {city.days || "A definir"}
          {city.region && (
            <>
              {" · "}
              <span style={{ color: "#6B7280" }}>{city.region}</span>
            </>
          )}
        </p>

        {city.highlights && city.highlights.length > 0 && (
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                background: "none",
                border: "none",
                color: "#0B5ED7",
                cursor: "pointer",
                fontSize: "14px",
                padding: 0,
              }}
            >
              {expanded ? "▼ Ocultar actividades" : "▶ Ver actividades clave"}
            </button>

            {expanded && (
              <ul
                style={{
                  margin: "10px 0 0",
                  paddingLeft: "20px",
                  fontSize: "14px",
                  color: "#374151",
                  lineHeight: 1.6,
                }}
              >
                {city.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginTop: "20px",
          }}
        >
          {BUTTONS.map((btn) => (
            <button
              key={btn.label}
              onClick={() => handleAction(btn.label)}
              style={{
                padding: "8px 12px",
                background: "#F3F4F6",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>

        {city.wikilocRoutes && city.wikilocRoutes.length > 0 && (
          <WikilocLink routes={city.wikilocRoutes} />
        )}

        <div
          style={{
            marginTop: "20px",
            borderTop: "1px solid #E5E7EB",
            paddingTop: "15px",
          }}
        >
          {editing ? (
            <div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Notas para esta ciudad..."
                style={{
                  width: "100%",
                  minHeight: "60px",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid #D1D5DB",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button onClick={handleSave}>💾 Guardar</button>
                <button onClick={handleCancel}>✖ Cancelar</button>
              </div>
            </div>
          ) : (
            <div>
              {note ? (
                <p
                  style={{
                    fontSize: "14px",
                    color: "#374151",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  📝 {note}
                </p>
              ) : (
                <p style={{ fontSize: "14px", color: "#9CA3AF", margin: 0 }}>
                  Sin notas
                </p>
              )}
              <button
                onClick={() => {
                  setDraft(note || "");
                  setEditing(true);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0B5ED7",
                  cursor: "pointer",
                  fontSize: "13px",
                  padding: 0,
                  marginTop: "8px",
                }}
              >
                ✏️ {note ? "Editar nota" : "Añadir nota"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}