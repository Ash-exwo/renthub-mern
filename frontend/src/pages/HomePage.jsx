import { useLocation } from "react-router-dom";

export default function HomePage() {
  const location = useLocation();
  const successMessage = location.state?.successMessage;

  return (
    <div>
      {successMessage && (
        <div role="status" className="success-message">
          {successMessage}
        </div>
      )}

    </div>
  );
}