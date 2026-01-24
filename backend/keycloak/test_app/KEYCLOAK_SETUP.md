# Keycloak Setup Guide for Test App

This guide walks you through setting up Keycloak for the test_app.

## 1. Start Keycloak Server

### Using Docker (Recommended)
```bash
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
```

### Using Downloaded Keycloak
1. Download Keycloak from https://www.keycloak.org/downloads
2. Extract and run:
   ```bash
   bin/kc.sh start-dev
   ```

## 2. Access Keycloak Admin Console

1. Open http://localhost:8080/admin
2. Login with admin/admin (or your configured credentials)

## 3. Create Realm

1. Click on "Create Realm" button
2. Enter realm name: `test-realm`
3. Click "Create"

## 4. Create Client

1. Go to "Clients" in the left sidebar
2. Click "Create client"
3. Fill in the details:
   - **Client type**: OpenID Connect
   - **Client ID**: `test-app-client`
   - Click "Next"
4. Configure capability:
   - **Client authentication**: OFF (public client)
   - **Authorization**: OFF
   - **Standard flow**: ON
   - **Direct access grants**: ON
   - Click "Next"
5. Configure login settings:
   - **Root URL**: `http://localhost:3000`
   - **Home URL**: `http://localhost:3000`
   - **Valid redirect URIs**: `http://localhost:3000/*`
   - **Valid post logout redirect URIs**: `http://localhost:3000/*`
   - **Web origins**: `http://localhost:3000`
   - Click "Save"

## 5. Create Roles

1. Go to "Realm roles" in the left sidebar
2. Click "Create role" and create these roles:
   - **Role name**: `data-engineer`
   - **Description**: Can create dataset requests
   - Click "Save"

3. Repeat for:
   - **Role name**: `ai-engineer`
   - **Description**: Can create AI agent requests
   
   - **Role name**: `org-admin`
   - **Description**: Can approve/reject all requests

## 6. Create Test Users

1. Go to "Users" in the left sidebar
2. Click "Create new user"

### Data Engineer User
- **Username**: `dataeng1`
- **Email**: `dataeng1@example.com`
- **First name**: `Data`
- **Last name**: `Engineer`
- Click "Create"

After creation:
1. Go to "Credentials" tab
2. Set password: `password123`
3. Turn off "Temporary" toggle
4. Click "Set password"
5. Go to "Role mapping" tab
6. Click "Assign role"
7. Select `data-engineer` role
8. Click "Assign"

### AI Engineer User
- **Username**: `aieng1`
- **Email**: `aieng1@example.com`
- **First name**: `AI`
- **Last name**: `Engineer`
- Follow same steps as above but assign `ai-engineer` role

### Org Admin User
- **Username**: `admin1`
- **Email**: `admin1@example.com`
- **First name**: `Org`
- **Last name**: `Admin`
- Follow same steps as above but assign `org-admin` role

## 7. Test Users Summary

| Username | Password | Role | Capabilities |
|----------|----------|------|-------------|
| dataeng1 | password123 | data-engineer | Create dataset requests |
| aieng1 | password123 | ai-engineer | Create AI agent requests |
| admin1 | password123 | org-admin | Approve/reject all requests |

## 8. Verify Configuration

1. Start the React app: `npm start`
2. Navigate to http://localhost:3000
3. You should be redirected to Keycloak login
4. Try logging in with different users to test role-based access

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure "Web origins" is set to `http://localhost:3000` in the client configuration

2. **Redirect Issues**: Verify "Valid redirect URIs" includes `http://localhost:3000/*`

3. **Role Not Found**: Check that roles are created at realm level, not client level

4. **User Can't Login**: Verify user credentials are set and not temporary

5. **App Shows No Roles**: Check that roles are assigned to users in "Role mapping" tab

### Keycloak URLs:
- Admin Console: http://localhost:8080/admin
- Realm URL: http://localhost:8080/realms/test-realm
- Token Endpoint: http://localhost:8080/realms/test-realm/protocol/openid-connect/token