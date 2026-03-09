(function () {
  // IMPORTANT: Use your Experience Cloud site base URL (publicly accessible)
  const SITE_HOST = "https://acimacredit--preflight.sandbox.my.site.com/AdvantageLoyaltyProgram"; 

  const SCRIPT_SRC = `${SITE_HOST}/lightning/lightning.out.js`;

  // Your Aura out app (your app file name: AdvantageLoyalty.app)
  const AURA_APP = "c:AdvantageLoyalty";

  // Your LWC exposed via LO
  const COMPONENT = "c:AdvantageLoyaltyLWC";

  const MOUNT_ID = "lwc-root";

  function showStatus(text) {
    const root = document.getElementById(MOUNT_ID);
    if (root) root.innerHTML = `<p class="status">${text}</p>`;
  }

  function showError(err) {
    const root = document.getElementById(MOUNT_ID);
    const msg = err && err.message ? err.message : String(err);
    if (root) root.innerHTML = `<pre style="white-space:pre-wrap;color:#b00020">${msg}</pre>`;
    console.error(err);
  }

  function loadScript() {
    return new Promise((resolve, reject) => {
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

      if (!window.$Lightning) throw new Error("window.$Lightning missing; lightning.out.js not initialized.");

      showStatus("Initializing…");

      window.$Lightning.use(
        AURA_APP,
        function () {
          showStatus("Creating component…");
          window.$Lightning.createComponent(COMPONENT, {}, MOUNT_ID, function () {
            // mounted
          });
        },
        SITE_HOST
      );
    } catch (e) {
      showError(e);
    }
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", boot)
    : boot();
})();
