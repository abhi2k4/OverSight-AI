import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ allow, children, redirectTo = '/unauthorized' }) => {
  return allow ? children : <Navigate to={redirectTo} replace />;
};

export default ProtectedRoute;
