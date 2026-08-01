const CURRENCY_SYMBOLS = {
  USD: "$",
  ARS: "$",
  ILS: "₪",
};

const CATEGORY_COLORS = {
  Vuelos: "#0EA5E9",
  Alojamiento: "#8B5CF6",
  Gastronomía: "#F59E0B",
  Actividades: "#10B981",
  Varios: "#6B7280",
};

export default function ExpenseList({ expenses, cities, onDeleteExpense }) {
  if (!expenses || expenses.length === 0) {
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
          📋 No hay gastos registrados todavía
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
        📋 Gastos Registrados ({expenses.length})
      </h3>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {expenses.map((exp) => {
          const symbol = CURRENCY_SYMBOLS[exp.currency] || "";
          const catColor = CATEGORY_COLORS[exp.category] || "#6B7280";
          const city = cityName(exp.cityId);

          return (
            <div
              key={exp.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "10px 14px",
                background: "#F9FAFB",
                borderRadius: "10px",
                border: "1px solid #E5E7EB",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
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
                    {exp.category}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#374151",
                      background: "#E0E7FF",
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {exp.currency}
                  </span>
                  {city && (
                    <span style={{ fontSize: "12px", color: "#6B7280" }}>
                      📍 {city}
                    </span>
                  )}
                </div>
                {exp.description && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "14px",
                      color: "#374151",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {exp.description}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#1F2937",
                  }}
                >
                  {symbol}
                  {exp.amount.toFixed(2)}
                </span>
                <button
                  onClick={() => onDeleteExpense(exp.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#EF4444",
                    cursor: "pointer",
                    fontSize: "18px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                  title="Eliminar gasto"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}