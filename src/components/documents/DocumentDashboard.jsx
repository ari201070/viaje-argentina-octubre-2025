import { useState } from "react";
import useDocuments from "../../hooks/useDocuments";
import DocumentUploader from "./DocumentUploader";
import DocumentList from "./DocumentList";
import DocumentViewer from "./DocumentViewer";

const CATEGORIES = ["", "Vuelos", "Alojamiento", "Excursiones", "Seguro", "Cambio", "Varios"];

const cardStyle = {
  background: "#FFFFFF",
  padding: "20px",
  borderRadius: "14px",
  boxShadow: "0 4px 12px rgba(0,0,0,.08)",
};

export default function DocumentDashboard({ cities }) {
  const {
    documents,
    loading,
    saveDocument,
    deleteDocument,
    getDocumentUrl,
    revokeUrl,
  } = useDocuments();

  const [filterCategory, setFilterCategory] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [viewDoc, setViewDoc] = useState(null);
  const [viewUrl, setViewUrl] = useState(null);

  const handleView = async (doc) => {
    const url = await getDocumentUrl(doc.id);
    if (url) {
      setViewDoc(doc);
      setViewUrl(url);
    }
  };

  const handleClose = () => {
    setViewDoc(null);
    setViewUrl(null);
  };

  const filtered = documents.filter((doc) => {
    if (filterCategory && doc.category !== filterCategory) return false;
    if (filterCity && doc.cityId !== parseInt(filterCity)) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Encabezado */}
      <div style={{ ...cardStyle, background: "linear-gradient(135deg,#0B5ED7,#38BDF8)", color: "white" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "22px" }}>
          📄 Documentos y Vouchers
        </h2>
        <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>
          {loading
            ? "Cargando documentos..."
            : `Total: ${documents.length} documento${documents.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Filtros */}
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              Filtrar por categoría
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid #D1D5DB",
                fontSize: "14px",
              }}
            >
              <option value="">Todas</option>
              {CATEGORIES.filter(Boolean).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
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
              Filtrar por ciudad
            </label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid #D1D5DB",
                fontSize: "14px",
              }}
            >
              <option value="">Todas</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Uploader */}
      <DocumentUploader cities={cities} onSave={saveDocument} />

      {/* Lista filtrada */}
      <DocumentList
        documents={filtered}
        cities={cities}
        onView={handleView}
        onDelete={deleteDocument}
      />

      {/* Visor */}
      <DocumentViewer
        key={viewDoc?.id || "none"}
        document={viewDoc}
        url={viewUrl}
        onClose={handleClose}
        revokeUrl={revokeUrl}
      />
    </div>
  );
}