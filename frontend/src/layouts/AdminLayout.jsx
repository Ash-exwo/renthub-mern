import React from "react";
import { Outlet } from "react-router-dom";

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-espresso)] font-[var(--font-sans)] transition-colors duration-200">
      <Outlet />
    </div>
  );
}

export default AdminLayout;
