(function () {
    // Configuration
    const SITE_ORIGIN = "https://acimacredit--preflight.sandbox.my.site.com";
    const SITE_PATH = "/AdvantageLoyaltyProgram";
    const SCRIPT_SRC = `${SITE_ORIGIN}${SITE_PATH}/lightning/lightning.out.js`;

    const AURA_APP = "c:AdvantageLoyalty";
    const COMPONENT = "c:AdvantageLoyaltyAuraWrapper";
    const MOUNT_ID = "lwc-root";

    const CONFIG = {
        maxRetries: 3,
        retryDelay: 2000,
        timeoutMs: 15000,
        showDetailedStatus: true
    };

    // State
    let retryCount = 0;
    let componentMounted = false;
    let loadingTimeout = null;

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

    // Helper Functions
    function showElement(element) {
        if (element) element.classList.remove('hidden');
    }

    function hideElement(element) {
        if (element) element.classList.add('hidden');
    }

    function updateStatus(text, isError = false) {
        console.log(isError ? '❌' : '✓', text);
        if (elements.statusBanner && elements.statusMessage) {
            elements.statusMessage.textContent = text;
            elements.statusBanner.style.background = isError ? '#c23934' : '#45b75d';
            showElement(elements.statusBanner);
            
            // Auto-hide success messages
            if (!isError) {
                setTimeout(() => hideElement(elements.statusBanner), 3000);
            }
        }
    }

    function showError(error) {
        hideElement(elements.skeletonLoader);
        hideElement(elements.spinnerOverlay);
        
        const errorMsg = error?.message || String(error);
        if (elements.errorMessage) {
            elements.errorMessage.textContent = errorMsg;
        }
        showElement(elements.errorContainer);
        updateStatus(errorMsg, true);
        console.error('Error:', error);
    }

    function hideAllLoadingStates() {
        if (elements.spinnerOverlay) {
            elements.spinnerOverlay.classList.add('fade-out');
            setTimeout(() => {
                hideElement(elements.spinnerOverlay);
                elements.spinnerOverlay.classList.remove('fade-out');
            }, 300);
        }
        
        if (elements.skeletonLoader) {
            elements.skeletonLoader.style.transition = 'opacity 0.3s ease';
            elements.skeletonLoader.style.opacity = '0';
            setTimeout(() => {
                hideElement(elements.skeletonLoader);
                elements.skeletonLoader.style.opacity = '1';
            }, 300);
        }
    }

    // Get configuration from URL
    function getConfig() {
        const params = new URLSearchParams(window.location.search);
        return {
            locationId: params.get('locationId') || 'LOC-001',
            userGuid: params.get('userGuid') || 'DEMO-USER-123',
            permissions: params.get('permissions') || 'view,export'
        };
    }

    // Apply demo config (called from the button)
    window.applyDemoConfig = function() {
        const locationId = document.getElementById('demo-locationId').value;
        const userGuid = document.getElementById('demo-userGuid').value;
        const permissions = document.getElementById('demo-permissions').value;
        const params = new URLSearchParams({ locationId, userGuid, permissions });
        window.location.search = params.toString();
    };

    // Load Lightning Out script
    function loadScript() {
        return new Promise((resolve, reject) => {
            // Check if script already exists
            const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
            if (existing) {
                console.log('Script already loaded');
                if (window.$Lightning) {
                    return resolve();
                }
            }

            // Create new script
            const script = document.createElement('script');
            script.src = SCRIPT_SRC;
            script.async = true;
            
            script.onload = () => {
                console.log('Script loaded successfully');
                // Wait for $Lightning to be available
                const checkInterval = setInterval(() => {
                    if (window.$Lightning) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                
                setTimeout(() => {
                    clearInterval(checkInterval);
                    reject(new Error('$Lightning not initialized'));
                }, 5000);
            };
            
            script.onerror = () => {
                reject(new Error(`Failed to load script: ${SCRIPT_SRC}`));
            };
            
            document.head.appendChild(script);
        });
    }

    // Initialize Lightning Out
function initializeLightningOut() {
    return new Promise((resolve, reject) => {
        if (!window.$Lightning) {
            reject(new Error('$Lightning not available'));
            return;
        }
        const endpoint = `${SITE_ORIGIN}${SITE_PATH}`;
        const initTimeout = setTimeout(() => {
            reject(new Error('Lightning Out initialization timed out'));
        }, CONFIG.timeoutMs);

        window.$Lightning.use(
            AURA_APP,
            function() {
                clearTimeout(initTimeout);
                console.log('Lightning Out initialized');
                resolve();
            },
            endpoint
        );
    });
}

    // Create the component
function createComponent() {
    return new Promise((resolve, reject) => {
        const componentTimeout = setTimeout(() => {
            reject(new Error('Component creation timed out'));
        }, CONFIG.timeoutMs);

        const config = getConfig();

        // Show mount target BEFORE creating
        showElement(elements.lwcRoot);

        window.$Lightning.createComponent(
            COMPONENT,
            {
                locationId:  config.locationId,
                userGuid:    config.userGuid,
                permissions: config.permissions
            },
            MOUNT_ID,
            function(cmp) {
                clearTimeout(componentTimeout);
                if (!cmp) {
                    reject(new Error('createComponent returned null — verify c:AdvantageLoyalty app name and Experience Cloud CORS'));
                    return;
                }
                componentMounted = true;
                resolve(cmp);
            }
        );
    });
}

    // Main boot function
    async function boot() {
        try {
            console.log('Starting boot process...');
            
            // Show skeleton, hide others
            showElement(elements.skeletonLoader);
            hideElement(elements.lwcRoot);
            hideElement(elements.errorContainer);
            
            updateStatus('Loading Salesforce runtime...');
            
            // Set overall timeout
            const bootTimeout = setTimeout(() => {
                if (!componentMounted) {
                    handleError(new Error('Boot process timed out'));
                }
            }, CONFIG.timeoutMs * 2);

            // Load script
            await loadScript();
            updateStatus('Salesforce runtime loaded');
            
            // Initialize Lightning Out
            await initializeLightningOut();
            
            // Create component
            await createComponent();
            
            clearTimeout(bootTimeout);
            
            // Success!
            hideAllLoadingStates();
            showElement(elements.lwcRoot);
            updateStatus('Loyalty program loaded successfully');
            retryCount = 0;
            
        } catch (error) {
            handleError(error);
        }
    }

    function handleError(error) {
        if (loadingTimeout) clearTimeout(loadingTimeout);
        
        if (retryCount < CONFIG.maxRetries) {
            retryCount++;
            updateStatus(`Retrying (${retryCount}/${CONFIG.maxRetries})...`, true);
            hideElement(elements.errorContainer);
            showElement(elements.skeletonLoader);
            
            setTimeout(boot, CONFIG.retryDelay * retryCount);
        } else {
            showError(error);
        }
    }

    // Retry function
    window.retryLoad = function() {
        retryCount = 0;
        componentMounted = false;
        hideElement(elements.errorContainer);
        boot();
    };

    // Start the app
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    // Debug utilities
    window.debugLoyalty = {
        status: () => ({
            componentMounted,
            retryCount,
            lightningAvailable: !!window.$Lightning,
            config: getConfig()
        }),
        retry: window.retryLoad,
        boot: boot
    };
    
    console.log('Debug: window.debugLoyalty available');
})();
