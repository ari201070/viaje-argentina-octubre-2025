const ROADMAP_ITEMS = [
  { icon: "✅", label: "Arquitectura" },
  { icon: "🟡", label: "OpenStreetMap" },
  { icon: "🟡", label: "Wikiloc" },
  { icon: "🟡", label: "Diario" },
  { icon: "🟡", label: "Fotos" },
  { icon: "🟡", label: "Presupuesto" },
  { icon: "🟡", label: "IA Local" },
  { icon: "🟡", label: "Offline" },
];

export default function Roadmap() {
  return (
    <section
      style={{
        marginTop: "40px",
        background: "white",
        padding: "30px",
        borderRadius: "18px",
        boxShadow: "0 8px 20px rgba(0,0,0,.12)",
      }}
    >
      <h2>Roadmap</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: "20px",
        }}
      >
        {ROADMAP_ITEMS.map((item) => (
          <div key={item.label}>
            {item.icon} {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}