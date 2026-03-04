const express = require("express");
const cors = require("cors");
const LicenseManager = require("./licenseManager");

class LicenseServer {
  constructor(port = 5000) {
    this.app = express();
    this.port = port;
    this.licenseManager = new LicenseManager();
    this.activeBrowsers = new Set(); // Śledzenie aktywnych przeglądarek

    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  setupRoutes() {
    // Endpoint GET /license - zwraca informacje o licencji
    this.app.get("/license", (req, res) => {
      try {
        const licenseInfo = this.licenseManager.getLicenseInfo();

        if (!licenseInfo.isActive) {
          return res.status(403).json({
            error: "Brak aktywnej licencji",
            isActive: false,
          });
        }

        res.json({
          licenseType: licenseInfo.licenseType,
          maxBrowsers: licenseInfo.maxBrowsers,
          isActive: licenseInfo.isActive,
          expiresAt: licenseInfo.expiresAt,
          activatedAt: licenseInfo.activatedAt,
          currentBrowsers: this.activeBrowsers.size,
          availableSlots: licenseInfo.maxBrowsers - this.activeBrowsers.size,
        });
      } catch (error) {
        res.status(500).json({
          error: "Błąd odczytu licencji",
          message: error.message,
        });
      }
    });

    // Endpoint POST /browser/register - rejestracja nowej przeglądarki
    this.app.post("/browser/register", (req, res) => {
      const { browserId } = req.body;

      if (!browserId) {
        return res.status(400).json({ error: "Brak browserId" });
      }

      try {
        const licenseInfo = this.licenseManager.getLicenseInfo();

        if (!licenseInfo.isActive) {
          return res.status(403).json({ error: "Brak aktywnej licencji" });
        }

        // Sprawdź czy przeglądarka już jest zarejestrowana
        if (this.activeBrowsers.has(browserId)) {
          return res.json({
            success: true,
            message: "Przeglądarka już zarejestrowana",
            currentBrowsers: this.activeBrowsers.size,
          });
        }

        // Sprawdź czy nie przekroczono limitu
        if (this.activeBrowsers.size >= licenseInfo.maxBrowsers) {
          return res.status(403).json({
            error: "Przekroczono limit przeglądarek",
            maxBrowsers: licenseInfo.maxBrowsers,
            currentBrowsers: this.activeBrowsers.size,
          });
        }

        // Zarejestruj przeglądarkę
        this.activeBrowsers.add(browserId);

        res.json({
          success: true,
          currentBrowsers: this.activeBrowsers.size,
          availableSlots: licenseInfo.maxBrowsers - this.activeBrowsers.size,
        });
      } catch (error) {
        res.status(500).json({
          error: "Błąd rejestracji przeglądarki",
          message: error.message,
        });
      }
    });

    // Endpoint POST /browser/unregister - wyrejestrowanie przeglądarki
    this.app.post("/browser/unregister", (req, res) => {
      const { browserId } = req.body;

      if (!browserId) {
        return res.status(400).json({ error: "Brak browserId" });
      }

      this.activeBrowsers.delete(browserId);

      res.json({
        success: true,
        currentBrowsers: this.activeBrowsers.size,
      });
    });

    // Endpoint GET /health - sprawdzenie czy serwer działa
    this.app.get("/health", (req, res) => {
      res.json({ status: "OK", timestamp: new Date().toISOString() });
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          console.log(
            `📡 Serwer licencji działa na http://localhost:${this.port}`,
          );
          resolve();
        });
      } catch (error) {
        console.error("Błąd uruchomienia serwera:", error);
        reject(error);
      }
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      console.log("Serwer licencji zatrzymany");
    }
  }
}

module.exports = LicenseServer;
