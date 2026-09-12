import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sidebar, MobileNav } from "./Navigation";
import { PageSkeleton } from "./LoadingSkeleton";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <PageSkeleton />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageSkeleton />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
