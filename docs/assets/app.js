(function () {
  const SITE_ORIGIN = "https://acimacredit--preflight.sandbox.my.site.com";
  const SITE_PATH = "/AdvantageLoyaltyProgram";
  const SCRIPT_SRC = `${SITE_ORIGIN}/lightning/lightning.out.js`;

  const AURA_APP = "c:AdvantageLoyalty";
  const COMPONENT = "c:AdvantageLoyaltyAuraWrapper";
  const MOUNT_ID = "lwc-root";

  // Configuration
  const CONFIG = {
    maxRetries: 3,
    retryDelay: 2000, // 2 seconds
    timeoutMs: 10000, // 10 seconds
    showDetailedStatus: true // Set to false in production
  };

  // State
  let retryCount = 0;
  let loadingTimeout = null;
  let componentMounted = false;

  // DOM Elements
  const elements = {
    lwcRoot: document.getElementById(MOUNT_ID),
    skeletonLoader: document.getElementById('skeleton-loader'),
    errorContainer: document.getElementById('error-container'),
    errorMessage: document.getElementById('error-message'),
    spinnerOverlay: document.getElementById('spinner-overlay'),
    statusBanner: document.getElementById('status-banner'),
    statusMessage: document.getElementById('status-message')
  };

  // Utility Functions
  function showElement(element) {
    if (element) element.classList.remove('hidden');
  }

  function hideElement(element) {
    if (element) element.classList.add('hidden');
  }

  function updateStatus(text, isError = false) {
    if (CONFIG.showDetailedStatus && elements.statusBanner && elements.statusMessage) {
      elements.statusMessage.textContent = text;
      
      // Update banner color based on status
      elements.statusBanner.className = isError ? 'error-container' : 'success-message';
      
      if (isError) {
        elements.statusBanner.style.background = '#c23934';
      } else {
        elements.statusBanner.style.background = '#45b75d';
      }
      
      showElement(elements.statusBanner);
      
      // Auto-hide success messages after 3 seconds
      if (!isError) {
        setTimeout(() => {
          if (elements.statusBanner && !componentMounted) {
            hideElement(elements.statusBanner);
          }
        }, 3000);
      }
    }
    
    console.log(isError ? '❌' : '✓', text);
  }

  function showError(err) {
    // Hide loading states
    hideElement(elements.skeletonLoader);
    hideElement(elements.spinnerOverlay);
    
    // Show error container
    const msg = err && err.message ? err.message : String(err);
    if (elements.errorMessage) {
      elements.errorMessage.textContent = msg;
    }
    showElement(elements.errorContainer);
    
    // Update status
    updateStatus(msg, true);
    
    console.error('Error:', err);
  }

  function hideAllLoadingStates() {
    // Fade out spinner
    if (elements.spinnerOverlay) {
      elements.spinnerOverlay.classList.add('fade-out');
      setTimeout(() => {
        hideElement(elements.spinnerOverlay);
        elements.spinnerOverlay.classList.remove('fade-out');
      }, 300);
    }
    
    // Hide skeleton with fade
    if (elements.skeletonLoader) {
      elements.skeletonLoader.style.transition = 'opacity 0.3s ease';
      elements.skeletonLoader.style.opacity = '0';
      setTimeout(() => {
        hideElement(elements.skeletonLoader);
        elements.skeletonLoader.style.opacity = '1';
      }, 300);
    }
  }

  function loadScript() {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
      if (existing) {
        if (window.$Lightning) {
          return resolve();
        }
        // Script exists but not initialized, wait for it
        const checkInterval = setInterval(() => {
          if (window.$Lightning) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        return;
      }

      // Create new script
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      
      s.onload = () => {
        // Wait for $Lightning to be available
        const checkInterval = setInterval(() => {
          if (window.$Lightning) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        
        // Timeout for $Lightning initialization
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error("$Lightning not initialized after script load"));
        }, 5000);
      };
      
      s.onerror = () => reject(new Error(`Failed to load script: ${SCRIPT_SRC}`));
      document.head.appendChild(s);
    });
  }

  async function initializeLightningOut() {
    return new Promise((resolve, reject) => {
      try {
        const endpoint = `${SITE_ORIGIN}${SITE_PATH}`;
        
        // Set timeout for Lightning Out initialization
        const initTimeout = setTimeout(() => {
          reject(new Error("Lightning Out initialization timed out"));
        }, CONFIG.timeoutMs);

        window.$Lightning.use(
          AURA_APP,
          function () {
            clearTimeout(initTimeout);
            updateStatus("Lightning Out initialized, creating component...");
            resolve();
          },
          endpoint,
          (error) => {
            clearTimeout(initTimeout);
            reject(error);
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  function createComponent() {
    return new Promise((resolve, reject) => {
      // Show spinner for component creation
      showElement(elements.spinnerOverlay);
      
      // Set timeout for component creation
      const componentTimeout = setTimeout(() => {
        reject(new Error("Component creation timed out"));
      }, CONFIG.timeoutMs);

      window.$Lightning.createComponent(
        COMPONENT,
        {
          // Pass any attributes your component needs
          // onload: (event) => console.log('Component loaded', event),
          // onerror: (event) => console.error('Component error', event)
        },
        MOUNT_ID,
        function (cmp) {
          clearTimeout(componentTimeout);
          
          if (cmp) {
            componentMounted = true;
            resolve(cmp);
          } else {
            reject(new Error("createComponent did not return a component"));
          }
        },
        function (error) {
          clearTimeout(componentTimeout);
          reject(error);
        }
      );
    });
  }

  async function boot() {
    try {
      // Show skeleton loader
      showElement(elements.skeletonLoader);
      hideElement(elements.lwcRoot);
      hideElement(elements.errorContainer);
      
      updateStatus("Loading Salesforce runtime...");
      
      // Set global timeout for entire boot process
      const bootTimeout = setTimeout(() => {
        if (!componentMounted) {
          showError(new Error("Boot process timed out. Please check your connection."));
        }
      }, CONFIG.timeoutMs * 2);

      // Load Lightning Out script
      await loadScript();
      updateStatus("Salesforce runtime loaded");
      
      // Initialize Lightning Out
      await initializeLightningOut();
      
      // Create and mount component
      await createComponent();
      
      // Clear boot timeout
      clearTimeout(bootTimeout);
      
      // Success! Hide loading states and show component
      hideAllLoadingStates();
      showElement(elements.lwcRoot);
      
      updateStatus("Loyalty program loaded successfully");
      
      // Reset retry count on success
      retryCount = 0;
      
    } catch (error) {
      handleError(error);
    }
  }

  function handleError(error) {
    // Clear any pending timeouts
    if (loadingTimeout) clearTimeout(loadingTimeout);
    
    // Check if we should retry
    if (retryCount < CONFIG.maxRetries) {
      retryCount++;
      updateStatus(`Connection failed. Retrying (${retryCount}/${CONFIG.maxRetries})...`, true);
      
      // Hide error container if showing
      hideElement(elements.errorContainer);
      
      // Show skeleton loader for retry
      showElement(elements.skeletonLoader);
      
      // Attempt retry after delay
      setTimeout(() => {
        boot();
      }, CONFIG.retryDelay * retryCount); // Exponential backoff
    } else {
      // Max retries reached, show permanent error
      showError(error);
    }
  }

  // Retry function for error button
  window.retryLoad = function() {
    retryCount = 0;
    componentMounted = false;
    hideElement(elements.errorContainer);
    boot();
  };

  // Connection status monitoring
  window.addEventListener('online', function() {
    updateStatus("Internet connection restored");
    // If we're showing an error, automatically retry
    if (!elements.errorContainer.classList.contains('hidden')) {
      retryLoad();
    }
  });

  window.addEventListener('offline', function() {
    showError(new Error("Internet connection lost. Please check your network."));
  });

  // Start the boot process
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // Optional: Expose debug info in console
  window.debugLoyalty = {
    status: () => ({
      componentMounted,
      retryCount,
      siteOrigin: SITE_ORIGIN,
      sitePath: SITE_PATH,
      component: COMPONENT,
      auraApp: AURA_APP
    }),
    retry: retryLoad
  };
})();
