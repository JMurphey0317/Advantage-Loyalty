(function () {
  const SCRIPT_SRC =
    "https://acimacredit--preflight.sandbox.my.salesforce.com/lightning/lightning.out.latest/index.iife.prod.js";

  const APP_ID = "1UsVF0000000Fwj0AE";

  // Must match Salesforce snippet exactly
  const COMPONENT_TAG = "c-advantageloyaltylwc";

  function showError(err) {
    const root = document.getElementById("lwc-root");
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
      const root = document.getElementById("lwc-root");
      if (!root) throw new Error('Missing mount element: <div id="lwc-root">...</div>');

      // clear placeholder
      root.innerHTML = "";

      await loadScript();

      const appEl = document.createElement("lightning-out-application");
      appEl.setAttribute("app-id", APP_ID);
      appEl.setAttribute("components", COMPONENT_TAG);

      const cmpEl = document.createElement(COMPONENT_TAG);

      root.appendChild(appEl);
      root.appendChild(cmpEl);
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
