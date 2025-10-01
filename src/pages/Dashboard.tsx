// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-Auth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";

interface HistoryItem {
    id: string;
    filename: string;
    createdAt: string;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, session } = useAuth();
    
    const [file, setFile] = useState<File | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // ✅ Fetch user info and history on mount
    useEffect(() => {
        const init = async () => {
            const { data } = await supabase.auth.getUser();
            if (!data.user) {
                navigate("/auth");
                return;
            }
            setUser(data.user);
            await createProfileIfMissing(data.user);
            fetchHistory(data.user);
        };
        init();
    }, [navigate]);

    // ✅ Create a profile for new users (Fix for "Failed to create user")
    const createProfileIfMissing = async (user: any) => {
        try {
            const { data: existingProfile, error: selectError } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (selectError) {
                console.error("Error checking profile:", selectError);
                return;
            }

            if (!existingProfile) {
                const { error: insertError } = await supabase
                    .from("profiles")
                    .insert({
                        user_id: user.id,
                        email: user.email,
                        first_name: user.user_metadata?.first_name || null,
                        last_name: user.user_metadata?.last_name || null,
                    });

                if (insertError) {
                    console.error(
                        "Error creating profile:",
                        insertError.message
                    );
                } else {
                    console.log("✅ Profile created for new user:", user.email);
                }
            }
        } catch (err) {
            console.error("Unexpected error in createProfileIfMissing:", err);
        }
    };

    const fetchHistory = async (user: any) => {
        try {
            setLoadingHistory(true);
            const token = (await supabase.auth.getSession()).data.session
                ?.access_token;
            const resp = await axios.get("http://localhost:5000/history", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setHistory(resp.data);
        } catch (err: any) {
            console.error("Failed to fetch history:", err);
            if (err.response?.status === 401) {
                alert("Session expired. Please log in again.");
                await supabase.auth.signOut();
                navigate("/auth");
            }
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please choose a file first");
            return;
        }
        try {
            setUploading(true);
            const token = (await supabase.auth.getSession()).data.session
                ?.access_token;

            const formData = new FormData();
            formData.append("file", file);

            const response = await axios.post(
                "http://localhost:5000/upload",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                    onUploadProgress: (progressEvent) => {
                        const percent = Math.round(
                            (progressEvent.loaded * 100) /
                                (progressEvent.total || 1)
                        );
                        console.log(`Upload progress: ${percent}%`);
                    },
                }
            );

            console.log("Upload response:", response.data);
            alert("File uploaded and simplified successfully!");
            fetchHistory(user);
            setFile(null);
        } catch (err: any) {
            console.error("Upload failed:", err);
            if (err.response?.status === 401) {
                alert("Session expired. Please log in again.");
                await supabase.auth.signOut();
                navigate("/auth");
            } else {
                alert("❌ Failed to upload. Check backend or token.");
            }
        } finally {
            setUploading(false);
        }
    };

    // ✅ Handle logout
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/auth");
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* ---------- Sidebar ---------- */}
            <aside className="w-1/4 bg-white shadow-md p-6 flex flex-col justify-between border-r border-gray-200">
                <div className="flex flex-col items-center text-center">
                    {/* Profile Placeholder */}
                    <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-3xl mb-3">
                        {user?.user_metadata?.first_name?.[0]?.toUpperCase() ||
                            user?.email?.[0]?.toUpperCase() ||
                            "U"}
                    </div>

                    <h2 className="text-2xl font-bold text-indigo-700 mb-1">
                        Hello,{" "}
                        {user?.user_metadata?.first_name ||
                            user?.email?.split("@")[0]}{" "}
                        👋
                    </h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Welcome to your Legal Document Simplifier Dashboard
                    </p>

                    {/* ---------- History Section ---------- */}
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        📜 Your History
                    </h3>
                    {loadingHistory ? (
                        <p className="text-gray-500 text-sm">Loading...</p>
                    ) : history.length > 0 ? (
                        <ul className="space-y-2 w-full text-left overflow-y-auto max-h-[300px]">
                            {history.map((item) => (
                                <li
                                    key={item.id}
                                    className="p-3 border rounded-md hover:bg-indigo-50 cursor-pointer transition"
                                    onClick={() =>
                                        navigate(`/history/${item.id}`)
                                    }
                                >
                                    <p className="font-medium text-gray-800 truncate">
                                        {item.filename}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(
                                            item.createdAt
                                        ).toLocaleString()}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-sm">No history yet</p>
                    )}
                </div>

                {/* ---------- Logout Button ---------- */}
                <Button
                    variant="outline"
                    className="w-full mt-6 border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                    onClick={handleLogout}
                >
                    Logout
                </Button>
            </aside>

            {/* ---------- Main Content ---------- */}
            <main className="flex-1 p-10 overflow-y-auto">
                <Card className="p-10 bg-white shadow-lg rounded-2xl">
                    <h1 className="text-3xl font-bold text-indigo-700 mb-6">
                        Upload a New Legal Document
                    </h1>

                    <div className="mb-6">
                        <Label>Select a file (.pdf, .docx, .txt)</Label>
                        <Input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={(e) =>
                                setFile(e.target.files?.[0] || null)
                            }
                            className="mt-2"
                        />
                    </div>

                    <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={handleUpload}
                        disabled={uploading}
                    >
                        {uploading ? "Processing..." : "Upload & Simplify"}
                    </Button>
                </Card>
            </main>
        </div>
    );
}
