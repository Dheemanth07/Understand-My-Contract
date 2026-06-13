import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import Spinner from "@/components/ui/Spinner"; // Ensure you have a Spinner component

const PrivateRoute = ({ children }: { children: ReactNode }) => {
    const { session, loading } = UserAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <Spinner size={48} />
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/signin" />;
    }

    return <>{children}</>;
};

export default PrivateRoute;
