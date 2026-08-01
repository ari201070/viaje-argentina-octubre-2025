import { useState } from "react";
import cities from "./data/cities.json";
import Layout from "./components/layout/Layout";
import CityGrid from "./components/cities/CityGrid";
import Roadmap from "./components/dashboard/Roadmap";
import BudgetDashboard from "./components/budget/BudgetDashboard";
import ExpenseForm from "./components/budget/ExpenseForm";
import ExpenseList from "./components/budget/ExpenseList";
import BudgetBackup from "./components/budget/BudgetBackup";
import DocumentDashboard from "./components/documents/DocumentDashboard";
import useLocalStorage from "./hooks/useLocalStorage";

const DEFAULT_BUDGET_CONFIG = {
  baseCurrency: "USD",
  arsToUsd: 1000,
  ilsToUsd: 3.7,
};

export default function App() {
  const [notes, setNotes] = useLocalStorage("argentina-viaje-notes", {});
  const [expenses, setExpenses] = useLocalStorage("vacation_expenses", []);
  const [budgetConfig, setBudgetConfig] = useLocalStorage(
    "vacation_budget_config",
    DEFAULT_BUDGET_CONFIG
  );
  const [view, setView] = useState("cities");

  const handleNoteChange = (cityId, note) => {
    setNotes((prev) => {
      const updated = { ...prev };
      if (note && note.trim()) {
        updated[cityId] = note.trim();
      } else {
        delete updated[cityId];
      }
      return updated;
    });
  };

  const handleAddExpense = (expense) => {
    setExpenses((prev) => [...prev, expense]);
  };

  const handleDeleteExpense = (id) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  const handleConfigChange = (newConfig) => {
    setBudgetConfig(newConfig);
  };

  const handleImportData = (importedExpenses, importedConfig) => {
    setExpenses(importedExpenses);
    setBudgetConfig(importedConfig);
  };

  const navButton = (key, label) => (
    <button
      onClick={() => setView(key)}
      style={{
        padding: "8px 16px",
        background: view === key ? "#0B5ED7" : "white",
        color: view === key ? "white" : "#374151",
        border: "1px solid #D1D5DB",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <Layout>
      {/* Navigation */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {navButton("cities", "Ciudades")}
        {navButton("budget", "Presupuesto")}
        {navButton("documents", "Vouchers")}
      </div>

      {view === "cities" && (
        <>
          <CityGrid
            cities={cities}
            notes={notes}
            onNoteChange={handleNoteChange}
          />
          <Roadmap />
        </>
      )}

      {view === "budget" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
            gap: "20px",
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <BudgetDashboard
              expenses={expenses}
              config={budgetConfig}
              onConfigChange={handleConfigChange}
            />
            <BudgetBackup
              expenses={expenses}
              config={budgetConfig}
              cities={cities}
              onImport={handleImportData}
            />
            <ExpenseList
              expenses={expenses}
              cities={cities}
              onDeleteExpense={handleDeleteExpense}
            />
          </div>
          <ExpenseForm cities={cities} onAddExpense={handleAddExpense} />
        </div>
      )}

      {view === "documents" && <DocumentDashboard cities={cities} />}
    </Layout>
  );
}
