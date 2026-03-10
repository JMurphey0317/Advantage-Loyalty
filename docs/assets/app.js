(function () {
    // Configuration
    const SITE_ORIGIN = "https://acimacredit--preflight.sandbox.my.site.com";
    const SITE_PATH = "/AdvantageLoyaltyProgram";
    const SCRIPT_SRC = `${SITE_ORIGIN}${SITE_PATH}/lightning/lightning.out.js`;

    const AURA_APP = "c:AdvantageLoyalty";
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

        errorMsg += '\n\nCheck console for details (F12)';

        if (elements.errorMessage) {
            elements.errorMessage.textContent = errorMsg;
            elements.errorMessage.style.whiteSpace = 'pre-wrap';
        }

        showElement(elements.errorContainer);
        updateStatus('Error loading program', true);
        console.error('Error details:', { error, detailedError });
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

    window.applyDemoConfig = function () {
        const locationId = document.getElementById('demo-locationId').value;
        const userGuid = document.getElementById('demo-userGuid').value;
        const permissions = document.getElementById('demo-permissions').value;
        const params = new URLSearchParams({ locationId, userGuid, permissions });
        window.location.search = params.toString();
    };

    // Load Lightning Out script
    function loadScript() {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
            if (existing) existing.remove();

            const script = document.createElement('script');
            script.src = SCRIPT_SRC;
            script.async = true;
            // NOTE: do NOT set crossOrigin = 'anonymous' — this causes Salesforce
            // to withhold CORS headers on lightning.out.js
            
            let resolved = false;

            script.onload = () => {
                console.log('✓ Script tag loaded, waiting for $Lightning...');
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.$Lightning) {
                        clearInterval(checkInterval);
                        if (!resolved) {
                            resolved = true;
                            console.log('✓ $Lightning is available');
                            resolve();
                        }
                    } else if (attempts >= 50) {
                        clearInterval(checkInterval);
                        if (!resolved) {
                            resolved = true;
                            reject(new Error('$Lightning did not initialize after script load'));
                        }
                    }
                }, 100);
            };

            script.onerror = () => {
                if (!resolved) {
                    resolved = true;
                    reject(new Error(`Failed to load: ${SCRIPT_SRC} — check CORS settings in Salesforce Setup`));
                }
            };

            document.head.appendChild(script);
        });
    }

    // Initialize Lightning Out
    // IMPORTANT: $Lightning.use() takes exactly 3 arguments for guest access:
    //   1. Aura app name
    //   2. success callback
    //   3. endpoint URL
    // The 4th argument is an OAuth access token — passing a function here
    // will be treated as a token string and cause silent failures.
    function initializeLightningOut() {
        return new Promise((resolve, reject) => {
            if (!window.$Lightning) {
                reject(new Error('$Lightning not available'));
                return;
            }

            const endpoint = `${SITE_ORIGIN}${SITE_PATH}`;
            console.log('✓ Calling $Lightning.use() with endpoint:', endpoint);

            const initTimeout = setTimeout(() => {
                reject(new Error('$Lightning.use() timed out — check Aura app name and guest access'));
            }, CONFIG.timeoutMs);

            // 3 arguments only — no error callback
            window.$Lightning.use(
                AURA_APP,
                function () {
                    clearTimeout(initTimeout);
                    console.log('✓ Lightning Out initialized');
                    updateStatus('Lightning Out initialized');
                    resolve();
                },
                endpoint
                // ← NO 4th argument. Passing a function here breaks guest auth.
            );
        });
    }

    // Create the component
    // IMPORTANT: $Lightning.createComponent() takes exactly 4 arguments:
    //   1. Component name
    //   2. Attributes object
    //   3. DOM element ID to mount into
    //   4. Single callback — receives (cmp) on success, null on failure
    // There is NO 5th error callback parameter.
    function createComponent() {
        return new Promise((resolve, reject) => {
            if (!window.$Lightning) {
                reject(new Error('$Lightning not available'));
                return;
            }

            const config = getConfig();
            console.log('✓ Creating component with config:', config);

            const componentTimeout = setTimeout(() => {
                reject(new Error('createComponent timed out — verify component name and Guest User profile access'));
            }, CONFIG.timeoutMs);

            // Show mount target BEFORE creating the component
            showElement(elements.lwcRoot);

            // 4 arguments only — no 5th error callback
            window.$Lightning.createComponent(
                COMPONENT,
                {
                    locationId: config.locationId,
                    userGuid: config.userGuid,
                    permissions: config.permissions
                },
                MOUNT_ID,
                function (cmp) {
                    clearTimeout(componentTimeout);
                    if (!cmp) {
                        // null means failure — hide the root again
                        hideElement(elements.lwcRoot);
                        reject(new Error('createComponent returned null — check component name and Guest User profile'));
                        return;
                    }
                    console.log('✓ Component created successfully');
                    componentMounted = true;
                    resolve(cmp);
                }
                // ← NO 5th argument
            );
        });
    }

    // Main boot function
    async function boot() {
        try {
            console.log('🚀 Starting boot...');

            showElement(elements.skeletonLoader);
            hideElement(elements.lwcRoot);
            hideElement(elements.errorContainer);

            updateStatus('Loading Salesforce runtime...');

            const bootTimeout = setTimeout(() => {
                if (!componentMounted) {
                    handleError(new Error('Boot timed out'));
                }
            }, CONFIG.timeoutMs * 2);

            await loadScript();
            updateStatus('Framework loaded');

            await initializeLightningOut();

            await createComponent();

            clearTimeout(bootTimeout);

            hideAllLoadingStates();
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

    window.retryLoad = function () {
        retryCount = 0;
        componentMounted = false;
        hideElement(elements.errorContainer);
        boot();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        setTimeout(boot, 100);
    }

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
        boot: boot
    };

    console.log('Debug: window.debugLoyalty available');
})();
