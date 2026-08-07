import { useState, useEffect, useCallback } from "react";
import VoucherForm from "./VoucherForm";
import VoucherList from "./VoucherList";
import VoucherViewer from "./VoucherViewer";

const STORAGE_KEY = "travel_bookings";

const cardStyle = {
  background: "#FFFFFF",
  padding: "20px",
  borderRadius: "14px",
  boxShadow: "0 4px 12px rgba(0,0,0,.08)",
};

const CATEGORIES = [
  { id: "all", label: "Todos", emoji: "📄" },
  { id: "hotel", label: "Hoteles", emoji: "🏨" },
  { id: "flight", label: "Vuelos", emoji: "✈️" },
  { id: "car_rental", label: "Alquiler de Autos", emoji: "🚗" },
  { id: "activity", label: "Actividades", emoji: "🎫" },
  { id: "purchase", label: "Compras y Recibos", emoji: "🛍️" },
  { id: "other_travel", label: "Otros", emoji: "🧳" },
];

/**
 * Dashboard de Vouchers / Reservas.
 *
 * Persiste los vouchers en `localStorage` bajo la clave `travel_bookings`,
 * garantizando compatibilidad directa con `photoGeoService.ts`.
 */
export default function VoucherDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewBooking, setViewBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [notification, setNotification] = useState(null);

  // Cargar vouchers desde localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setBookings(parsed);
        }
      }
    } catch (e) {
      console.error("VoucherDashboard: Error al leer travel_bookings:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Persistir cada cambio
  const persist = useCallback((next) => {
    setBookings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("VoucherDashboard: Error al guardar travel_bookings:", e);
    }
  }, []);

  const showToast = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSave = (data) => {
    if (editingBooking) {
      // Edición
      persist(
        bookings.map((b) =>
          b.id === editingBooking.id ? { ...b, ...data, id: editingBooking.id } : b
        )
      );
      showToast("Voucher actualizado correctamente.", "success");
    } else {
      // Nuevo
      const newBooking = {
        ...data,
        id: `local-${Date.now()}`,
        isTravelDocument: true,
        source: "manual",
        mimeType: data.mimeType || "application/manual",
      };
      persist([newBooking, ...bookings]);
      showToast("Voucher guardado correctamente.", "success");
    }
    setEditingBooking(null);
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Eliminar este voucher?")) {
      persist(bookings.filter((b) => b.id !== id));
      showToast("Voucher eliminado.", "info");
    }
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const parsedBookings = bookings.filter((b) => b.isTravelDocument !== false);

  const filtered = parsedBookings.filter((b) => {
    if (activeCategory === "all") return true;
    return b.category === activeCategory;
  });

  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = parsedBookings.filter((b) => b.category === cat.id).length;
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Notificación */}
      {notification && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            background:
              notification.type === "success"
                ? "#ECFDF5"
                : notification.type === "error"
                ? "#FEF2F2"
                : "#EFF6FF",
            color:
              notification.type === "success"
                ? "#065F46"
                : notification.type === "error"
                ? "#991B1B"
                : "#1E40AF",
            border:
              notification.type === "success"
                ? "1px solid #A7F3D0"
                : notification.type === "error"
                ? "1px solid #FECACA"
                : "1px solid #BFDBFE",
          }}
        >
          {notification.message}
        </div>
      )}

      {/* Encabezado */}
      <div
        style={{
          ...cardStyle,
          background: "linear-gradient(135deg,#0B5ED7,#38BDF8)",
          color: "white",
        }}
      >
        <h2 style={{ margin: "0 0 4px", fontSize: "22px" }}>
          🎫 Vouchers y Reservas
        </h2>
        <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>
          {loading
            ? "Cargando vouchers..."
            : `Total: ${parsedBookings.length} voucher${
                parsedBookings.length !== 1 ? "es" : ""
              }`}
        </p>
      </div>

      {/* Filtros por categoría */}
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid #D1D5DB",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                background: activeCategory === cat.id ? "#0B5ED7" : "white",
                color: activeCategory === cat.id ? "white" : "#374151",
              }}
            >
              {cat.emoji} {cat.label}{" "}
              <span style={{ opacity: 0.8 }}>({counts[cat.id] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Formulario de alta/edición */}
      <VoucherForm
        key={editingBooking?.id || "new"}
        initial={editingBooking}
        onSave={handleSave}
        onCancel={() => setEditingBooking(null)}
      />

      {/* Lista de vouchers */}
      <VoucherList
        bookings={filtered}
        onView={setViewBooking}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Visor de detalles */}
      <VoucherViewer
        key={viewBooking?.id || "none"}
        booking={viewBooking}
        onClose={() => setViewBooking(null)}
      />
    </div>
  );
}