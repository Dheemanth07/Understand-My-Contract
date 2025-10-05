// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import Spinner from "@/components/ui/Spinner"; // Ensure you have a Spinner component

const PrivateRoute = ({ children }) => {
    const { session, loading } = UserAuth();

    // 1. If we are still checking for a session, show a loading message
    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <Spinner size={48} />
            </div>
        );
    }

    // 2. If the check is done and there's no session, redirect to sign-in
    if (!session) {
        return <Navigate to="/auth" />;
    }

    // 3. If the check is done and there IS a session, show the protected content
    return children;
};

export default PrivateRoute;
