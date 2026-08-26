import { useEffect, useState } from "react";

function formatLicenseKey(value) {
  const raw = value
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 16);
  return raw.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}

export default function LicenseActivationPage() {
  const [machineId, setMachineId] = useState("Ładowanie...");
  const [licenseKey, setLicenseKey] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.electronAPI.getMachineId().then((result) => {
      setMachineId(result.machineId || "Niedostępne");
    });

    window.electronAPI.onLicenseError((message) => {
      setError(message);
      setIsSubmitting(false);
    });

    window.electronAPI.onLicenseSuccess(() => {
      setError("");
      setIsSubmitting(false);
    });
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const regex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!regex.test(licenseKey)) {
      setError("Nieprawidłowy format klucza licencyjnego");
      return;
    }

    setIsSubmitting(true);
    window.electronAPI.activateLicense(licenseKey);
  };

  return (
    <div className="activation-page">
      <div className="activation-card">
        <h1>🔐 Aktywacja Licencji</h1>
        <p className="activation-subtitle">
          Automatyzacja pracy w przeglądarce
        </p>

        <div className="activation-machine-id">
          <div className="activation-machine-id-label">ID Komputera:</div>
          <div className="activation-machine-id-value">{machineId}</div>
        </div>

        <form className="activation-form" onSubmit={handleSubmit}>
          <label htmlFor="license-key">Klucz Licencyjny</label>
          <input
            id="license-key"
            type="text"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            maxLength={19}
            value={licenseKey}
            onChange={(event) =>
              setLicenseKey(formatLicenseKey(event.target.value))
            }
            required
          />
          <div style={{ fontSize: 12, color: "#999", marginTop: 5 }}>
            Format: XXXX-XXXX-XXXX-XXXX
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={isSubmitting}
            style={{ marginTop: 22 }}
          >
            {isSubmitting ? "Aktywacja..." : "Aktywuj Licencję"}
          </button>
        </form>

        {error && <div className="activation-error">{error}</div>}

        <div className="activation-info">
          <strong>Wskazówka:</strong> Klucz licencyjny jest przypisany do tego
          komputera. Zapisz swój ID komputera w bezpiecznym miejscu.
        </div>
      </div>
    </div>
  );
}
