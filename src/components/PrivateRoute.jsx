// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
    const { session, loading } = UserAuth();

    // 1. If we are still checking for a session, show a loading message
    if (loading) {
        return <div>Loading...</div>;
    }

    // 2. If the check is done and there's no session, redirect to sign-in
    if (!session) {
        return <Navigate to="/signin" />;
    }

    // 3. If the check is done and there IS a session, show the protected content
    return children;
};

export default PrivateRoute;
