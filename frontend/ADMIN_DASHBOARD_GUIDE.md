# Admin Dashboard - Implementation Guide

## Overview
The Admin Dashboard is an exclusive interface for `org-admin` users to monitor system activity, manage users, view alerts, and access comprehensive administrative controls.

## Access Control
- **Role Required**: `org-admin` only
- **Route**: `/admin`
- **Protection**: Protected route with `canAccessAdmin()` check
- **Visibility**: Link only appears in sidebar for org-admin users

## Features

### 1. **System Statistics Overview**
Four key metric cards displaying:
- **Total Users**: Active and inactive user counts
- **Total Datasets**: Aggregated across all users
- **Recent Activities**: Activity count in the last hour
- **Critical Alerts**: High-priority alerts requiring attention

### 2. **Role Distribution**
Visual breakdown of users by role:
- Data Engineers (dataset management)
- AI Engineers (AI agent management)
- Org Admins (full access)

Shows count for each role with descriptive icons.

### 3. **System Alerts**
Real-time monitoring of system issues:
- **Severity Levels**: High, Medium, Low
- **Color Coding**: Red (high), Amber (medium), Blue (low)
- **Alert Types**:
  - Unusual data access patterns
  - Storage capacity warnings
  - Backup completion notifications
  - Security incidents

### 4. **Recent Activities Log**
Comprehensive activity tracking showing:
- User actions (create, update, access, errors)
- Resource affected
- Timestamp
- Activity type with color-coded icons:
  - 🟢 Create (emerald)
  - 🔵 Update (blue)
  - 🟣 Access (purple)
  - 🔴 Error (red)

### 5. **User Management Table**
Full user administration interface:
- **User Information**: Name, email
- **Role Assignment**: Visual role badges
- **Status**: Active/Inactive
- **Dataset Count**: Number of datasets per user
- **Last Login**: Recent activity tracking
- **Actions**: Edit user, Remove user

### 6. **System Health Monitoring**
Three health indicators:
- **Storage Usage**: Visual progress bar (850 GB / 1 TB)
- **API Usage**: Request tracking (45.2K / 100K)
- **System Uptime**: 99.9% uptime display

### 7. **Time Range Filtering**
Dropdown selector for data filtering:
- Last 24 Hours
- Last 7 Days (default)
- Last 30 Days
- Last 90 Days

### 8. **Export Functionality**
Export system reports for:
- Compliance audits
- Activity logs
- User management reports
- System health metrics

## UI Components

### Stats Cards
```jsx
- Icon with colored background
- Metric label
- Large number display
- Contextual subtitle
- Trend indicator
```

### Activity Feed
```jsx
- Icon representing activity type
- Action description
- User and resource information
- Timestamp
- Color-coded background
```

### User Table
```jsx
- Sortable columns
- Role badges
- Status indicators
- Action buttons (Edit, Remove)
- Pagination support
```

### Alert Cards
```jsx
- Severity badge
- Alert message
- Timestamp
- View action button
```

## Mock Data Structure

### Recent Activities
```javascript
{
  id: number,
  user: string,
  action: string,
  resource: string,
  timestamp: string,
  type: 'create' | 'update' | 'access' | 'error'
}
```

### System Users
```javascript
{
  id: number,
  name: string,
  email: string,
  role: 'org-admin' | 'ai-engineer' | 'data-engineer',
  status: 'active' | 'inactive',
  lastLogin: string,
  datasets: number
}
```

### System Alerts
```javascript
{
  id: number,
  severity: 'high' | 'medium' | 'low',
  message: string,
  timestamp: string
}
```

## Color Scheme

### Activity Types
- **Create**: Emerald (bg-emerald-50, border-emerald-200)
- **Update**: Blue (bg-blue-50, border-blue-200)
- **Access**: Purple (bg-purple-50, border-purple-200)
- **Error**: Red (bg-red-50, border-red-200)

### Severity Levels
- **High**: Red (bg-red-100, text-red-700)
- **Medium**: Amber (bg-amber-100, text-amber-700)
- **Low**: Blue (bg-blue-100, text-blue-700)

### Role Badges
- **org-admin**: Red (bg-red-100, text-red-700)
- **ai-engineer**: Blue (bg-blue-100, text-blue-700)
- **data-engineer**: Emerald (bg-emerald-100, text-emerald-700)

## User Experience

### For org-admin
1. **Dashboard Access**: Sees "Admin Dashboard" link in sidebar
2. **Comprehensive View**: Full visibility into system operations
3. **User Management**: Can add, edit, and remove users
4. **Alert Monitoring**: Real-time system alerts
5. **Activity Tracking**: Complete audit trail
6. **System Health**: Infrastructure monitoring

### For Other Roles
- **No Access**: Admin Dashboard link not visible in sidebar
- **Route Protection**: Direct URL access redirected to /unauthorized
- **Clear Messaging**: Unauthorized page explains access restrictions

## Integration Points

### Backend APIs (To Be Implemented)

#### 1. User Management API
```
GET /api/admin/users - List all users
POST /api/admin/users - Create new user
PUT /api/admin/users/:id - Update user
DELETE /api/admin/users/:id - Remove user
```

#### 2. Activity Log API
```
GET /api/admin/activities?timeRange=7d - Get activities
GET /api/admin/activities/:id - Get activity details
```

#### 3. System Alerts API
```
GET /api/admin/alerts - Get system alerts
PUT /api/admin/alerts/:id/acknowledge - Acknowledge alert
```

#### 4. System Health API
```
GET /api/admin/health - Get system health metrics
GET /api/admin/health/storage - Storage usage
GET /api/admin/health/api-usage - API usage stats
GET /api/admin/health/uptime - System uptime
```

#### 5. Export API
```
POST /api/admin/export - Generate and download reports
```

## Future Enhancements

### 1. Real-time Updates
- WebSocket connection for live activity feed
- Real-time alert notifications
- Live user status updates

### 2. Advanced Analytics
- User activity heatmaps
- Dataset usage trends
- API usage patterns
- Cost analysis

### 3. User Management Features
- Bulk user operations
- Role assignment workflows
- User invitation system
- Password reset functionality

### 4. Alert Management
- Alert rules configuration
- Custom alert thresholds
- Alert routing and escalation
- Alert history and trends

### 5. Audit Trail
- Detailed audit logs
- Compliance reporting
- Change history tracking
- Export to SIEM systems

### 6. System Configuration
- Global settings management
- Feature flags
- Integration configurations
- Backup and restore

### 7. Performance Monitoring
- Response time tracking
- Error rate monitoring
- Resource utilization
- Database performance

## Security Considerations

### 1. Access Control
- Strict role-based access (org-admin only)
- Route-level protection
- API endpoint authorization

### 2. Audit Logging
- All admin actions logged
- User management changes tracked
- Configuration changes recorded

### 3. Data Privacy
- Sensitive data masking
- PII protection
- Secure data export

### 4. Session Management
- Admin session timeout
- Multi-factor authentication (future)
- Session activity monitoring

## Testing Scenarios

### 1. Access Control Testing
- Login as org-admin → Should see Admin Dashboard link
- Login as ai-engineer → Should NOT see Admin Dashboard link
- Login as data-engineer → Should NOT see Admin Dashboard link
- Direct URL access as non-admin → Redirect to /unauthorized

### 2. Functionality Testing
- View system statistics
- Filter activities by time range
- View user list
- Check system alerts
- Monitor system health

### 3. Responsive Design Testing
- Desktop view (1920x1080)
- Tablet view (768x1024)
- Mobile view (375x667)

## Files Created/Modified

### Created
- `frontend/src/pages/AdminDashboard.jsx` - Main admin dashboard component
- `frontend/ADMIN_DASHBOARD_GUIDE.md` - This documentation

### Modified
- `frontend/src/App.jsx` - Added /admin route with protection
- `frontend/src/components/CollapsibleSidebar.jsx` - Added Admin Dashboard link
- `frontend/src/services/KeycloakService.js` - Already has canAccessAdmin()

## Usage

### Accessing the Admin Dashboard
1. Login as a user with `org-admin` role
2. Click "Admin Dashboard" in the sidebar (appears below regular Dashboard)
3. View comprehensive system overview
4. Use time range filter to adjust data view
5. Export reports as needed

### Managing Users
1. Navigate to User Management section
2. View all users with their roles and status
3. Click "Edit" to modify user details
4. Click "Add User" to invite new users
5. Click remove icon to deactivate users

### Monitoring Alerts
1. View System Alerts card
2. Check severity levels
3. Click "View" to see alert details
4. Take appropriate action based on alert type

## Best Practices

1. **Regular Monitoring**: Check admin dashboard daily
2. **Alert Response**: Address high-severity alerts immediately
3. **User Audits**: Review user list regularly for inactive accounts
4. **Activity Review**: Monitor recent activities for suspicious patterns
5. **System Health**: Keep storage and API usage within limits
6. **Export Reports**: Generate regular compliance reports

## Troubleshooting

### Issue: Admin Dashboard not visible
**Solution**: Verify user has `org-admin` role in Keycloak

### Issue: Data not loading
**Solution**: Check backend API endpoints are implemented and accessible

### Issue: Unauthorized access
**Solution**: Verify route protection is properly configured in App.jsx

### Issue: Statistics showing zero
**Solution**: Ensure mock data is properly loaded or backend APIs are returning data
