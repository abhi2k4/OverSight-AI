# Test App Demo Guide

## Application Overview

This React application demonstrates role-based access control with Keycloak authentication. Here's how to test the different user roles:

## Demo Flow

### 1. Data Engineer User (dataeng1/password123)

**Login as Data Engineer:**
1. Navigate to http://localhost:3000
2. Login with `dataeng1` / `password123`
3. You'll see the Dashboard with:
   - User information showing "data-engineer" role
   - Link to "Data Engineer Page"

**Test Data Engineer Features:**
1. Click "Data Engineer Page"
2. Create a dataset request:
   - Enter name: "Customer Analytics Dataset"
   - Click "Create Request"
   - See success message
3. View your requests in the "Your Dataset Requests" section
4. Try accessing other pages (should be blocked)

### 2. AI Engineer User (aieng1/password123)

**Login as AI Engineer:**
1. Logout and login with `aieng1` / `password123`
2. Dashboard shows "ai-engineer" role
3. Link to "AI Engineer Page" available

**Test AI Engineer Features:**
1. Click "AI Engineer Page"
2. Create an AI agent request:
   - Enter name: "Recommendation Engine Agent"
   - Click "Create Request"
3. View your requests
4. Notice you can't access Data Engineer or Org Admin pages

### 3. Org Admin User (admin1/password123)

**Login as Org Admin:**
1. Logout and login with `admin1` / `password123`
2. Dashboard shows "org-admin" role
3. Link to "Org Admin Page" available

**Test Org Admin Features:**
1. Click "Org Admin Page"
2. See all pending requests from previous users
3. Approve or reject requests:
   - Click "Approve" on the dataset request
   - Click "Reject" on the agent request
4. See requests move to "Processed Requests" section

## Key Features Demonstrated

### Authentication
- ✅ Keycloak handles all authentication
- ✅ No passwords stored in app
- ✅ JWT tokens contain role information
- ✅ Automatic redirect to Keycloak login

### Authorization
- ✅ Role-based page access
- ✅ Route protection
- ✅ UI elements shown/hidden based on roles
- ✅ Business logic respects role permissions

### Request Management
- ✅ In-memory storage (no backend needed)
- ✅ Different request types (dataset vs agent)
- ✅ Status tracking (PENDING/APPROVED/REJECTED)
- ✅ User ownership of requests

### User Experience
- ✅ Clean, responsive UI
- ✅ Clear role-based navigation
- ✅ Feedback messages
- ✅ Intuitive workflow

## Testing Scenarios

### Scenario 1: Role Isolation
1. Login as data-engineer
2. Try to access `/org-admin` directly in URL
3. Should redirect to dashboard (access denied)

### Scenario 2: Request Workflow
1. Login as data-engineer, create request
2. Login as org-admin, see and approve request
3. Login back as data-engineer, see approved status

### Scenario 3: Multi-Role User
1. In Keycloak, assign multiple roles to a user
2. Login and see all available pages
3. Test functionality across roles

## Architecture Highlights

- **Frontend Only**: No backend API required
- **Keycloak Integration**: Standard OpenID Connect flow
- **Role-Based Routing**: React Router with role guards
- **State Management**: Simple in-memory store
- **Responsive Design**: Works on mobile and desktop

This demo shows a complete role-based access system that can be extended for real-world applications.