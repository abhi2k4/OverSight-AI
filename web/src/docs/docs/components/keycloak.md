---
sidebar_position: 4
title: Keycloak - Authentication
---

# Keycloak - Identity & Access Management

## What is Keycloak?

Keycloak is an open-source Identity and Access Management solution that provides comprehensive authentication and authorization services for modern applications and services. It's designed to secure applications with minimal code changes and maximum flexibility.

## Key Features

### 🔐 Single Sign-On (SSO)
- **Seamless authentication** across multiple applications
- **Remember me** functionality
- **Session management**
- **Single logout** across all apps

### 🌐 Identity Brokering & Social Login
Connect with external identity providers:
- **Google**, **Facebook**, **GitHub**
- **SAML 2.0** providers
- **OpenID Connect** providers
- Custom identity providers

### 👥 User Federation
Integrate with existing user directories:
- **LDAP** integration
- **Active Directory** sync
- **Kerberos** support
- Custom user storage providers

### 🎭 Standard Protocols
Industry-standard protocol support:
- **OpenID Connect**
- **OAuth 2.0**
- **SAML 2.0**

### 🎨 Customizable
- **Custom themes** for login pages
- **Localization** support
- **Custom authentication flows**
- **Extension points** via SPIs

### 👤 User Management
- Self-registration
- Password policies
- Account management
- User attributes
- Required actions

### 🔑 Authorization Services
Fine-grained authorization:
- **Role-Based Access Control (RBAC)**
- **Attribute-Based Access Control (ABAC)**
- **Policy enforcement**
- **Permission management**

## Quick Start

### Installation

```bash
docker run -d -p 8080:8080 --name keycloak \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:26.5.2 start-dev
```

### Access Admin Console

Navigate to: `http://localhost:8080`

**Default credentials**: `admin` / `admin`

## Core Concepts

### Realms
Isolated namespaces for users, applications, and roles. Think of realms as tenants.

### Clients
Applications that will use Keycloak for authentication (web apps, mobile apps, APIs).

### Users
End users who will authenticate through Keycloak.

### Roles
Permissions assigned to users. Can be realm-level or client-specific.

### Groups
Collections of users that share common roles or attributes.

### Identity Providers
External authentication sources (Google, SAML providers, etc.).

## Configuration

### Create a Realm

1. Click realm dropdown (top-left)
2. Click **Create Realm**
3. Enter realm name (e.g., `oversight`)
4. Click **Create**

### Create a Client

1. Navigate to **Clients** → **Create client**
2. Set **Client ID** (e.g., `oversight-app`)
3. Configure authentication settings
4. Set redirect URIs
5. Click **Save**

### Create Users

1. Navigate to **Users** → **Add user**
2. Fill in user details
3. Click **Create**
4. Set credentials in **Credentials** tab

### Assign Roles

1. Navigate to **Realm roles** or **Client roles**
2. Create roles as needed
3. Go to user's **Role mapping** tab
4. Assign appropriate roles

## Authentication Flows

### Authorization Code Flow
Standard OAuth 2.0 flow for web applications.

```javascript
// Redirect to Keycloak for authentication
window.location.href = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth?
  client_id=${clientId}&
  redirect_uri=${redirectUri}&
  response_type=code&
  scope=openid`;
```

### Implicit Flow (Deprecated)
Not recommended for new applications.

### Client Credentials Flow
For service-to-service authentication.

```bash
curl -X POST "${keycloakUrl}/realms/${realm}/protocol/openid-connect/token" \
  -d "client_id=${clientId}" \
  -d "client_secret=${clientSecret}" \
  -d "grant_type=client_credentials"
```

### Resource Owner Password Credentials
Direct username/password authentication.

## Client Integration

### JavaScript/React

```javascript
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'oversight',
  clientId: 'oversight-app'
});

// Initialize
keycloak.init({ onLoad: 'login-required' })
  .then(authenticated => {
    console.log('Authenticated:', authenticated);
  });

// Get token
const token = keycloak.token;

// Refresh token
keycloak.updateToken(30);

// Logout
keycloak.logout();
```

### Spring Boot

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends KeycloakWebSecurityConfigurerAdapter {
    
    @Autowired
    public void configureGlobal(AuthenticationManagerBuilder auth) {
        auth.authenticationProvider(keycloakAuthenticationProvider());
    }
    
    @Bean
    @Override
    protected SessionAuthenticationStrategy sessionAuthenticationStrategy() {
        return new RegisterSessionAuthenticationStrategy(
            new SessionRegistryImpl());
    }
}
```

### Python/FastAPI

```python
from fastapi import FastAPI, Depends
from fastapi_keycloak import FastAPIKeycloak

app = FastAPI()

idp = FastAPIKeycloak(
    server_url="http://localhost:8080",
    client_id="oversight-app",
    client_secret="your-secret",
    realm="oversight"
)

@app.get("/protected")
def protected_route(user=Depends(idp.get_current_user())):
    return {"user": user}
```

## Advanced Features

### Multi-Factor Authentication

Enable 2FA for enhanced security:
1. Navigate to **Authentication** → **Required actions**
2. Enable **Configure OTP**
3. Users will be prompted to set up 2FA on next login

### Custom Themes

Create branded login pages:

```bash
# Theme structure
themes/
  my-theme/
    login/
      theme.properties
      login.ftl
      styles.css
    email/
      theme.properties
      email-verification.ftl
```

### Email Configuration

Set up email for:
- Email verification
- Password reset
- Admin notifications

```properties
# Realm Settings → Email
smtp.host=smtp.gmail.com
smtp.port=587
smtp.from=noreply@oversight.com
smtp.auth=true
smtp.ssl=true
smtp.starttls=true
smtp.user=your-email@gmail.com
smtp.password=your-app-password
```

### Events & Audit Logging

Track all authentication events:
1. Navigate to **Realm settings** → **Events**
2. Enable **Login events** and **Admin events**
3. Configure event listeners

## Integration with Oversight Components

### With Langfuse

Configure Langfuse to use Keycloak:

```env
AUTH_PROVIDER=keycloak
AUTH_KEYCLOAK_ID=oversight-app
AUTH_KEYCLOAK_SECRET=your-secret
AUTH_KEYCLOAK_ISSUER=http://localhost:8080/realms/oversight
```

### With DataHub

Configure DataHub for OIDC:

```yaml
auth:
  oidc:
    enabled: true
    clientId: oversight-app
    clientSecret: your-secret
    discoveryUri: http://localhost:8080/realms/oversight/.well-known/openid-configuration
```

## Security Best Practices

### Production Deployment

1. **Use HTTPS** - Always use SSL/TLS in production
2. **Strong passwords** - Enforce password policies
3. **Token lifespans** - Configure appropriate token expiry
4. **Brute force detection** - Enable account lockout
5. **Regular updates** - Keep Keycloak up to date
6. **Database backups** - Regular backup of Keycloak database
7. **Security headers** - Configure proper CORS and CSP

### Password Policies

Configure in **Realm Settings** → **Security Defenses**:
- Minimum length
- Special characters required
- Uppercase/lowercase requirements
- Password history
- Expiration time

### Brute Force Protection

Enable in **Realm Settings** → **Security Defenses**:
- Maximum login failures
- Wait increment
- Quick login check
- Minimum quick login wait
- Maximum wait time

## High Availability

### Clustered Deployment

Deploy multiple Keycloak instances:

```bash
# Node 1
docker run -d \
  --name keycloak-1 \
  -e KC_CACHE=ispn \
  -e KC_CACHE_STACK=kubernetes \
  quay.io/keycloak/keycloak:26.5.2 start

# Node 2
docker run -d \
  --name keycloak-2 \
  -e KC_CACHE=ispn \
  -e KC_CACHE_STACK=kubernetes \
  quay.io/keycloak/keycloak:26.5.2 start
```

### Database Configuration

Use external database for production:

```bash
docker run -d \
  -e KC_DB=postgres \
  -e KC_DB_URL=jdbc:postgresql://db-host/keycloak \
  -e KC_DB_USERNAME=keycloak \
  -e KC_DB_PASSWORD=password \
  quay.io/keycloak/keycloak:26.5.2 start
```

## Monitoring

### Admin Console Metrics

View in admin console:
- Active sessions
- User registrations
- Login failures
- Token usage

### Prometheus Metrics

Enable metrics endpoint:

```bash
docker run -d \
  -e KC_METRICS_ENABLED=true \
  quay.io/keycloak/keycloak:26.5.2 start
```

Access metrics at: `/metrics`

## Troubleshooting

### Common Issues

**Issue**: Redirect URI mismatch  
**Solution**: Ensure redirect URIs in Keycloak match your application exactly

**Issue**: CORS errors  
**Solution**: Add application origin to "Web Origins" in client settings

**Issue**: Token expired  
**Solution**: Implement token refresh mechanism

**Issue**: Cannot login  
**Solution**: Check realm name, client ID, and credentials

## Use Cases

### Enterprise SSO
Single authentication point for all company applications.

### API Security
Secure REST APIs with OAuth 2.0 tokens.

### Mobile Apps
Authenticate mobile applications with PKCE flow.

### Microservices
Service-to-service authentication with client credentials.

### Multi-tenancy
Separate realms for different customers or divisions.

## Resources

- [Official Documentation](https://www.keycloak.org/documentation)
- [Getting Started](https://www.keycloak.org/getting-started)
- [Server Administration](https://www.keycloak.org/docs/latest/server_admin/)
- [Community Forums](https://keycloak.discourse.group/)
- [GitHub Repository](https://github.com/keycloak/keycloak)

## Next Steps

- [Install Keycloak](/getting-started)
- [Keycloak Integration Guide](/guides/keycloak)
- [Configure clients for your applications](https://www.keycloak.org/docs/latest/server_admin/#_clients)
- [Set up user federation](https://www.keycloak.org/docs/latest/server_admin/#_user-storage-federation)
