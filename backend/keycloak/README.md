# Quick Start Guide - Keycloak Authentication

## Prerequisites

1. Keycloak server running at `http://localhost:8080`
2. Realm named `oversight` configured in Keycloak
3. Client named `oversight-app` configured in the realm
4. Node.js and npm installed

## Setup Steps

### 1. Install Dependencies

```bash
cd GRACE_Knowcode_OverSight/frontend
npm install
```

The `keycloak-js` package has already been installed.

### 2. Verify Environment Variables

Check that `.env` contains:

```env
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=oversight
VITE_KEYCLOAK_CLIENT_ID=oversight-app
```

### 3. Start the Application

```bash
npm run dev
```

### 4. Access the Application

Open your browser and navigate to `http://localhost:5173` (or the port shown in terminal).

## What Happens

1. **Automatic Redirect**: The app will automatically redirect you to the Keycloak login page
2. **Login**: Enter your Keycloak credentials
3. **Redirect Back**: After successful login, you'll be redirected back to the app
4. **User Info**: Navigate to `/login` to see your authenticated user information
5. **Dashboard**: Click "Go to Dashboard" to access the main application

## Authentication Flow

```
App Start → Keycloak Init → Check Auth → Redirect to Keycloak Login
                                ↓
                          User Logs In
                                ↓
                    Redirect Back to App → Show Dashboard
```

## Troubleshooting

### Error: "Realm not accessible"
- Ensure Keycloak is running at `http://localhost:8080`
- Verify the realm name is correct in `.env`

### Error: "OpenID Connect configuration not found"
- Check that the realm is properly configured in Keycloak
- Verify the client exists in the realm

### Error: "Authentication failed"
- Check Keycloak logs for authentication errors
- Verify user credentials are correct
- Ensure the client is configured to allow the redirect URI

## Testing Different Roles

To test role-based access:

1. Create roles in Keycloak (e.g., `data-engineer`, `ai-engineer`, `org-admin`)
2. Assign roles to users
3. Use the `RoleBasedRoute` component to protect routes

Example:
```jsx
import RoleBasedRoute from './components/RoleBasedRoute';

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

## Logout

Click the logout button in the header or on the login page to log out. This will:
1. Clear the Keycloak session
2. Redirect to Keycloak logout page
3. Redirect back to the app (which will show login again)

## Next Steps

- Configure additional roles in Keycloak
- Add role-based routing to protect sensitive pages
- Customize the login page styling
- Add token refresh logic for long-running sessions
