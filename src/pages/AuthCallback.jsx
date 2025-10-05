import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import Spinner from "@/components/ui/Spinner"; // If you use your Spinner

export default function AuthCallback() {
    const { session, loading } = UserAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && session) {
            navigate("/dashboard");
        } else if (!loading && !session) {
            navigate("/auth");
        }
    }, [loading, session, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Spinner size={48} />
            {/* Or a fallback: <p>Restoring session...</p> */}
        </div>
    );
}
