import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (!user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
