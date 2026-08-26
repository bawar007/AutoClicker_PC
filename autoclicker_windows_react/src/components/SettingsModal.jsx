import { useEffect, useRef, useState } from "react";
import CredentialsPanel from "./CredentialsPanel.jsx";
import { LicenseDetails } from "./LicenseManagerModal.jsx";

const THEME_OPTIONS = [
  { value: "system", label: "Użyj domyślnych ustawień systemowych" },
  { value: "dark", label: "Ciemny" },
  { value: "light", label: "Jasny" },
];

function ThemeDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedOption =
    THEME_OPTIONS.find((option) => option.value === value) ?? THEME_OPTIONS[0];

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      className={`theme-dropdown${isOpen ? " is-open" : ""}`}
      ref={dropdownRef}
    >
      <button
        className="theme-dropdown__trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{selectedOption.label}</span>
        <span className="theme-dropdown__chevron" aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          className="theme-dropdown__menu"
          role="listbox"
          aria-label="Motyw aplikacji"
        >
          {THEME_OPTIONS.map((option) => (
            <button
              className={`theme-dropdown__option${option.value === value ? " is-selected" : ""}`}
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsModal({
  isOpen,
  activeBrowserId,
  trustedOverride,
  credentials,
  onSaveCredential,
  onDeleteCredential,
  onCopyCredential,
  onOpenLicenseManager,
  onOpenDevTools,
  onClose,
  persistenceEnabled,
  onPersistenceChange,
  showLogs,
  onLogsVisibilityChange,
  profiles = [],
  onSaveProfile,
  onLoadProfile,
  onDeleteProfile,
  onExportProfiles,
  onImportProfiles,
  licenseInfo,
  onRefreshLicense,
  onOpenLicenseActivation,
  onRevokeLicense,
  themePreference = "system",
  onThemeChange,
}) {
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem("autoclicker-windows-settings-tab");
    return ["general", "advanced", "license"].includes(savedTab)
      ? savedTab
      : "general";
  });
  const [profileName, setProfileName] = useState("");
  const profileFileInputRef = useRef(null);
  const selectTab = (tab) => {
    setActiveTab(tab);
    localStorage.setItem("autoclicker-windows-settings-tab", tab);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" role="dialog" aria-modal="true">
      <div className="modal-content settings-modal-content">
        <div className="modal-header">
          <h2>⚙️ Ustawienia aplikacji</h2>
          <button className="modal-close-btn" type="button" onClick={onClose}>
            ✕ Zamknij
          </button>
        </div>
        <div className="settings-tabs" role="tablist" aria-label="Ustawienia">
          <button
            className={`settings-tab${activeTab === "general" ? " is-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={activeTab === "general"}
            onClick={() => selectTab("general")}
          >
            Ogólne
          </button>
          <button
            className={`settings-tab${activeTab === "advanced" ? " is-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={activeTab === "advanced"}
            onClick={() => selectTab("advanced")}
          >
            Zaawansowane
          </button>
          <button
            className={`settings-tab${activeTab === "license" ? " is-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={activeTab === "license"}
            onClick={() => selectTab("license")}
          >
            Licencja
          </button>
        </div>
        <div className="modal-body settings-modal-body">
          {activeTab === "general" ? (
            <>
              <div className="control-section settings-persistence-section">
                <h3>💾 Preferencje aplikacji</h3>
                <div className="toggle-group">
                  <span className="toggle-label">
                    Zapamiętuj układ i ustawienia
                  </span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={persistenceEnabled}
                      onChange={(event) =>
                        onPersistenceChange(event.target.checked)
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <p className="settings-trusted-hint">
                  Zapisywane są karty, adresy URL, polling i stan panelu
                  bocznego.
                </p>
              </div>
              <div className="control-section settings-theme-section">
                <h3>🎨 Wygląd</h3>
                <label
                  className="settings-select-label"
                  htmlFor="theme-preference"
                >
                  Motyw aplikacji
                </label>
                <ThemeDropdown
                  value={themePreference}
                  onChange={onThemeChange}
                />
                <p className="settings-trusted-hint">
                  Tryb systemowy dopasowuje aplikację do ustawień Windows.
                </p>
              </div>
              <CredentialsPanel
                credentials={credentials}
                onSave={onSaveCredential}
                onDelete={onDeleteCredential}
                onCopy={onCopyCredential}
              />
            </>
          ) : activeTab === "advanced" ? (
            <>
              <div className="control-section settings-advanced-section">
                <h3>🧪 Zaawansowane</h3>
                <div className="toggle-group">
                  <span className="toggle-label">Pokaż sekcję Logi</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={showLogs}
                      onChange={(event) =>
                        onLogsVisibilityChange(event.target.checked)
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <p className="settings-trusted-hint">
                  Ukrywa lub pokazuje panel logów w głównym oknie aplikacji.
                </p>
                <div className="settings-profiles">
                  <h3>📁 Profile pracy</h3>
                  <div className="settings-profile-create">
                    <input
                      type="text"
                      value={profileName}
                      placeholder="Nazwa profilu"
                      onChange={(event) => setProfileName(event.target.value)}
                    />
                    <button
                      className="btn btn-secondary btn-small"
                      type="button"
                      disabled={!profileName.trim()}
                      onClick={() => {
                        onSaveProfile(profileName);
                        setProfileName("");
                      }}
                    >
                      Zapisz
                    </button>
                  </div>
                  {profiles.length === 0 ? (
                    <p className="settings-trusted-hint">
                      Brak zapisanych profili.
                    </p>
                  ) : (
                    <div className="settings-profile-list">
                      {profiles.map((profile) => (
                        <div
                          className="settings-profile-row"
                          key={profile.name}
                        >
                          <span>{profile.name}</span>
                          <button
                            className="btn btn-secondary btn-small"
                            type="button"
                            onClick={() => onLoadProfile(profile)}
                          >
                            Wczytaj
                          </button>
                          <button
                            className="btn btn-danger btn-small"
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Czy na pewno usunąć profil „${profile.name}”?`,
                                )
                              ) {
                                onDeleteProfile(profile.name);
                              }
                            }}
                          >
                            Usuń
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="settings-profile-transfer">
                    <button
                      className="btn btn-secondary btn-small"
                      type="button"
                      onClick={onExportProfiles}
                      disabled={profiles.length === 0}
                    >
                      Eksportuj
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      type="button"
                      onClick={() => profileFileInputRef.current?.click()}
                    >
                      Importuj
                    </button>
                    <input
                      ref={profileFileInputRef}
                      className="settings-profile-file-input"
                      type="file"
                      accept="application/json,.json"
                      onChange={(event) => {
                        onImportProfiles(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="control-section settings-trusted-section">
                <h3>🔓 Kontrola isTrusted</h3>
                <div className="toggle-group">
                  <span className="toggle-label">Override isTrusted</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={!!trustedOverride.enabled[activeBrowserId]}
                      onChange={(event) =>
                        trustedOverride.toggle(
                          activeBrowserId,
                          event.target.checked,
                        )
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <p className="settings-trusted-hint">
                  Override dotyczy aktywnego okna przeglądarki.
                </p>
              </div>
              <div className="control-section settings-tools">
                <h3>🛠️ Narzędzia</h3>
                <button className="btn btn-secondary" onClick={onOpenDevTools}>
                  🔧 Otwórz DevTools
                </button>
              </div>
            </>
          ) : (
            <div className="settings-license-content">
              <LicenseDetails
                licenseInfo={licenseInfo}
                onRefresh={onRefreshLicense}
                onOpenActivation={onOpenLicenseActivation}
                onRevoke={onRevokeLicense}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
