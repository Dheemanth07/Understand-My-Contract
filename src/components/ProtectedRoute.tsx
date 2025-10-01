import { useEffect, useState, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-Auth";

// This component checks if a user is authenticated.
// If they are, it renders the child components (the protected page).
// If not, it redirects them to the authentication page.
export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const { session, loading } = useAuth();

    // Show a loading indicator while the session is being checked
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-lg text-gray-600">Loading session...</p>
            </div>
        );
    }

    // If there is no active session, redirect to the auth page
    if (!session) {
        return <Navigate to="/auth" replace />;
    }

    // If a session exists, render the requested page
    return <>{children}</>;
}
