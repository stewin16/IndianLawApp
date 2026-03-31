import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <div className="animate-pulse text-sm font-medium tracking-wide text-navy-india/70">Checking authentication...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return children;
};

export default ProtectedRoute;
