/**
 * Componente para renderizar enlaces a rutas de Wikiloc.
 * Muestra cada ruta con un ícono de senderismo y estilo visual acorde a la PWA.
 *
 * @param {Object} props
 * @param {Array<{title: string, url: string}>} props.routes - Lista de rutas de Wikiloc
 */
export default function WikilocLink({ routes }) {
  if (!routes || routes.length === 0) return null;

  return (
    <div
      style={{
        marginTop: "15px",
        padding: "12px",
        background: "#F0F9FF",
        borderRadius: "10px",
        border: "1px solid #BAE6FD",
      }}
    >
      <p
        style={{
          margin: "0 0 8px",
          fontSize: "13px",
          fontWeight: 600,
          color: "#0369A1",
        }}
      >
        🥾 Rutas de Wikiloc
      </p>

      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {routes.map((route, i) => (
          <li key={i}>
            <a
              href={route.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "14px",
                color: "#0B5ED7",
                textDecoration: "none",
              }}
            >
              <span>📍</span>
              {route.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}