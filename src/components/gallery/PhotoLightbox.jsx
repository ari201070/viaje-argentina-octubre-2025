import { useEffect } from "react";

export default function PhotoLightbox({
  photos,
  index,
  cityName,
  onClose,
  onPrev,
  onNext,
}) {
  const photo = photos[index];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrev, onNext]);

  if (!photo) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "rgba(255,255,255,0.15)",
          border: "none",
          borderRadius: "8px",
          padding: "10px 16px",
          fontSize: "16px",
          cursor: "pointer",
          color: "white",
          fontWeight: 600,
          zIndex: 10,
        }}
      >
        ✖ Cerrar
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        style={{
          position: "absolute",
          left: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "rgba(255,255,255,0.15)",
          border: "none",
          borderRadius: "50%",
          width: "48px",
          height: "48px",
          fontSize: "24px",
          cursor: "pointer",
          color: "white",
          zIndex: 10,
        }}
        aria-label="Foto anterior"
      >
        ‹
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        style={{
          position: "absolute",
          right: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "rgba(255,255,255,0.15)",
          border: "none",
          borderRadius: "50%",
          width: "48px",
          height: "48px",
          fontSize: "24px",
          cursor: "pointer",
          color: "white",
          zIndex: 10,
        }}
        aria-label="Foto siguiente"
      >
        ›
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "90vw",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <img
          src={photo.src}
          alt={photo.filename}
          style={{
            maxWidth: "90vw",
            maxHeight: "80vh",
            objectFit: "contain",
            borderRadius: "8px",
          }}
        />
        <div
          style={{
            color: "white",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>
            📍 {cityName(photo.cityId)}
          </p>
          {photo.matchedEvent && (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "12px",
                background: "rgba(16,185,129,0.25)",
                border: "1px solid rgba(16,185,129,0.5)",
                color: "#6EE7B7",
                padding: "6px 12px",
                borderRadius: "999px",
                display: "inline-block",
              }}
            >
              🎯 {photo.matchedEvent.name}
              {photo.lat !== undefined && photo.lng !== undefined && (
                <span style={{ opacity: 0.8, marginLeft: "6px", fontFamily: "monospace" }}>
                  · {photo.lat.toFixed(4)}, {photo.lng.toFixed(4)}
                </span>
              )}
            </p>
          )}
          <p style={{ margin: "4px 0 0", opacity: 0.7, fontSize: "12px" }}>
            {index + 1} / {photos.length} · {photo.filename}
          </p>
        </div>
      </div>
    </div>
  );
}