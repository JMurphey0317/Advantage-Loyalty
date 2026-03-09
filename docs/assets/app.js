(function () {
  // Site origin (NO path)
  const SITE_ORIGIN = "https://acimacredit--preflight.sandbox.my.site.com";

  // Your site path (the part after the domain)
  const SITE_PATH = "/AdvantageLoyaltyProgram";

  // Load Lightning Out runtime from the site origin
  const SCRIPT_SRC = `${SITE_ORIGIN}/lightning/lightning.out.js`;

  const AURA_APP = "c:AdvantageLoyalty";
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

      // Quick visible proof:
      showStatus(`Runtime loaded. $Lightning is ${window.$Lightning ? "present" : "MISSING"}.`);

      if (!window.$Lightning) {
        throw new Error("window.$Lightning is missing. lightning.out.js did not initialize properly.");
      }

      showStatus("Initializing Lightning Out…");

      // Try endpoint WITH the site path first (common for Experience sites)
      const endpoint = SITE_ORIGIN + SITE_PATH;

      window.$Lightning.use(
        AURA_APP,
        function () {
          showStatus("Creating component…");
          window.$Lightning.createComponent(COMPONENT, {}, MOUNT_ID, function () {
            // mounted
          });
        },
        endpoint
      );
    } catch (e) {
      showError(e);
    }
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", boot)
    : boot();
})();
