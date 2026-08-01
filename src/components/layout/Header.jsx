export default function Header() {
  return (
    <header
      style={{
        background: "linear-gradient(135deg,#0B5ED7,#38BDF8)",
        color: "white",
        padding: "60px 40px",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "auto" }}>
        <h1 style={{ fontSize: 56, margin: 0 }}>🇦🇷 Argentina</h1>
        <h2 style={{ fontWeight: 400 }}>Aventura Familiar de 30 Días</h2>
        <p>28 Septiembre · 2 Noviembre 2025</p>
      </div>
    </header>
  );
}