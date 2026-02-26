async function storePluginId() {
  let storedId;

  storedId = crypto.randomUUID();
  return storedId;
}

const premiumTypes = ["GOLD", "BUSINESS GOLD"];

async function getToken() {
  chrome.storage.local.get("storedId", async (result) => {
    let storedId = result.storedId ? result.storedId : false;
    if (storedId) {
      document.querySelector("#token").innerText = `${storedId}`;

      const isPremiumEl = document.getElementById("is__premium");
      const data = {
        premium: "GOLD",
      };
      if (data.premium) {
        //document.querySelector(".buttonContainer").style.display = "none";
        document.querySelector(".switchContainer").style.display = "flex";
        if (premiumTypes.includes(data.premium)) {
          isPremiumEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 20 20" height="40px" viewBox="0 0 20 20" width="40px" fill="gold"><rect fill="none" height="20" width="20"/><path d="M10,2C6.41,2,3.5,4.91,3.5,8.5c0,1.83,0.76,3.48,1.97,4.66V19L10,18l4.5,1v-5.82c1.23-1.18,2-2.84,2-4.68 C16.5,4.91,13.59,2,10,2z M13,17.13l-3-0.67l-3.03,0.67v-2.88C7.88,14.73,8.91,15,10,15c1.08,0,2.1-0.27,3-0.74V17.13z M10,13.5 c-2.76,0-5-2.24-5-5s2.24-5,5-5s5,2.24,5,5S12.76,13.5,10,13.5z M8.14,11.35L10,9.94l1.85,1.41l-0.7-2.28L13,7.6h-2.27L10,5.35 L9.27,7.6H7l1.85,1.47L8.14,11.35z"/></svg>`;
        }
        if (!premiumTypes.includes(data.premium)) {
          isPremiumEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 20 20" height="40px" viewBox="0 0 20 20" width="40px" fill="silver"><rect fill="none" height="20" width="20"/><path d="M10,2C6.41,2,3.5,4.91,3.5,8.5c0,1.83,0.76,3.48,1.97,4.66V19L10,18l4.5,1v-5.82c1.23-1.18,2-2.84,2-4.68 C16.5,4.91,13.59,2,10,2z M13,17.13l-3-0.67l-3.03,0.67v-2.88C7.88,14.73,8.91,15,10,15c1.08,0,2.1-0.27,3-0.74V17.13z M10,13.5 c-2.76,0-5-2.24-5-5s2.24-5,5-5s5,2.24,5,5S12.76,13.5,10,13.5z M8.14,11.35L10,9.94l1.85,1.41l-0.7-2.28L13,7.6h-2.27L10,5.35 L9.27,7.6H7l1.85,1.47L8.14,11.35z"/></svg>`;
        }
      } else {
        chrome.storage.local.remove("myData", (result) => {});
        chrome.storage.local.remove("premium", (result) => {});
        document.querySelector(".buttonContainer").style.display = "flex";

        document.querySelector("#openEbrama").style.display = "none";
        document.querySelector("#buy_premium").style.display = "block";
        document.querySelector("#buy_premium").addEventListener("click", () => {
          const url = `https://autoclicker.pl/panel/dashboard?token=${storedId}`;
          window.open(url, "_blank");
        });

        isPremiumEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 20 20" height="40px" viewBox="0 0 20 20" width="40px" fill="brown"><rect fill="none" height="20" width="20"/><path d="M10,2C6.41,2,3.5,4.91,3.5,8.5c0,1.83,0.76,3.48,1.97,4.66V19L10,18l4.5,1v-5.82c1.23-1.18,2-2.84,2-4.68 C16.5,4.91,13.59,2,10,2z M13,17.13l-3-0.67l-3.03,0.67v-2.88C7.88,14.73,8.91,15,10,15c1.08,0,2.1-0.27,3-0.74V17.13z M10,13.5 c-2.76,0-5-2.24-5-5s2.24-5,5-5s5,2.24,5,5S12.76,13.5,10,13.5z M8.14,11.35L10,9.94l1.85,1.41l-0.7-2.28L13,7.6h-2.27L10,5.35 L9.27,7.6H7l1.85,1.47L8.14,11.35z"/></svg>`;
      }
      chrome.storage.local.set({ storedId: storedId }, () => {});

      return true;
    } else {
      document.querySelector("#token").innerText = ``;
      const id = await storePluginId();
      chrome.storage.local.set({ storedId: id }, () => {});
    }
  });
}

document.addEventListener("DOMContentLoaded", async (isLoaded) => {
  //Funkcja która tworzy sloty do wyświetlania w popup.html
  // Sprawdzenie aktywnej zakładki
  chrome.tabs.query(
    { active: true, currentWindow: true },
    async function (tabs) {
      // tabs[0] to aktywna zakładka
      const currentTab = tabs[0];

      await getToken();
      if (currentTab.url.includes("ebrama.baltichub.com")) {
        document.querySelector(".buttonContainer").style.display = "none";

        chrome.storage.local.get("myData", (result) => {
          if (result.myData && result.myData.length > 0) {
            const firstDateTime = result.myData[0]; // Pobieramy pierwszą datę z tablicy

            // Ustawiamy datę w elemencie span #data
            document.getElementById("data").innerText =
              `Wybrana data: ${firstDateTime.date}`;

            // Tworzymy główny div dla godzin
            const timeContainer = document.createElement("div");
            timeContainer.id = "time-container";

            // Dodajemy godziny jako osobne divy
            result.myData
              .sort((a, b) => {
                // Porównujemy czas, traktując go jako godziny i minuty
                const [hoursA, minutesA] = a.time.split(":").map(Number);
                const [hoursB, minutesB] = b.time.split(":").map(Number);

                // Porównujemy godziny, a następnie minuty
                if (hoursA !== hoursB) {
                  return hoursA - hoursB;
                }
                return minutesA - minutesB;
              })
              .forEach((dateTime) => {
                const timeDiv = document.createElement("div");
                timeDiv.classList.add("time-slot");
                timeDiv.innerText = dateTime.time; // Pobieramy tylko godzinę

                const showDetails = document.createElement("div");
                showDetails.className = "showDetails";

                timeDiv.appendChild(showDetails);
                timeContainer.appendChild(timeDiv);
              });

            const h3El = document.createElement("h3");
            h3El.innerText = "Wybrane sloty do klikania";

            // Dodajemy timeContainer do dokumentu
            document.querySelector(".my-slots").appendChild(h3El);
            document.querySelector(".my-slots").appendChild(timeContainer);
          }
        });

        chrome.storage.local.get("pluginIsOn", (result) => {
          const dateEL = document.querySelector("#date-span");
          const slotsEl = document.querySelector(".my-slots");
          if (result.pluginIsOn) {
            const myCheck = document.querySelector("#my-check");

            myCheck.checked = true;
            document.querySelector("#onoff").innerText = "ON";
            dateEL.style.display = "block";
            slotsEl.style.display = "flex";
          } else {
            const myCheck = document.querySelector("#my-check");

            myCheck.checked = false;
            document.querySelector("#onoff").innerText = "OFF";
            dateEL.style.display = "none";
            slotsEl.style.display = "none";
          }
        });

        document.querySelector(".switch").addEventListener("click", () => {
          const myCheck = document.querySelector("#my-check");
          const dateEL = document.querySelector("#date-span");
          const slotsEl = document.querySelector(".my-slots");

          myCheck.checked = !myCheck.checked;

          document.querySelector("#onoff").innerText = myCheck.checked
            ? "ON"
            : "OFF";

          if (myCheck.checked) {
            chrome.storage.local.set({ pluginIsOn: true }, () => {});
            dateEL.style.display = "block";
            slotsEl.style.display = "flex";
          } else {
            chrome.storage.local.set({ pluginIsOn: false }, () => {});
            chrome.storage.local.remove("myData", (result) => {});

            dateEL.style.display = "none";
            slotsEl.style.display = "none";
          }
        });
      } else {
        document.querySelector(".my-slots").style.display = "none";
        document.querySelector("#date-span").style.display = "none";

        document.querySelector(".buttonContainer").style.display = "flex";
        const textInfo = document.createElement("p");
        textInfo.innerText =
          "Plugin działa tylko na stronie ebrama.baltichub.com";
        document.querySelector(".buttonContainer").appendChild(textInfo);
        document.querySelector(".switch__container").style.display = "none";

        document.querySelector("#openEbrama").style.display = "block";
        document.querySelector("#buy_premium").style.display = "none";

        document.querySelector("#openEbrama").addEventListener("click", () => {
          const url = `https://ebrama.baltichub.com`;
          window.open(url, "_blank");
        });
      }
    },
  );
});
