import { useState, useCallback } from "react";
import VoucherForm from "./VoucherForm";
import VoucherList from "./VoucherList";
import VoucherViewer from "./VoucherViewer";
import initialBookingsData from "../../data/initialBookings.json";

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
  // Cargar vouchers desde localStorage de forma síncrona asegurando re-hidratación si está vacío o corrupto
  const [bookings, setBookings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length >= 10) return parsed;
      }
      // Forzar re-hidratación inmediata con initialBookings.json
      if (Array.isArray(initialBookingsData) && initialBookingsData.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialBookingsData));
        return initialBookingsData;
      }
    } catch (e) {
      console.error("VoucherDashboard: Error al leer/hidratar travel_bookings:", e);
    }
    return initialBookingsData || [];
  });
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [viewBooking, setViewBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [notification, setNotification] = useState(null);

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

  const CITIES_FILTER = [
    { id: "all", label: "Todas las ciudades" },
    { id: "Buenos Aires", label: "Buenos Aires" },
    { id: "Rosario", label: "Rosario" },
    { id: "Bariloche", label: "Bariloche" },
    { id: "Mendoza", label: "Mendoza" },
    { id: "Salta", label: "Jujuy / Salta" },
    { id: "Iguazú", label: "Puerto Iguazú" },
    { id: "Esteros del Iberá", label: "Esteros del Iberá" },
    { id: "Corrientes", label: "Corrientes" },
  ];

  const filtered = parsedBookings.filter((b) => {
    const matchCat = activeCategory === "all" || b.category === activeCategory;
    const matchCity = selectedCity === "all" || (b.location && b.location.toLowerCase().includes(selectedCity.toLowerCase())) || (b.title && b.title.toLowerCase().includes(selectedCity.toLowerCase())) || (b.fileName && b.fileName.toLowerCase().includes(selectedCity.toLowerCase()));
    return matchCat && matchCity;
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
          {`Total: ${parsedBookings.length} voucher${
            parsedBookings.length !== 1 ? "es" : ""
          }`}
        </p>
      </div>

      {/* Filtros por categoría y ciudad */}
      <div style={cardStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
              📍 Filtrar por ciudad:
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #D1D5DB",
                fontSize: "13px",
                background: "white",
                color: "#374151",
                fontWeight: 600,
              }}
            >
              {CITIES_FILTER.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
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