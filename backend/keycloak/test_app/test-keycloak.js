// Simple test script to check Keycloak connectivity
const https = require('https');
const http = require('http');
const fs = require('fs');

// Read .env file
let envConfig = {};
if (fs.existsSync('.env')) {
  const envFile = fs.readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envConfig[key.trim()] = value.trim();
    }
  });
}

const KEYCLOAK_URL = envConfig.REACT_APP_KEYCLOAK_URL;
const REALM = envConfig.REACT_APP_KEYCLOAK_REALM || 'master';

console.log('Testing Keycloak connectivity...');
console.log('URL:', KEYCLOAK_URL);
console.log('Realm:', REALM);

// Test basic Keycloak server
const testUrl = `${KEYCLOAK_URL}/realms/${REALM}/.well-known/openid_configuration`;
console.log('Testing URL:', testUrl);

const client = KEYCLOAK_URL.startsWith('https') ? https : http;

client.get(testUrl, (res) => {
  console.log('Status Code:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Keycloak realm is accessible!');
      try {
        const config = JSON.parse(data);
        console.log('Issuer:', config.issuer);
        console.log('Authorization endpoint:', config.authorization_endpoint);
        console.log('Token endpoint:', config.token_endpoint);
      } catch (e) {
        console.log('Response data:', data);
      }
    } else {
      console.log('❌ Failed to access Keycloak realm');
      console.log('Response:', data);
    }
  });
}).on('error', (err) => {
  console.log('❌ Connection error:', err.message);
  console.log('\nTroubleshooting steps:');
  console.log('1. Make sure Keycloak is running on', KEYCLOAK_URL);
  console.log('2. Check if the realm "' + REALM + '" exists');
  console.log('3. Verify the URL is accessible in your browser');
});