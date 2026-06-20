import { ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import Spinner from "@/components/ui/Spinner"; // Ensure you have a Spinner component
import axios from "axios";
import { API_BASE_URL } from "@/config";

const PrivateRoute = ({ children }: { children: ReactNode }) => {
    const { session, loading } = UserAuth();

    useEffect(() => {
        if (!session?.access_token) return;

        const intervalId = setInterval(async () => {
            const activeId = sessionStorage.getItem("activeAnalysisId");
            if (!activeId) return;

            try {
                // Keep heartbeat alive by requesting details
                const resp = await axios.get(`${API_BASE_URL}/history/${activeId}`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (resp.data.status === "completed" || resp.data.status === "failed") {
                    sessionStorage.removeItem("activeAnalysisId");
                    sessionStorage.removeItem("uploading");
                }
            } catch (err) {
                console.error("Global active analysis heartbeat ping failed:", err);
            }
        }, 3000);

        return () => clearInterval(intervalId);
    }, [session]);

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
