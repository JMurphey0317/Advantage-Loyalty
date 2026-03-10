(function () {
    // Configuration
    const SITE_ORIGIN = "https://acimacredit--preflight.sandbox.my.site.com";
    const SITE_PATH = "/AdvantageLoyaltyProgram";
    const SCRIPT_SRC = `${SITE_ORIGIN}${SITE_PATH}/lightning/lightning.out.js`;

    const AURA_APP = "c:AdvantageLoyaltyapp";
    const COMPONENT = "c:AdvantageLoyaltyWrapper";
    const MOUNT_ID = "lwc-root";

    const CONFIG = {
        maxRetries: 2,
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
            
            if (!isError) {
                setTimeout(() => hideElement(elements.statusBanner), 3000);
            }
        }
    }

    function showError(error) {
        hideElement(elements.skeletonLoader);
        hideElement(elements.spinnerOverlay);
        
        let errorMsg = '';
        let detailedError = '';
        
        if (typeof error === 'string') {
            errorMsg = error;
        } else if (error && error.message) {
            errorMsg = error.message;
            detailedError = error.stack || '';
        } else {
            errorMsg = String(error);
        }
        
        // Add diagnostic info
        errorMsg += '\n\nCheck console for details (F12)';
        
        if (elements.errorMessage) {
            elements.errorMessage.textContent = errorMsg;
            elements.errorMessage.style.whiteSpace = 'pre-wrap';
        }
        
        showElement(elements.errorContainer);
        updateStatus('Error loading program', true);
        console.error('Error details:', { error, detailedError });
        
        // Log diagnostic info
        console.log('Diagnostic info:', {
            scriptLoaded: !!document.querySelector(`script[src="${SCRIPT_SRC}"]`),
            lightningAvailable: !!window.$Lightning,
            auraAvailable: !!window.$A,
            siteUrl: `${SITE_ORIGIN}${SITE_PATH}`,
            scriptSrc: SCRIPT_SRC
        });
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

    function getConfig() {
        const params = new URLSearchParams(window.location.search);
        return {
            locationId: params.get('locationId') || 'LOC-001',
            userGuid: params.get('userGuid') || 'DEMO-USER-123',
            permissions: params.get('permissions') || 'view,export'
        };
    }

    window.applyDemoConfig = function() {
        const locationId = document.getElementById('demo-locationId').value;
        const userGuid = document.getElementById('demo-userGuid').value;
        const permissions = document.getElementById('demo-permissions').value;
        const params = new URLSearchParams({ locationId, userGuid, permissions });
        window.location.search = params.toString();
    };

    // Check if the Salesforce site is accessible
    async function checkSiteAccess() {
        try {
            const response = await fetch(`${SITE_ORIGIN}${SITE_PATH}`, { 
                method: 'HEAD',
                mode: 'no-cors'
            });
            return { accessible: true, status: 'Site responded' };
        } catch (error) {
            return { accessible: false, status: error.message };
        }
    }

    // Load Lightning Out script with better error handling
    function loadScript() {
        return new Promise((resolve, reject) => {
            // Remove any existing script with same src
            const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
            if (existing) {
                existing.remove();
            }

            const script = document.createElement('script');
            script.src = SCRIPT_SRC;
            script.async = true;
            script.crossOrigin = 'anonymous';
            
            let resolved = false;
            
            script.onload = () => {
                console.log('Script loaded, waiting for initialization...');
                
                // Wait for either $Lightning or $A to be available
                let attempts = 0;
                const maxAttempts = 50; // 5 seconds total
                
                const checkInterval = setInterval(() => {
                    attempts++;
                    
                    if (window.$Lightning || window.$A) {
                        clearInterval(checkInterval);
                        if (!resolved) {
                            resolved = true;
                            console.log('Lightning framework initialized:', {
                                hasLightning: !!window.$Lightning,
                                hasA: !!window.$A
                            });
                            resolve();
                        }
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        if (!resolved) {
                            resolved = true;
                            reject(new Error('Lightning framework failed to initialize (timeout)'));
                        }
                    }
                }, 100);
            };
            
            script.onerror = (error) => {
                if (!resolved) {
                    resolved = true;
                    reject(new Error(`Failed to load script: ${SCRIPT_SRC}`));
                }
            };
            
            document.head.appendChild(script);
        });
    }

    // Initialize Lightning Out
    function initializeLightningOut() {
        return new Promise((resolve, reject) => {
            // Check if we have either $Lightning or $A
            if (!window.$Lightning && !window.$A) {
                reject(new Error('Lightning framework not available'));
                return;
            }

            const endpoint = `${SITE_ORIGIN}${SITE_PATH}`;
            console.log('Initializing with endpoint:', endpoint);
            
            const initTimeout = setTimeout(() => {
                reject(new Error('Lightning Out initialization timed out'));
            }, CONFIG.timeoutMs);

            // Use $Lightning if available, otherwise try $A
            if (window.$Lightning) {
                window.$Lightning.use(
                    AURA_APP,
                    function() {
                        clearTimeout(initTimeout);
                        console.log('Lightning Out initialized via $Lightning');
                        updateStatus('Lightning Out initialized');
                        resolve();
                    },
                    endpoint,
                    function(error) {
                        clearTimeout(initTimeout);
                        console.error('$Lightning.use error:', error);
                        reject(error);
                    }
                );
            } else {
                // Fallback to $A
                window.$A.ready(function() {
                    window.$Lightning = window.$Lightning || {};
                    window.$Lightning.use = window.$Lightning.use || function(app, callback, endpoint) {
                        // Simple wrapper for $A
                        window.$A.getCallback(function() {
                            callback();
                        })();
                    };
                    
                    clearTimeout(initTimeout);
                    console.log('Using $A fallback');
                    resolve();
                });
            }
        });
    }

    // Create the component
    function createComponent() {
        return new Promise((resolve, reject) => {
            if (!window.$Lightning) {
                reject(new Error('$Lightning not available'));
                return;
            }

            showElement(elements.spinnerOverlay);
            
            const componentTimeout = setTimeout(() => {
                reject(new Error('Component creation timed out'));
            }, CONFIG.timeoutMs);

            const config = getConfig();
            console.log('Creating component with:', config);

            window.$Lightning.createComponent(
                COMPONENT,
                {
                    locationId: config.locationId,
                    userGuid: config.userGuid,
                    permissions: config.permissions
                },
                MOUNT_ID,
                function(cmp) {
                    clearTimeout(componentTimeout);
                    if (cmp) {
                        console.log('Component created:', cmp);
                        componentMounted = true;
                        resolve(cmp);
                    } else {
                        reject(new Error('Component creation returned null'));
                    }
                },
                function(error) {
                    clearTimeout(componentTimeout);
                    console.error('Create component error:', error);
                    reject(error);
                }
            );
        });
    }

    // Main boot function
    async function boot() {
        try {
            console.log('🚀 Starting boot process...');
            
            // Show skeleton
            showElement(elements.skeletonLoader);
            hideElement(elements.lwcRoot);
            hideElement(elements.errorContainer);
            
            updateStatus('Checking Salesforce connection...');
            
            // Check site access first
            const siteCheck = await checkSiteAccess();
            if (!siteCheck.accessible) {
                throw new Error(`Cannot access Salesforce site: ${siteCheck.status}`);
            }
            
            updateStatus('Loading Salesforce runtime...');
            
            // Set overall timeout
            const bootTimeout = setTimeout(() => {
                if (!componentMounted) {
                    handleError(new Error('Boot process timed out'));
                }
            }, CONFIG.timeoutMs * 2);

            // Load script
            await loadScript();
            updateStatus('Framework loaded');
            
            // Initialize
            await initializeLightningOut();
            
            // Create component
            await createComponent();
            
            clearTimeout(bootTimeout);
            
            // Success!
            hideAllLoadingStates();
            showElement(elements.lwcRoot);
            updateStatus('✅ Loyalty program loaded');
            retryCount = 0;
            
        } catch (error) {
            handleError(error);
        }
    }

    function handleError(error) {
        if (loadingTimeout) clearTimeout(loadingTimeout);
        
        console.error('Boot error:', error);
        
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
        setTimeout(boot, 100); // Small delay to ensure DOM is ready
    }

    // Enhanced debug utilities
    window.debugLoyalty = {
        status: () => ({
            componentMounted,
            retryCount,
            lightningAvailable: !!window.$Lightning,
            auraAvailable: !!window.$A,
            scriptLoaded: !!document.querySelector(`script[src="${SCRIPT_SRC}"]`),
            config: getConfig(),
            siteUrl: `${SITE_ORIGIN}${SITE_PATH}`
        }),
        retry: window.retryLoad,
        boot: boot,
        test: async () => {
            console.log('Testing connection...');
            try {
                const response = await fetch(`${SITE_ORIGIN}${SITE_PATH}`, { mode: 'no-cors' });
                console.log('Site response:', response.type);
            } catch (e) {
                console.error('Site test failed:', e);
            }
        }
    };
    
    console.log('Debug: window.debugLoyalty available - run window.debugLoyalty.status()');
})();
