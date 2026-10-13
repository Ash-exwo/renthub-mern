import { Navigate, Outlet } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";

/**
 * Route wrapper that prevents authenticated users from viewing guest-only
 * authentication pages like /login, /register, and /forgot-password.
 * If already logged in, automatically redirects to /explore.
 */
export function GuestRoute() {
  if (isLoggedIn()) {
    return <Navigate to="/explore" replace />;
  }

  return <Outlet />;
}

export default GuestRoute;
