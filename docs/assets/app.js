(function () {
  "use strict";

  var mount = document.getElementById("app");
  if (!mount) return;

  var heading = document.createElement("h1");
  heading.textContent = "Advantage Loyalty";

  var status = document.createElement("p");
  status.textContent = "GitHub Pages site is active. Static assets are ready for Salesforce Lightning Out 2.0.";
  status.className = "status";

  mount.appendChild(heading);
  mount.appendChild(status);
})();
