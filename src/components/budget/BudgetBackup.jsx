import { useRef, useState } from "react";

const cardStyle = {
  background: "#FFFFFF",
  padding: "20px",
  borderRadius: "14px",
  boxShadow: "0 4px 12px rgba(0,0,0,.08)",
};

const buttonStyle = {
  padding: "10px 16px",
  border: "1px solid #D1D5DB",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
};

/**
 * Descarga un blob como archivo en el navegador.
 */
function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Escapa un valor para CSV (maneja comas, comillas y saltos de línea).
 */
function escapeCsv(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function BudgetBackup({
  expenses,
  config,
  cities,
  onImport,
}) {
  const fileRef = useRef(null);
  const [message, setMessage] = useState(null);

  const handleExportJson = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      expenses,
      config,
    };
    downloadBlob(
      JSON.stringify(data, null, 2),
      "presupuesto_argentina.json",
      "application/json"
    );
    setMessage({ type: "success", text: "✅ JSON exportado correctamente" });
  };

  const handleExportCsv = () => {
    const headers = ["Fecha", "Categoría", "Ciudad", "Monto", "Moneda", "Descripción"];

    const rows = expenses.map((exp) => {
      const date = exp.date ? new Date(exp.date).toLocaleDateString("es-AR") : "";
      const city = cities.find((c) => c.id === exp.cityId);
      return [
        escapeCsv(date),
        escapeCsv(exp.category),
        escapeCsv(city ? city.name : ""),
        escapeCsv(exp.amount.toFixed(2)),
        escapeCsv(exp.currency),
        escapeCsv(exp.description || ""),
      ].join(",");
    });

    const csv = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
    downloadBlob(csv, "gastos_argentina.csv", "text/csv;charset=utf-8");
    setMessage({ type: "success", text: "✅ CSV exportado correctamente" });
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        if (!data.expenses || !Array.isArray(data.expenses)) {
          setMessage({ type: "error", text: "❌ Formato inválido: 'expenses' no es un array" });
          return;
        }

        if (!data.config || typeof data.config !== "object") {
          setMessage({ type: "error", text: "❌ Formato inválido: 'config' no es un objeto" });
          return;
        }

        onImport(data.expenses, data.config);
        setMessage({ type: "success", text: `✅ Importados ${data.expenses.length} gastos` });
      } catch (err) {
        setMessage({ type: "error", text: "❌ Error al parsear JSON: " + err.message });
      }
    };
    reader.readAsText(file);

    // Reset input para permitir re-importar el mismo archivo
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>
        💾 Respaldar y Restaurar
      </h3>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          onClick={handleExportJson}
          style={{ ...buttonStyle, background: "#F0F9FF", color: "#0369A1", borderColor: "#BAE6FD" }}
        >
          📥 Exportar JSON
        </button>

        <button
          onClick={handleExportCsv}
          style={{ ...buttonStyle, background: "#F0FDF4", color: "#15803D", borderColor: "#BBF7D0" }}
        >
          📊 Exportar CSV
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          style={{ ...buttonStyle, background: "#FFFBEB", color: "#B45309", borderColor: "#FDE68A" }}
        >
          📤 Importar JSON
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          style={{ display: "none" }}
        />
      </div>

      {message && (
        <p
          style={{
            margin: "12px 0 0",
            fontSize: "14px",
            color: message.type === "error" ? "#DC2626" : "#15803D",
          }}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}