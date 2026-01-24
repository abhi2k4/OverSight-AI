import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL,
  realm: process.env.REACT_APP_KEYCLOAK_REALM,
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID,
};

console.log('Keycloak configuration:', keycloakConfig);

const keycloak = new Keycloak(keycloakConfig);

export const initKeycloak = () => {
  console.log('Initializing Keycloak with config:', keycloakConfig);
  
  // First, let's test if we can reach the realm
  const realmUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}`;
  console.log('Testing realm URL:', realmUrl);
  
  return fetch(realmUrl)
    .then(response => {
      console.log('Realm response status:', response.status);
      if (response.status !== 200) {
        throw new Error(`Realm not accessible. Status: ${response.status}`);
      }
      return response.json();
    })
    .then(realmData => {
      console.log('Realm data:', realmData);
      
      // Now test OpenID configuration
      const openidUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/.well-known/openid-configuration`;
      console.log('Testing OpenID URL:', openidUrl);
      
      return fetch(openidUrl);
    })
    .then(response => {
      console.log('OpenID config response status:', response.status);
      if (response.status !== 200) {
        throw new Error(`OpenID Connect configuration not found. Status: ${response.status}`);
      }
      return response.json();
    })
    .then(openidConfig => {
      console.log('OpenID configuration:', openidConfig);
      
      // If we get here, the configuration should work
      return keycloak.init({
        onLoad: 'login-required',
        checkLoginIframe: false,
      });
    })
    .then((authenticated) => {
      console.log('Keycloak initialization result:', authenticated);
      return authenticated;
    })
    .catch((error) => {
      console.error('Keycloak initialization error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        keycloakConfig: keycloakConfig
      });
      throw error;
    });
};

export const getUserRoles = () => {
  if (keycloak.tokenParsed && keycloak.tokenParsed.realm_access) {
    return keycloak.tokenParsed.realm_access.roles || [];
  }
  return [];
};

export const getUserInfo = () => {
  if (keycloak.tokenParsed) {
    return {
      username: keycloak.tokenParsed.preferred_username,
      email: keycloak.tokenParsed.email,
      name: keycloak.tokenParsed.name,
    };
  }
  return null;
};

export const logout = () => {
  keycloak.logout();
};

export default keycloak;