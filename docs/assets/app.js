(function () {
  const SF_HOST = "https://acimacredit--preflight.sandbox.my.salesforce.com";
  const SCRIPT_SRC = `${SF_HOST}/lightning/lightning.out.js`;

  // This matches your Aura app file AdvantageLoyalty.app
  const AURA_APP = "c:AdvantageLoyalty";

  // This matches your dependency
  const COMPONENT = "c:AdvantageLoyaltyLWC";

  const MOUNT_ID = "lwc-root";

  function showStatus(text) {
    const root = document.getElementById(MOUNT_ID);
    if (root) root.innerHTML = `<p class="status">${text}</p>`;
  }

  function showError(err) {
    const root = document.getElementById(MOUNT_ID);
    const msg = err && err.message ? err.message : String(err);
    if (root) {
      root.innerHTML = `<pre style="white-space:pre-wrap;color:#b00020">${msg}</pre>`;
    }
    console.error(err);
  }

  function loadScript() {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
      if (existing) return resolve();

      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load script: " + SCRIPT_SRC));
      document.head.appendChild(s);
    });
  }

  async function boot() {
    try {
      showStatus("Loading Salesforce runtime…");

      await loadScript();

      if (!window.$Lightning) {
        throw new Error(
          "Lightning Out runtime loaded, but window.$Lightning is missing. " +
            "This usually means the script response wasn't the real runtime JS."
        );
      }

      showStatus("Initializing Lightning Out…");

      window.$Lightning.use(
        AURA_APP,
        function () {
          showStatus("Creating component…");

          window.$Lightning.createComponent(COMPONENT, {}, MOUNT_ID, function () {
            // Mounted
          });
        },
        SF_HOST
      );
    } catch (e) {
      showError(e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
