import { Navigate } from "react-router-dom";

export function RequireRole({ user, role, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    const fallback = user.role === "shopper" ? "/dashboard" : "/";
    return <Navigate to={fallback} replace />;
  }
  return children;
}
