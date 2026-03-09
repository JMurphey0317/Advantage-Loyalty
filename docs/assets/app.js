(function () {
  // This must be the Salesforce host that serves lightning.out
  const SF_HOST = "https://acimacredit--preflight.sandbox.my.salesforce.com";

  const SCRIPT_SRC = `${SF_HOST}/lightning/lightning.out.js`;


  const APP_NAME = "c:Advantage Loyalty"; 

  const COMPONENT_NAME = "c:AdvantageLoyaltyLWC";
  const MOUNT_ID = "lwc-root";

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
      const root = document.getElementById(MOUNT_ID);
      if (!root) throw new Error(`Missing mount element: #${MOUNT_ID}`);
      root.innerHTML = "Loading Salesforce component…";

      await loadScript();

      if (!window.$Lightning) {
        throw new Error("Lightning Out did not initialize (window.$Lightning is missing). Check SCRIPT_SRC/CSP/CORS.");
      }

      // Boot Lightning Out, then create the component into the mount div.
      window.$Lightning.use(
        APP_NAME,
        function () {
          window.$Lightning.createComponent(
            COMPONENT_NAME,
            {},              // attributes for your component
            MOUNT_ID,         // id of the DOM element to mount into
            function (cmp) {
              // mounted
            }
          );
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
