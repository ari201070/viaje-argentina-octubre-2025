import { useState } from "react";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD · Dólar" },
  { code: "ARS", symbol: "$", label: "ARS · Peso Argentino" },
  { code: "ILS", symbol: "₪", label: "ILS · Shekel" },
];

const CATEGORIES = [
  "Vuelos",
  "Alojamiento",
  "Gastronomía",
  "Actividades",
  "Varios",
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

export default function ExpenseForm({ cities, onAddExpense }) {
  const [form, setForm] = useState({
    currency: "USD",
    amount: "",
    category: "Vuelos",
    cityId: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return;

    onAddExpense({
      id: Date.now(),
      currency: form.currency,
      amount,
      category: form.category,
      cityId: form.cityId ? parseInt(form.cityId) : null,
      description: form.description.trim(),
      date: new Date().toISOString(),
    });

    setForm({
      currency: "USD",
      amount: "",
      category: "Vuelos",
      cityId: "",
      description: "",
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
      <h3 style={{ margin: "0 0 16px", fontSize: "18px" }}>➕ Registrar Gasto</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          gap: "12px",
        }}
      >
        <div>
          <label style={labelStyle}>Moneda</label>
          <select
            name="currency"
            value={form.currency}
            onChange={handleChange}
            style={inputStyle}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Monto</label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            placeholder="0.00"
            style={inputStyle}
            required
          />
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
              <option key={cat} value={cat}>
                {cat}
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
          <label style={labelStyle}>Descripción</label>
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Ej: Vuelo a Bariloche"
            style={inputStyle}
          />
        </div>
      </div>

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
        💾 Guardar gasto
      </button>
    </form>
  );
}