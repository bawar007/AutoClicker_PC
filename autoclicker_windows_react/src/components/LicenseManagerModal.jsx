function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function LicenseDetails({
  licenseInfo,
  onRefresh,
  onOpenActivation,
  onRevoke,
}) {
  const isActive = !!licenseInfo?.isActive;
  const licenseType = licenseInfo?.licenseType ?? "BRAK";
  const licenseTypeClass = licenseType.toLowerCase();
  const key = licenseInfo?.licenseKey ?? licenseInfo?.key ?? "—";
  const handleRevoke = () => {
    if (
      window.confirm(
        "Czy na pewno usunąć licencję? Tej operacji nie można cofnąć.",
      )
    ) {
      onRevoke();
    }
  };

  if (!isActive) {
    return (
      <div className="license-card inactive">
        <div style={{ textAlign: "center", padding: "24px 10px" }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>❌</div>
          <h3 style={{ marginBottom: 10 }}>Brak aktywnej licencji</h3>
          <p style={{ color: "#aaa", fontSize: 13, marginBottom: 18 }}>
            Aplikacja wymaga aktywnej licencji do działania.
          </p>
          <button className="btn btn-primary" onClick={onOpenActivation}>
            Aktywuj Licencję
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="license-card active">
        <div className="status-row">
          <div className={`license-type ${licenseTypeClass}`}>
            {licenseType}
          </div>
          <div className="status-badge">
            <span className="status-indicator"></span>
            <span>AKTYWNA</span>
          </div>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">🔑 Klucz</div>
            <div className="info-value">{key}</div>
          </div>
          <div className="info-item">
            <div className="info-label">👥 Max przeglądarek</div>
            <div className="info-value">{licenseInfo?.maxBrowsers ?? "—"}</div>
          </div>
          <div className="info-item">
            <div className="info-label">📅 Aktywowana</div>
            <div className="info-value">
              {formatDate(licenseInfo?.activatedAt)}
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">⏰ Wygasa</div>
            <div className="info-value">
              {formatDate(licenseInfo?.expiresAt)}
            </div>
          </div>
          <div className="info-item full-width">
            <div className="info-label">🖥️ Machine ID</div>
            <div className="info-value">{licenseInfo?.machineId ?? "—"}</div>
          </div>
        </div>
        <div className="action-row">
          <button className="btn btn-secondary" onClick={onRefresh}>
            🔄 Odśwież
          </button>
          <button className="btn btn-primary" onClick={onOpenActivation}>
            🔄 Zmień Licencję
          </button>
          <button className="btn btn-danger" onClick={handleRevoke}>
            🗑️ Usuń Licencję
          </button>
        </div>
      </div>
      <div className="license-card">
        <div className="info-label">ℹ️ Informacje Techniczne</div>
        <p style={{ color: "#aaa", fontSize: 12, lineHeight: 1.6 }}>
          Licencja jest przechowywana lokalnie na tym komputerze i zaszyfrowana
          za pomocą Machine ID.
        </p>
      </div>
    </>
  );
}

export default function LicenseManagerModal({
  isOpen,
  licenseInfo,
  onClose,
  onRefresh,
  onOpenActivation,
  onRevoke,
}) {
  return (
    <div className={`modal-overlay${isOpen ? " active" : ""}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>🔐 Zarządzanie Licencją</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕ Zamknij
          </button>
        </div>

        <div className="modal-body">
          <LicenseDetails
            licenseInfo={licenseInfo}
            onRefresh={onRefresh}
            onOpenActivation={onOpenActivation}
            onRevoke={onRevoke}
          />
        </div>
      </div>
    </div>
  );
}
