(function () {
  const SALESFORCE_ORIGIN = "https://acimacredit--preflight.sandbox.my.salesforce.com";
  const APP_ID = "1UsVF0000000Fwj0AE";
  const COMPONENT_DESCRIPTOR = "c:advantageLoyaltyLwc";

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load script: " + src));
      document.head.appendChild(s);
    });
  }

  function showError(err) {
    const root = document.getElementById("lwc-root");
    const msg = err && err.message ? err.message : String(err);
    if (root) root.innerHTML = `<pre style="white-space:pre-wrap;color:#b00020">${msg}</pre>`;
    console.error(err);
  }

  async function boot() {
    try {
      await loadScript(
        `${SALESFORCE_ORIGIN}/lightning/lightning.out.latest/index.iife.prod.js`
      );

      if (!window.$Lightning) throw new Error("$Lightning not found after loading Lightning Out.");

      window.$Lightning.use(APP_ID, function () {
        window.$Lightning.createComponent(
          COMPONENT_DESCRIPTOR,
          {},
          "lwc-root",
          function () {}
        );
      });
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
