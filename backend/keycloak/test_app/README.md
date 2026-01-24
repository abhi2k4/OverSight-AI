# Test App - Role-Based Access with Keycloak

A simple React application demonstrating role-based access control using Keycloak authentication.

## Features

- **Authentication**: Handled completely by Keycloak using OpenID Connect
- **Role-based Access**: Three roles supported:
  - `data-engineer`: Can create dataset requests
  - `ai-engineer`: Can create AI agent requests  
  - `org-admin`: Can view and approve/reject all requests
- **Request Management**: In-memory storage for dataset and agent requests
- **Approval Workflow**: Basic approval system for org-admin users

## Prerequisites

- Node.js (v14 or higher)
- Keycloak server running and configured

## Keycloak Setup

1. **Create a Realm**: Create a new realm called `test-realm`

2. **Create a Client**: 
   - Client ID: `test-app-client`
   - Client Protocol: `openid-connect`
   - Access Type: `public`
   - Valid Redirect URIs: `http://localhost:3000/*`
   - Web Origins: `http://localhost:3000`

3. **Create Roles**:
   - `data-engineer`
   - `ai-engineer`
   - `org-admin`

4. **Create Users** and assign appropriate roles

## Installation

1. Clone or navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env` file and update with your Keycloak settings:
   ```
   REACT_APP_KEYCLOAK_URL=http://localhost:8080
   REACT_APP_KEYCLOAK_REALM=test-realm
   REACT_APP_KEYCLOAK_CLIENT_ID=test-app-client
   ```

## Running the Application

```bash
npm start
```

The application will open at `http://localhost:3000`

## Application Flow

1. **Login**: Users are redirected to Keycloak for authentication
2. **Dashboard**: After login, users see their information and available pages based on roles
3. **Role-specific Pages**:
   - **Data Engineer**: Create dataset requests and view own requests
   - **AI Engineer**: Create AI agent requests and view own requests
   - **Org Admin**: View all requests and approve/reject them

## Project Structure

```
src/
├── components/
│   ├── Dashboard.js           # Main dashboard after login
│   ├── DataEngineerPage.js    # Data engineer functionality
│   ├── AIEngineerPage.js      # AI engineer functionality
│   ├── OrgAdminPage.js        # Org admin functionality
│   └── RoleBasedRoute.js      # Route protection component
├── services/
│   └── KeycloakService.js     # Keycloak integration
├── store/
│   └── RequestStore.js        # In-memory request storage
├── App.js                     # Main app with routing
└── App.css                    # Styles
```

## Key Features

- **No Backend Required**: All data stored in memory
- **JWT Token Parsing**: Roles extracted from Keycloak JWT tokens
- **Route Protection**: Pages protected based on user roles
- **Responsive Design**: Works on desktop and mobile devices

## Security Notes

- Authentication is handled entirely by Keycloak
- No passwords or credentials stored in the application
- Authorization decisions based solely on JWT token roles
- All sensitive operations require appropriate role permissions

## Development

To extend the application:

1. **Add New Roles**: Update Keycloak realm and modify role checks in components
2. **Add New Request Types**: Extend RequestStore and create new page components
3. **Add Persistence**: Replace RequestStore with API calls to a backend service
4. **Enhanced UI**: Add more sophisticated UI components and styling

## Troubleshooting

- **Authentication Issues**: Check Keycloak server is running and configuration matches .env file
- **Role Issues**: Verify users have correct roles assigned in Keycloak
- **CORS Issues**: Ensure Web Origins is set correctly in Keycloak client configuration