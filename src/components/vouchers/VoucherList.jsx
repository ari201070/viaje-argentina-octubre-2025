import { useState } from "react";

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
      return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
    }
  } catch {
    // ignore
  }
  return dateStr;
}

export default function VoucherList({ bookings, onView, onEdit, onDelete }) {
  const [copiedId, setCopiedId] = useState(null);

  if (!bookings || bookings.length === 0) {
    return (
      <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "14px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", textAlign: "center", color: "#9CA3AF" }}>
        <p style={{ margin: 0, fontSize: "15px" }}>🎫 No hay vouchers en esta categoría</p>
      </div>
    );
  }

  const handleCopy = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "14px", boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}>
      <h3 style={{ margin: "0 0 16px", fontSize: "18px" }}>📋 Vouchers ({bookings.length})</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "12px" }}>
        {bookings.map((booking) => {
          const style = CATEGORY_STYLES[booking.category] || CATEGORY_STYLES.other_travel;
          const title = booking.supplier || booking.title || booking.fileName || "Voucher sin título";
          return (
            <div key={booking.id} style={{ padding: "14px", borderRadius: "10px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderLeft: `4px solid ${style.color}`, display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <span style={{ fontSize: "24px" }}>{style.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "white", background: style.color, padding: "2px 8px", borderRadius: "6px", display: "inline-block", marginBottom: "4px" }}>{style.label}</span>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
                </div>
              </div>

              {(booking.startDate || booking.endDate) && (
                <div style={{ fontSize: "12px", color: "#6B7280" }}>
                  {booking.startDate && <div>📅 Inicio: {formatDisplayDate(booking.startDate)}{booking.startTime && ` a las ${booking.startTime}`}</div>}
                  {booking.endDate && <div>📅 Fin: {formatDisplayDate(booking.endDate)}{booking.endTime && ` a las ${booking.endTime}`}</div>}
                </div>
              )}

              {booking.confirmationNumber && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF", padding: "6px 10px", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
                  <span style={{ fontSize: "12px", color: "#6B7280" }}>Localizador:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#1F2937", fontFamily: "monospace" }}>{booking.confirmationNumber}</span>
                    <button onClick={() => handleCopy(booking.id, booking.confirmationNumber)} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "13px", color: copiedId === booking.id ? "#10B981" : "#6B7280" }} title="Copiar código">
                      {copiedId === booking.id ? "✓" : "📋"}
                    </button>
                  </div>
                </div>
              )}

              {booking.location && (
                <div style={{ fontSize: "12px", color: "#374151" }}>
                  📍 {booking.location}
                  {booking.coordinates && (
                    <span style={{ color: "#9CA3AF", marginLeft: "6px" }}>({booking.coordinates.lat.toFixed(4)}, {booking.coordinates.lng.toFixed(4)})</span>
                  )}
                </div>
              )}

              {booking.price && (
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#059669" }}>
                  💰 {booking.price.toLocaleString("es-ES")} <span style={{ fontSize: "10px", fontWeight: 600 }}>{booking.currency || "USD"}</span>
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button onClick={() => onView(booking)} style={{ padding: "6px 12px", background: "#F0F9FF", color: "#0369A1", border: "1px solid #BAE6FD", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", flex: 1 }}>👁️ Ver</button>
                <button onClick={() => onEdit(booking)} style={{ padding: "6px 12px", background: "#F5F3FF", color: "#6D28D9", border: "1px solid #DDD6FE", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", flex: 1 }}>✏️ Editar</button>
                <button onClick={() => onDelete(booking.id)} style={{ padding: "6px 12px", background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", flex: 1 }}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}