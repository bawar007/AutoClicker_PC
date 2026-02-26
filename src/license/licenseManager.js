const { machineIdSync } = require('node-machine-id');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

class LicenseManager {
  constructor() {
    this.licenseFile = path.join(require('electron').app.getPath('userData'), 'license.dat');
    this.machineId = this.getMachineId();
  }

  getMachineId() {
    try {
      return machineIdSync({ original: true });
    } catch (error) {
      console.error('Błąd pobierania Machine ID:', error);
      return null;
    }
  }

  // Szyfrowanie licencji
  encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.machineId || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  // Deszyfrowanie licencji
  decrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.machineId || 'default-key', 'salt', 32);
    
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = parts.join(':');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Walidacja klucza licencyjnego
  validateLicenseKey(key) {
    // Format: XXXX-XXXX-XXXX-XXXX
    const regex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return regex.test(key);
  }

  // Aktywacja licencji
  activate(licenseKey) {
    if (!this.validateLicenseKey(licenseKey)) {
      return { success: false, error: 'Nieprawidłowy format klucza licencyjnego' };
    }

    try {
      const licenseData = {
        key: licenseKey,
        machineId: this.machineId,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 rok
      };

      const encrypted = this.encrypt(JSON.stringify(licenseData));
      fs.writeFileSync(this.licenseFile, encrypted, 'utf8');

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Błąd zapisu licencji: ' + error.message };
    }
  }

  // Sprawdzenie czy licencja jest ważna
  isValid() {
    try {
      if (!fs.existsSync(this.licenseFile)) {
        return false;
      }

      const encrypted = fs.readFileSync(this.licenseFile, 'utf8');
      const decrypted = this.decrypt(encrypted);
      const licenseData = JSON.parse(decrypted);

      // Sprawdzenie Machine ID
      if (licenseData.machineId !== this.machineId) {
        return false;
      }

      // Sprawdzenie daty wygaśnięcia
      const expiresAt = new Date(licenseData.expiresAt);
      if (expiresAt < new Date()) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Błąd walidacji licencji:', error);
      return false;
    }
  }

  // Pobranie informacji o licencji
  getLicenseInfo() {
    try {
      if (!fs.existsSync(this.licenseFile)) {
        return { valid: false, message: 'Brak licencji' };
      }

      const encrypted = fs.readFileSync(this.licenseFile, 'utf8');
      const decrypted = this.decrypt(encrypted);
      const licenseData = JSON.parse(decrypted);

      return {
        valid: true,
        key: licenseData.key,
        activatedAt: licenseData.activatedAt,
        expiresAt: licenseData.expiresAt,
        machineId: this.machineId
      };
    } catch (error) {
      return { valid: false, message: 'Błąd odczytu licencji' };
    }
  }

  // Usunięcie licencji
  revoke() {
    try {
      if (fs.existsSync(this.licenseFile)) {
        fs.unlinkSync(this.licenseFile);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = LicenseManager;
