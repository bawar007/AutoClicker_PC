// Test API licencji
// Uruchom: node test-license-api.js

const testAPI = async () => {
  const baseURL = "http://localhost:5000";

  console.log("🧪 Testowanie API licencji...\n");

  // Test 1: Health check
  console.log("1️⃣ Test health check:");
  try {
    const response = await fetch(`${baseURL}/health`);
    const data = await response.json();
    console.log("✅ Serwer działa:", data);
  } catch (error) {
    console.log("❌ Serwer nie jest dostępny:", error.message);
    console.log("   Upewnij się, że aplikacja Electron jest uruchomiona!");
    return;
  }

  console.log("\n2️⃣ Test sprawdzenia licencji:");
  try {
    const response = await fetch(`${baseURL}/license`);
    const data = await response.json();

    if (data.isActive) {
      console.log("✅ Licencja aktywna:");
      console.log(`   Typ: ${data.licenseType}`);
      console.log(`   Max przeglądarek: ${data.maxBrowsers}`);
      console.log(`   Aktywne przeglądarki: ${data.currentBrowsers}`);
      console.log(`   Dostępne sloty: ${data.availableSlots}`);
      console.log(
        `   Wygasa: ${new Date(data.expiresAt).toLocaleDateString("pl-PL")}`,
      );
    } else {
      console.log("❌ Brak aktywnej licencji");
      return;
    }
  } catch (error) {
    console.log("❌ Błąd:", error.message);
    return;
  }

  console.log("\n3️⃣ Test rejestracji przeglądarek:");
  const browserIds = ["browser-test-1", "browser-test-2", "browser-test-3"];

  for (const browserId of browserIds) {
    try {
      const response = await fetch(`${baseURL}/browser/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ browserId }),
      });

      const data = await response.json();

      if (data.success) {
        console.log(
          `✅ ${browserId}: Zarejestrowana (${data.currentBrowsers}/${data.currentBrowsers + data.availableSlots})`,
        );
      } else {
        console.log(`❌ ${browserId}: ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ ${browserId}: Błąd połączenia`);
    }
  }

  console.log("\n4️⃣ Test ponownego sprawdzenia licencji:");
  try {
    const response = await fetch(`${baseURL}/license`);
    const data = await response.json();
    console.log(
      `   Aktywne przeglądarki: ${data.currentBrowsers}/${data.maxBrowsers}`,
    );
    console.log(`   Dostępne sloty: ${data.availableSlots}`);
  } catch (error) {
    console.log("❌ Błąd:", error.message);
  }

  console.log("\n5️⃣ Test wyrejestrowania przeglądarki:");
  try {
    const response = await fetch(`${baseURL}/browser/unregister`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ browserId: "browser-test-1" }),
    });

    const data = await response.json();
    if (data.success) {
      console.log(
        `✅ browser-test-1 wyrejestrowana (pozostało: ${data.currentBrowsers})`,
      );
    }
  } catch (error) {
    console.log("❌ Błąd:", error.message);
  }

  console.log("\n6️⃣ Finalny stan:");
  try {
    const response = await fetch(`${baseURL}/license`);
    const data = await response.json();
    console.log(
      `   Aktywne przeglądarki: ${data.currentBrowsers}/${data.maxBrowsers}`,
    );
    console.log(`   Dostępne sloty: ${data.availableSlots}`);
  } catch (error) {
    console.log("❌ Błąd:", error.message);
  }

  console.log("\n✅ Testy zakończone!");
};

// Node.js 18+ ma wbudowany fetch, dla starszych wersji użyj node-fetch
testAPI().catch(console.error);
