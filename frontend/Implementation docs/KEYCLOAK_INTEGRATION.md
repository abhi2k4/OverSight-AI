# Keycloak Authentication Integration

This document describes the Keycloak authentication implementation in the OverSight frontend application.

## Overview

The frontend now uses Keycloak for authentication and authorization, replacing the previous mock authentication system.

## Files Added/Modified

### New Files
- `src/services/KeycloakService.js` - Keycloak service for authentication
- `src/components/RoleBasedRoute.jsx` - Component for role-based routing

### Modified Files
- `src/App.jsx` - Added Keycloak initialization on app startup
- `src/pages/Login.jsx` - Updated to show authenticated user info
- `src/components/Header.jsx` - Integrated Keycloak logout
- `.env` - Added Keycloak configuration variables

## Configuration

The following environment variables must be set in `.env`:

```env
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=oversight
VITE_KEYCLOAK_CLIENT_ID=oversight-app
```

## How It Works

1. **App Initialization**: When the app starts, `App.jsx` calls `initKeycloak()` which:
   - Validates the Keycloak realm is accessible
   - Checks OpenID configuration
   - Initializes Keycloak with `login-required` mode
   - Redirects to Keycloak login if not authenticated

2. **Authentication Flow**:
   - User is redirected to Keycloak login page
   - After successful login, user is redirected back to the app
   - App displays loading screen during initialization
   - Once authenticated, user can access the application

3. **User Information**: The `KeycloakService` provides:
   - `getUserInfo()` - Returns username, email, and name
   - `getUserRoles()` - Returns array of user roles
   - `logout()` - Logs out and redirects to Keycloak
   - `getToken()` - Returns the current JWT token
   - `updateToken()` - Refreshes the token

4. **Login Page**: Shows authenticated user information including:
   - Username
   - Full name
   - Email
   - Assigned roles
   - Logout button
   - Link to dashboard

## Role-Based Access Control

Use the `RoleBasedRoute` component to protect routes:

```jsx
<Route 
  path="/admin" 
  element={
    <RoleBasedRoute 
      allowedRoles={['org-admin']} 
      fallback={<Navigate to="/" replace />}
    >
      <AdminPage />
    </RoleBasedRoute>
  } 
/>
```

## Dependencies

- `keycloak-js` v26.2.2 - Official Keycloak JavaScript adapter

## Testing

To test the integration:

1. Ensure Keycloak is running at `http://localhost:8080`
2. Ensure the `oversight` realm exists
3. Ensure the `oversight-app` client is configured
4. Start the frontend: `npm run dev`
5. The app will redirect to Keycloak login
6. After login, you'll see the authenticated user info

## Error Handling

The app displays error messages if:
- Keycloak realm is not accessible
- OpenID configuration is not found
- Authentication fails

These errors are shown with helpful messages to guide troubleshooting.
