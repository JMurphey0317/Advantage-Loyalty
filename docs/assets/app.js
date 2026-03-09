(function () {
  const SITE_ORIGIN = "https://acimacredit--preflight.sandbox.my.site.com";
  const SITE_PATH = "/AdvantageLoyaltyProgram";
  const SCRIPT_SRC = `${SITE_ORIGIN}/lightning/lightning.out.js`;

  const AURA_APP = "c:AdvantageLoyalty";
  const COMPONENT = "c:AdvantageLoyaltyAuraWrapper";
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

      if (!window.$Lightning) {
        throw new Error("window.$Lightning is missing. lightning.out.js did not initialize properly.");
      }

      showStatus("Initializing Lightning Out…");

      // Experience site context MUST include the site path
      const endpoint = `${SITE_ORIGIN}${SITE_PATH}`;

      window.$Lightning.use(
        AURA_APP,
        function () {
          showStatus("Creating component…");
          window.$Lightning.createComponent(COMPONENT, {}, MOUNT_ID, function (cmp) {
            showStatus(cmp ? "Component mounted." : "createComponent did not return a component.");
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
