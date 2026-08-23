import { useState, useEffect } from "react";
import cities from "../../data/cities.json";
import GalleryGrid from "./GalleryGrid";
import PhotoLightbox from "./PhotoLightbox";
import { enrichPhotosWithGeoAsync } from "../../services/photoGeoService";

const cardStyle = {
  background: "#FFFFFF",
  padding: "20px",
  borderRadius: "14px",
  boxShadow: "0 4px 12px rgba(0,0,0,.08)",
};

export default function GalleryDashboard() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCity, setFilterCity] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    import("../../data/gallery.json")
      .then(async (mod) => {
        const raw = mod.default || mod;
        // Enriquecer fotos con geolocalización temporal (vouchers/itinerario + IndexedDB).
        const enriched = await enrichPhotosWithGeoAsync(raw);
        // Deduplicar por id para evitar keys duplicadas de React.
        const seen = new Set();
        const unique = enriched.filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        setPhotos(unique);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar fotos de la galería:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
          ...cardStyle,
        }}
      >
        <p style={{ margin: 0, fontSize: "16px", color: "#4B5563" }}>
          🖼️ Cargando fotos de la galería...
        </p>
      </div>
    );
  }

  const filtered = filterCity
    ? photos.filter((p) => p.cityId === parseInt(filterCity))
    : photos;

  const cityName = (cityId) => {
    const city = cities.find((c) => c.id === cityId);
    return city ? city.name : `Ciudad ${cityId}`;
  };

  const handleClose = () => setLightboxIndex(null);
  const handlePrev = () =>
    setLightboxIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
  const handleNext = () =>
    setLightboxIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Encabezado */}
      <div
        style={{
          ...cardStyle,
          background: "linear-gradient(135deg,#0B5ED7,#38BDF8)",
          color: "white",
        }}
      >
        <h2 style={{ margin: "0 0 4px", fontSize: "22px" }}>
          🖼️ Galería de Fotos
        </h2>
        <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>
          {photos.length > 0
            ? `Total: ${photos.length} fotos · ${filtered.length} mostradas`
            : "Procesando fotos..."}
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
              <option value="">Todas las ciudades</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid de fotos */}
      <GalleryGrid
        photos={filtered}
        cityName={cityName}
        onPhotoClick={(index) => setLightboxIndex(index)}
      />

      {/* Lightbox */}
      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <PhotoLightbox
          photos={filtered}
          index={lightboxIndex}
          cityName={cityName}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </div>
  );
}