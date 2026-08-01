import { useState } from "react";

const CATEGORIES = [
  { value: "Vuelos", icon: "✈️" },
  { value: "Alojamiento", icon: "🏨" },
  { value: "Excursiones", icon: "🥾" },
  { value: "Seguro", icon: "🛡️" },
  { value: "Cambio", icon: "💱" },
  { value: "Varios", icon: "📎" },
];

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

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

export default function DocumentUploader({ cities, onSave }) {
  const [form, setForm] = useState({
    category: "Vuelos",
    cityId: "",
    notes: "",
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > MAX_SIZE_BYTES) {
      setError(`El archivo excede el máximo de ${MAX_SIZE_MB} MB`);
      setFile(null);
      return;
    }
    setError(null);
    setFile(selected);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setError("Seleccioná un archivo para subir");
      return;
    }

    onSave({
      name: file.name,
      type: file.type,
      size: file.size,
      blob: file,
      category: form.category,
      cityId: form.cityId ? parseInt(form.cityId) : null,
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    });

    setForm({ category: "Vuelos", cityId: "", notes: "" });
    setFile(null);
    setError(null);
    e.target.reset();
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
      <h3 style={{ margin: "0 0 16px", fontSize: "18px" }}>📤 Subir Documento</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          gap: "12px",
        }}
      >
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Archivo (PDF, PNG, JPG · máx {MAX_SIZE_MB} MB)</label>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            onChange={handleFileChange}
            style={{
              ...inputStyle,
              padding: "6px",
              border: "1px dashed #9CA3AF",
            }}
          />
          {file && (
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#15803D" }}>
              ✓ {file.name} ({(file.size / 1024).toFixed(0)} KB)
            </p>
          )}
        </div>

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
                {cat.icon} {cat.value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Ciudad</label>
          <select
            name="cityId"
            value={form.cityId}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">— Sin asignar —</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Notas (opcional)</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Ej: Voucher de hotel con confirmación..."
            rows={2}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: "40px",
            }}
          />
        </div>
      </div>

      {error && (
        <p style={{ margin: "12px 0 0", fontSize: "14px", color: "#DC2626" }}>
          ⚠️ {error}
        </p>
      )}

      <button
        type="submit"
        style={{
          marginTop: "16px",
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
        📤 Subir documento
      </button>
    </form>
  );
}