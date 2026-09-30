import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";

/**
 * Wrap any route that should only be visible to logged-in users:
 * /listings/new, /my-listings, /profile, /bookings, /notifications, etc.
 */
export function ProtectedRoute() {
  const location = useLocation();

  if (!isLoggedIn()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          notice: "Please log in to continue.",
        }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
