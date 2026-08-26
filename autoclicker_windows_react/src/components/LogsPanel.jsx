import { useState } from "react";

/**
 * Odpowiednik addLog()/#logs z oryginalnego renderer.js.
 */
export default function LogsPanel({ logs, onClear }) {
  const [query, setQuery] = useState("");
  const [browserFilter, setBrowserFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredLogs = logs.filter((entry) => {
    const matchesQuery = `${entry.message} ${entry.timestamp}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesBrowser =
      browserFilter === "all" || entry.browserId === browserFilter;
    const matchesType = typeFilter === "all" || entry.type === typeFilter;
    return matchesQuery && matchesBrowser && matchesType;
  });

  const exportLogs = () => {
    const content = filteredLogs
      .map(
        (entry) =>
          `[${entry.timestamp}] ${entry.browserId ? `(${entry.browserId.toUpperCase()}) ` : ""}${entry.message}`,
      )
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([content], { type: "text/plain" }),
    );
    link.download = "autoclicker-logi.txt";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="logs-section" id="logs">
      <div className="logs-toolbar">
        <input
          className="logs-search"
          type="search"
          placeholder="Szukaj w logach"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          value={browserFilter}
          onChange={(event) => setBrowserFilter(event.target.value)}
        >
          <option value="all">Wszystkie karty</option>
          <option value="a">Karta A</option>
          <option value="b">Karta B</option>
          <option value="c">Karta C</option>
          <option value="d">Karta D</option>
        </select>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="all">Wszystkie typy</option>
          <option value="success">Sukces</option>
          <option value="info">Informacja</option>
          <option value="warning">Ostrzeżenia</option>
          <option value="error">Błędy</option>
        </select>
        <div className="logs-actions">
          <button
            type="button"
            className="logs-action-btn"
            onClick={exportLogs}
            title="Eksportuj widoczne logi"
          >
            Eksportuj
          </button>
          <button
            type="button"
            className="logs-action-btn logs-action-btn--muted"
            onClick={onClear}
            title="Wyczyść logi"
          >
            Wyczyść
          </button>
        </div>
      </div>
      {filteredLogs.map((entry) => (
        <div key={entry.id} className={`log-entry log-${entry.type}`}>
          [{entry.timestamp}]{" "}
          {entry.browserId ? `(${entry.browserId.toUpperCase()}) ` : ""}
          {entry.message}
        </div>
      ))}
      {filteredLogs.length === 0 && (
        <div className="logs-empty">Brak logów dla wybranych filtrów</div>
      )}
    </div>
  );
}
