import { useState } from "react";

const CATEGORY_COLORS = {
  Vuelos: "#0EA5E9",
  Alojamiento: "#8B5CF6",
  Excursiones: "#10B981",
  Seguro: "#F59E0B",
  Cambio: "#14B8A6",
  Varios: "#6B7280",
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentViewer({ document, url, onClose, revokeUrl }) {
  const [imgError, setImgError] = useState(false);

  if (!document || !url) return null;

  const isPdf = document.type === "application/pdf";
  const isImage = document.type?.startsWith("image/");
  const catColor = CATEGORY_COLORS[document.category] || "#6B7280";

  const handleClose = () => {
    revokeUrl(url);
    onClose();
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          borderRadius: "14px",
          maxWidth: "900px",
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header del modal */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #E5E7EB",
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                color: "#1F2937",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {isPdf ? "📄" : "🖼️"} {document.name}
            </h3>
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginTop: "4px",
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
                {document.category}
              </span>
              <span style={{ fontSize: "12px", color: "#6B7280" }}>
                {formatSize(document.size)}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "#F3F4F6",
              border: "none",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "16px",
              cursor: "pointer",
              color: "#374151",
              fontWeight: 600,
              flexShrink: 0,
              marginLeft: "12px",
            }}
          >
            ✖ Cerrar
          </button>
        </div>

        {/* Notas */}
        {document.notes && (
          <div
            style={{
              padding: "10px 20px",
              background: "#F9FAFB",
              borderBottom: "1px solid #E5E7EB",
              fontSize: "14px",
              color: "#374151",
              flexShrink: 0,
            }}
          >
            📝 {document.notes}
          </div>
        )}

        {/* Contenido del visor */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F3F4F6",
            minHeight: "300px",
          }}
        >
          {isPdf ? (
            <iframe
              src={url}
              title={document.name}
              style={{
                width: "100%",
                height: "100%",
                minHeight: "500px",
                border: "none",
              }}
            />
          ) : isImage && !imgError ? (
            <img
              src={url}
              alt={document.name}
              onError={() => setImgError(true)}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <div
              style={{
                textAlign: "center",
                color: "#6B7280",
                padding: "40px",
              }}
            >
              <p style={{ fontSize: "48px", margin: "0 0 12px" }}>📎</p>
              <p style={{ fontSize: "15px", margin: 0 }}>
                Vista previa no disponible para este tipo de archivo
              </p>
              <p style={{ fontSize: "13px", margin: "8px 0 0", color: "#9CA3AF" }}>
                Tipo: {document.type || "desconocido"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}