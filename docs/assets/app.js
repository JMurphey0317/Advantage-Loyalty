function getConfig() {
  const params = new URLSearchParams(window.location.search);
  return {
    locationId: params.get('locationId') || 'LOC-001',
    userGuid:   params.get('userGuid')   || 'DEMO-USER-123',
    permissions: params.get('permissions') || 'view,export,manage'
  };
}

function createComponent() {
  return new Promise((resolve, reject) => {
    showElement(elements.spinnerOverlay);

    const componentTimeout = setTimeout(() => {
      reject(new Error("Component creation timed out"));
    }, CONFIG.timeoutMs);

    const config = getConfig();

    window.$Lightning.createComponent(
      COMPONENT,
      {
        locationId:  config.locationId,
        userGuid:    config.userGuid,
        permissions: config.permissions
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
