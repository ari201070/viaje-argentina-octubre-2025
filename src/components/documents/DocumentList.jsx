const CATEGORY_COLORS = {
  Vuelos: "#0EA5E9",
  Alojamiento: "#8B5CF6",
  Excursiones: "#10B981",
  Seguro: "#F59E0B",
  Cambio: "#14B8A6",
  Varios: "#6B7280",
};

const CATEGORY_ICONS = {
  Vuelos: "✈️",
  Alojamiento: "🏨",
  Excursiones: "🥾",
  Seguro: "🛡️",
  Cambio: "💱",
  Varios: "📎",
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({ documents, cities, onView, onDelete }) {
  if (!documents || documents.length === 0) {
    return (
      <div
        style={{
          background: "#FFFFFF",
          padding: "20px",
          borderRadius: "14px",
          boxShadow: "0 4px 12px rgba(0,0,0,.08)",
          textAlign: "center",
          color: "#9CA3AF",
        }}
      >
        <p style={{ margin: 0, fontSize: "15px" }}>
          📄 No hay documentos cargados
        </p>
      </div>
    );
  }

  const cityName = (cityId) => {
    if (!cityId) return null;
    const city = cities.find((c) => c.id === cityId);
    return city ? city.name : null;
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        padding: "20px",
        borderRadius: "14px",
        boxShadow: "0 4px 12px rgba(0,0,0,.08)",
      }}
    >
      <h3 style={{ margin: "0 0 16px", fontSize: "18px" }}>
        📋 Documentos ({documents.length})
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
          gap: "12px",
        }}
      >
        {documents.map((doc) => {
          const catColor = CATEGORY_COLORS[doc.category] || "#6B7280";
          const catIcon = CATEGORY_ICONS[doc.category] || "📎";
          const isPdf = doc.type === "application/pdf";
          const city = cityName(doc.cityId);

          return (
            <div
              key={doc.id}
              style={{
                padding: "14px",
                borderRadius: "10px",
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderLeft: `4px solid ${catColor}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "24px" }}>{isPdf ? "📄" : "🖼️"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1F2937",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {doc.name}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>
                    {formatSize(doc.size)}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexWrap: "wrap",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "white",
                    background: catColor,
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {catIcon} {doc.category}
                </span>
                {city && (
                  <span style={{ fontSize: "12px", color: "#6B7280" }}>
                    📍 {city}
                  </span>
                )}
              </div>

              {doc.notes && (
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: "13px",
                    color: "#374151",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  📝 {doc.notes}
                </p>
              )}

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => onView(doc)}
                  style={{
                    padding: "6px 12px",
                    background: "#F0F9FF",
                    color: "#0369A1",
                    border: "1px solid #BAE6FD",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  👁️ Ver
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`¿Eliminar "${doc.name}"?`)) {
                      onDelete(doc.id);
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    background: "#FEF2F2",
                    color: "#DC2626",
                    border: "1px solid #FECACA",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}