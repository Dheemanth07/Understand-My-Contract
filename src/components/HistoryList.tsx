// src/components/HistoryList.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock } from "lucide-react";

interface HistoryItem {
    id: string;
    filename: string;
    createdAt: string;
}

export default function HistoryList() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Get the user's Supabase access token
                const { data } = await supabase.auth.getSession();
                const token = data.session?.access_token;

                if (!token) {
                    setError("You must be logged in to view history.");
                    return;
                }

                // Fetch user history from backend
                const response = await fetch("http://localhost:5000/history", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error("Failed to fetch history");

                const dataJson = await response.json();
                setHistory(dataJson);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12 text-gray-500 animate-pulse">
                Loading your document history...
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 py-12">
                ⚠️ {error || "Something went wrong while fetching history."}
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                No previous documents found.
                <br />
                <span className="text-sm">
                    Upload your first document to get started.
                </span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                📜 Your Document History
            </h2>

            <div className="grid gap-4">
                {history.map((item) => (
                    <Card
                        key={item.id}
                        className="p-5 flex justify-between items-center bg-white shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 hover:border-legal-primary"
                        onClick={() => navigate(`/history/${item.id}`)}
                    >
                        <div className="flex items-center gap-4">
                            <FileText className="w-6 h-6 text-legal-primary" />
                            <div>
                                <p className="font-semibold text-gray-800">
                                    {item.filename}
                                </p>
                                <div className="flex items-center text-sm text-gray-500 gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                        {new Date(
                                            item.createdAt
                                        ).toLocaleString("en-IN", {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation(); // prevent card click
                                navigate(`/history/${item.id}`);
                            }}
                        >
                            View
                        </Button>
                    </Card>
                ))}
            </div>
        </div>
    );
}
