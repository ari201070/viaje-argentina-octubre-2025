import Header from "./Header";

export default function Layout({ children }) {
  return (
    <div
      style={{
        background: "#F5F7FA",
        minHeight: "100vh",
        fontFamily: "Segoe UI,Arial",
      }}
    >
      <Header />

      <main
        style={{
          maxWidth: "1400px",
          margin: "40px auto",
          padding: "20px",
        }}
      >
        {children}
      </main>
    </div>
  );
}