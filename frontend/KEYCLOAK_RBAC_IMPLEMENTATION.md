# Keycloak Role-Based Access Control (RBAC) Implementation

## Overview
Complete implementation of role-based access control using Keycloak authentication with three roles: `org-admin`, `ai-engineer`, and `data-engineer`.

## Keycloak Configuration

### Realm: `oversight`
### Client: `oversight-app`

### Client Settings
- **Access Type**: Public
- **Standard Flow**: ✅ Enabled
- **PKCE**: S256
- **Valid Redirect URIs**: `http://localhost:3000/*`
- **Web Origins**: `*`

### Realm Roles
1. **org-admin** - Full access to all features
2. **ai-engineer** - Access to AI Agents and related features
3. **data-engineer** - Access to Datasets and data management

## Access Control Matrix

| Role | Dashboard | AI Agents | Datasets | Metadata Manager | Policies | Compliance | Alerts | Audit Logs | Chatbot |
|------|-----------|-----------|----------|------------------|----------|------------|--------|------------|---------|
| org-admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ai-engineer | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| data-engineer | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |

## Implementation Details

### 1. Environment Configuration

**File**: `frontend/.env`

```env
VITE_KEYCLOAK_URL="http://localhost:8180"
VITE_KEYCLOAK_REALM="oversight"
VITE_KEYCLOAK_CLIENT_ID="oversight-app"
VITE_KEYCLOAK_USERINFO_URL="http://localhost:8080/auth/realms/oversight/protocol/openid-connect/userinfo"
```

### 2. Keycloak Service

**File**: `frontend/src/services/KeycloakService.js`

#### User Info Extraction
```javascript
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
```

#### Role Helper Functions
```javascript
// Check if user has specific role
export const hasRole = (roles, role) => roles.includes(role);

// Check if user is org admin
export const isOrgAdmin = (roles) => roles.includes('org-admin');

// Access control functions
export const canAccessAdmin = (roles) => isOrgAdmin(roles);
export const canAccessAI = (roles) => isOrgAdmin(roles) || roles.includes('ai-engineer');
export const canAccessData = (roles) => isOrgAdmin(roles) || roles.includes('data-engineer');
export const canAccessMetadata = (roles) => isOrgAdmin(roles) || roles.includes('ai-engineer') || roles.includes('data-engineer');
export const canAccessPolicies = (roles) => isOrgAdmin(roles);
export const canAccessCompliance = (roles) => isOrgAdmin(roles);
export const canAccessAlerts = (roles) => isOrgAdmin(roles) || roles.includes('ai-engineer') || roles.includes('data-engineer');
export const canAccessAuditLogs = (roles) => isOrgAdmin(roles);
export const canAccessChatbot = (roles) => isOrgAdmin(roles) || roles.includes('ai-engineer');
```

### 3. Protected Routes

**File**: `frontend/src/components/ProtectedRoute.jsx`

```javascript
const ProtectedRoute = ({ allow, children, redirectTo = '/unauthorized' }) => {
  return allow ? children : <Navigate to={redirectTo} replace />;
};
```

**Usage in App.jsx**:
```javascript
<Route 
  path="agents" 
  element={
    <ProtectedRoute allow={canAccessAI(userRoles)}>
      <AIAgents />
    </ProtectedRoute>
  } 
/>
```

### 4. Sidebar Navigation

**File**: `frontend/src/components/CollapsibleSidebar.jsx`

Navigation items are filtered based on user roles:

```javascript
const navItems = [
  { path: '/dashboard', icon: IconLayoutDashboard, label: 'Dashboard', checkAccess: null },
  { path: '/agents', icon: IconRobot, label: 'AI Agents', checkAccess: canAccessAI },
  { path: '/datasets', icon: IconDatabase, label: 'Datasets', checkAccess: canAccessData },
  // ... more items
];

// Filter visible items
const visibleNavItems = navItems.filter(item => {
  if (!item.checkAccess) return true;
  return item.checkAccess(userRoles);
});
```

### 5. User Profile in Settings

**File**: `frontend/src/pages/Settings.jsx`

Displays:
- Username
- Email
- Full Name
- Last Login timestamp
- Assigned Roles (with color-coded badges)
- Authentication Provider (Keycloak)
- Role Permissions

### 6. Unauthorized Page

**File**: `frontend/src/pages/Unauthorized.jsx`

Shown when users try to access pages they don't have permission for.

## User Experience

### For org-admin
- Sees all navigation items
- Can access all pages
- Full administrative control

### For ai-engineer
- Sees: Dashboard, AI Agents, Metadata Manager, Alerts, Chatbot Monitor
- Cannot see: Datasets, Policies, Compliance, Audit Logs
- Redirected to /unauthorized if trying to access forbidden pages

### For data-engineer
- Sees: Dashboard, Datasets, Metadata Manager, Alerts
- Cannot see: AI Agents, Policies, Compliance, Audit Logs, Chatbot Monitor
- Redirected to /unauthorized if trying to access forbidden pages

## Security Features

### 1. UI-Level Protection
- Navigation items hidden based on roles
- Users don't see links to pages they can't access

### 2. Route-Level Protection
- Direct URL access blocked with ProtectedRoute component
- Automatic redirect to /unauthorized page

### 3. Token-Based Authentication
- Roles extracted from Keycloak JWT token
- Token contains realm_access.roles array
- No hardcoded usernames or passwords

### 4. Session Management
- Last login timestamp tracked
- Automatic token refresh
- Secure logout functionality

## Testing

### Test Users Setup in Keycloak

1. **Admin User**
   - Username: `admin`
   - Roles: `org-admin`
   - Expected: Full access to all features

2. **AI Engineer User**
   - Username: `ai-engineer`
   - Roles: `ai-engineer`
   - Expected: Access to AI Agents, Metadata, Alerts, Chatbot

3. **Data Engineer User**
   - Username: `data-engineer`
   - Roles: `data-engineer`
   - Expected: Access to Datasets, Metadata, Alerts

### Test Scenarios

1. **Login as each user type**
   - Verify correct navigation items appear
   - Verify Settings page shows correct roles

2. **Try direct URL access**
   - Navigate to forbidden pages via URL
   - Verify redirect to /unauthorized

3. **Check Settings page**
   - Verify user info displays correctly
   - Verify roles are shown with proper badges
   - Verify last login timestamp

## Files Modified/Created

### Created
- `frontend/src/components/ProtectedRoute.jsx`
- `frontend/src/pages/Unauthorized.jsx`
- `frontend/KEYCLOAK_RBAC_IMPLEMENTATION.md`

### Modified
- `frontend/.env` - Added VITE_KEYCLOAK_USERINFO_URL
- `frontend/src/services/KeycloakService.js` - Added role helpers
- `frontend/src/App.jsx` - Added protected routes
- `frontend/src/store/appStore.js` - Added setUser function
- `frontend/src/components/CollapsibleSidebar.jsx` - Added role-based filtering
- `frontend/src/pages/Settings.jsx` - Added user profile display

## Best Practices Followed

✅ **No username checks** - Only role-based access control
✅ **No hardcoding** - All roles from Keycloak token
✅ **Centralized helpers** - All access checks in KeycloakService
✅ **Consistent patterns** - Same approach for all protected routes
✅ **User feedback** - Clear unauthorized page with guidance
✅ **Security layers** - Both UI and route-level protection

## Troubleshooting

### Issue: Roles not appearing
**Solution**: Check that Keycloak client has "Full Scope Allowed" enabled and realm roles are mapped to the token.

### Issue: Unauthorized page shows for valid users
**Solution**: Verify user has correct realm roles assigned in Keycloak admin console.

### Issue: Navigation items not hiding
**Solution**: Ensure user object in appStore contains roles array from getUserInfo().

## Next Steps

1. **Backend API Protection**: Add role-based middleware to backend APIs
2. **Fine-grained Permissions**: Add feature-level permissions within pages
3. **Audit Logging**: Log all access attempts and role changes
4. **Role Management UI**: Allow org-admins to manage user roles from the app
