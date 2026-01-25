import { getUserRoles } from '../services/KeycloakService';

const RoleBasedRoute = ({ allowedRoles, children, fallback = null }) => {
  const userRoles = getUserRoles();
  
  const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));
  
  if (hasRequiredRole) {
    return children;
  }
  
  return fallback;
};

export default RoleBasedRoute;
