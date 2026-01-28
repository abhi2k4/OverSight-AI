---
sidebar_position: 1
title: Keycloak Integration Guide
---

# Keycloak Integration Guide

This comprehensive guide will walk you through setting up Keycloak for authentication in your Oversight platform.

## Overview

Keycloak is an open-source Identity and Access Management solution that provides:
- Single Sign-On (SSO)
- Identity brokering and social login
- User federation
- Client adapters
- Admin console and account management

## Installation

### Step 1: Download and Run Keycloak

Visit [Keycloak Docker Registry](https://quay.io/repository/keycloak/keycloak?tab=tags) and find the latest stable version.

```bash
# Pull and run Keycloak 26.5.2
docker run -d -p 8080:8080 --name keycloak \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:26.5.2 start-dev
```

### Step 2: Access Keycloak

Open your browser and navigate to: `http://localhost:8080`

**Login with default credentials:**
- Username: `admin`
- Password: `admin`

## Configuration

### Step 3: Create a Realm

> **Important:** Do NOT use the 'master' realm for your applications. Create a dedicated realm.

1. Click on the realm dropdown (top-left corner)
2. Click **Create Realm**
3. Set realm name: `oversight`
4. Click **Create**

### Step 4: Create a Client

Clients are applications that will use Keycloak for authentication.

1. Navigate to **Clients** → **Create client**

#### General Settings
- **Client ID**: `oversight-app`
- **Client type**: `OpenID Connect`
- Click **Next**

#### Capability Configuration
- **Client authentication**: ❌ OFF (for public clients)
- **Standard flow**: ✅ ON (OAuth 2.0 Authorization Code Flow)
- **Implicit flow**: ❌ OFF (deprecated)
- **Direct access grants**: ✅ ON (Resource Owner Password Credentials)
- **PKCE**: Optional (can enable for enhanced security)
- Click **Next**

#### Login Settings
- **Root URL**: `http://localhost:3002`
- **Home URL**: `http://localhost:3002`
- **Valid Redirect URIs**: `http://localhost:3002/*`
- **Valid Post Logout Redirect URIs**: `http://localhost:3002/*`
- **Web Origins**: `http://localhost:3002`
- Click **Save**

### Step 5: Restart Keycloak

```bash
docker restart keycloak
```

## Application Integration

### React Application Setup

#### Prerequisites
```bash
npm install keycloak-js@26.2.2
```

#### Step 1: Create Environment Variables

Create a `.env` file in your React application directory:

```bash
cd your-app-directory
touch .env
```

Add the following variables to `.env`:

```env
REACT_APP_KEYCLOAK_URL=http://localhost:8080
REACT_APP_KEYCLOAK_REALM=oversight
REACT_APP_KEYCLOAK_CLIENT_ID=oversight-app
```

#### Step 2: Create KeycloakService.js

Create a file `src/KeycloakService.js`:

```javascript
import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: process.env.REACT_APP_KEYCLOAK_URL,
  realm: process.env.REACT_APP_KEYCLOAK_REALM,
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID,
});

const initKeycloak = () =>
  keycloak.init({
    onLoad: "login-required",
    checkLoginIframe: false,
  });

export { keycloak, initKeycloak };
```

#### Step 3: Update App.js

```javascript
import { useEffect, useState } from "react";
import { initKeycloak, keycloak } from "./KeycloakService";

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initKeycloak()
      .then(() => {
        setReady(true);
        console.log("Keycloak initialized successfully");
      })
      .catch(err => {
        console.error("Keycloak init failed", err);
      });
  }, []);

  if (!ready) return <div>Loading authentication...</div>;

  return (
    <div>
      <h1>Welcome, {keycloak.tokenParsed?.preferred_username}!</h1>
      <button onClick={() => keycloak.logout()}>Logout</button>
    </div>
  );
}

export default App;
```

#### Step 4: Update index.js

```javascript
import ReactDOM from "react-dom/client";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
```

> **Important:** Do NOT use React.StrictMode when integrating Keycloak as it can cause double-initialization issues.

## Clean Restart Procedure

If you encounter authentication issues, follow this clean restart procedure:

1. **Stop React Server** (Ctrl+C in terminal)
2. **Close all browser windows**
3. **Clear browser data:**
   - Cookies
   - localStorage
   - sessionStorage
4. **Restart Keycloak:**
   ```bash
   docker restart keycloak
   ```
5. **Start React Server:**
   ```bash
   npm run dev
   ```
6. **Open fresh browser window:** `http://localhost:3002`

## Advanced Configuration

### User Management

#### Create Users
1. Navigate to **Users** → **Add user**
2. Fill in user details
3. Click **Create**
4. Go to **Credentials** tab
5. Set password and disable "Temporary"

#### Create Roles
1. Navigate to **Realm roles** → **Create role**
2. Define role name (e.g., `admin`, `user`, `analyst`)
3. Assign roles to users

### Social Login

Enable login with Google, GitHub, or other providers:
1. Navigate to **Identity Providers**
2. Select provider (e.g., Google)
3. Enter Client ID and Secret from provider
4. Configure redirect URIs

### User Federation

Connect to existing user directories:
1. Navigate to **User Federation**
2. Select provider (LDAP, Active Directory, etc.)
3. Configure connection details

### Custom Themes

Customize the login page appearance:
1. Create custom theme files
2. Place in Keycloak themes directory
3. Select theme in realm settings

## Integration with Other Oversight Components

### DataHub Integration
Configure DataHub to use Keycloak for SSO:
```yaml
# datahub.properties
auth.oidc.enabled=true
auth.oidc.clientId=oversight-app
auth.oidc.clientSecret=your-client-secret
auth.oidc.discoveryUri=http://localhost:8080/realms/oversight/.well-known/openid-configuration
```

### Langfuse Integration
Configure Langfuse to use Keycloak:
```env
NEXTAUTH_URL=http://localhost:3000
AUTH_PROVIDER=keycloak
AUTH_KEYCLOAK_ID=oversight-app
AUTH_KEYCLOAK_SECRET=your-client-secret
AUTH_KEYCLOAK_ISSUER=http://localhost:8080/realms/oversight
```

## Troubleshooting

### Issue: Redirect URI Mismatch
**Solution:** Ensure all redirect URIs in Keycloak match your application URLs exactly.

### Issue: CORS Errors
**Solution:** Add your application origin to the "Web Origins" field in client settings.

### Issue: Token Expired
**Solution:** Implement token refresh logic:
```javascript
// Refresh token before expiry
setInterval(() => {
  keycloak.updateToken(70).catch(() => {
    console.log('Failed to refresh token');
  });
}, 60000); // Check every minute
```

### Issue: Double Login Prompt
**Solution:** Remove React.StrictMode from your application.

## Security Best Practices

1. **Use HTTPS in production**
2. **Enable PKCE for public clients**
3. **Set short token lifespans**
4. **Implement refresh token rotation**
5. **Use strong admin passwords**
6. **Enable brute force detection**
7. **Regular security updates**
8. **Audit logs monitoring**

## Production Deployment

For production deployment:

```bash
# Use production-ready configuration
docker run -d \
  --name keycloak \
  -p 8443:8443 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=<strong-password> \
  -e KC_HOSTNAME=auth.yourdomain.com \
  -e KC_HTTPS_CERTIFICATE_FILE=/path/to/cert.pem \
  -e KC_HTTPS_CERTIFICATE_KEY_FILE=/path/to/key.pem \
  -v /path/to/certs:/opt/keycloak/conf/certs \
  quay.io/keycloak/keycloak:26.5.2 start
```

## Resources

- [Official Documentation](https://www.keycloak.org/documentation)
- [Getting Started Guide](https://www.keycloak.org/getting-started)
- [Server Administration](https://www.keycloak.org/docs/latest/server_admin/)
- [Community Forums](https://keycloak.discourse.group/)

## Next Steps

- [Configure Langfuse with Keycloak](/guides/langfuse)
- [Configure DataHub with Keycloak](/guides/datahub)
- [Learn about Keycloak Roles and Permissions](https://www.keycloak.org/docs/latest/server_admin/#_roles)
