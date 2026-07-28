// src/pages/AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import Spinner from "@/components/ui/Spinner";

export default function AuthCallback() {
    const { session, loading } = UserAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (window.location.hash) {
                window.history.replaceState(null, "", window.location.pathname);
            }
            navigate("/dashboard", { replace: true });
        }
    }, [session, loading, navigate]);

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-3">
                <Spinner size={40} />
                <p className="text-xs text-slate-500 font-medium">Completing sign in...</p>
            </div>
        </div>
    );
}
