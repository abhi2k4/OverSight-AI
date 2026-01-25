import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
};

console.log('Keycloak configuration:', keycloakConfig);

const keycloak = new Keycloak(keycloakConfig);

export const initKeycloak = () => {
  console.log('Initializing Keycloak with config:', keycloakConfig);
  
  // First, test if we can reach the realm
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
    const token = keycloak.tokenParsed;
    return {
      username: token.preferred_username,
      email: token.email,
      name: token.name,
      roles: token.realm_access?.roles || [],
      lastLogin: token.auth_time ? new Date(token.auth_time * 1000) : new Date(),
    };
  }
  return null;
};

// Role Helper Functions
export const hasRole = (roles, role) => {
  return roles.includes(role);
};

export const isOrgAdmin = (roles) => {
  return roles.includes('org-admin');
};

export const canAccessAdmin = (roles) => {
  return isOrgAdmin(roles);
};

export const canAccessAI = (roles) => {
  return isOrgAdmin(roles) || roles.includes('ai-engineer');
};

export const canAccessData = (roles) => {
  return isOrgAdmin(roles) || roles.includes('data-engineer');
};

export const canAccessMetadata = (roles) => {
  // All authenticated users can access metadata manager
  return isOrgAdmin(roles) || roles.includes('ai-engineer') || roles.includes('data-engineer');
};

export const canAccessPolicies = (roles) => {
  return isOrgAdmin(roles);
};

export const canAccessCompliance = (roles) => {
  return isOrgAdmin(roles);
};

export const canAccessAlerts = (roles) => {
  return isOrgAdmin(roles) || roles.includes('ai-engineer') || roles.includes('data-engineer');
};

export const canAccessAuditLogs = (roles) => {
  return isOrgAdmin(roles);
};

export const canAccessChatbot = (roles) => {
  return isOrgAdmin(roles) || roles.includes('ai-engineer');
};

export const logout = () => {
  keycloak.logout();
};

export const getToken = () => {
  return keycloak.token;
};

export const updateToken = (minValidity = 5) => {
  return keycloak.updateToken(minValidity);
};

export default keycloak;
