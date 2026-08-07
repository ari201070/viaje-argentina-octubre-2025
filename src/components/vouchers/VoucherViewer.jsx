const CATEGORY_STYLES = {
  hotel: { icon: "🏨", color: "#8B5CF6", label: "Hotel" },
  flight: { icon: "✈️", color: "#0EA5E9", label: "Vuelo" },
  car_rental: { icon: "🚗", color: "#10B981", label: "Alquiler de Auto" },
  activity: { icon: "🎫", color: "#F59E0B", label: "Actividad" },
  purchase: { icon: "🛍️", color: "#F43F5E", label: "Compra / Factura" },
  other_travel: { icon: "🧳", color: "#6B7280", label: "Otro" },
};

function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    }
  } catch {
    // ignore
  }
  return dateStr;
}

export default function VoucherViewer({ booking, onClose }) {
  if (!booking) return null;

  const style = CATEGORY_STYLES[booking.category] || CATEGORY_STYLES.other_travel;
  const title = booking.supplier || booking.title || booking.fileName || "Voucher sin título";

  const row = (label, value) =>
    value ? (
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
        <span style={{ fontSize: "13px", color: "#6B7280", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: "13px", color: "#1F2937", textAlign: "right" }}>{value}</span>
      </div>
    ) : null;

  return (
    <div
      onClick={onClose}
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
          maxWidth: "560px",
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #E5E7EB", flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "20px" }}>{style.icon}</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "white", background: style.color, padding: "2px 8px", borderRadius: "6px" }}>{style.label}</span>
            </div>
            <h3 style={{ margin: 0, fontSize: "16px", color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "16px", cursor: "pointer", color: "#374151", fontWeight: 600, flexShrink: 0, marginLeft: "12px" }}>
            ✖ Cerrar
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
          {booking.summary && (
            <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#6B7280", fontStyle: "italic", borderLeft: "2px solid #E5E7EB", paddingLeft: "10px" }}>
              "{booking.summary}"
            </p>
          )}

          {row("Código de reserva", booking.confirmationNumber)}
          {row("Fecha inicio", booking.startDate ? `${formatDisplayDate(booking.startDate)}${booking.startTime ? ` a las ${booking.startTime}` : ""}` : null)}
          {row("Fecha fin", booking.endDate ? `${formatDisplayDate(booking.endDate)}${booking.endTime ? ` a las ${booking.endTime}` : ""}` : null)}
          {row("Ubicación", booking.location)}
          {row("A nombre de", booking.passengerOrGuestName)}
          {row("Precio", booking.price ? `${booking.price.toLocaleString("es-ES")} ${booking.currency || "USD"}` : null)}

          {booking.coordinates && (
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "8px 0", borderBottom: "1px solid #F3F4F6", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "#6B7280", fontWeight: 600 }}>Coordenadas</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", color: "#1F2937", fontFamily: "monospace" }}>
                  {booking.coordinates.lat.toFixed(6)}, {booking.coordinates.lng.toFixed(6)}
                </span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${booking.coordinates.lat},${booking.coordinates.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: "12px", color: "#0369A1", textDecoration: "none", fontWeight: 600 }}
                >
                  Ver en mapa ↗
                </a>
              </div>
            </div>
          )}

          {booking.details && (
            <div style={{ marginTop: "12px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#6B7280", fontWeight: 600 }}>Detalles</p>
              <p style={{ margin: 0, fontSize: "13px", color: "#374151", background: "#F9FAFB", padding: "10px", borderRadius: "8px", border: "1px solid #E5E7EB", whiteSpace: "pre-wrap" }}>
                {booking.details}
              </p>
            </div>
          )}

          {booking.webViewLink && (
            <a
              href={booking.webViewLink}
              target="_blank"
              rel="noreferrer"
              style={{ display: "inline-block", marginTop: "16px", padding: "10px 20px", background: "#0B5ED7", color: "white", borderRadius: "8px", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}
            >
              📄 Ver archivo original
            </a>
          )}
        </div>
      </div>
    </div>
  );
}