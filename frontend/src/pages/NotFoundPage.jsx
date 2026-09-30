import React from "react";
import { Compass } from "lucide-react";
import Container from "../components/Container";
import { EmptyState } from "../components/ui";

export default function NotFoundPage() {
  return (
    <div className="py-12 sm:py-24 min-h-[calc(100vh-180px)] flex items-center">
      <Container>
        <EmptyState
          icon={Compass}
          title="Page Not Found (404)"
          description="The rental page, asset, or link you are looking for has moved or does not exist."
          actionLabel="Return to Marketplace Home"
          onAction={() => (window.location.href = "/")}
          secondaryActionLabel="Explore All Rentals"
          onSecondaryAction={() => (window.location.href = "/explore")}
        />
      </Container>
    </div>
  );
}