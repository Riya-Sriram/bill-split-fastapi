import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('Token');
  const username = localStorage.getItem('Username');

  // If no token or username, redirect to login
  if (!token || !username) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
