export default function GalleryGrid({ photos, cityName, onPhotoClick }) {
  if (!photos || photos.length === 0) {
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
          🖼️ No hay fotos para mostrar
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
        gap: "10px",
      }}
    >
      {photos.map((photo, index) => (
        <button
          key={photo.id}
          onClick={() => onPhotoClick(index)}
          style={{
            padding: 0,
            border: "none",
            borderRadius: "10px",
            overflow: "hidden",
            cursor: "pointer",
            background: "#F3F4F6",
            position: "relative",
            aspectRatio: "1 / 1",
            display: "block",
          }}
          aria-label={`Ver foto ${photo.filename}`}
        >
          <img
            src={photo.thumb}
            alt={photo.filename}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          <span
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "6px 8px",
              background: "rgba(0,0,0,0.6)",
              color: "white",
              fontSize: "11px",
              fontWeight: 600,
              textAlign: "left",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            📍 {cityName(photo.cityId)}
          </span>
          {photo.matchedEvent && (
            <span
              style={{
                position: "absolute",
                top: 6,
                left: 6,
                padding: "3px 8px",
                background: "rgba(16,185,129,0.9)",
                color: "white",
                fontSize: "10px",
                fontWeight: 700,
                borderRadius: "999px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "90%",
              }}
              title={`Coordenadas inferidas: ${photo.lat?.toFixed(4)}, ${photo.lng?.toFixed(4)} — ${photo.matchedEvent.name}`}
            >
              🎯 {photo.matchedEvent.name}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}