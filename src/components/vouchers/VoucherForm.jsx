import { useState } from "react";

const CATEGORIES = [
  { value: "hotel", label: "🏨 Hotel" },
  { value: "flight", label: "✈️ Vuelo" },
  { value: "car_rental", label: "🚗 Alquiler de Auto" },
  { value: "activity", label: "🎫 Actividad" },
  { value: "purchase", label: "🛍️ Compra / Factura" },
  { value: "other_travel", label: "🧳 Otro" },
];

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid #D1D5DB",
  fontSize: "14px",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "4px",
};

/**
 * Formulario de alta/edición de vouchers.
 * Los datos se guardan en `localStorage` bajo `travel_bookings`
 * (compatible con photoGeoService.ts).
 */
export default function VoucherForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    category: initial?.category || "hotel",
    supplier: initial?.supplier || "",
    title: initial?.title || "",
    confirmationNumber: initial?.confirmationNumber || "",
    startDate: initial?.startDate || "",
    startTime: initial?.startTime || "",
    endDate: initial?.endDate || "",
    endTime: initial?.endTime || "",
    location: initial?.location || "",
    lat: initial?.coordinates?.lat ?? "",
    lng: initial?.coordinates?.lng ?? "",
    passengerOrGuestName: initial?.passengerOrGuestName || "",
    price: initial?.price ?? "",
    currency: initial?.currency || "USD",
    details: initial?.details || "",
    summary: initial?.summary || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const lat = form.lat === "" ? undefined : Number(form.lat);
    const lng = form.lng === "" ? undefined : Number(form.lng);
    const price = form.price === "" ? undefined : Number(form.price);

    onSave({
      category: form.category,
      supplier: form.supplier.trim() || undefined,
      title: form.title.trim() || undefined,
      confirmationNumber: form.confirmationNumber.trim() || undefined,
      startDate: form.startDate || undefined,
      startTime: form.startTime || undefined,
      endDate: form.endDate || undefined,
      endTime: form.endTime || undefined,
      location: form.location.trim() || undefined,
      coordinates:
        lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)
          ? { lat, lng }
          : undefined,
      passengerOrGuestName: form.passengerOrGuestName.trim() || undefined,
      price: price !== undefined && !isNaN(price) ? price : undefined,
      currency: form.currency || "USD",
      details: form.details.trim() || undefined,
      summary: form.summary.trim() || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#FFFFFF",
        padding: "20px",
        borderRadius: "14px",
        boxShadow: "0 4px 12px rgba(0,0,0,.08)",
      }}
    >
      <h3 style={{ margin: "0 0 16px", fontSize: "18px" }}>
        {initial ? "✏️ Editar Voucher" : "➕ Agregar Voucher"}
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: "12px",
        }}
      >
        <div>
          <label style={labelStyle}>Categoría</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            style={inputStyle}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Proveedor</label>
          <input
            name="supplier"
            value={form.supplier}
            onChange={handleChange}
            placeholder="Ej: Aerolíneas Argentinas"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Título</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Ej: Vuelo Buenos Aires - Bariloche"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Código de reserva</label>
          <input
            name="confirmationNumber"
            value={form.confirmationNumber}
            onChange={handleChange}
            placeholder="Ej: QTAJPJ"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Fecha inicio</label>
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Hora inicio</label>
          <input
            type="time"
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Fecha fin</label>
          <input
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Hora fin</label>
          <input
            type="time"
            name="endTime"
            value={form.endTime}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Ubicación</label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Ej: Aeropuerto Ezeiza"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Latitud</label>
          <input
            type="number"
            step="any"
            name="lat"
            value={form.lat}
            onChange={handleChange}
            placeholder="-34.8222"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Longitud</label>
          <input
            type="number"
            step="any"
            name="lng"
            value={form.lng}
            onChange={handleChange}
            placeholder="-58.5358"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>A nombre de</label>
          <input
            name="passengerOrGuestName"
            value={form.passengerOrGuestName}
            onChange={handleChange}
            placeholder="Nombre del pasajero"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Precio</label>
          <input
            type="number"
            step="any"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="1200"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Moneda</label>
          <select
            name="currency"
            value={form.currency}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
            <option value="EUR">EUR</option>
            <option value="ILS">ILS</option>
          </select>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Resumen</label>
          <input
            name="summary"
            value={form.summary}
            onChange={handleChange}
            placeholder="Breve descripción del voucher"
            style={inputStyle}
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Detalles</label>
          <textarea
            name="details"
            value={form.details}
            onChange={handleChange}
            placeholder="Detalles adicionales del voucher..."
            rows={2}
            style={{ ...inputStyle, resize: "vertical", minHeight: "40px" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
        <button
          type="submit"
          style={{
            padding: "10px 24px",
            background: "#0B5ED7",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {initial ? "💾 Guardar cambios" : "💾 Guardar voucher"}
        </button>
        {initial && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 24px",
              background: "#F3F4F6",
              color: "#374151",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}