import { useAuth } from "@/lib/AuthContext";
import { Outlet, Navigate } from "react-router-dom";
import AdminPasswordGate from "./AdminPasswordGate";
import { base44 } from "@/api/base44Client";

export default function AdminGuard() {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    base44.auth.redirectToLogin(window.location.pathname);
    return null;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminPasswordGate>
      <Outlet />
    </AdminPasswordGate>
  );
}