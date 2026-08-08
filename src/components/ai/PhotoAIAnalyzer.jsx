import { useState, useRef } from "react";
import { analyzePhoto, autoTagPhoto, hasGeminiApiKey } from "../../services/geminiService";

const cardStyle = {
  background: "#FFFFFF",
  padding: "20px",
  borderRadius: "14px",
  boxShadow: "0 4px 12px rgba(0,0,0,.08)",
};

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
 * PhotoAIAnalyzer — Componente liviano para analizar una foto con Gemini.
 * Permite seleccionar una imagen, analizarla (descripción, hitos, etiquetas,
 * OCR, categoría, hint de ubicación) y auto-etiquetarla para el viaje.
 */
export default function PhotoAIAnalyzer() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [tags, setTags] = useState([]);
  const fileInputRef = useRef(null);

  const apiKeyConfigured = hasGeminiApiKey();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("Seleccioná un archivo de imagen (JPG, PNG, etc.)");
      return;
    }
    setError(null);
    setResult(null);
    setTags([]);
    setFile(selected);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Seleccioná una foto primero");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const analysis = await analyzePhoto(file, { context: context.trim() || undefined });
      setResult(analysis);
    } catch (err) {
      setError(
        err?.message === "RATE_LIMIT_EXCEEDED"
          ? "Límite de cuota de Gemini alcanzado. Intentá de nuevo más tarde."
          : "Error al analizar la foto con Gemini."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAutoTag = async () => {
    if (!file) {
      setError("Seleccioná una foto primero");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const generated = await autoTagPhoto(file);
      setTags(generated);
    } catch (err) {
      setError(
        err?.message === "RATE_LIMIT_EXCEEDED"
          ? "Límite de cuota de Gemini alcanzado. Intentá de nuevo más tarde."
          : "Error al auto-etiquetar la foto."
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setTags([]);
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: "0 0 4px", fontSize: "18px" }}>🤖 Análisis Visual con IA</h3>
      <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#6B7280" }}>
        Enviá una foto a Gemini para obtener descripción, hitos, etiquetas, OCR y sugerencia de ubicación.
      </p>

      {!apiKeyConfigured && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            background: "#FEF3C7",
            border: "1px solid #FDE68A",
            color: "#92400E",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          ⚠️ No hay API Key de Gemini configurada. Agregá <code>VITE_GEMINI_API_KEY</code> en tu archivo{" "}
          <code>.env</code> para habilitar el análisis visual.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          gap: "12px",
        }}
      >
        <div>
          <label style={labelStyle}>Foto a analizar</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ ...inputStyle, padding: "6px", border: "1px dashed #9CA3AF" }}
          />
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Vista previa"
              style={{
                marginTop: "8px",
                maxWidth: "100%",
                maxHeight: "160px",
                borderRadius: "8px",
                objectFit: "cover",
                border: "1px solid #E5E7EB",
              }}
            />
          )}
        </div>

        <div>
          <label style={labelStyle}>Contexto del viaje (opcional)</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Ej: Viaje familiar por Argentina, octubre 2025"
            rows={3}
            style={{ ...inputStyle, resize: "vertical", minHeight: "60px" }}
          />
        </div>
      </div>

      {error && (
        <p style={{ margin: "12px 0 0", fontSize: "14px", color: "#DC2626" }}>⚠️ {error}</p>
      )}

      <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
        <button
          onClick={handleAnalyze}
          disabled={loading || !file}
          style={{
            padding: "10px 20px",
            background: "#0B5ED7",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: loading || !file ? "not-allowed" : "pointer",
            opacity: loading || !file ? 0.6 : 1,
          }}
        >
          {loading ? "⏳ Analizando..." : "🔍 Analizar foto"}
        </button>
        <button
          onClick={handleAutoTag}
          disabled={loading || !file}
          style={{
            padding: "10px 20px",
            background: "#10B981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: loading || !file ? "not-allowed" : "pointer",
            opacity: loading || !file ? 0.6 : 1,
          }}
        >
          {loading ? "⏳ Etiquetando..." : "🏷️ Auto-etiquetar"}
        </button>
        {(file || result || tags.length > 0) && (
          <button
            onClick={reset}
            style={{
              padding: "10px 20px",
              background: "#F3F4F6",
              color: "#374151",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Resultado del análisis */}
      {result && (
        <div
          style={{
            marginTop: "16px",
            padding: "14px",
            borderRadius: "10px",
            background: "#F9FAFB",
            border: "1px solid #E5E7EB",
          }}
        >
          <h4 style={{ margin: "0 0 10px", fontSize: "15px", color: "#1F2937" }}>
            📊 Resultado del análisis
          </h4>

          {result.description && (
            <p style={{ margin: "0 0 10px", fontSize: "14px", color: "#374151" }}>
              {result.description}
            </p>
          )}

          {result.category && (
            <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#6B7280" }}>
              <strong>Categoría:</strong> {result.category}
            </p>
          )}

          {result.locationHint && (
            <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#6B7280" }}>
              <strong>📍 Ubicación probable:</strong> {result.locationHint}
            </p>
          )}

          {result.landmarks.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#6B7280" }}>
                <strong>🏛️ Hitos:</strong>
              </p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {result.landmarks.map((l, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "12px",
                      background: "#EFF6FF",
                      color: "#1E40AF",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      border: "1px solid #BFDBFE",
                    }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.labels.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#6B7280" }}>
                <strong>🏷️ Etiquetas:</strong>
              </p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {result.labels.map((l, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "12px",
                      background: "#ECFDF5",
                      color: "#065F46",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      border: "1px solid #A7F3D0",
                    }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.texts.length > 0 && (
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#6B7280" }}>
                <strong>🔤 Texto detectado (OCR):</strong>
              </p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {result.texts.map((t, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "12px",
                      background: "#FEF2F2",
                      color: "#991B1B",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      border: "1px solid #FECACA",
                      fontFamily: "monospace",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#9CA3AF" }}>
            Relevante para el viaje: {result.isTravelRelevant ? "✅ Sí" : "❌ No"}
          </p>
        </div>
      )}

      {/* Resultado de auto-etiquetado */}
      {tags.length > 0 && (
        <div
          style={{
            marginTop: "16px",
            padding: "14px",
            borderRadius: "10px",
            background: "#F9FAFB",
            border: "1px solid #E5E7EB",
          }}
        >
          <h4 style={{ margin: "0 0 10px", fontSize: "15px", color: "#1F2937" }}>
            🏷️ Etiquetas generadas
          </h4>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {tags.map((tag, i) => (
              <span
                key={i}
                style={{
                  fontSize: "12px",
                  background: "#F5F3FF",
                  color: "#6D28D9",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  border: "1px solid #DDD6FE",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}