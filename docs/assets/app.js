// Load Lightning Out from Salesforce

const appId = 'YourAppId'; // Update with actual app ID

$Lightning.use(appId, function() {
    $Lightning.createComponent('c:advantageLoyaltyLwc', {}, 'lwc-root');
});