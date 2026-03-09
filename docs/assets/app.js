(function () {
  const SALESFORCE_ORIGIN = "https://acimacredit--preflight.sandbox.my.salesforce.com";
  const APP_ID = "1UsVF0000000Fwj0AE";
  const COMPONENT_DESCRIPTOR = "c:advantageLoyaltyLwc";

  function log(...args) {
    console.log("[Advantage-Loyalty]", ...args);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load script: " + src));
      document.head.appendChild(s);
    });
  }

  function showError(err) {
    const root = document.getElementById("lwc-root");
    const msg = err && err.message ? err.message : String(err);
    if (root) {
      root.innerHTML = `<pre style="white-space:pre-wrap;color:#b00020">${msg}</pre>`;
    }
    console.error(err);
  }

  async function boot() {
    try {
      const url = `${SALESFORCE_ORIGIN}/lightning/lightning.out.js`;
      log("Loading Lightning Out:", url);

      await loadScript(url);

      log("Loaded. window.$Lightning =", typeof window.$Lightning);

      if (!window.$Lightning) {
        throw new Error(
          "$Lightning not found after loading lightning.out.js. " +
            "Open DevTools → Network and confirm lightning.out.js is 200 and not an HTML login page."
        );
      }

      window.$Lightning.use(APP_ID, function () {
        log("Bootstrapped app. Creating component:", COMPONENT_DESCRIPTOR);

        window.$Lightning.createComponent(
          COMPONENT_DESCRIPTOR,
          {},
          "lwc-root",
          function () {
            log("Component created.");
          }
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
