import { useState } from "react";

const CURRENCY_SYMBOLS = {
  USD: "$",
  ARS: "$",
  ILS: "₪",
};

const CATEGORIES = ["Vuelos", "Alojamiento", "Gastronomía", "Actividades", "Varios"];

const CATEGORY_COLORS = {
  Vuelos: "#0EA5E9",
  Alojamiento: "#8B5CF6",
  Gastronomía: "#F59E0B",
  Actividades: "#10B981",
  Varios: "#6B7280",
};

const cardStyle = {
  background: "#FFFFFF",
  padding: "20px",
  borderRadius: "14px",
  boxShadow: "0 4px 12px rgba(0,0,0,.08)",
};

const inputStyle = {
  width: "80px",
  padding: "6px 8px",
  borderRadius: "6px",
  border: "1px solid #D1D5DB",
  fontSize: "14px",
  fontFamily: "inherit",
};

export default function BudgetDashboard({
  expenses,
  config,
  onConfigChange,
}) {
  const [showRates, setShowRates] = useState(false);
  const [rateDraft, setRateDraft] = useState({
    arsToUsd: config.arsToUsd,
    ilsToUsd: config.ilsToUsd,
  });

  const baseCurrency = config.baseCurrency || "USD";

  // Convertir cualquier monto a la moneda base (USD como puente)
  const toBase = (amount, currency) => {
    if (currency === baseCurrency) return amount;
    if (currency === "USD") {
      // USD → base
      if (baseCurrency === "ARS") return amount * config.arsToUsd;
      if (baseCurrency === "ILS") return amount * config.ilsToUsd;
      return amount;
    }
    if (currency === "ARS") {
      const usd = amount / config.arsToUsd;
      return toBase(usd, "USD");
    }
    if (currency === "ILS") {
      const usd = amount / config.ilsToUsd;
      return toBase(usd, "USD");
    }
    return amount;
  };

  const totalBase = expenses.reduce(
    (sum, exp) => sum + toBase(exp.amount, exp.currency),
    0
  );

  const byCategory = CATEGORIES.map((cat) => {
    const total = expenses
      .filter((exp) => exp.category === cat)
      .reduce((sum, exp) => sum + toBase(exp.amount, exp.currency), 0);
    return { category: cat, total };
  });

  const byCurrency = ["USD", "ARS", "ILS"].map((cur) => {
    const total = expenses
      .filter((exp) => exp.currency === cur)
      .reduce((sum, exp) => sum + exp.amount, 0);
    return { currency: cur, total };
  });

  const handleSaveRates = () => {
    const ars = parseFloat(rateDraft.arsToUsd);
    const ils = parseFloat(rateDraft.ilsToUsd);
    onConfigChange({
      ...config,
      arsToUsd: ars > 0 ? ars : config.arsToUsd,
      ilsToUsd: ils > 0 ? ils : config.ilsToUsd,
    });
    setShowRates(false);
  };

  const symbol = CURRENCY_SYMBOLS[baseCurrency] || "$";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Resumen Total */}
      <div
        style={{
          ...cardStyle,
          background: "linear-gradient(135deg,#0B5ED7,#38BDF8)",
          color: "white",
        }}
      >
        <h2 style={{ margin: "0 0 8px", fontSize: "22px" }}>
          💰 Presupuesto del Viaje
        </h2>
        <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>
          Total acumulado en {baseCurrency}
        </p>
        <p style={{ margin: "8px 0 0", fontSize: "36px", fontWeight: 700 }}>
          {symbol}
          {totalBase.toFixed(2)}
        </p>
      </div>

      {/* Configuración de tasas */}
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "16px" }}>💱 Conversión de Moneda</h3>
          <button
            onClick={() => {
              setRateDraft({
                arsToUsd: config.arsToUsd,
                ilsToUsd: config.ilsToUsd,
              });
              setShowRates((v) => !v);
            }}
            style={{
              background: "none",
              border: "1px solid #D1D5DB",
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: "13px",
              cursor: "pointer",
              color: "#374151",
            }}
          >
            {showRates ? "Cerrar" : "⚙️ Ajustar tasas"}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            fontSize: "14px",
            color: "#374151",
          }}
        >
          <span>
            <b>Moneda base:</b> {baseCurrency}
          </span>
          <span>
            1 USD = <b>{config.arsToUsd.toFixed(0)}</b> ARS
          </span>
          <span>
            1 USD = <b>{config.ilsToUsd.toFixed(2)}</b> ILS
          </span>
        </div>

        {showRates && (
          <div
            style={{
              marginTop: "16px",
              padding: "16px",
              background: "#F9FAFB",
              borderRadius: "10px",
              border: "1px solid #E5E7EB",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Moneda base:
                </label>
                <select
                  value={baseCurrency}
                  onChange={(e) =>
                    onConfigChange({ ...config, baseCurrency: e.target.value })
                  }
                  style={{ ...inputStyle, width: "120px" }}
                >
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                  <option value="ILS">ILS</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  1 USD = ? ARS
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={rateDraft.arsToUsd}
                  onChange={(e) =>
                    setRateDraft((prev) => ({
                      ...prev,
                      arsToUsd: e.target.value,
                    }))
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  1 USD = ? ILS
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={rateDraft.ilsToUsd}
                  onChange={(e) =>
                    setRateDraft((prev) => ({
                      ...prev,
                      ilsToUsd: e.target.value,
                    }))
                  }
                  style={inputStyle}
                />
              </div>

              <button
                onClick={handleSaveRates}
                style={{
                  padding: "8px 16px",
                  background: "#0B5ED7",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "fit-content",
                }}
              >
                ✓ Guardar tasas
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Gastos por categoría */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>
          📊 Gastos por Categoría ({baseCurrency})
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: "12px",
          }}
        >
          {byCategory.map((cat) => (
            <div
              key={cat.category}
              style={{
                padding: "12px",
                borderRadius: "10px",
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderLeft: `4px solid ${CATEGORY_COLORS[cat.category]}`,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "#6B7280",
                  fontWeight: 600,
                }}
              >
                {cat.category}
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#1F2937",
                }}
              >
                {symbol}
                {cat.total.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Gastos por moneda original */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>
          💵 Gastos por Moneda Original
        </h3>
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          {byCurrency.map((cur) => (
            <div
              key={cur.currency}
              style={{
                padding: "10px 16px",
                borderRadius: "10px",
                background: "#F0F9FF",
                border: "1px solid #BAE6FD",
              }}
            >
              <span style={{ fontSize: "13px", color: "#0369A1", fontWeight: 600 }}>
                {cur.currency}
              </span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#1F2937", marginLeft: "8px" }}>
                {CURRENCY_SYMBOLS[cur.currency]}
                {cur.total.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}